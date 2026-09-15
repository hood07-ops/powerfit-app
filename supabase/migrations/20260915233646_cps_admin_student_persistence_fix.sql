-- CPS admin/student persistence and dynamic pricing fix.

insert into public.cps_audit_log(actor_id, action, entity_table, entity_id, before_data, after_data, reason)
select
  null,
  'cleanup_invalid_boxing_tomo_access',
  'cps_tomo_access',
  id::text,
  to_jsonb(cps_tomo_access),
  null,
  'BOXING excludes Tomo 5; invalid access row removed from academic/material route.'
from public.cps_tomo_access
where route_code = 'BOXING'
  and tomo_no not in (select tomo_no from public.cps_stage_tomos where route_code = 'BOXING');

delete from public.cps_tomo_access
where route_code = 'BOXING'
  and tomo_no not in (select tomo_no from public.cps_stage_tomos where route_code = 'BOXING');

update public.cps_cards
set explanation = 'Base defensiva para combate de pie, sin perder vision ni salida.'
where code = 'CPS-T01-GUARD'
  and path_code = 'BOTH'
  and explanation ~* '(kick|patada|low kick|middle kick|high kick|teep|front kick|knee|rodilla|shin|roundhouse)';

create or replace function public.get_powerfit_cps_pricing_secure()
returns jsonb
language plpgsql
stable
security invoker
set search_path to 'public'
as $function$
declare
  v_id bigint := public.cps_current_alumno_id();
  v_status text;
  v_due date;
  v_price integer;
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED' using errcode='42501'; end if;
  select estado_pago,fecha_vencimiento into v_status,v_due from public.alumnos where id=v_id;
  v_price := case when v_status = 'Pagado' and v_due >= current_date then 5000 else 10000 end;
  return jsonb_build_object(
    'alumno_id',v_id,
    'membership_status',coalesce(v_status,'Pendiente'),
    'membership_due',v_due,
    'membership_current',v_price=5000,
    'tomo_price_clp',v_price,
    'member_price_clp',5000,
    'non_member_price_clp',10000,
    'message',case when v_price=5000 then 'Mensualidad al día: valor preferente por tomo $5.000' else 'Mensualidad no vigente: valor por tomo $10.000' end
  );
end;
$function$;

create or replace function public.get_powerfit_cps_payment_quote_server(
  p_alumno_id bigint,
  p_path_code text,
  p_tomo_no smallint,
  p_user_id uuid
)
returns jsonb
language plpgsql
stable
security definer
set search_path to 'public'
as $function$
declare
  v_path text := upper(trim(coalesce(p_path_code,'')));
  v_a public.alumnos%rowtype;
  v_price integer;
  v_tomo public.cps_tomos%rowtype;
begin
  if p_user_id is null then raise exception 'AUTH_REQUIRED' using errcode='42501'; end if;
  if v_path not in ('BOXING','KICKBOXING') then raise exception 'INVALID_CPS_PATH' using errcode='22023'; end if;

  select * into v_a from public.alumnos where id=p_alumno_id;
  if not found then raise exception 'STUDENT_NOT_FOUND' using errcode='22023'; end if;
  if v_a.user_id is distinct from p_user_id then raise exception 'FORBIDDEN' using errcode='42501'; end if;

  select * into v_tomo from public.cps_tomos where tomo_no=p_tomo_no and active=true;
  if not found then raise exception 'TOMO_NOT_FOUND' using errcode='22023'; end if;
  if not exists (select 1 from public.cps_stage_tomos where route_code=v_path and tomo_no=p_tomo_no) then
    raise exception 'TOMO_NOT_IN_PATH' using errcode='22023';
  end if;
  if not exists (select 1 from public.cps_student_enrollments where alumno_id=p_alumno_id and route_code=v_path and status='ACTIVE') then
    raise exception 'ACTIVE_ENROLLMENT_NOT_FOUND' using errcode='22023';
  end if;

  v_price := case when v_a.estado_pago = 'Pagado' and v_a.fecha_vencimiento >= current_date then 5000 else 10000 end;
  return jsonb_build_object(
    'alumno_id',p_alumno_id,
    'path_code',v_path,
    'tomo_no',p_tomo_no,
    'title',v_tomo.title,
    'amount_clp',v_price,
    'membership_current',v_price=5000,
    'membership_status',coalesce(v_a.estado_pago,'Pendiente'),
    'membership_due',v_a.fecha_vencimiento
  );
