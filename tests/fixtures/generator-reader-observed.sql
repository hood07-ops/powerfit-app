-- TEST ONLY: observed reader definition, not a production migration.
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
  if not (v_a.user_id=auth.uid() or public.is_powerfit_admin()) then raise exception 'FORBIDDEN' using errcode='42501'; end if;

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
