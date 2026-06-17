-- PowerFit 360 - Row Level Security policies
-- Ejecutar en Supabase Dashboard > SQL Editor.
-- Objetivo: cerrar tablas publicas y permitir acceso solo al alumno propietario
-- o al usuario admin definido en public.alumnos.role = 'admin'.

create schema if not exists public;

create or replace function public.is_powerfit_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.alumnos a
    where a.user_id = auth.uid()
      and lower(coalesce(a.role, '')) = 'admin'
  );
$$;

grant execute on function public.is_powerfit_admin() to authenticated;

create or replace function public.get_powerfit_checkin_alumno(p_alumno_id text)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_alumno public.alumnos%rowtype;
  v_estado text;
  v_ya_registrado boolean;
  v_hoy date := current_date;
begin
  select *
  into v_alumno
  from public.alumnos
  where id::text = p_alumno_id
  limit 1;

  if not found then
    return null;
  end if;

  v_estado := coalesce(v_alumno.estado_pago, 'Pendiente');

  if v_alumno.fecha_vencimiento is not null
     and v_alumno.fecha_vencimiento::date < v_hoy then
    v_estado := 'Moroso';
    update public.alumnos
    set estado_pago = 'Moroso'
    where id = v_alumno.id;
  end if;

  select exists (
    select 1
    from public.asistencias a
    where a.alumno_id = v_alumno.id
      and a.fecha::date = v_hoy
  )
  into v_ya_registrado;

  return jsonb_build_object(
    'id', v_alumno.id,
    'nombre', v_alumno.nombre,
    'estado_pago', v_estado,
    'fecha_vencimiento', v_alumno.fecha_vencimiento,
    'generaciones_disponibles', v_alumno.generaciones_disponibles,
    'monto', v_alumno.monto,
    'experiencia', v_alumno.experiencia,
    'rango', coalesce(v_alumno.rango, 'Bronce'),
    'ya_registrado', v_ya_registrado
  );
end;
$$;

create or replace function public.registrar_powerfit_checkin(p_alumno_id text)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_alumno public.alumnos%rowtype;
  v_estado text;
  v_ya_registrado boolean;
  v_fecha timestamptz := now();
  v_hoy date := current_date;
  v_exp numeric;
  v_rango text;
begin
  select *
  into v_alumno
  from public.alumnos
  where id::text = p_alumno_id
  limit 1;

  if not found then
    return jsonb_build_object('success', false, 'message', 'No se encontro el alumno.');
  end if;

  v_estado := coalesce(v_alumno.estado_pago, 'Pendiente');

  if v_alumno.fecha_vencimiento is not null
     and v_alumno.fecha_vencimiento::date < v_hoy then
    v_estado := 'Moroso';
    update public.alumnos
    set estado_pago = 'Moroso'
    where id = v_alumno.id;
  end if;

  select exists (
    select 1
    from public.asistencias a
    where a.alumno_id = v_alumno.id
      and a.fecha::date = v_hoy
  )
  into v_ya_registrado;

  if v_ya_registrado then
    return jsonb_build_object(
      'success', false,
      'message', 'Este alumno ya tiene asistencia registrada hoy.',
      'experiencia', v_alumno.experiencia,
      'rango', coalesce(v_alumno.rango, 'Bronce')
    );
  end if;

  v_exp := coalesce(v_alumno.experiencia, 0) + 10;
  v_rango := case
    when v_exp >= 2000 then 'Ariki Matatoa'
    when v_exp >= 1000 then 'Matatoa Nui'
    when v_exp >= 600 then 'Matatoa'
    when v_exp >= 300 then 'Oro'
    when v_exp >= 100 then 'Plata'
    else 'Bronce'
  end;

  insert into public.asistencias (
    alumno_id,
    user_id,
    nombre_alumno,
    estado_pago,
    fecha_vencimiento,
    registrado_por,
    fecha,
    created_at
  )
  values (
    v_alumno.id,
    v_alumno.user_id,
    v_alumno.nombre,
    v_estado,
    v_alumno.fecha_vencimiento,
    'qr',
    v_fecha,
    v_fecha
  );

  update public.alumnos
  set experiencia = v_exp,
      rango = v_rango
  where id = v_alumno.id;

  return jsonb_build_object(
    'success', true,
    'message', 'Asistencia registrada correctamente. +10 XP. Rango: ' || v_rango,
    'experiencia', v_exp,
    'rango', v_rango
  );
end;
$$;

grant execute on function public.get_powerfit_checkin_alumno(text) to anon, authenticated;
grant execute on function public.registrar_powerfit_checkin(text) to anon, authenticated;

alter table if exists public.alumnos enable row level security;
alter table if exists public.asistencias enable row level security;
alter table if exists public.rm_alumnos enable row level security;
alter table if exists public.records_entrenamiento enable row level security;
alter table if exists public.planificaciones_generadas enable row level security;
alter table if exists public.solicitudes_compra enable row level security;
alter table if exists public.tiempos_bloques enable row level security;
alter table if exists public.intentos_powerfit enable row level security;
alter table if exists public.bloques_powerfit enable row level security;
alter table if exists public.rendimiento_powerfit enable row level security;

-- ALUMNOS
drop policy if exists "alumnos_select_own_or_admin" on public.alumnos;
create policy "alumnos_select_own_or_admin"
on public.alumnos
for select
to authenticated
using (user_id = auth.uid() or public.is_powerfit_admin());

