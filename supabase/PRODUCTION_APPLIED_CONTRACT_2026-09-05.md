# PowerFit 360 — Production Applied Contract Snapshot

> **ESTADO: YA APLICADO EN PRODUCCIÓN. NO EJECUTAR COMO MIGRACIÓN.**
>
> Este archivo es un snapshot documental del backend verificado en el proyecto Supabase productivo `sabsmurhriohwmczaktn`.
> Su objetivo es mantener trazabilidad entre producción y repositorio sin volver a ejecutar DDL ya aplicado.

## Reglas canónicas verificadas

- Backend single-tenant.
- No agregar `gimnasio_id`.
- Zona horaria operativa: `Pacific/Easter`.
- El estado financiero es informativo y **no autoriza ni bloquea acceso deportivo**.
- Frontend objetivo: 0 accesos directos a tablas; acceso por RPC seguro.
- Fotos de perfil: Storage privado.
- RPCs sensibles: `SECURITY DEFINER` + autenticación/autorización.
- No exponer `service_role`, OpenAI ni Mercado Pago secrets en frontend.

## RPCs verificados en producción

### Identidad / sesión

- `ensure_powerfit_self_profile(...)`
- `get_powerfit_self_profile_secure()`
- `get_powerfit_user_shell()`
- `get_powerfit_student_directory_secure()`
- `get_powerfit_student_directory_full_secure()`

### Asistencia

- `get_powerfit_attendance_secure(p_alumno_id bigint, p_limit integer)`
- `get_powerfit_attendance_overview_secure(p_limit integer default 500)`
- `register_powerfit_attendance_secure_v2(p_client_event_id text, p_alumno_id bigint, p_method text, p_at timestamptz)`
- `get_powerfit_checkin_alumno(p_alumno_id text)`
- `registrar_powerfit_checkin(p_alumno_id text)`

### Entrenamiento / RM / planes

- `save_powerfit_training_record_secure(...)`
- `save_powerfit_routine_record_with_xp_secure(...)`
- `save_powerfit_rm_secure(p_alumno_id bigint, p_ejercicio text, p_rm_kg numeric, p_fecha date, p_reason text)`
- `save_powerfit_plan_secure(...)`
- `save_powerfit_manual_plan_with_generation_secure(...)`
- `save_powerfit_monthly_plan_secure(...)`
- `get_powerfit_training_history_secure(...)`
- `get_powerfit_generator_state_secure(p_alumno_id bigint)`
- `get_powerfit_routine_catalog_secure()`
- `get_powerfit_routine_content_secure(...)`

### Finanzas / compras

- `register_powerfit_payment_quick(...)`
- `register_powerfit_payment_quick_v2(...)`
- `register_powerfit_payment_with_generation_reset_secure(...)`
- `get_powerfit_purchase_center()`
- `create_powerfit_purchase_request(...)`
- `approve_powerfit_purchase_request_compat_secure(p_request_id bigint, p_note text)`
- `adjust_powerfit_generation_balance(...)`

### Administración / perfil / términos

- `update_powerfit_student_field_admin_secure(...)`
- `accept_powerfit_terms(...)`
- `request_powerfit_avatar_ai(...)`
- `decide_powerfit_avatar_ai(...)`
- `hard_delete_powerfit_student_if_empty(...)`

## Contratos de negocio confirmados

### Pago manual

`register_powerfit_payment_quick(...)` exige `p_period_start` explícito cuando el alumno no tiene todavía `fecha_vencimiento`.

El frontend fue corregido en el commit:
`aefa0dec1513c85f5c180ef5a49715910850834b`

Comportamiento esperado:

- Alumno sin ciclo previo:
  - `p_period_start = fechaPago`
  - `p_paid_on = fechaPago`
- Alumno con ciclo existente:
  - `p_period_start = null`
  - backend continúa el ciclo canónico.

### Generaciones

`save_powerfit_manual_plan_with_generation_secure(...)` guarda plan y descuenta exactamente 1 generación en la misma transacción.

### Plan mensual

`save_powerfit_monthly_plan_secure(...)` consume crédito mensual aprobado y no usa generaciones normales.

### Rutinas + XP

`save_powerfit_routine_record_with_xp_secure(...)` guarda el registro deportivo y suma XP dentro del flujo seguro.

### Bloqueo financiero

Los contratos backend relevantes devuelven:

- `finance_is_sports_authorization = false`
- `sports_never_blocked_only_because_payment_is_pending_or_overdue = true`

## Edge Functions

Presentes en repositorio:

- `create-preference`
- `create-mercadopago-preference`
- `mercadopago-webhook`

Fuente sincronizada desde producción:

- `powerfit-ai-coach` v11

La fuente de `powerfit-ai-coach` v11 fue recuperada directamente desde producción y guardada en `supabase/functions/powerfit-ai-coach/index.ts`. No redeployar sin comparación y E2E.

## Seguridad del repositorio

Revisión realizada:

- `.env` contiene únicamente URL de Supabase y publishable/anon key de cliente.
- No se detectó `service_role`.
- No se detectaron claves `sk-`.
- No se detectó `sb_secret`.
- No se detectó `MP_ACCESS_TOKEN`.
- No se detectaron secrets OpenAI en el repositorio.

## Instrucción crítica

Este archivo **NO es una migración**.

No copiar estas funciones a `supabase/migrations` ni ejecutar nuevamente en producción sin comparar primero:

1. definición actual en Supabase,
2. versión del repositorio,
3. dependencias,
4. permisos `authenticated/anon`,
5. impacto transaccional.
