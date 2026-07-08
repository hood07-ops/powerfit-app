# PowerFit 360

Aplicacion web y Android para gestion de alumnos, asistencia QR, rutinas, IA, reportes, pagos y progreso deportivo.

## Flujo de pago Mercado Pago

El flujo esperado queda preparado asi:

1. Alumno presiona **Pagar mensualidad**.
2. La app llama a Supabase Edge Function `create-preference` o a `VITE_PAYMENT_URL` si se configura una URL manual.
3. El backend crea una preferencia en Mercado Pago.
4. Mercado Pago devuelve `init_point`.
5. La app abre el link de pago.
6. Alumno paga.
7. Mercado Pago llama al webhook.
8. El webhook verifica el pago con Mercado Pago.
9. Supabase actualiza `alumnos`:
   - `estado_pago = Pagado`
   - `fecha_pago = hoy`
   - `fecha_vencimiento = +1 mes`

## Funciones Supabase

Se agregaron dos Edge Functions:

- `supabase/functions/create-preference`
- `supabase/functions/create-mercadopago-preference` queda como alias compatible.
- `supabase/functions/mercadopago-webhook`

## Variables necesarias

Frontend:

```env
VITE_MP_PUBLIC_KEY=TU_PUBLIC_KEY_DE_PRUEBA
VITE_PAYMENT_URL=https://TU-PROYECTO.supabase.co/functions/v1/create-preference
```

`VITE_PAYMENT_URL` es opcional si la app usa `supabase.functions.invoke('create-preference')`.
`VITE_MP_PUBLIC_KEY` puede quedar lista para Checkout Pro/SDK del frontend, pero el flujo actual abre el `init_point` devuelto por backend.

Supabase Edge Functions:

```env
MP_ACCESS_TOKEN=APP_USR_xxx
POWERFIT_APP_URL=https://tu-app.vercel.app
MERCADOPAGO_WEBHOOK_URL=https://TU-PROYECTO.supabase.co/functions/v1/mercadopago-webhook
SUPABASE_URL=https://TU-PROYECTO.supabase.co
SUPABASE_SERVICE_ROLE_KEY=xxx
```

## Comandos utiles

```powershell
npm run build
npx cap sync android
```

Para revisar APK en GitHub Actions:

```powershell
gh run list --limit 5
gh run view --web
```
