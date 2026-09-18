import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const allowedOrigins = new Set([
  'https://powerfit-app-alpha.vercel.app',
  'https://cps-staging.vercel.app',
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost',
  'capacitor://localhost',
])

function corsHeaders(req: Request) {
  const origin = req.headers.get('origin') || ''
  const allowed = allowedOrigins.has(origin) ? origin : 'https://powerfit-app-alpha.vercel.app'
  return {
    'Access-Control-Allow-Origin': allowed,
    'Vary': 'Origin',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'no-referrer',
  }
}

const PLANS = {
  monthly: { name: 'Plan mensual', months: 1, amount: 40000 },
  quarterly: { name: 'Plan trimestral', months: 3, amount: 105000 },
  semiannual: { name: 'Plan semestral', months: 6, amount: 190000 },
  annual: { name: 'Plan anual', months: 12, amount: 360000 },
} as const

type PlanCode = keyof typeof PLANS

const DEFAULT_POWERFIT_APP_URL = 'https://powerfit-app-cv9o.vercel.app'
const DEFAULT_MERCADOPAGO_WEBHOOK_URL =
  'https://sabsmurhriohwmczaktn.supabase.co/functions/v1/mercadopago-webhook'

function jsonResponse(req: Request, body: unknown, status = 200, extraHeaders: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(req), ...extraHeaders, 'Content-Type': 'application/json' },
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

function safeMessage(value: unknown) {
  if (typeof value === 'string') return value.slice(0, 500)
  if (value && typeof value === 'object' && 'message' in value) {
    return String((value as { message?: unknown }).message || '').slice(0, 500)
  }
  return 'Mercado Pago no entrego un mensaje legible.'
}

