-- PowerFit 360 - reparar y prevenir usuarios Auth sin ficha en public.alumnos.
-- Ejecutar una vez en Supabase SQL Editor.

alter table if exists public.alumnos
add column if not exists fecha_nacimiento date;

alter table if exists public.alumnos
add column if not exists fecha_ingreso date;

create or replace function public.powerfit_create_alumno_for_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.alumnos (
    user_id,
    email,
    nombre,
    telefono,
    fecha_nacimiento,
    fecha_ingreso,
    categoria,
    plan,
    estado_pago,
    monto,
    xp,
    bloques_premium,
    generaciones_disponibles
  )
  values (
    new.id,
    new.email,
    coalesce(nullif(new.raw_user_meta_data->>'nombre', ''), split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'telefono', ''),
    nullif(new.raw_user_meta_data->>'fecha_nacimiento', '')::date,
    coalesce(nullif(new.raw_user_meta_data->>'fecha_ingreso', '')::date, current_date),
    coalesce(new.raw_user_meta_data->>'categoria', ''),
    'Básico',
    'Pendiente',
    0,
    0,
    0,
    6
  )
  on conflict do nothing;

  return new;
end;
$$;

drop trigger if exists powerfit_auth_user_to_alumno on auth.users;

create trigger powerfit_auth_user_to_alumno
after insert on auth.users
for each row execute function public.powerfit_create_alumno_for_auth_user();

insert into public.alumnos (
  user_id,
  email,
  nombre,
  telefono,
  fecha_nacimiento,
  fecha_ingreso,
  categoria,
  plan,
  estado_pago,
  monto,
  xp,
  bloques_premium,
  generaciones_disponibles
)
select
  u.id,
  u.email,
  coalesce(nullif(u.raw_user_meta_data->>'nombre', ''), split_part(u.email, '@', 1)),
  coalesce(u.raw_user_meta_data->>'telefono', ''),
  nullif(u.raw_user_meta_data->>'fecha_nacimiento', '')::date,
  coalesce(nullif(u.raw_user_meta_data->>'fecha_ingreso', '')::date, current_date),
  coalesce(u.raw_user_meta_data->>'categoria', ''),
  'Básico',
  'Pendiente',
  0,
  0,
  0,
  6
from auth.users u
where not exists (
  select 1
  from public.alumnos a
  where a.user_id = u.id
);
