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
function jsonResponse(body: unknown, status = 200) { return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }) }
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
  const accessToken = Deno.env.get('MP_ACCESS_TOKEN')
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!accessToken || !supabaseUrl || !serviceRoleKey) return jsonResponse({ error: 'Configuracion webhook incompleta' }, 500)
  const paymentId = await paymentIdFromRequest(req)
  if (!paymentId) return jsonResponse({ received: true, ignored: 'Sin payment id' })
  const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, { headers: { Authorization: `Bearer ${accessToken}` } })
  const payment = await mpResponse.json()
  if (!mpResponse.ok) return jsonResponse({ error: 'No se pudo verificar pago', detail: payment }, 502)
  if (payment.status !== 'approved') return jsonResponse({ received: true, status: payment.status })
  const alumnoId = String(payment.metadata?.alumno_id || payment.external_reference || payment.additional_info?.items?.[0]?.id || '').trim()
  const planCode = String(payment.metadata?.plan_code || 'monthly').trim().toLowerCase() as PlanCode
  const plan = PLANS[planCode]
  const amount = Number(payment.transaction_amount || 0)
  if (!alumnoId) return jsonResponse({ error: 'Pago aprobado sin alumno asociado' }, 400)
  if (!plan) return jsonResponse({ error: 'INVALID_MEMBERSHIP_PLAN' }, 400)
  if (amount !== plan.amount) return jsonResponse({ error: 'PAYMENT_AMOUNT_MISMATCH', expected: plan.amount, received: amount }, 400)
  const paidOnRaw = String(payment.date_approved || payment.date_created || '')
  const paidOn = paidOnRaw ? paidOnRaw.slice(0, 10) : new Date().toISOString().slice(0, 10)
  const supabase = createClient(supabaseUrl, serviceRoleKey)
  const { data: receipt, error: paymentError } = await supabase.rpc('register_powerfit_mercadopago_payment_secure', {
    p_external_payment_id: String(paymentId), p_alumno_id: Number(alumnoId), p_plan_code: planCode, p_amount: amount, p_paid_on: paidOn, p_external_reference: String(payment.external_reference || alumnoId),
  })
  if (paymentError) return jsonResponse({ error: paymentError.message }, 500)
  return jsonResponse({ received: true, alumno_id: alumnoId, plan_code: planCode, months: plan.months, amount, payment_id: String(paymentId), receipt })
})
