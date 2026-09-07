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

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return jsonResponse({ error: 'Metodo no permitido' }, 405)
  const accessToken = Deno.env.get('MP_ACCESS_TOKEN')
  const appUrl = Deno.env.get('POWERFIT_APP_URL')
  const webhookUrl = Deno.env.get('MERCADOPAGO_WEBHOOK_URL')
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  const authorization = req.headers.get('Authorization') || ''
  if (!accessToken || !appUrl || !webhookUrl || !supabaseUrl || !anonKey || !serviceRoleKey) return jsonResponse({ error: 'Configuracion de pago incompleta' }, 500)
  const userDb = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authorization } } })
  const { data: authData, error: authError } = await userDb.auth.getUser()
  const authUser = authData?.user
  if (authError || !authUser) return jsonResponse({ error: 'UNAUTHORIZED' }, 401)
  const body = await req.json().catch(() => null)
  const alumnoId = String(body?.alumno_id || '').trim()
  const planCode = String(body?.plan_code || 'monthly').trim().toLowerCase() as PlanCode
  const plan = PLANS[planCode]
  if (!alumnoId || !plan) return jsonResponse({ error: 'Datos de pago invalidos' }, 400)
  const serverDb = createClient(supabaseUrl, serviceRoleKey)
  const { data: alumno, error: alumnoError } = await serverDb.from('alumnos').select('id,user_id,nombre').eq('id', alumnoId).maybeSingle()
  if (alumnoError || !alumno) return jsonResponse({ error: 'Alumno no encontrado' }, 404)
  if (String(alumno.user_id || '') !== authUser.id) return jsonResponse({ error: 'FORBIDDEN' }, 403)
  const nombre = String(alumno.nombre || authUser.email || 'Alumno PowerFit').trim()
  const preference = {
    items: [{ id: `${planCode}-${alumnoId}`, title: `${plan.name} PowerFit 360 - ${nombre}`, quantity: 1, unit_price: plan.amount, currency_id: 'CLP' }],
    payer: { name: nombre }, external_reference: alumnoId,
    metadata: { alumno_id: alumnoId, user_id: authUser.id, tipo: 'membership_powerfit', plan_code: planCode, months: plan.months, amount: plan.amount },
    back_urls: { success: `${appUrl}?payment=success`, failure: `${appUrl}?payment=failure`, pending: `${appUrl}?payment=pending` },
    auto_return: 'approved', notification_url: webhookUrl,
  }
  const response = await fetch('https://api.mercadopago.com/checkout/preferences', { method: 'POST', headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' }, body: JSON.stringify(preference) })
  const data = await response.json()
  if (!response.ok) return jsonResponse({ error: 'Mercado Pago rechazo la preferencia', detail: data }, 502)
  return jsonResponse({ preferenceId: data.id, id: data.id, init_point: data.init_point, sandbox_init_point: data.sandbox_init_point, plan_code: planCode, months: plan.months, amount: plan.amount })
})
