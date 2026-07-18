-- PowerFit 360 - foto de perfil y avatar campeon
-- Ejecutar en Supabase Dashboard > SQL Editor.

alter table if exists public.alumnos
add column if not exists foto_url text;

alter table if exists public.alumnos
add column if not exists avatar_template text default 'champion_red';

notify pgrst, 'reload schema';
