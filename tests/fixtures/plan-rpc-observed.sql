-- READ-ONLY SNAPSHOT 2026-10-26: function bodies only; no production data.
-- Used solely inside local PostgreSQL tests. This is not a migration.
CREATE OR REPLACE FUNCTION public.is_powerfit_admin()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select exists (
    select 1
    from public.alumnos a
    where a.user_id = (select auth.uid())
      and lower(coalesce(a.role,'')) = 'admin'
  );
$function$
;

CREATE OR REPLACE FUNCTION public.get_powerfit_effective_role()
 RETURNS text
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select case
    when exists(select 1 from public.alumnos a where a.user_id=(select auth.uid()) and lower(coalesce(a.role,''))='admin') then 'admin'
    when exists(select 1 from public.alumnos a where a.user_id=(select auth.uid()) and lower(coalesce(a.role,''))='coach') then 'coach'
    when exists(select 1 from public.alumnos a where a.user_id=(select auth.uid())) then 'alumno'
    else 'unknown'
  end;
$function$
;

CREATE OR REPLACE FUNCTION public.can_manage_powerfit_training(p_alumno_id bigint)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select
    public.is_powerfit_admin()
    or exists (
      select 1 from public.powerfit_coach_assignments ca
      where ca.coach_user_id=(select auth.uid())
        and ca.alumno_id=p_alumno_id
        and ca.active=true
    );
$function$
;

CREATE OR REPLACE FUNCTION public.save_powerfit_plan_secure(p_alumno_id bigint, p_objetivo text, p_nivel text, p_contenido text, p_source text DEFAULT 'manual'::text, p_source_ref text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
 SET "TimeZone" TO 'Pacific/Easter'
AS $function$
declare
  v_a public.alumnos%rowtype;
  v_plan public.planificaciones_generadas%rowtype;
  v_role text;
  v_can_manage boolean:=false;
  v_owner boolean:=false;
  v_requested text:=lower(trim(coalesce(p_source,'manual')));
  v_source text;
begin
  if auth.uid() is null then raise exception 'Authentication required' using errcode='42501'; end if;
  select * into v_a from public.alumnos where id=p_alumno_id;
  if not found then raise exception 'Athlete not found'; end if;
  v_role:=public.get_powerfit_effective_role();
  v_can_manage:=public.can_manage_powerfit_training(p_alumno_id);
  v_owner:=v_a.user_id=auth.uid();
  if not (v_can_manage or v_owner) then raise exception 'FORBIDDEN' using errcode='42501'; end if;
  if nullif(trim(coalesce(p_objetivo,'')),'') is null then raise exception 'Objective is required'; end if;
  if nullif(trim(coalesce(p_nivel,'')),'') is null then raise exception 'Level is required'; end if;
  if length(trim(coalesce(p_contenido,''))) < 20 then raise exception 'Plan content is too short'; end if;
  if length(p_contenido) > 120000 then raise exception 'Plan content is too large'; end if;
  if v_requested not in ('manual','self','ai_coach','import') then raise exception 'Invalid plan source'; end if;

  if v_can_manage then
    v_source:=case when v_requested='import' and not public.is_powerfit_admin() then 'manual' else v_requested end;
  else
    v_source:='self';
  end if;

  insert into public.planificaciones_generadas(user_id,alumno_id,nombre_alumno,objetivo,nivel,contenido)
  values(v_a.user_id,v_a.id,v_a.nombre,trim(p_objetivo),trim(p_nivel),p_contenido)
  returning * into v_plan;

  insert into public.powerfit_plan_metadata(planificacion_id,source,requested_source,status,source_ref,created_by,creator_role)
  values(v_plan.id,v_source,v_requested,'active',nullif(trim(coalesce(p_source_ref,'')),''),auth.uid(),v_role);

  insert into public.powerfit_plan_events(planificacion_id,alumno_id,event_type,source,actor_user_id,actor_role,metadata)
  values(v_plan.id,v_a.id,'created',v_source,auth.uid(),v_role,jsonb_build_object('requested_source',v_requested,'objetivo',v_plan.objetivo,'nivel',v_plan.nivel));

  return jsonb_build_object(
    'version','secure-plan-save-v1',
    'plan',jsonb_build_object('id',v_plan.id,'alumno_id',v_plan.alumno_id,'nombre_alumno',v_plan.nombre_alumno,'objetivo',v_plan.objetivo,'nivel',v_plan.nivel,'contenido',v_plan.contenido,'created_at',v_plan.created_at),
    'metadata',jsonb_build_object('source',v_source,'requested_source',v_requested,'status','active','source_ref',nullif(trim(coalesce(p_source_ref,'')),''),'creator_role',v_role),
    'rule','Plans are immutable; use void_powerfit_plan_secure instead of update/delete.'
  );
end;
$function$
;

CREATE OR REPLACE FUNCTION public.save_powerfit_manual_plan_with_generation_secure(p_alumno_id bigint, p_objetivo text, p_nivel text, p_contenido text, p_source_ref text DEFAULT 'constructor'::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
 SET "TimeZone" TO 'Pacific/Easter'
AS $function$
declare
  v_uid uuid := auth.uid();
  v_a public.alumnos%rowtype;
  v_plan_result jsonb;
  v_before integer;
  v_after integer;
begin
  if v_uid is null then
    raise exception 'AUTHENTICATION_REQUIRED' using errcode = '42501';
  end if;

  select * into v_a
  from public.alumnos
  where id = p_alumno_id
  for update;

  if not found then
    raise exception 'ATHLETE_NOT_FOUND' using errcode = '22023';
  end if;

  if not (v_a.user_id = v_uid or public.is_powerfit_admin()) then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;

  v_before := coalesce(v_a.generaciones_disponibles, 0);
  if v_before < 1 then
    raise exception 'NO_GENERATIONS_AVAILABLE' using errcode = '22023';
  end if;

  v_plan_result := public.save_powerfit_plan_secure(
    p_alumno_id,
    p_objetivo,
    p_nivel,
    p_contenido,
    'manual',
    p_source_ref
  );

  v_after := v_before - 1;
  update public.alumnos
  set generaciones_disponibles = v_after
  where id = p_alumno_id;

  insert into public.powerfit_generation_adjustments(
    alumno_id,
    actor_user_id,
    balance_before,
    balance_after,
    delta,
    reason
  ) values (
    p_alumno_id,
    v_uid,
    v_before,
    v_after,
    -1,
    'Manual plan generation consumed by secure RPC'
  );

  return jsonb_build_object(
    'version', 'manual-plan-generation-v1',
    'plan', v_plan_result->'plan',
    'metadata', v_plan_result->'metadata',
    'quota_before', v_before,
    'quota_after', v_after,
    'consumed_generations', 1,
    'transactional', true
  );
end;
$function$
;