end;
$function$;

revoke execute on function public.get_powerfit_cps_payment_quote_server(bigint,text,smallint,uuid) from public;
revoke execute on function public.get_powerfit_cps_payment_quote_server(bigint,text,smallint,uuid) from anon;
revoke execute on function public.get_powerfit_cps_payment_quote_server(bigint,text,smallint,uuid) from authenticated;
grant execute on function public.get_powerfit_cps_payment_quote_server(bigint,text,smallint,uuid) to service_role;

create or replace function public.register_powerfit_tomo_payment_secure(
  p_external_payment_id text,
  p_alumno_id bigint,
  p_path_code text,
  p_tomo_no smallint,
  p_amount integer,
  p_paid_on date default current_date
)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_path text := upper(trim(coalesce(p_path_code,'')));
  v_expected integer;
  v_existing public.cps_tomo_access%rowtype;
  v_access public.cps_tomo_access%rowtype;
begin
  if nullif(trim(coalesce(p_external_payment_id,'')),'') is null then
    raise exception 'MISSING_EXTERNAL_PAYMENT_ID' using errcode='22023';
  end if;

  select * into v_existing
  from public.cps_tomo_access
  where external_provider='mercadopago'
    and external_payment_id=trim(p_external_payment_id)
  limit 1;

  if found then
    return jsonb_build_object('ok',true,'idempotent',true,'access',to_jsonb(v_existing));
  end if;

  if v_path not in ('BOXING','KICKBOXING') then
    raise exception 'INVALID_CPS_PATH' using errcode='22023';
  end if;
  if not exists (select 1 from public.cps_tomos where tomo_no=p_tomo_no and active=true) then
    raise exception 'INVALID_TOMO' using errcode='22023';
  end if;
  if not exists (select 1 from public.cps_stage_tomos where route_code=v_path and tomo_no=p_tomo_no) then
    raise exception 'TOMO_NOT_IN_PATH' using errcode='22023';
  end if;
  if not exists (
    select 1 from public.cps_student_enrollments
    where alumno_id=p_alumno_id and route_code=v_path and status='ACTIVE'
  ) then
    raise exception 'ACTIVE_ENROLLMENT_NOT_FOUND' using errcode='22023';
  end if;

  v_expected := case
    when exists (
      select 1
      from public.alumnos a
      where a.id=p_alumno_id
        and a.estado_pago='Pagado'
        and a.fecha_vencimiento >= coalesce(p_paid_on,current_date)
    )
    then 5000
    else 10000
  end;

  if p_amount <> v_expected then
    raise exception 'PAYMENT_AMOUNT_MISMATCH expected %, received %', v_expected, p_amount using errcode='22023';
  end if;

  insert into public.cps_tomo_access(
    alumno_id,route_code,tomo_no,status,source,amount_clp,external_provider,external_payment_id,unlocked_at
  )
  values(
    p_alumno_id,v_path,p_tomo_no,'UNLOCKED','mercadopago',p_amount,'mercadopago',trim(p_external_payment_id),now()
  )
  on conflict(alumno_id,route_code,tomo_no) do update set
    status='UNLOCKED',
    source='mercadopago',
    amount_clp=p_amount,
    external_provider='mercadopago',
    external_payment_id=trim(p_external_payment_id),
    unlocked_at=coalesce(public.cps_tomo_access.unlocked_at,now()),
    updated_at=now()
  returning * into v_access;

  insert into public.cps_audit_log(actor_id,action,entity_table,entity_id,after_data,reason)
  values(null,'mercadopago_tomo_unlock','cps_tomo_access',v_access.id::text,to_jsonb(v_access),'Pago CPS aprobado por Mercado Pago');

  return jsonb_build_object('ok',true,'idempotent',false,'expected_amount_clp',v_expected,'access',to_jsonb(v_access));
end;
$function$;

revoke execute on function public.register_powerfit_tomo_payment_secure(text,bigint,text,smallint,integer,date) from public;
revoke execute on function public.register_powerfit_tomo_payment_secure(text,bigint,text,smallint,integer,date) from anon;
revoke execute on function public.register_powerfit_tomo_payment_secure(text,bigint,text,smallint,integer,date) from authenticated;
grant execute on function public.register_powerfit_tomo_payment_secure(text,bigint,text,smallint,integer,date) to service_role;

