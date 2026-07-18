-- PowerFit 360 - Storage para fotos y solicitudes de avatar IA
-- Ejecutar en Supabase SQL Editor despues de profile_avatar.sql.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'profile-photos',
  'profile-photos',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'champion-avatars',
  'champion-avatars',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create table if not exists public.avatar_ia_solicitudes (
  id uuid primary key default gen_random_uuid(),
  alumno_id bigint references public.alumnos(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  gimnasio_id uuid references public.gimnasios(id) on delete set null,
  foto_url text,
  template text not null default 'champion_red',
  prompt text,
  estado text not null default 'Pendiente',
  resultado_url text,
  costo_creditos integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.avatar_ia_solicitudes enable row level security;

drop policy if exists "avatar_ia_owner_or_tenant" on public.avatar_ia_solicitudes;
create policy "avatar_ia_owner_or_tenant"
on public.avatar_ia_solicitudes
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

drop policy if exists "profile_photos_public_read" on storage.objects;
create policy "profile_photos_public_read"
on storage.objects
for select
to public
using (bucket_id = 'profile-photos');

drop policy if exists "profile_photos_owner_write" on storage.objects;
create policy "profile_photos_owner_write"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'profile-photos'
  and split_part(name, '/', 1) = auth.uid()::text
);

drop policy if exists "profile_photos_owner_update" on storage.objects;
create policy "profile_photos_owner_update"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'profile-photos'
  and split_part(name, '/', 1) = auth.uid()::text
)
with check (
  bucket_id = 'profile-photos'
  and split_part(name, '/', 1) = auth.uid()::text
);

drop policy if exists "champion_avatars_public_read" on storage.objects;
create policy "champion_avatars_public_read"
on storage.objects
for select
to public
using (bucket_id = 'champion-avatars');

drop policy if exists "champion_avatars_owner_write" on storage.objects;
create policy "champion_avatars_owner_write"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'champion-avatars'
  and split_part(name, '/', 1) = auth.uid()::text
);

notify pgrst, 'reload schema';
