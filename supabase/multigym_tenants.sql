-- PowerFit 360 - multigimnasio / tenant por profesor
-- Ejecutar en Supabase Dashboard > SQL Editor cuando queramos activar bases separadas.
-- Objetivo:
-- 1) Cada profesor/gimnasio administra solo sus alumnos.
-- 2) PowerFit conserva trazabilidad comercial del 10% por alumno integrado.
-- 3) Mantener compatibilidad con alumnos existentes asignandolos al gimnasio base.

create extension if not exists pgcrypto;

create table if not exists public.gimnasios (
  id uuid primary key default gen_random_uuid(),
  nombre text not null default 'PowerFit 360',
  slug text unique,
  logo_url text,
  owner_user_id uuid references auth.users(id) on delete set null,
  comision_powerfit numeric(5, 4) not null default 0.10,
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.gimnasio_profesores (
  id uuid primary key default gen_random_uuid(),
  gimnasio_id uuid not null references public.gimnasios(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  rol text not null default 'profesor',
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  unique (gimnasio_id, user_id)
);

alter table if exists public.alumnos
add column if not exists gimnasio_id uuid references public.gimnasios(id) on delete set null;

alter table if exists public.asistencias
add column if not exists gimnasio_id uuid references public.gimnasios(id) on delete set null;

alter table if exists public.rm_alumnos
add column if not exists gimnasio_id uuid references public.gimnasios(id) on delete set null;

alter table if exists public.records_entrenamiento
add column if not exists gimnasio_id uuid references public.gimnasios(id) on delete set null;

alter table if exists public.planificaciones_generadas
add column if not exists gimnasio_id uuid references public.gimnasios(id) on delete set null;

alter table if exists public.solicitudes_compra
add column if not exists gimnasio_id uuid references public.gimnasios(id) on delete set null;

insert into public.gimnasios (nombre, slug, comision_powerfit)
values ('PowerFit 360 Base', 'powerfit-360-base', 0.10)
on conflict (slug) do nothing;

update public.alumnos
set gimnasio_id = (select id from public.gimnasios where slug = 'powerfit-360-base' limit 1)
where gimnasio_id is null;

insert into public.gimnasio_profesores (gimnasio_id, user_id, rol)
select distinct
  a.gimnasio_id,
  a.user_id,
  case
    when lower(coalesce(a.role, '')) in ('admin', 'powerfit_admin') then 'owner'
    else 'alumno'
  end
from public.alumnos a
where a.user_id is not null
  and a.gimnasio_id is not null
on conflict (gimnasio_id, user_id) do nothing;

update public.asistencias asi
set gimnasio_id = a.gimnasio_id
from public.alumnos a
where asi.alumno_id = a.id
  and asi.gimnasio_id is null;

update public.rm_alumnos rm
set gimnasio_id = a.gimnasio_id
from public.alumnos a
where rm.alumno_id = a.id
  and rm.gimnasio_id is null;

update public.records_entrenamiento rec
set gimnasio_id = a.gimnasio_id
from public.alumnos a
where rec.alumno_id = a.id
  and rec.gimnasio_id is null;

update public.planificaciones_generadas plan
set gimnasio_id = a.gimnasio_id
from public.alumnos a
where plan.alumno_id = a.id
  and plan.gimnasio_id is null;

update public.solicitudes_compra sol
set gimnasio_id = a.gimnasio_id
from public.alumnos a
where sol.alumno_id = a.id
  and sol.gimnasio_id is null;

create or replace function public.powerfit_is_platform_admin()
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
      and lower(coalesce(a.role, '')) in ('powerfit_admin', 'super_admin')
  );
$$;

create or replace function public.is_powerfit_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select public.powerfit_is_platform_admin();
$$;

create or replace function public.powerfit_current_gimnasio_ids()
returns setof uuid
language sql
security definer
set search_path = public
stable
as $$
  select gp.gimnasio_id
  from public.gimnasio_profesores gp
  where gp.user_id = auth.uid()
    and gp.activo = true
  union
  select a.gimnasio_id
  from public.alumnos a
  where a.user_id = auth.uid()
    and a.gimnasio_id is not null;
$$;

create or replace function public.powerfit_can_access_gimnasio(p_gimnasio_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select public.powerfit_is_platform_admin()
    or p_gimnasio_id in (select public.powerfit_current_gimnasio_ids());
$$;

create or replace function public.powerfit_set_gimnasio_from_alumno()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.gimnasio_id is null and new.alumno_id is not null then
    select a.gimnasio_id
    into new.gimnasio_id
    from public.alumnos a
    where a.id = new.alumno_id;
  end if;

  return new;
end;
$$;

create or replace function public.powerfit_create_gimnasio_for_current_user(
  p_nombre text,
  p_logo_url text default null
)
returns public.gimnasios
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_gimnasio public.gimnasios%rowtype;
  v_nombre text := coalesce(nullif(trim(p_nombre), ''), 'Mi gimnasio PowerFit');
begin
  if auth.uid() is null then
    raise exception 'Usuario no autenticado';
  end if;

  insert into public.gimnasios (
    nombre,
    slug,
    logo_url,
    owner_user_id,
    comision_powerfit
  )
  values (
    v_nombre,
    lower(regexp_replace(v_nombre || '-' || substr(auth.uid()::text, 1, 8), '[^a-zA-Z0-9]+', '-', 'g')),
    p_logo_url,
    auth.uid(),
    0.10
  )
  returning *
  into v_gimnasio;

  insert into public.gimnasio_profesores (gimnasio_id, user_id, rol)
  values (v_gimnasio.id, auth.uid(), 'owner')
  on conflict (gimnasio_id, user_id) do update
  set rol = excluded.rol,
      activo = true;

  update public.alumnos
  set gimnasio_id = v_gimnasio.id,
      role = case
        when lower(coalesce(role, '')) in ('powerfit_admin', 'super_admin') then role
        else 'admin'
      end
  where user_id = auth.uid();

  return v_gimnasio;
end;
$$;

drop trigger if exists set_asistencias_gimnasio on public.asistencias;
create trigger set_asistencias_gimnasio
before insert or update on public.asistencias
for each row execute function public.powerfit_set_gimnasio_from_alumno();

drop trigger if exists set_rm_alumnos_gimnasio on public.rm_alumnos;
create trigger set_rm_alumnos_gimnasio
before insert or update on public.rm_alumnos
for each row execute function public.powerfit_set_gimnasio_from_alumno();

drop trigger if exists set_records_entrenamiento_gimnasio on public.records_entrenamiento;
create trigger set_records_entrenamiento_gimnasio
before insert or update on public.records_entrenamiento
for each row execute function public.powerfit_set_gimnasio_from_alumno();

drop trigger if exists set_planificaciones_gimnasio on public.planificaciones_generadas;
create trigger set_planificaciones_gimnasio
before insert or update on public.planificaciones_generadas
for each row execute function public.powerfit_set_gimnasio_from_alumno();

drop trigger if exists set_solicitudes_compra_gimnasio on public.solicitudes_compra;
create trigger set_solicitudes_compra_gimnasio
before insert or update on public.solicitudes_compra
for each row execute function public.powerfit_set_gimnasio_from_alumno();

create or replace view public.powerfit_comisiones_profesor as
select
  g.id as gimnasio_id,
  g.nombre as gimnasio,
  count(a.id) as alumnos_integrados,
  coalesce(sum(a.monto), 0) as mensualidad_total,
  round(coalesce(sum(a.monto), 0) * coalesce(g.comision_powerfit, 0.10)) as comision_powerfit_estimada,
  round(coalesce(sum(a.monto), 0) * (1 - coalesce(g.comision_powerfit, 0.10))) as ingreso_profesor_estimado
from public.gimnasios g
left join public.alumnos a on a.gimnasio_id = g.id
group by g.id, g.nombre, g.comision_powerfit;

grant execute on function public.powerfit_is_platform_admin() to authenticated;
grant execute on function public.is_powerfit_admin() to authenticated;
grant execute on function public.powerfit_current_gimnasio_ids() to authenticated;
grant execute on function public.powerfit_can_access_gimnasio(uuid) to authenticated;
grant execute on function public.powerfit_create_gimnasio_for_current_user(text, text) to authenticated;
grant select on public.powerfit_comisiones_profesor to authenticated;

alter table public.gimnasios enable row level security;
alter table public.gimnasio_profesores enable row level security;

drop policy if exists "gimnasios_select_tenant_or_platform" on public.gimnasios;
create policy "gimnasios_select_tenant_or_platform"
on public.gimnasios
for select
to authenticated
using (public.powerfit_can_access_gimnasio(id));

drop policy if exists "gimnasios_update_owner_or_platform" on public.gimnasios;
create policy "gimnasios_update_owner_or_platform"
on public.gimnasios
for update
to authenticated
using (
  public.powerfit_is_platform_admin()
  or exists (
    select 1
    from public.gimnasio_profesores gp
    where gp.gimnasio_id = gimnasios.id
      and gp.user_id = auth.uid()
      and gp.activo = true
      and lower(gp.rol) in ('owner', 'admin')
  )
)
with check (
  public.powerfit_is_platform_admin()
  or exists (
    select 1
    from public.gimnasio_profesores gp
    where gp.gimnasio_id = gimnasios.id
      and gp.user_id = auth.uid()
      and gp.activo = true
      and lower(gp.rol) in ('owner', 'admin')
  )
);

drop policy if exists "gimnasio_profesores_select_tenant_or_platform" on public.gimnasio_profesores;
create policy "gimnasio_profesores_select_tenant_or_platform"
on public.gimnasio_profesores
for select
to authenticated
using (public.powerfit_can_access_gimnasio(gimnasio_id));

-- Politicas multigimnasio para activar despues de revisar en staging.
-- Reemplazan el acceso global por role='admin' y limitan por gimnasio_id.
drop policy if exists "alumnos_select_tenant_or_own" on public.alumnos;
create policy "alumnos_select_tenant_or_own"
on public.alumnos
for select
to authenticated
using (
  user_id = auth.uid()
  or public.powerfit_is_platform_admin()
  or public.powerfit_can_access_gimnasio(gimnasio_id)
);

drop policy if exists "alumnos_update_tenant_or_own" on public.alumnos;
create policy "alumnos_update_tenant_or_own"
on public.alumnos
for update
to authenticated
using (
  user_id = auth.uid()
  or public.powerfit_is_platform_admin()
  or public.powerfit_can_access_gimnasio(gimnasio_id)
)
with check (
  user_id = auth.uid()
  or public.powerfit_is_platform_admin()
  or public.powerfit_can_access_gimnasio(gimnasio_id)
);

drop policy if exists "alumnos_delete_tenant_or_platform" on public.alumnos;
create policy "alumnos_delete_tenant_or_platform"
on public.alumnos
for delete
to authenticated
using (
  public.powerfit_is_platform_admin()
  or public.powerfit_can_access_gimnasio(gimnasio_id)
);

drop policy if exists "asistencias_tenant_access" on public.asistencias;
create policy "asistencias_tenant_access"
on public.asistencias
for all
to authenticated
using (
  public.powerfit_is_platform_admin()
  or public.powerfit_can_access_gimnasio(gimnasio_id)
  or exists (
    select 1
    from public.alumnos a
    where a.id = asistencias.alumno_id
      and a.user_id = auth.uid()
  )
)
with check (
  public.powerfit_is_platform_admin()
  or public.powerfit_can_access_gimnasio(gimnasio_id)
  or exists (
    select 1
    from public.alumnos a
    where a.id = asistencias.alumno_id
      and a.user_id = auth.uid()
  )
);

drop policy if exists "rm_alumnos_tenant_access" on public.rm_alumnos;
create policy "rm_alumnos_tenant_access"
on public.rm_alumnos
for all
to authenticated
using (
  user_id = auth.uid()
  or public.powerfit_is_platform_admin()
  or public.powerfit_can_access_gimnasio(gimnasio_id)
)
with check (
  user_id = auth.uid()
  or public.powerfit_is_platform_admin()
  or public.powerfit_can_access_gimnasio(gimnasio_id)
);

drop policy if exists "records_entrenamiento_tenant_access" on public.records_entrenamiento;
create policy "records_entrenamiento_tenant_access"
on public.records_entrenamiento
for all
to authenticated
using (
  user_id = auth.uid()
  or public.powerfit_is_platform_admin()
  or public.powerfit_can_access_gimnasio(gimnasio_id)
)
with check (
  user_id = auth.uid()
  or public.powerfit_is_platform_admin()
  or public.powerfit_can_access_gimnasio(gimnasio_id)
);

drop policy if exists "planificaciones_generadas_tenant_access" on public.planificaciones_generadas;
create policy "planificaciones_generadas_tenant_access"
on public.planificaciones_generadas
for all
to authenticated
using (
  user_id = auth.uid()
  or public.powerfit_is_platform_admin()
  or public.powerfit_can_access_gimnasio(gimnasio_id)
)
with check (
  user_id = auth.uid()
  or public.powerfit_is_platform_admin()
  or public.powerfit_can_access_gimnasio(gimnasio_id)
);

drop policy if exists "solicitudes_compra_tenant_access" on public.solicitudes_compra;
create policy "solicitudes_compra_tenant_access"
on public.solicitudes_compra
for all
to authenticated
using (
  user_id = auth.uid()
  or public.powerfit_is_platform_admin()
  or public.powerfit_can_access_gimnasio(gimnasio_id)
)
with check (
  user_id = auth.uid()
  or public.powerfit_is_platform_admin()
  or public.powerfit_can_access_gimnasio(gimnasio_id)
);

notify pgrst, 'reload schema';
