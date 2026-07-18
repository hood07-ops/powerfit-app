-- PowerFit 360 - terminos, condiciones y contrato aceptado
-- Ejecutar en Supabase SQL Editor.

alter table if exists public.alumnos
add column if not exists terminos_aceptados boolean not null default false;

alter table if exists public.alumnos
add column if not exists terminos_version text;

alter table if exists public.alumnos
add column if not exists terminos_aceptados_at timestamptz;

create table if not exists public.terminos_aceptaciones (
  id uuid primary key default gen_random_uuid(),
  alumno_id bigint references public.alumnos(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  gimnasio_id uuid references public.gimnasios(id) on delete set null,
  version text not null,
  acepto_terminos boolean not null default false,
  acepto_contrato boolean not null default false,
  nombre_aceptante text,
  email text,
  user_agent text,
  created_at timestamptz not null default now()
);

alter table public.terminos_aceptaciones enable row level security;

drop policy if exists "terminos_aceptaciones_owner_or_tenant" on public.terminos_aceptaciones;
create policy "terminos_aceptaciones_owner_or_tenant"
on public.terminos_aceptaciones
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
