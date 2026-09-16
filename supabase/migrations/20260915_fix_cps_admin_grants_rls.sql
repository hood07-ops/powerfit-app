-- Fix CPS admin grants under RLS without exposing direct table INSERT permissions.
-- Applied to production project sabsmurhriohwmczaktn on 2026-09-15.

create or replace function public.grant_powerfit_tomo_admin_secure(
  p_alumno_id bigint,
  p_path_code text,
  p_tomo_no smallint,
  p_reason text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_path text := upper(trim(coalesce(p_path_code,'')));
  v_reason text := nullif(trim(coalesce(p_reason,'')),'');
  v_access public.cps_tomo_access%rowtype;
begin
  if auth.uid() is null or not public.cps_is_admin() then
    raise exception 'ADMIN_REQUIRED' using errcode='42501';
  end if;
  if v_reason is null then
    raise exception 'REASON_REQUIRED' using errcode='22023';
  end if;
  if v_path not in ('BOXING','KICKBOXING') then
    raise exception 'INVALID_CPS_PATH' using errcode='22023';
  end if;
  if not exists (
    select 1 from public.cps_student_enrollments
    where alumno_id=p_alumno_id and route_code=v_path and status='ACTIVE'
  ) then
    raise exception 'ACTIVE_ENROLLMENT_NOT_FOUND' using errcode='22023';
  end if;
  if not exists (
    select 1 from public.cps_stage_tomos
    where route_code=v_path and tomo_no=p_tomo_no
  ) then
    raise exception 'TOMO_NOT_IN_PATH' using errcode='22023';
  end if;

  insert into public.cps_tomo_access(
    alumno_id,route_code,tomo_no,status,source,amount_clp,
    granted_by,granted_reason,unlocked_at
  ) values (
    p_alumno_id,v_path,p_tomo_no,'UNLOCKED','admin_grant',0,
    auth.uid(),v_reason,now()
  )
  on conflict(alumno_id,route_code,tomo_no) do update set
    status='UNLOCKED',
    source='admin_grant',
    amount_clp=0,
    granted_by=auth.uid(),
    granted_reason=v_reason,
    unlocked_at=now(),
    updated_at=now()
  returning * into v_access;

  insert into public.cps_audit_log(actor_id,action,entity_table,entity_id,after_data,reason)
  values(auth.uid(),'grant_tomo_admin','cps_tomo_access',v_access.id::text,to_jsonb(v_access),v_reason);

  return jsonb_build_object('ok',true,'access',to_jsonb(v_access));
end;
$$;

alter function public.grant_powerfit_tomo_admin_secure(bigint,text,smallint,text) owner to postgres;
revoke all on function public.grant_powerfit_tomo_admin_secure(bigint,text,smallint,text) from public;
revoke all on function public.grant_powerfit_tomo_admin_secure(bigint,text,smallint,text) from anon;
revoke all on function public.grant_powerfit_tomo_admin_secure(bigint,text,smallint,text) from service_role;
grant execute on function public.grant_powerfit_tomo_admin_secure(bigint,text,smallint,text) to authenticated;

create or replace function public.grant_powerfit_all_tomos_admin_secure(
  p_alumno_id bigint,
  p_path_code text default null,
  p_reason text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_reason text := nullif(trim(coalesce(p_reason,'')),'');
  v_path text := case when p_path_code is null then null else upper(trim(p_path_code)) end;
  v_count int := 0;
  v_row record;
begin
  if auth.uid() is null or not public.cps_is_admin() then
    raise exception 'ADMIN_REQUIRED' using errcode='42501';
  end if;
  if v_reason is null then
    raise exception 'REASON_REQUIRED' using errcode='22023';
  end if;
  if v_path is not null and v_path not in ('BOXING','KICKBOXING') then
    raise exception 'INVALID_CPS_PATH' using errcode='22023';
  end if;

  for v_row in
    select distinct e.route_code, st.tomo_no
    from public.cps_student_enrollments e
    join public.cps_stage_tomos st on st.route_code=e.route_code
    where e.alumno_id=p_alumno_id
      and e.status='ACTIVE'
      and (v_path is null or e.route_code=v_path)
    order by e.route_code, st.tomo_no
  loop
    perform public.grant_powerfit_tomo_admin_secure(
      p_alumno_id,v_row.route_code,v_row.tomo_no,v_reason
    );
    v_count := v_count + 1;
  end loop;

  insert into public.cps_audit_log(actor_id,action,entity_table,entity_id,after_data,reason)
  values(
    auth.uid(),'grant_all_tomos_admin','alumnos',p_alumno_id::text,
    jsonb_build_object('path_code',v_path,'granted_count',v_count),v_reason
  );

  return jsonb_build_object('ok',true,'granted_count',v_count);
end;
$$;

alter function public.grant_powerfit_all_tomos_admin_secure(bigint,text,text) owner to postgres;
revoke all on function public.grant_powerfit_all_tomos_admin_secure(bigint,text,text) from public;
revoke all on function public.grant_powerfit_all_tomos_admin_secure(bigint,text,text) from anon;
revoke all on function public.grant_powerfit_all_tomos_admin_secure(bigint,text,text) from service_role;
grant execute on function public.grant_powerfit_all_tomos_admin_secure(bigint,text,text) to authenticated;