Deno.serve(async (req) => {
  try {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders(req) })
    if (req.method !== 'POST') return jsonResponse(req, { error: 'METHOD_NOT_ALLOWED', message: 'Metodo no permitido' }, 405)
    const accessToken = Deno.env.get('MP_ACCESS_TOKEN')
    const appUrl = Deno.env.get('POWERFIT_APP_URL') || DEFAULT_POWERFIT_APP_URL
    const webhookUrl = Deno.env.get('MERCADOPAGO_WEBHOOK_URL') || DEFAULT_MERCADOPAGO_WEBHOOK_URL
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const authorization = req.headers.get('Authorization') || ''
    const missingConfig = [
      !accessToken ? 'MP_ACCESS_TOKEN' : '',
      !supabaseUrl ? 'SUPABASE_URL' : '',
      !anonKey ? 'SUPABASE_ANON_KEY' : '',
      !serviceRoleKey ? 'SUPABASE_SERVICE_ROLE_KEY' : '',
    ].filter(Boolean)
    if (missingConfig.length) {
      return jsonResponse(req, 
        {
          error: 'PAYMENT_CONFIGURATION_ERROR',
          message: `Configuracion de pago incompleta: ${missingConfig.join(', ')}`,
        },
        500,
      )
    }
    const userDb = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authorization } } })
    const { data: authData, error: authError } = await userDb.auth.getUser()
    const authUser = authData?.user
    if (authError || !authUser) return jsonResponse(req, { error: 'UNAUTHORIZED', message: 'Sesion no autorizada.' }, 401)
    const contentLength = Number(req.headers.get('content-length') || '0')
    if (contentLength > 32768) return jsonResponse(req, { error: 'PAYLOAD_TOO_LARGE' }, 413)
    const body = await req.json().catch(() => null)
    const paymentType = String(body?.payment_type || body?.tipo || 'membership').trim().toLowerCase()
    const alumnoId = String(body?.alumno_id || '').trim()
    const planCode = String(body?.plan_code || 'monthly').trim().toLowerCase() as PlanCode
    const cpsPath = String(body?.path_code || '').trim().toUpperCase()
    const cpsTomoNo = Number(body?.tomo_no || 0)
    const plan = PLANS[planCode]
    const isCpsTomo = paymentType === 'cps_tomo'
    if (!alumnoId || (!isCpsTomo && !plan)) return jsonResponse(req, { error: 'INVALID_PAYMENT_DATA', message: 'Datos de pago invalidos' }, 400)
    if (isCpsTomo && (!['BOXING', 'KICKBOXING'].includes(cpsPath) || !Number.isInteger(cpsTomoNo) || cpsTomoNo < 1 || cpsTomoNo > 15)) {
      return jsonResponse(req, { error: 'INVALID_CPS_TOMO_PAYMENT', message: 'Datos CPS invalidos.' }, 400)
    }
    const serverDb = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } })
    const shortLimit = await enforceRateLimit(serverDb, `create-preference:user:${authUser.id}`, 8, 60)
    if (!shortLimit.allowed) {
      return jsonResponse(req, { error: 'RATE_LIMITED' }, 429, { 'Retry-After': String(shortLimit.retry_after_seconds || 60) })
    }
    const hourlyLimit = await enforceRateLimit(serverDb, `create-preference-hour:user:${authUser.id}`, 30, 3600)
    if (!hourlyLimit.allowed) {
      return jsonResponse(req, { error: 'RATE_LIMITED' }, 429, { 'Retry-After': String(hourlyLimit.retry_after_seconds || 3600) })
    }
    const { data: alumno, error: alumnoError } = await serverDb.from('alumnos').select('id,user_id,nombre').eq('id', alumnoId).maybeSingle()
    if (alumnoError || !alumno) return jsonResponse(req, { error: 'STUDENT_NOT_FOUND', message: 'Alumno no encontrado' }, 404)
    if (String(alumno.user_id || '') !== authUser.id) return jsonResponse(req, { error: 'FORBIDDEN', message: 'No puedes iniciar el pago de este alumno.' }, 403)
    const nombre = String(alumno.nombre || authUser.email || 'Alumno PowerFit').trim()
    let cpsQuote: Record<string, unknown> | null = null
    if (isCpsTomo) {
      const { data: quote, error: quoteError } = await serverDb.rpc('get_powerfit_cps_payment_quote_server', {
        p_alumno_id: Number(alumnoId),
        p_path_code: cpsPath,
        p_tomo_no: cpsTomoNo,
        p_user_id: authUser.id,
      })
      if (quoteError || !quote) {
        return jsonResponse(req, 
          {
            error: 'CPS_PAYMENT_QUOTE_ERROR',
            message: quoteError?.message || 'No se pudo calcular el precio del tomo CPS.',
          },
          400,
        )
      }
      cpsQuote = quote as Record<string, unknown>
    }
    const itemTitle = isCpsTomo
      ? `CPS Tomo ${cpsTomoNo} ${cpsPath === 'BOXING' ? 'Boxeo' : 'Kickboxing'} - ${String(cpsQuote?.title || nombre)}`
      : `${plan.name} PowerFit 360 - ${nombre}`
    const itemAmount = isCpsTomo ? Number(cpsQuote?.amount_clp || 0) : plan.amount
    if (!Number.isFinite(itemAmount) || itemAmount <= 0) {
      return jsonResponse(req, { error: 'INVALID_PAYMENT_AMOUNT', message: 'Monto de pago invalido.' }, 400)
    }
    const preference = {
      items: [{ id: isCpsTomo ? `cps-${cpsPath}-${cpsTomoNo}-${alumnoId}` : `${planCode}-${alumnoId}`, title: itemTitle, quantity: 1, unit_price: itemAmount, currency_id: 'CLP' }],
      payer: { name: nombre, email: authUser.email },
      external_reference: alumnoId,
      metadata: isCpsTomo
        ? {
          alumno_id: alumnoId,
          user_id: authUser.id,
          tipo: 'cps_tomo_powerfit',
          path_code: cpsPath,
          tomo_no: cpsTomoNo,
          amount: itemAmount,
          membership_current: Boolean(cpsQuote?.membership_current),
        }
        : { alumno_id: alumnoId, user_id: authUser.id, tipo: 'membership_powerfit', plan_code: planCode, months: plan.months, amount: plan.amount },
      back_urls: { success: `${appUrl}?payment=success`, failure: `${appUrl}?payment=failure`, pending: `${appUrl}?payment=pending` },
      auto_return: 'approved',
      notification_url: webhookUrl,
    }
    const response = await fetch('https://api.mercadopago.com/checkout/preferences', { method: 'POST', headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' }, body: JSON.stringify(preference) })
    const raw = await response.text()
    let data: Record<string, unknown> = {}
    if (raw) {
      try {
        data = JSON.parse(raw)
      } catch {
        data = { message: raw }
      }
    }
    if (!response.ok) {
      return jsonResponse(req, 
        {
          error: 'MERCADOPAGO_PREFERENCE_ERROR',
          message: safeMessage(data),
          status: response.status,
        },
        502,
      )
    }
    return jsonResponse(req, {
      preferenceId: data.id,
      id: data.id,
      init_point: data.init_point,
      sandbox_init_point: data.sandbox_init_point,
      payment_type: isCpsTomo ? 'cps_tomo' : 'membership',
      plan_code: isCpsTomo ? null : planCode,
      months: isCpsTomo ? null : plan.months,
      path_code: isCpsTomo ? cpsPath : null,
      tomo_no: isCpsTomo ? cpsTomoNo : null,
      amount: itemAmount,
    })
  } catch (error) {
    return jsonResponse(req, 
      {
        error: 'CREATE_PREFERENCE_ERROR',
        message: error instanceof Error ? error.message : 'Error inesperado creando preferencia.',
      },
      500,
    )
  }
})