create or replace function public.get_powerfit_combat_home_secure()
returns jsonb
language plpgsql
security invoker
set search_path to 'public'
as $function$
declare
  v_alumno_id bigint := public.cps_current_alumno_id();
  v_is_admin boolean := public.cps_is_admin();
  v_price integer;
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED' using errcode='42501'; end if;
  v_price := case
    when exists(select 1 from public.alumnos a where a.id=v_alumno_id and a.estado_pago='Pagado' and a.fecha_vencimiento >= current_date)
    then 5000 else 10000 end;

  return jsonb_build_object(
    'version','cps-home-v2-persistent-access',
    'price_school_member_clp',5000,
    'tomo_price_clp',v_price,
    'is_admin',v_is_admin,
    'student_alumno_id',v_alumno_id,
    'routes',(
      select coalesce(jsonb_agg(jsonb_build_object(
        'code',r.code,
        'name',r.name,
        'uses_belts',r.uses_belts,
        'enrollment',(
          select to_jsonb(e) from public.cps_student_enrollments e
          where e.alumno_id = v_alumno_id and e.route_code = r.code and e.status='ACTIVE'
        ),
        'stages',(
          select jsonb_agg(jsonb_build_object(
            'stage_order',s.stage_order,
            'label',s.label,
            'minimum_months',s.minimum_months,
            'minimum_exam_score',s.minimum_exam_score,
            'tomos',(
              select jsonb_agg(jsonb_build_object(
                'tomo_no',t.tomo_no,
                'title',t.title,
                'price_clp',v_price,
                'access_status',coalesce(ta.status,'LOCKED'),
                'completed_at',ta.completed_at
              ) order by t.tomo_no)
              from public.cps_stage_tomos st
              join public.cps_tomos t on t.tomo_no = st.tomo_no
              left join public.cps_tomo_access ta on ta.alumno_id = v_alumno_id and ta.route_code = r.code and ta.tomo_no = t.tomo_no
              where st.route_code = r.code and st.stage_order = s.stage_order
            )
          ) order by s.stage_order)
          from public.cps_stages s where s.route_code = r.code
        )
      ) order by r.display_order),'[]'::jsonb)
      from public.cps_routes r
    ),
    'coach_queue',case when v_is_admin then public.get_powerfit_video_review_queue_secure() else '[]'::jsonb end
  );
end;
$function$;

create or replace function public.get_powerfit_tomo_detail_secure(p_path_code text, p_tomo_no smallint)
returns jsonb
language plpgsql
security invoker
set search_path to 'public'
as $function$
declare
  v_alumno_id bigint := public.cps_current_alumno_id();
  v_path text := upper(trim(coalesce(p_path_code,'')));
  v_stage smallint;
  v_access text;
  v_tomo public.cps_tomos%rowtype;
  v_eval_cards jsonb := '[]'::jsonb;
  v_price integer;
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED' using errcode='42501'; end if;
  if v_path not in ('BOXING','KICKBOXING') then raise exception 'INVALID_CPS_PATH' using errcode='22023'; end if;
  if not exists (select 1 from public.cps_stage_tomos where route_code=v_path and tomo_no=p_tomo_no) then
    raise exception 'TOMO_NOT_IN_PATH' using errcode='22023';
  end if;

  select current_stage_order into v_stage
  from public.cps_student_enrollments
  where alumno_id=v_alumno_id and route_code=v_path and status='ACTIVE';
  if v_stage is null then raise exception 'ACTIVE_ENROLLMENT_NOT_FOUND' using errcode='22023'; end if;

  select * into v_tomo from public.cps_tomos where tomo_no=p_tomo_no and active=true;
  if not found then raise exception 'TOMO_NOT_FOUND' using errcode='22023'; end if;

  select status into v_access
  from public.cps_tomo_access
  where alumno_id=v_alumno_id and route_code=v_path and tomo_no=p_tomo_no;

  v_price := case
    when exists(select 1 from public.alumnos a where a.id=v_alumno_id and a.estado_pago='Pagado' and a.fecha_vencimiento >= current_date)
    then 5000 else 10000 end;

  select coalesce(jsonb_agg(jsonb_build_object(
    'id',c.id,'code',c.code,'name',c.name,'category',c.category,'objective',c.objective,'explanation',c.explanation,
    'steps',c.steps,'common_errors',c.common_errors,'critical_errors',c.critical_errors,'corrections',c.corrections,
    'drill',c.drill,'repetitions',c.repetitions,'demo_video_url',c.demo_video_url,'video_required',c.video_required,
    'live_required',c.live_required,'critical',c.critical,
    'status',coalesce(cp.status,'AVAILABLE')
  ) order by c.display_order),'[]'::jsonb) into v_eval_cards
  from public.cps_cards c
  left join public.cps_card_progress cp
    on cp.alumno_id=v_alumno_id and cp.route_code=v_path and cp.card_id=c.id
  where c.tomo_no=p_tomo_no
    and c.active=true
    and (c.path_code='BOTH' or c.path_code=v_path);

  return jsonb_build_object(
    'path_code',v_path,
    'stage_order',v_stage,
    'tomo',to_jsonb(v_tomo) - 'study_content',
    'price_clp',v_price,
    'access_status',coalesce(v_access,'LOCKED'),
    'study',jsonb_build_object(
      'available',nullif(trim(coalesce(v_tomo.study_content,'')),'') is not null,
      'title',v_tomo.title,
      'version',v_tomo.study_version,
      'content',case when coalesce(v_access,'LOCKED') in ('UNLOCKED','IN_PROGRESS','CARDS_COMPLETE','TOMO_TEST_ELIGIBLE','TOMO_TEST_PASSED','TOMO_COMPLETED') then v_tomo.study_content else null end
    ),
    'cards',v_eval_cards
  );
