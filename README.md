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
npm run build:management
npm run build:student
npm run build:professor
npx cap sync android
```

## Ediciones de la app

PowerFit puede compilarse en tres modos:

- `management`: gestion de asistencia, alumnos, pagos, reportes y administracion de gimnasio. No muestra Generador IA, Constructor, Biblioteca ni Rutinas.
- `student`: experiencia de alumno.
- `professor_full`: app completa para profesores, con marca personalizable.

Cada modo usa su archivo:

```env
.env.management
.env.student
.env.professor_full
```

La variable que controla la edicion es:

```env
VITE_POWERFIT_EDITION=professor_full
```

## Multigimnasio

Para activar bases separadas por profesor/gimnasio, ejecutar en Supabase SQL Editor:

```sql
supabase/multigym_tenants.sql
```

Esto crea:

- `gimnasios`
- `gimnasio_profesores`
- `gimnasio_id` en alumnos, asistencias, RM, records, planificaciones y compras
- politicas RLS por gimnasio
- vista `powerfit_comisiones_profesor` para estimar el 10% PowerFit por alumno/mensualidad

Despues de activar el SQL, un admin/profesor puede ir a **Marca** y guardar nombre/logo de su escuela. Si todavia no tiene gimnasio propio, la app intentara crearlo con `powerfit_create_gimnasio_for_current_user`.

## Foto y avatar de alumno

Para permitir que cada alumno suba su foto y use avatar de campeon, ejecutar:

```sql
supabase/profile_avatar.sql
```

Si ya ejecutaste `supabase/multigym_tenants.sql`, esas columnas tambien quedan creadas.

Para guardar fotos en Supabase Storage y dejar solicitudes de avatar IA pendientes:

```sql
supabase/avatar_storage_ai.sql
```

Esto crea los buckets `profile-photos` y `champion-avatars`, mas la tabla `avatar_ia_solicitudes`.

Para revisar APK en GitHub Actions:

```powershell
gh run list --limit 5
gh run view --web
```
