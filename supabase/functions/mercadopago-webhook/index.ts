import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  })
}

function addThirtyDays(date: Date) {
  const next = new Date(date)
  next.setDate(next.getDate() + 30)
  return next
}

async function paymentIdFromRequest(req: Request) {
  const url = new URL(req.url)
  const queryId = url.searchParams.get('data.id') || url.searchParams.get('id')

  if (queryId) return queryId

  const body = await req.json().catch(() => null)
  return body?.data?.id || body?.id || body?.resource?.split('/').pop() || null
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Metodo no permitido' }, 405)
  }

  const accessToken = Deno.env.get('MP_ACCESS_TOKEN')
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

  if (!accessToken || !supabaseUrl || !serviceRoleKey) {
    return jsonResponse(
      { error: 'Faltan secretos MP_ACCESS_TOKEN, SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY' },
      500
    )
  }

  const paymentId = await paymentIdFromRequest(req)

  if (!paymentId) {
    return jsonResponse({ received: true, ignored: 'Sin payment id' })
  }

  const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })
  const payment = await mpResponse.json()

  if (!mpResponse.ok) {
    return jsonResponse({ error: 'No se pudo verificar pago', detail: payment }, 502)
  }

  if (payment.status !== 'approved') {
    return jsonResponse({ received: true, status: payment.status })
  }

  const alumnoId =
    payment.metadata?.alumno_id ||
    payment.external_reference ||
    payment.additional_info?.items?.[0]?.id

  if (!alumnoId) {
    return jsonResponse({ error: 'Pago aprobado sin alumno asociado' }, 400)
  }

  const hoy = new Date()
  const vencimiento = addThirtyDays(hoy)
  const supabase = createClient(supabaseUrl, serviceRoleKey)

  const updateData = {
    estado_pago: 'Pagado',
    fecha_pago: hoy.toISOString().slice(0, 10),
    fecha_vencimiento: vencimiento.toISOString().slice(0, 10),
  }

  const { error: updateError } = await supabase
    .from('alumnos')
    .update(updateData)
    .eq('id', alumnoId)

  if (updateError) {
    return jsonResponse({ error: updateError.message }, 500)
  }

  await supabase.from('solicitudes_compra').insert([
    {
      alumno_id: alumnoId,
      nombre_alumno: payment.payer?.first_name || '',
      monto: Number(payment.transaction_amount || 0),
      generaciones: 0,
      estado: 'Aprobado',
      payment_id: String(paymentId),
      referencia: `Mercado Pago mensualidad aprobada - comprobante ${paymentId}`,
    },
  ])

  return jsonResponse({
    received: true,
    alumno_id: alumnoId,
    estado_pago: updateData.estado_pago,
    fecha_pago: updateData.fecha_pago,
    fecha_vencimiento: updateData.fecha_vencimiento,
  })
})
