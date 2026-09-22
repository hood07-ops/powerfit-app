import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const responseHeaders = {
  'Content-Type': 'application/json',
  'Cache-Control': 'no-store',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer',
}

const PLANS = {
  monthly: { months: 1, amount: 40000 },
  quarterly: { months: 3, amount: 105000 },
  semiannual: { months: 6, amount: 190000 },
  annual: { months: 12, amount: 360000 },
} as const

type PlanCode = keyof typeof PLANS

function jsonResponse(body: unknown, status = 200, extraHeaders: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...responseHeaders, ...extraHeaders },
  })
}

async function enforceRateLimit(serverDb: any, key: string, limit: number, windowSeconds: number) {
  const { data, error } = await serverDb.rpc('server_consume_powerfit_rate_limit', {
    p_bucket_key: key,
    p_limit: limit,
    p_window_seconds: windowSeconds,
  })
  if (error) throw new Error('RATE_LIMIT_CHECK_FAILED')
  return data as { allowed?: boolean; retry_after_seconds?: number }
}

function requestIp(req: Request) {
  return (req.headers.get('x-forwarded-for') || req.headers.get('cf-connecting-ip') || 'unknown')
    .split(',')[0]
    .trim()
    .slice(0, 80)
}

function safeErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message.slice(0, 500)
  return String(error || 'Error inesperado').slice(0, 500)
}

