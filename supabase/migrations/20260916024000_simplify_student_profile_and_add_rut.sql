create or replace function public.powerfit_normalize_rut(p_rut text)
returns text
language plpgsql
immutable
set search_path = public
as $$
declare
  v_clean text;
begin
  v_clean := upper(regexp_replace(coalesce(p_rut,''), '[^0-9kK]', '', 'g'));
  if length(v_clean) < 2 then return null; end if;
  return substr(v_clean,1,length(v_clean)-1) || '-' || right(v_clean,1);
end;
$$;

create or replace function public.powerfit_validate_rut(p_rut text)
returns boolean
language plpgsql
immutable
set search_path = public
as $$
declare
  v_norm text := public.powerfit_normalize_rut(p_rut);
  v_body text;
  v_dv text;
  v_sum integer := 0;
  v_factor integer := 2;
  v_i integer;
  v_calc integer;
  v_expected text;
begin
  if v_norm is null then return false; end if;
  v_body := split_part(v_norm,'-',1);
  v_dv := split_part(v_norm,'-',2);
  if v_body !~ '^[0-9]{6,8}$' or v_dv !~ '^[0-9K]$' then return false; end if;
  for v_i in reverse length(v_body)..1 loop
    v_sum := v_sum + substr(v_body,v_i,1)::integer * v_factor;
    v_factor := v_factor + 1;
    if v_factor > 7 then v_factor := 2; end if;
  end loop;
  v_calc := 11 - (v_sum % 11);
  v_expected := case when v_calc=11 then '0' when v_calc=10 then 'K' else v_calc::text end;
  return v_dv = v_expected;
end;
$$;

alter table public.alumnos add column if not exists rut text;
update public.alumnos set rut = null where rut is not null and trim(rut)='';
create unique index if not exists alumnos_rut_unique_when_present on public.alumnos(rut) where rut is not null;

alter table public.alumnos drop constraint if exists alumnos_rut_valid_check;
alter table public.alumnos add constraint alumnos_rut_valid_check check (
  rut is null or (rut = public.powerfit_normalize_rut(rut) and public.powerfit_validate_rut(rut))
);

comment on column public.alumnos.edad is 'LEGACY compatibility only. Canonical age is calculated from fecha_nacimiento.';
comment on column public.alumnos.categoria is 'LEGACY compatibility only. Not requested during self-registration.';
comment on column public.alumnos.rut is 'Chilean RUT normalized as body-DV. Private: admin/self only.';