drop policy if exists "alumnos_insert_own" on public.alumnos;
create policy "alumnos_insert_own"
on public.alumnos
for insert
to authenticated
with check (user_id = auth.uid() or public.is_powerfit_admin());

drop policy if exists "alumnos_update_own_or_admin" on public.alumnos;
create policy "alumnos_update_own_or_admin"
on public.alumnos
for update
to authenticated
using (user_id = auth.uid() or public.is_powerfit_admin())
with check (user_id = auth.uid() or public.is_powerfit_admin());

drop policy if exists "alumnos_delete_admin" on public.alumnos;
create policy "alumnos_delete_admin"
on public.alumnos
for delete
to authenticated
using (public.is_powerfit_admin());

-- ASISTENCIAS
drop policy if exists "asistencias_select_own_or_admin" on public.asistencias;
create policy "asistencias_select_own_or_admin"
on public.asistencias
for select
to authenticated
using (
  public.is_powerfit_admin()
  or exists (
    select 1 from public.alumnos a
    where a.id = asistencias.alumno_id
      and a.user_id = auth.uid()
  )
);

drop policy if exists "asistencias_insert_own_or_admin" on public.asistencias;
create policy "asistencias_insert_own_or_admin"
on public.asistencias
for insert
to authenticated
with check (
  public.is_powerfit_admin()
  or exists (
    select 1 from public.alumnos a
    where a.id = asistencias.alumno_id
      and a.user_id = auth.uid()
  )
);

drop policy if exists "asistencias_update_admin" on public.asistencias;
create policy "asistencias_update_admin"
on public.asistencias
for update
to authenticated
using (public.is_powerfit_admin())
with check (public.is_powerfit_admin());

drop policy if exists "asistencias_delete_admin" on public.asistencias;
create policy "asistencias_delete_admin"
on public.asistencias
for delete
to authenticated
using (public.is_powerfit_admin());

-- TABLAS CON user_id/alumno_id
drop policy if exists "rm_alumnos_owner_or_admin" on public.rm_alumnos;
create policy "rm_alumnos_owner_or_admin"
on public.rm_alumnos
for all
to authenticated
using (user_id = auth.uid() or public.is_powerfit_admin())
with check (user_id = auth.uid() or public.is_powerfit_admin());

drop policy if exists "records_entrenamiento_owner_or_admin" on public.records_entrenamiento;
create policy "records_entrenamiento_owner_or_admin"
on public.records_entrenamiento
for all
to authenticated
using (user_id = auth.uid() or public.is_powerfit_admin())
with check (user_id = auth.uid() or public.is_powerfit_admin());

drop policy if exists "planificaciones_generadas_owner_or_admin" on public.planificaciones_generadas;
create policy "planificaciones_generadas_owner_or_admin"
on public.planificaciones_generadas
for all
to authenticated
using (user_id = auth.uid() or public.is_powerfit_admin())
with check (user_id = auth.uid() or public.is_powerfit_admin());

drop policy if exists "solicitudes_compra_owner_or_admin" on public.solicitudes_compra;
create policy "solicitudes_compra_owner_or_admin"
on public.solicitudes_compra
for all
to authenticated
using (user_id = auth.uid() or public.is_powerfit_admin())
with check (user_id = auth.uid() or public.is_powerfit_admin());

-- POWERFIT / ESTADISTICAS
drop policy if exists "tiempos_bloques_owner_or_admin" on public.tiempos_bloques;
create policy "tiempos_bloques_owner_or_admin"
on public.tiempos_bloques
for all
to authenticated
using (
  user_id::text = auth.uid()::text
  or public.is_powerfit_admin()
  or exists (
    select 1 from public.alumnos a
    where a.id::text = tiempos_bloques.user_id::text
      and a.user_id = auth.uid()
  )
)
with check (
  user_id::text = auth.uid()::text
  or public.is_powerfit_admin()
  or exists (
    select 1 from public.alumnos a
    where a.id::text = tiempos_bloques.user_id::text
      and a.user_id = auth.uid()
  )
);

drop policy if exists "intentos_powerfit_owner_or_admin" on public.intentos_powerfit;
create policy "intentos_powerfit_owner_or_admin"
on public.intentos_powerfit
for all
to authenticated
using (user_id = auth.uid() or public.is_powerfit_admin())
with check (user_id = auth.uid() or public.is_powerfit_admin());

drop policy if exists "rendimiento_powerfit_owner_or_admin" on public.rendimiento_powerfit;
create policy "rendimiento_powerfit_owner_or_admin"
on public.rendimiento_powerfit
for all
to authenticated
using (user_id = auth.uid() or public.is_powerfit_admin())
with check (user_id = auth.uid() or public.is_powerfit_admin());

-- bloques_powerfit suele ser catalogo de bloques. Si es contenido publico de la app,
-- cualquier usuario autenticado puede leerlo, pero solo admin puede modificarlo.
drop policy if exists "bloques_powerfit_read_authenticated" on public.bloques_powerfit;
create policy "bloques_powerfit_read_authenticated"
on public.bloques_powerfit
for select
to authenticated
using (true);

drop policy if exists "bloques_powerfit_write_admin" on public.bloques_powerfit;
create policy "bloques_powerfit_write_admin"
on public.bloques_powerfit
for all
to authenticated
using (public.is_powerfit_admin())
with check (public.is_powerfit_admin());

-- Fix sugerido por Security Advisor si la funcion existe.
do $$
begin
  if exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'actualizar_powerfit'
      and p.pronargs = 0
  ) then
    alter function public.actualizar_powerfit() set search_path = public, pg_temp;
  end if;
end $$;