async function paymentIdFromRequest(req: Request) {
  const url = new URL(req.url)
  const queryId = url.searchParams.get('data.id') || url.searchParams.get('id')
  if (queryId) return queryId

  const body = await req.json().catch(() => null)
  return body?.data?.id || body?.id || body?.resource?.split('/').pop() || null
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: responseHeaders })
  if (req.method !== 'POST') return jsonResponse({ error: 'Metodo no permitido' }, 405)
  const contentLength = Number(req.headers.get('content-length') || '0')
  if (contentLength > 32768) return jsonResponse({ error: 'PAYLOAD_TOO_LARGE' }, 413)

  const paymentId = String((await paymentIdFromRequest(req)) || '').trim()

  try {
    const accessToken = Deno.env.get('MP_ACCESS_TOKEN')
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!accessToken || !supabaseUrl || !serviceRoleKey) {
      console.error('MP_WEBHOOK_CONFIG_MISSING')
      return jsonResponse({ error: 'Configuracion webhook incompleta' }, 500)
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } })
    const ipLimit = await enforceRateLimit(supabase, `mp-webhook:ip:${requestIp(req)}`, 120, 60)
    if (!ipLimit.allowed) {
      return jsonResponse({ error: 'RATE_LIMITED' }, 429, { 'Retry-After': String(ipLimit.retry_after_seconds || 60) })
    }

    if (!paymentId) {
      console.info('MP_WEBHOOK_IGNORED_NO_PAYMENT_ID')
      return jsonResponse({ received: true, ignored: 'Sin payment id' })
    }

    const paymentLimit = await enforceRateLimit(supabase, `mp-webhook:payment:${paymentId.slice(0, 120)}`, 10, 600)
    if (!paymentLimit.allowed) {
      return jsonResponse({ error: 'RATE_LIMITED' }, 429, { 'Retry-After': String(paymentLimit.retry_after_seconds || 600) })
    }

    console.info('MP_WEBHOOK_RECEIVED', { payment_id: paymentId })

    const mpResponse = await fetch(
      `https://api.mercadopago.com/v1/payments/${paymentId}`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    )

    const raw = await mpResponse.text()
    let payment: Record<string, any> | null = null
    try {
      payment = raw ? JSON.parse(raw) : null
    } catch {
      payment = null
    }

    if (!mpResponse.ok || !payment) {
      console.error('MP_WEBHOOK_VERIFY_FAILED', {
        payment_id: paymentId,
        http_status: mpResponse.status,
      })
      return jsonResponse({ error: 'No se pudo verificar pago' }, 502)
    }

    console.info('MP_WEBHOOK_PAYMENT_STATUS', {
      payment_id: paymentId,
      status: payment.status,
      status_detail: payment.status_detail || null,
    })

    if (payment.status !== 'approved') {
      return jsonResponse({ received: true, status: payment.status })
    }

    const alumnoId = String(
      payment.metadata?.alumno_id ||
      payment.external_reference ||
      payment.additional_info?.items?.[0]?.id ||
      '',
    ).trim()
    const paymentType = String(payment.metadata?.tipo || '').trim().toLowerCase()

    const planCode = String(
      payment.metadata?.plan_code || 'monthly',
    ).trim().toLowerCase() as PlanCode

    const plan = PLANS[planCode]
    const amount = Number(payment.transaction_amount || 0)
    const isCpsTomo = paymentType === 'cps_tomo_powerfit'

    console.info('MP_WEBHOOK_APPROVED_DATA', {
      payment_id: paymentId,
      alumno_id: alumnoId || null,
      plan_code: planCode,
      amount,
    })

    if (!alumnoId || !/^\d+$/.test(alumnoId)) {
      console.error('MP_WEBHOOK_INVALID_ALUMNO', {
        payment_id: paymentId,
        alumno_id: alumnoId || null,
      })
      return jsonResponse({ error: 'Pago aprobado sin alumno asociado' }, 400)
    }

    if (isCpsTomo) {
      const pathCode = String(payment.metadata?.path_code || '').trim().toUpperCase()
      const tomoNo = Number(payment.metadata?.tomo_no || 0)
      if (!['BOXING', 'KICKBOXING'].includes(pathCode) || !Number.isInteger(tomoNo) || tomoNo < 1 || tomoNo > 17) {
        console.error('MP_WEBHOOK_INVALID_CPS_TOMO', {
          payment_id: paymentId,
          path_code: pathCode || null,
          tomo_no: tomoNo || null,
        })
        return jsonResponse({ error: 'INVALID_CPS_TOMO_PAYMENT' }, 400)
      }

            const paidOnRaw = String(payment.date_approved || payment.date_created || '')
      const paidOn = paidOnRaw
        ? paidOnRaw.slice(0, 10)
        : new Date().toISOString().slice(0, 10)

      const { data: receipt, error: paymentError } = await supabase.rpc(
        'register_powerfit_tomo_payment_secure',
        {
          p_external_payment_id: paymentId,
          p_alumno_id: Number(alumnoId),
          p_path_code: pathCode,
          p_tomo_no: tomoNo,
          p_amount: amount,
          p_paid_on: paidOn,
        },
      )

      if (paymentError) {
        console.error('MP_WEBHOOK_CPS_RPC_FAILED', {
          payment_id: paymentId,
          alumno_id: alumnoId,
          code: paymentError.code || null,
          message: String(paymentError.message || '').slice(0, 500),
        })
        return jsonResponse({ error: paymentError.message }, 500)
      }

      return jsonResponse({
        received: true,
        payment_type: 'cps_tomo',
        alumno_id: alumnoId,
        path_code: pathCode,
        tomo_no: tomoNo,
        amount,
        payment_id: paymentId,
        receipt,
      })
    }

    if (!plan) {
      console.error('MP_WEBHOOK_INVALID_PLAN', {
        payment_id: paymentId,
        plan_code: planCode,
      })
      return jsonResponse({ error: 'INVALID_MEMBERSHIP_PLAN' }, 400)
    }

    if (amount !== plan.amount) {
      console.error('MP_WEBHOOK_AMOUNT_MISMATCH', {
        payment_id: paymentId,
        expected: plan.amount,
        received: amount,
      })
      return jsonResponse({
        error: 'PAYMENT_AMOUNT_MISMATCH',
        expected: plan.amount,
        received: amount,
      }, 400)
    }

    const paidOnRaw = String(payment.date_approved || payment.date_created || '')
    const paidOn = paidOnRaw
      ? paidOnRaw.slice(0, 10)
      : new Date().toISOString().slice(0, 10)

    
    const { data: receipt, error: paymentError } = await supabase.rpc(
      'register_powerfit_mercadopago_payment_secure',
      {
        p_external_payment_id: paymentId,
        p_alumno_id: Number(alumnoId),
        p_plan_code: planCode,
        p_amount: amount,
        p_paid_on: paidOn,
        p_external_reference: String(payment.external_reference || alumnoId),
      },
    )

    if (paymentError) {
      console.error('MP_WEBHOOK_RPC_FAILED', {
        payment_id: paymentId,
        alumno_id: alumnoId,
        code: paymentError.code || null,
        message: String(paymentError.message || '').slice(0, 500),
      })
      return jsonResponse({ error: paymentError.message }, 500)
    }

    console.info('MP_WEBHOOK_SETTLED', {
      payment_id: paymentId,
      alumno_id: alumnoId,
      plan_code: planCode,
      paid_on: paidOn,
    })

    return jsonResponse({
      received: true,
      alumno_id: alumnoId,
      plan_code: planCode,
      months: plan.months,
      amount,
      payment_id: paymentId,
      receipt,
    })
  } catch (error) {
    console.error('MP_WEBHOOK_UNEXPECTED_ERROR', {
      payment_id: paymentId || null,
      message: safeErrorMessage(error),
    })
    return jsonResponse({ error: 'Error interno procesando webhook' }, 500)
  }
})