end;
$function$;

create or replace function public.get_powerfit_cps_admin_students_secure()
returns jsonb
language plpgsql
security invoker
set search_path to 'public'
as $function$
begin
  if auth.uid() is null or not public.cps_is_admin() then raise exception 'ADMIN_REQUIRED' using errcode='42501'; end if;
  return (
    select coalesce(jsonb_agg(jsonb_build_object(
      'alumno_id',a.id,
      'nombre',a.nombre,
      'email',a.email,
      'estado_pago',a.estado_pago,
      'fecha_vencimiento',a.fecha_vencimiento,
      'routes',routes.routes,
      'unlocked_tomos',coalesce(access.unlocked_tomos,0)
    ) order by a.nombre),'[]'::jsonb)
    from public.alumnos a
    join lateral (
      select jsonb_agg(jsonb_build_object(
        'route_code',e.route_code,
        'status',e.status,
        'stage_order',e.current_stage_order,
        'stage_label',s.label
      ) order by e.route_code) as routes
      from public.cps_student_enrollments e
      join public.cps_stages s on s.route_code=e.route_code and s.stage_order=e.current_stage_order
      where e.alumno_id=a.id and e.status='ACTIVE'
    ) routes on routes.routes is not null
    left join lateral (
      select count(*)::int as unlocked_tomos
      from public.cps_tomo_access ta
      where ta.alumno_id=a.id and ta.status in ('UNLOCKED','IN_PROGRESS','CARDS_COMPLETE','TOMO_TEST_ELIGIBLE','TOMO_TEST_PASSED','TOMO_COMPLETED')
    ) access on true
  );
end;
$function$;

