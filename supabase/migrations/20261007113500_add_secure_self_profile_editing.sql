create or replace function public.update_powerfit_self_profile_secure(p_patch jsonb)
returns jsonb
language plpgsql
security definer
set search_path to 'public','auth'
set "TimeZone" to 'Pacific/Easter'
as $$
declare
  v_uid uuid := auth.uid();
  v_id bigint;
  v_unknown text[];
  v_nombre text;
  v_telefono text;
  v_birth date;
  v_peso numeric;
  v_altura numeric;
  v_emergencia text;
  v_observaciones text;
begin
  if v_uid is null then
    raise exception 'AUTH_REQUIRED' using errcode='42501';
  end if;

  if p_patch is null or jsonb_typeof(p_patch) <> 'object' then
    raise exception 'INVALID_PROFILE_PATCH' using errcode='22023';
  end if;

  select array_agg(key order by key)
  into v_unknown
  from jsonb_object_keys(p_patch) as key
  where key not in (
    'nombre','telefono','fecha_nacimiento','peso','altura',
    'contacto_emergencia','observaciones'
  );

  if coalesce(array_length(v_unknown,1),0) > 0 then
    raise exception 'FIELD_NOT_ALLOWED: %', array_to_string(v_unknown,',')
      using errcode='22023';
  end if;

  select id into v_id
  from public.alumnos
  where user_id=v_uid
  order by id
  limit 1
  for update;

  if v_id is null then
    raise exception 'PROFILE_NOT_FOUND' using errcode='22023';
  end if;

  if p_patch ? 'nombre' then
    v_nombre:=nullif(trim(coalesce(p_patch->>'nombre','')),'');
    if v_nombre is null then raise exception 'NAME_REQUIRED' using errcode='22023'; end if;
    update public.alumnos set nombre=left(v_nombre,160) where id=v_id;
  end if;

  if p_patch ? 'telefono' then
    v_telefono:=nullif(trim(coalesce(p_patch->>'telefono','')),'');
    update public.alumnos set telefono=left(coalesce(v_telefono,''),80) where id=v_id;
  end if;

  if p_patch ? 'fecha_nacimiento' then
    v_birth:=case when nullif(trim(coalesce(p_patch->>'fecha_nacimiento','')),'') is null
      then null else (p_patch->>'fecha_nacimiento')::date end;
    if v_birth is not null and (v_birth>public.powerfit_finance_today() or v_birth<date '1900-01-01') then
      raise exception 'INVALID_BIRTH_DATE' using errcode='22023';
    end if;
    update public.alumnos set fecha_nacimiento=v_birth where id=v_id;
  end if;

  if p_patch ? 'peso' then
    v_peso:=case when nullif(trim(coalesce(p_patch->>'peso','')),'') is null
      then null else (p_patch->>'peso')::numeric end;
    if v_peso is not null and (v_peso<20 or v_peso>350) then
      raise exception 'INVALID_WEIGHT' using errcode='22023';
    end if;
    update public.alumnos set peso=v_peso where id=v_id;
  end if;

  if p_patch ? 'altura' then
    v_altura:=case when nullif(trim(coalesce(p_patch->>'altura','')),'') is null
      then null else (p_patch->>'altura')::numeric end;
    if v_altura is not null and (v_altura<80 or v_altura>250) then
      raise exception 'INVALID_HEIGHT' using errcode='22023';
    end if;
    update public.alumnos set altura=v_altura where id=v_id;
  end if;

  if p_patch ? 'contacto_emergencia' then
    v_emergencia:=nullif(trim(coalesce(p_patch->>'contacto_emergencia','')),'');
    update public.alumnos
      set contacto_emergencia=left(coalesce(v_emergencia,''),200)
    where id=v_id;
  end if;

  if p_patch ? 'observaciones' then
    v_observaciones:=nullif(trim(coalesce(p_patch->>'observaciones','')),'');
    update public.alumnos
      set observaciones=left(coalesce(v_observaciones,''),2000)
    where id=v_id;
  end if;

  return public.get_powerfit_self_profile_secure();
end;
$$;

revoke all on function public.update_powerfit_self_profile_secure(jsonb) from public, anon;
grant execute on function public.update_powerfit_self_profile_secure(jsonb) to authenticated;
