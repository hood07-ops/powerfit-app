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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Metodo no permitido' }, 405)
  }

  const accessToken = Deno.env.get('MP_ACCESS_TOKEN')
  const appUrl = Deno.env.get('POWERFIT_APP_URL')
  const webhookUrl = Deno.env.get('MERCADOPAGO_WEBHOOK_URL')

  if (!accessToken || !appUrl || !webhookUrl) {
    return jsonResponse(
      { error: 'Faltan secretos MP_ACCESS_TOKEN, POWERFIT_APP_URL o MERCADOPAGO_WEBHOOK_URL' },
      500
    )
  }

  const body = await req.json().catch(() => null)
  const alumnoId = String(body?.alumno_id || '').trim()
  const userId = String(body?.user_id || '').trim()
  const nombre = String(body?.nombre || 'Alumno PowerFit').trim()
  const monto = Number(body?.monto || 0)

  if (!alumnoId || !userId || monto <= 0) {
    return jsonResponse({ error: 'Datos de pago invalidos' }, 400)
  }

  const preference = {
    items: [
      {
        title: `Mensualidad PowerFit 360 - ${nombre}`,
        quantity: 1,
        unit_price: monto,
        currency_id: 'CLP',
      },
    ],
    payer: {
      name: nombre,
    },
    external_reference: alumnoId,
    metadata: {
      alumno_id: alumnoId,
      user_id: userId,
      tipo: 'mensualidad_powerfit',
    },
    back_urls: {
      success: `${appUrl}?payment=success`,
      failure: `${appUrl}?payment=failure`,
      pending: `${appUrl}?payment=pending`,
    },
    auto_return: 'approved',
    notification_url: webhookUrl,
  }

  const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(preference),
  })

  const data = await response.json()

  if (!response.ok) {
    return jsonResponse({ error: 'Mercado Pago rechazo la preferencia', detail: data }, 502)
  }

  return jsonResponse({
    id: data.id,
    init_point: data.init_point,
    sandbox_init_point: data.sandbox_init_point,
  })
})
