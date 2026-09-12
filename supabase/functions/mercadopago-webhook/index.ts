import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const PLANS = {
  monthly: { months: 1, amount: 40000 },
  quarterly: { months: 3, amount: 105000 },
  semiannual: { months: 6, amount: 190000 },
  annual: { months: 12, amount: 360000 },
} as const

type PlanCode = keyof typeof PLANS

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
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
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return jsonResponse({ error: 'Metodo no permitido' }, 405)

  const paymentId = String((await paymentIdFromRequest(req)) || '').trim()

  try {
    const accessToken = Deno.env.get('MP_ACCESS_TOKEN')
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!accessToken || !supabaseUrl || !serviceRoleKey) {
      console.error('MP_WEBHOOK_CONFIG_MISSING')
      return jsonResponse({ error: 'Configuracion webhook incompleta' }, 500)
    }

    if (!paymentId) {
      console.info('MP_WEBHOOK_IGNORED_NO_PAYMENT_ID')
      return jsonResponse({ received: true, ignored: 'Sin payment id' })
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

    const planCode = String(
      payment.metadata?.plan_code || 'monthly',
    ).trim().toLowerCase() as PlanCode

    const plan = PLANS[planCode]
    const amount = Number(payment.transaction_amount || 0)

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

    const supabase = createClient(supabaseUrl, serviceRoleKey)

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