create or replace function public.ensure_powerfit_self_profile(
  p_nombre text default null,
  p_telefono text default null,
  p_fecha_nacimiento date default null,
  p_contacto_emergencia text default null,
  p_categoria text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
set "TimeZone" = 'Pacific/Easter'
as $$
declare
  v_uid uuid:=auth.uid();
  v_email text;
  v_meta jsonb;
  v_id bigint;
  v_created boolean:=false;
  v_nombre text;
  v_telefono text;
  v_birth date;
  v_rut text;
  v_peso numeric;
  v_altura numeric;
  v_emergencia text;
  v_observaciones text;
  v_shell jsonb;
begin
  if v_uid is null then raise exception 'AUTH_REQUIRED' using errcode='42501'; end if;
  select email,coalesce(raw_user_meta_data,'{}'::jsonb) into v_email,v_meta from auth.users where id=v_uid;
  if v_email is null then raise exception 'AUTH_USER_NOT_FOUND' using errcode='22023'; end if;
  v_nombre:=nullif(trim(coalesce(p_nombre,v_meta->>'nombre',split_part(v_email,'@',1))), '');
  v_telefono:=nullif(trim(coalesce(p_telefono,v_meta->>'telefono','')), '');
  v_birth:=coalesce(p_fecha_nacimiento,nullif(v_meta->>'fecha_nacimiento','')::date);
  v_rut:=public.powerfit_normalize_rut(v_meta->>'rut');
  v_peso:=nullif(trim(coalesce(v_meta->>'peso','')),'')::numeric;
  v_altura:=nullif(trim(coalesce(v_meta->>'altura','')),'')::numeric;
  v_emergencia:=nullif(trim(coalesce(p_contacto_emergencia,v_meta->>'contacto_emergencia','')), '');
  v_observaciones:=nullif(trim(coalesce(v_meta->>'observaciones','')), '');
  if v_birth is not null and (v_birth>public.powerfit_finance_today() or v_birth<date '1900-01-01') then raise exception 'INVALID_BIRTH_DATE' using errcode='22023'; end if;
  if v_rut is not null and not public.powerfit_validate_rut(v_rut) then raise exception 'INVALID_RUT' using errcode='22023'; end if;
  if v_peso is not null and (v_peso<20 or v_peso>350) then raise exception 'INVALID_WEIGHT' using errcode='22023'; end if;
  if v_altura is not null and (v_altura<80 or v_altura>250) then raise exception 'INVALID_HEIGHT' using errcode='22023'; end if;
  select id into v_id from public.alumnos where user_id=v_uid limit 1;
  if v_id is null then
    insert into public.alumnos(user_id,email,nombre,telefono,fecha_nacimiento,fecha_ingreso,categoria,contacto_emergencia,rut,peso,altura,observaciones,plan,estado_pago,monto,xp,bloques_premium,generaciones_disponibles,role,terminos_aceptados,terminos_version,terminos_aceptados_at)
    values(v_uid,left(v_email,320),left(coalesce(v_nombre,'Alumno'),160),left(coalesce(v_telefono,''),80),v_birth,public.powerfit_finance_today(),left(coalesce(trim(p_categoria),''),80),left(coalesce(v_emergencia,''),200),v_rut,v_peso,v_altura,left(coalesce(v_observaciones,''),2000),'Basico','Pendiente',0,0,0,6,null,false,null,null)
    on conflict (user_id) where user_id is not null do nothing returning id into v_id;
    if v_id is not null then v_created:=true; else select id into v_id from public.alumnos where user_id=v_uid limit 1; end if;
  else
    update public.alumnos set
      nombre=case when nullif(trim(nombre),'') is null and v_nombre is not null then left(v_nombre,160) else nombre end,
      telefono=case when nullif(trim(telefono),'') is null and v_telefono is not null then left(v_telefono,80) else telefono end,
      fecha_nacimiento=coalesce(fecha_nacimiento,v_birth),
      contacto_emergencia=case when nullif(trim(contacto_emergencia),'') is null and v_emergencia is not null then left(v_emergencia,200) else contacto_emergencia end,
      rut=coalesce(rut,v_rut),peso=coalesce(peso,v_peso),altura=coalesce(altura,v_altura),
      observaciones=case when nullif(trim(observaciones),'') is null and v_observaciones is not null then left(v_observaciones,2000) else observaciones end
    where id=v_id;
  end if;
  if v_id is null then raise exception 'PROFILE_BOOTSTRAP_FAILED' using errcode='P0001'; end if;
  v_shell:=public.get_powerfit_user_shell();
  return jsonb_build_object('version','identity-self-bootstrap-v2-simple-profile','created',v_created,'alumno_id',v_id,'shell',v_shell,'next',jsonb_build_object('profile_rpc','get_powerfit_athlete_360_v2','readiness_rpc','get_powerfit_student_readiness','terms_rpc','get_powerfit_terms_contract'));
end;
$$;

create or replace function public.get_powerfit_self_profile_secure()
returns jsonb
language plpgsql
stable security definer
set search_path = public
as $$
declare v_uid uuid := auth.uid(); v_a public.alumnos%rowtype; v_age integer;
begin
  if v_uid is null then raise exception 'AUTHENTICATION_REQUIRED' using errcode='42501'; end if;
  select * into v_a from public.alumnos where user_id=v_uid order by id limit 1;
  if not found then return jsonb_build_object('version','self-profile-secure-v2','profile',null); end if;
  v_age := case when v_a.fecha_nacimiento is null then null else extract(year from age(public.powerfit_finance_today(),v_a.fecha_nacimiento))::integer end;
  return jsonb_build_object('version','self-profile-secure-v2','profile',jsonb_build_object(
    'id',v_a.id,'nombre',v_a.nombre,'rut',v_a.rut,'telefono',v_a.telefono,'categoria',v_a.categoria,'estado',v_a.estado,'created_at',v_a.created_at,'fecha_ingreso',v_a.fecha_ingreso,'edad',v_age,'peso',v_a.peso,'altura',v_a.altura,
    'nivel',v_a.nivel,'bloque_actual',v_a.bloque_actual,'record_personal',v_a.record_personal,'mejor_tiempo',v_a.mejor_tiempo,'estado_powerfit',v_a.estado_powerfit,'xp',v_a.xp,'rango',v_a.rango,'medalla',v_a.medalla,'streak',v_a.streak,'puntos_semanales',v_a.puntos_semanales,'matatoa_mes',v_a.matatoa_mes,'record_semanal',v_a.record_semanal,'record_historico',v_a.record_historico,
    'user_id',v_a.user_id,'email',v_a.email,'plan',v_a.plan,'estado_pago',v_a.estado_pago,'fecha_pago',v_a.fecha_pago,'fecha_vencimiento',v_a.fecha_vencimiento,'monto',v_a.monto,'contacto_emergencia',v_a.contacto_emergencia,'observaciones',v_a.observaciones,'role',coalesce(nullif(lower(trim(v_a.role)),''),'alumno'),'bloques_premium',v_a.bloques_premium,'generaciones_disponibles',v_a.generaciones_disponibles,'fecha_ultima_generacion',v_a.fecha_ultima_generacion,'nivel_matatoa',v_a.nivel_matatoa,'foto_url',v_a.foto_url,'foto_storage_path',v_a.foto_storage_path,'avatar_template',v_a.avatar_template,'terminos_aceptados',v_a.terminos_aceptados,'terminos_version',v_a.terminos_version,'terminos_aceptados_at',v_a.terminos_aceptados_at,'fecha_nacimiento',v_a.fecha_nacimiento));
end;
$$;

create or replace function public.update_powerfit_student_field_admin_secure(p_alumno_id bigint,p_field text,p_value jsonb,p_reason text default null)
returns jsonb
language plpgsql
security definer
set search_path = public
set "TimeZone" = 'Pacific/Easter'
as $$
declare
  v_uid uuid := auth.uid(); v_field text := lower(trim(coalesce(p_field,''))); v_old jsonb; v_new jsonb; v_target_int int; v_text text; v_num numeric; v_date date;
begin
  if v_uid is null or not public.is_powerfit_admin() then raise exception 'FORBIDDEN' using errcode='42501'; end if;
  if not exists(select 1 from public.alumnos where id=p_alumno_id) then raise exception 'STUDENT_NOT_FOUND' using errcode='22023'; end if;
  if v_field not in ('nombre','rut','telefono','fecha_nacimiento','peso','altura','contacto_emergencia','observaciones','monto','fecha_ingreso','generaciones_disponibles') then raise exception 'FIELD_NOT_ALLOWED' using errcode='22023'; end if;
  select to_jsonb(a)->v_field into v_old from public.alumnos a where a.id=p_alumno_id for update;
  v_text:=nullif(trim(p_value#>>'{}'),'');
  if v_field='nombre' then update public.alumnos set nombre=left(v_text,160) where id=p_alumno_id;
  elsif v_field='rut' then v_text:=public.powerfit_normalize_rut(v_text); if v_text is not null and not public.powerfit_validate_rut(v_text) then raise exception 'INVALID_RUT' using errcode='22023'; end if; update public.alumnos set rut=v_text where id=p_alumno_id;
  elsif v_field='telefono' then update public.alumnos set telefono=left(v_text,80) where id=p_alumno_id;
  elsif v_field='fecha_nacimiento' then v_date:=v_text::date; if v_date is not null and (v_date>public.powerfit_finance_today() or v_date<date '1900-01-01') then raise exception 'INVALID_BIRTH_DATE' using errcode='22023'; end if; update public.alumnos set fecha_nacimiento=v_date where id=p_alumno_id;
  elsif v_field='peso' then v_num:=v_text::numeric; if v_num is not null and (v_num<20 or v_num>350) then raise exception 'INVALID_WEIGHT' using errcode='22023'; end if; update public.alumnos set peso=v_num where id=p_alumno_id;
  elsif v_field='altura' then v_num:=v_text::numeric; if v_num is not null and (v_num<80 or v_num>250) then raise exception 'INVALID_HEIGHT' using errcode='22023'; end if; update public.alumnos set altura=v_num where id=p_alumno_id;
  elsif v_field='contacto_emergencia' then update public.alumnos set contacto_emergencia=left(v_text,200) where id=p_alumno_id;
  elsif v_field='observaciones' then update public.alumnos set observaciones=left(v_text,2000) where id=p_alumno_id;
  elsif v_field='monto' then update public.alumnos set monto=greatest(coalesce(v_text::integer,0),0) where id=p_alumno_id;
  elsif v_field='fecha_ingreso' then update public.alumnos set fecha_ingreso=v_text::date where id=p_alumno_id;
  elsif v_field='generaciones_disponibles' then v_target_int:=greatest(coalesce(v_text::integer,0),0); perform public.adjust_powerfit_generation_balance(p_alumno_id,v_target_int,coalesce(nullif(trim(coalesce(p_reason,'')),''),'Actualizacion administrativa de generaciones'));
  end if;
  select to_jsonb(a)->v_field into v_new from public.alumnos a where a.id=p_alumno_id;
  insert into public.powerfit_admin_student_changes(alumno_id,changed_by,field_name,old_value,new_value,reason) values(p_alumno_id,v_uid,v_field,v_old,v_new,left(nullif(trim(coalesce(p_reason,'')),''),500));
  return jsonb_build_object('version','admin-student-field-update-v2','alumno_id',p_alumno_id,'field',v_field,'old_value',v_old,'new_value',v_new);
end;
$$;

-- get_powerfit_student_directory_full_secure was updated in production by the same migration
-- to calculate age from fecha_nacimiento and reveal RUT only to admin/self. Keep that
-- function in sync when regenerating schema dumps.