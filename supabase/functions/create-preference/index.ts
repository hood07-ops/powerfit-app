import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
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

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
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
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
    if (req.method !== 'POST') return jsonResponse({ error: 'METHOD_NOT_ALLOWED', message: 'Metodo no permitido' }, 405)
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
      return jsonResponse(
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
    if (authError || !authUser) return jsonResponse({ error: 'UNAUTHORIZED', message: 'Sesion no autorizada.' }, 401)
    const body = await req.json().catch(() => null)
    const paymentType = String(body?.payment_type || body?.tipo || 'membership').trim().toLowerCase()
    const alumnoId = String(body?.alumno_id || '').trim()
    const planCode = String(body?.plan_code || 'monthly').trim().toLowerCase() as PlanCode
    const cpsPath = String(body?.path_code || '').trim().toUpperCase()
    const cpsTomoNo = Number(body?.tomo_no || 0)
    const plan = PLANS[planCode]
    const isCpsTomo = paymentType === 'cps_tomo'
    if (!alumnoId || (!isCpsTomo && !plan)) return jsonResponse({ error: 'INVALID_PAYMENT_DATA', message: 'Datos de pago invalidos' }, 400)
    if (isCpsTomo && (!['BOXING', 'KICKBOXING'].includes(cpsPath) || !Number.isInteger(cpsTomoNo) || cpsTomoNo < 1 || cpsTomoNo > 12)) {
      return jsonResponse({ error: 'INVALID_CPS_TOMO_PAYMENT', message: 'Datos CPS invalidos.' }, 400)
    }
    const serverDb = createClient(supabaseUrl, serviceRoleKey)
    const { data: alumno, error: alumnoError } = await serverDb.from('alumnos').select('id,user_id,nombre').eq('id', alumnoId).maybeSingle()
    if (alumnoError || !alumno) return jsonResponse({ error: 'STUDENT_NOT_FOUND', message: 'Alumno no encontrado' }, 404)
    if (String(alumno.user_id || '') !== authUser.id) return jsonResponse({ error: 'FORBIDDEN', message: 'No puedes iniciar el pago de este alumno.' }, 403)
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
        return jsonResponse(
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
      return jsonResponse({ error: 'INVALID_PAYMENT_AMOUNT', message: 'Monto de pago invalido.' }, 400)
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
      return jsonResponse(
        {
          error: 'MERCADOPAGO_PREFERENCE_ERROR',
          message: safeMessage(data),
          status: response.status,
        },
        502,
      )
    }
    return jsonResponse({
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
    return jsonResponse(
      {
        error: 'CREATE_PREFERENCE_ERROR',
        message: error instanceof Error ? error.message : 'Error inesperado creando preferencia.',
      },
      500,
    )
  }
})
