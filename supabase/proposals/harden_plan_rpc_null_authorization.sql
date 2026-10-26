-- REVIEWED CHANGE: applied with explicit user authorization on 2026-10-26.
-- Supabase migration: 20261026195820_harden_plan_rpc_null_authorization.
-- Historical reviewed SQL, also used by isolated tests; do not reapply blindly.
-- Narrow authorization hardening: NULL is never treated as permission.
-- Preserves existing owner/admin/assigned-coach rules and function attributes.
BEGIN;

-- Abort rather than overwrite a function changed after the read-only snapshot.
DO $guard$
BEGIN
  IF md5(pg_get_functiondef('public.save_powerfit_manual_plan_with_generation_secure(bigint,text,text,text,text)'::regprocedure)) <> '5c91a5784d355bbeeb0dd110720d0185'
     OR md5(pg_get_functiondef('public.save_powerfit_plan_secure(bigint,text,text,text,text,text)'::regprocedure)) <> 'd058b2e8365dd4bd074e2a1dd21e6fab'
     OR md5(pg_get_functiondef('public.get_powerfit_generator_state_secure(bigint)'::regprocedure)) <> 'd625de417139288903b398a1cfabfbec'
  THEN
    RAISE EXCEPTION 'PLAN_RPC_SOURCE_DRIFT_REVIEW_REQUIRED';
  END IF;
END;
$guard$;

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

  if (v_a.user_id = v_uid or public.is_powerfit_admin()) is not true then
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
  if (v_can_manage or v_owner) is not true then raise exception 'FORBIDDEN' using errcode='42501'; end if;
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
CREATE OR REPLACE FUNCTION public.get_powerfit_generator_state_secure(p_alumno_id bigint)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
 SET "TimeZone" TO 'Pacific/Easter'
AS $function$
declare
  v_a public.alumnos%rowtype;
  v_rm jsonb;
  v_plans jsonb;
  v_packages jsonb;
  v_requests jsonb;
  v_generation_purchases integer:=0;
  v_monthly_approved integer:=0;
  v_monthly_used integer:=0;
  v_month_start timestamptz:=date_trunc('month',now());
  v_month_end timestamptz:=date_trunc('month',now())+interval '1 month';
begin
  if auth.uid() is null then raise exception 'AUTHENTICATION_REQUIRED' using errcode='42501'; end if;
  select * into v_a from public.alumnos where id=p_alumno_id;
  if not found then raise exception 'ATHLETE_NOT_FOUND' using errcode='22023'; end if;
  if (v_a.user_id=auth.uid() or public.is_powerfit_admin()) is not true then raise exception 'FORBIDDEN' using errcode='42501'; end if;

  select coalesce(jsonb_agg(to_jsonb(x) order by x.fecha desc,x.created_at desc),'[]'::jsonb)
  into v_rm
  from (
    select id,alumno_id,ejercicio,rm_kg,fecha,created_at
    from public.rm_alumnos where alumno_id=p_alumno_id
    order by fecha desc,created_at desc limit 100
  ) x;

  select coalesce(jsonb_agg(to_jsonb(x) order by x.created_at desc),'[]'::jsonb)
  into v_plans
  from (
    select p.id,p.alumno_id,p.nombre_alumno,p.objetivo,p.nivel,p.contenido,p.created_at,
           coalesce(m.source,'legacy') source,coalesce(m.status,'active') status,m.source_ref
    from public.planificaciones_generadas p
    left join public.powerfit_plan_metadata m on m.planificacion_id=p.id
    where p.alumno_id=p_alumno_id
      and coalesce(m.status,'active')='active'
      and p.created_at>=v_month_start and p.created_at<v_month_end
    order by p.created_at desc limit 100
  ) x;

  select coalesce(jsonb_agg(jsonb_build_object('id',id,'code',code,'label',label,'generations',generations,'amount',amount,'currency',currency) order by sort_order,id),'[]'::jsonb)
  into v_packages
  from public.powerfit_generation_packages where active=true;

  select coalesce(jsonb_agg(jsonb_build_object(
    'id',s.id,'amount',s.monto,'generations',s.generaciones,'legacy_status',s.estado,
    'origin',coalesce(m.origin,'legacy'),'status',coalesce(m.status,case when lower(coalesce(s.estado,''))='aprobado' then 'legacy_approved' else 'pending' end),
    'package_id',m.package_id,'package_code',pkg.code,'created_at',s.created_at
  ) order by s.created_at desc),'[]'::jsonb)
  into v_requests
  from public.solicitudes_compra s
  left join public.powerfit_purchase_request_meta m on m.request_id=s.id
  left join public.powerfit_generation_packages pkg on pkg.id=m.package_id
  where s.alumno_id=p_alumno_id;

  select coalesce(sum(greatest(coalesce(s.generaciones,0),0)),0)::int
  into v_generation_purchases
  from public.solicitudes_compra s
  left join public.powerfit_purchase_request_meta m on m.request_id=s.id
  left join public.powerfit_generation_packages pkg on pkg.id=m.package_id
  where s.alumno_id=p_alumno_id
    and (coalesce(m.status,'')='approved' or lower(coalesce(s.estado,''))='aprobado')
    and coalesce(pkg.code,'')<>'monthly_atr'
    and not (coalesce(s.generaciones,0)=0 and coalesce(s.monto,0)=60000);

  select count(*)::int
  into v_monthly_approved
  from public.solicitudes_compra s
  left join public.powerfit_purchase_request_meta m on m.request_id=s.id
  left join public.powerfit_generation_packages pkg on pkg.id=m.package_id
  where s.alumno_id=p_alumno_id
    and (coalesce(m.status,'')='approved' or lower(coalesce(s.estado,''))='aprobado')
    and (pkg.code='monthly_atr' or (coalesce(s.generaciones,0)=0 and coalesce(s.monto,0)=60000));

  select count(*)::int
  into v_monthly_used
  from public.planificaciones_generadas p
  left join public.powerfit_plan_metadata m on m.planificacion_id=p.id
  where p.alumno_id=p_alumno_id
    and coalesce(m.status,'active')='active'
    and p.created_at>=v_month_start and p.created_at<v_month_end
    and (lower(coalesce(p.objetivo,'')) like 'plan mensual%' or coalesce(m.source_ref,'')='generator_monthly');

  return jsonb_build_object(
    'version','generator-state-secure-v1',
    'alumno_id',p_alumno_id,
    'generations_available',coalesce(v_a.generaciones_disponibles,0),
    'generation_purchases_approved',v_generation_purchases,
    'monthly_approved',v_monthly_approved,
    'monthly_used',v_monthly_used,
    'monthly_available',greatest(v_monthly_approved-v_monthly_used,0),
    'rm',v_rm,
    'plans',v_plans,
    'packages',v_packages,
    'requests',v_requests,
    'finance_is_sports_authorization',false
  );
end;
$function$
;

COMMIT;