create or replace function public.get_powerfit_cps_admin_student_file_secure(p_alumno_id bigint)
returns jsonb
language plpgsql
security invoker
set search_path to 'public'
as $function$
begin
  if auth.uid() is null or not public.cps_is_admin() then raise exception 'ADMIN_REQUIRED' using errcode='42501'; end if;
  return (
    select jsonb_build_object(
      'student',jsonb_build_object('alumno_id',a.id,'nombre',a.nombre,'email',a.email,'role',a.role,'estado_pago',a.estado_pago,'fecha_pago',a.fecha_pago,'fecha_vencimiento',a.fecha_vencimiento),
      'routes',(
        select coalesce(jsonb_agg(jsonb_build_object(
          'enrollment',to_jsonb(e),
          'stage',to_jsonb(s),
          'tomo_access',(select coalesce(jsonb_agg(to_jsonb(ta) order by ta.tomo_no),'[]'::jsonb) from public.cps_tomo_access ta where ta.alumno_id=a.id and ta.route_code=e.route_code and ta.tomo_no in (select tomo_no from public.cps_stage_tomos where route_code=e.route_code)),
          'card_progress',(select coalesce(jsonb_agg(to_jsonb(cp) order by cp.card_id),'[]'::jsonb) from public.cps_card_progress cp where cp.alumno_id=a.id and cp.route_code=e.route_code),
          'videos',(select coalesce(jsonb_agg(to_jsonb(v) order by v.created_at desc),'[]'::jsonb) from public.cps_video_submissions v where v.alumno_id=a.id and v.route_code=e.route_code),
          'evaluaciones',(select coalesce(jsonb_agg(to_jsonb(la) order by la.assessed_at desc),'[]'::jsonb) from public.cps_live_assessments la where la.alumno_id=a.id and la.route_code=e.route_code),
          'tome_tests',(select coalesce(jsonb_agg(to_jsonb(tt) order by tt.created_at desc),'[]'::jsonb) from public.cps_tomo_tests tt where tt.alumno_id=a.id and tt.route_code=e.route_code),
          'final_exams',(select coalesce(jsonb_agg(to_jsonb(fe) order by fe.created_at desc),'[]'::jsonb) from public.cps_final_exams fe where fe.alumno_id=a.id and fe.route_code=e.route_code),
          'promotions',(select coalesce(jsonb_agg(to_jsonb(p) order by p.promoted_at desc),'[]'::jsonb) from public.cps_promotions p where p.alumno_id=a.id and p.route_code=e.route_code)
        ) order by e.route_code),'[]'::jsonb)
        from public.cps_student_enrollments e
        join public.cps_stages s on s.route_code=e.route_code and s.stage_order=e.current_stage_order
        where e.alumno_id=a.id and e.status='ACTIVE'
      )
    )
    from public.alumnos a
    where a.id=p_alumno_id
  );
end;
$function$;

create or replace function public.grant_powerfit_tomo_admin_secure(p_alumno_id bigint, p_path_code text, p_tomo_no smallint, p_reason text)
returns jsonb
language plpgsql
security invoker
set search_path to 'public'
as $function$
declare
  v_path text := upper(trim(coalesce(p_path_code,'')));
  v_access public.cps_tomo_access%rowtype;
begin
  if auth.uid() is null or not public.cps_is_admin() then raise exception 'ADMIN_REQUIRED' using errcode='42501'; end if;
  if nullif(trim(coalesce(p_reason,'')),'') is null then raise exception 'REASON_REQUIRED' using errcode='22023'; end if;
  if not exists (select 1 from public.cps_student_enrollments where alumno_id=p_alumno_id and route_code=v_path and status='ACTIVE') then raise exception 'ACTIVE_ENROLLMENT_NOT_FOUND' using errcode='22023'; end if;
  if not exists (select 1 from public.cps_stage_tomos where route_code=v_path and tomo_no=p_tomo_no) then raise exception 'TOMO_NOT_IN_PATH' using errcode='22023'; end if;

  insert into public.cps_tomo_access(alumno_id,route_code,tomo_no,status,source,amount_clp,granted_by,granted_reason,unlocked_at)
  values(p_alumno_id,v_path,p_tomo_no,'UNLOCKED','admin_grant',0,auth.uid(),p_reason,now())
  on conflict(alumno_id,route_code,tomo_no) do update set status='UNLOCKED', source='admin_grant', amount_clp=0, granted_by=auth.uid(), granted_reason=p_reason, unlocked_at=coalesce(public.cps_tomo_access.unlocked_at,now()), updated_at=now()
  returning * into v_access;

  insert into public.cps_audit_log(actor_id,action,entity_table,entity_id,after_data,reason)
  values(auth.uid(),'grant_tomo_admin','cps_tomo_access',v_access.id::text,to_jsonb(v_access),p_reason);
  return jsonb_build_object('ok',true,'access',to_jsonb(v_access));
end;
$function$;

create or replace function public.grant_powerfit_all_tomos_admin_secure(p_alumno_id bigint, p_path_code text default null, p_reason text default null)
returns jsonb
language plpgsql
security invoker
set search_path to 'public'
as $function$
declare
  v_reason text := nullif(trim(coalesce(p_reason,'')),'');
  v_count int := 0;
  v_row record;
begin
  if auth.uid() is null or not public.cps_is_admin() then raise exception 'ADMIN_REQUIRED' using errcode='42501'; end if;
  if v_reason is null then raise exception 'REASON_REQUIRED' using errcode='22023'; end if;

  for v_row in
    select distinct e.route_code, st.tomo_no
    from public.cps_student_enrollments e
    join public.cps_stage_tomos st on st.route_code=e.route_code
    where e.alumno_id=p_alumno_id and e.status='ACTIVE'
      and (p_path_code is null or e.route_code=upper(trim(p_path_code)))
  loop
    perform public.grant_powerfit_tomo_admin_secure(p_alumno_id,v_row.route_code,v_row.tomo_no,v_reason);
    v_count := v_count + 1;
  end loop;

  return jsonb_build_object('ok',true,'granted_count',v_count);
end;
$function$;

create or replace function public.get_powerfit_cps_admin_center_secure()
returns jsonb
language plpgsql
security invoker
set search_path to 'public'
as $function$
begin
  if auth.uid() is null or not public.cps_is_admin() then raise exception 'ADMIN_REQUIRED' using errcode='42501'; end if;
  return jsonb_build_object(
    'students',public.get_powerfit_cps_admin_students_secure(),
    'settings',(select coalesce(jsonb_agg(to_jsonb(x) order by x.route_code,x.stage_order),'[]'::jsonb) from public.cps_evaluation_settings x),
    'stages',(select coalesce(jsonb_agg(to_jsonb(s) order by s.route_code,s.stage_order),'[]'::jsonb) from public.cps_stages s),
    'stage_tomos',(select coalesce(jsonb_agg(to_jsonb(st) order by st.route_code,st.stage_order,st.tomo_no),'[]'::jsonb) from public.cps_stage_tomos st),
    'cards',(select coalesce(jsonb_agg(jsonb_build_object('id',c.id,'code',c.code,'path_code',c.path_code,'level_order',c.level_order,'tomo_no',c.tomo_no,'name',c.name,'video_required',c.video_required,'live_required',c.live_required,'critical',c.critical,'active',c.active,'display_order',c.display_order) order by c.path_code,c.level_order,c.tomo_no,c.display_order),'[]'::jsonb) from public.cps_cards c),
    'tomo_tests',(select coalesce(jsonb_agg(to_jsonb(tt) order by tt.created_at desc),'[]'::jsonb) from public.cps_tomo_tests tt),
    'final_exams',(select coalesce(jsonb_agg(to_jsonb(fe) order by fe.created_at desc),'[]'::jsonb) from public.cps_final_exams fe),
    'promotions',(select coalesce(jsonb_agg(to_jsonb(p) order by p.promoted_at desc),'[]'::jsonb) from public.cps_promotions p),
    'video_queue',public.get_powerfit_video_review_queue_secure(),
    'live_queue',public.get_powerfit_live_assessment_queue_secure()
  );
end;
$function$;

revoke execute on function public.get_powerfit_cps_payment_quote_server(bigint,text,smallint,uuid) from public;
revoke execute on function public.get_powerfit_cps_payment_quote_server(bigint,text,smallint,uuid) from anon;
revoke execute on function public.get_powerfit_cps_payment_quote_server(bigint,text,smallint,uuid) from authenticated;
grant execute on function public.get_powerfit_cps_payment_quote_server(bigint,text,smallint,uuid) to service_role;

revoke execute on function public.get_powerfit_cps_admin_students_secure() from public;
revoke execute on function public.get_powerfit_cps_admin_students_secure() from anon;
grant execute on function public.get_powerfit_cps_admin_students_secure() to authenticated;

revoke execute on function public.get_powerfit_cps_admin_student_file_secure(bigint) from public;
revoke execute on function public.get_powerfit_cps_admin_student_file_secure(bigint) from anon;
grant execute on function public.get_powerfit_cps_admin_student_file_secure(bigint) to authenticated;

revoke execute on function public.grant_powerfit_tomo_admin_secure(bigint,text,smallint,text) from public;
revoke execute on function public.grant_powerfit_tomo_admin_secure(bigint,text,smallint,text) from anon;
grant execute on function public.grant_powerfit_tomo_admin_secure(bigint,text,smallint,text) to authenticated;

revoke execute on function public.grant_powerfit_all_tomos_admin_secure(bigint,text,text) from public;
revoke execute on function public.grant_powerfit_all_tomos_admin_secure(bigint,text,text) from anon;
grant execute on function public.grant_powerfit_all_tomos_admin_secure(bigint,text,text) to authenticated;

revoke execute on function public.get_powerfit_cps_admin_center_secure() from public;
revoke execute on function public.get_powerfit_cps_admin_center_secure() from anon;
grant execute on function public.get_powerfit_cps_admin_center_secure() to authenticated;
