create or replace function public.get_powerfit_cps_route_progress_secure(
  p_alumno_id bigint,
  p_path_code text
) returns jsonb
language plpgsql
security definer
stable
set search_path to 'public','auth'
as $$
declare
  v_path text := upper(trim(coalesce(p_path_code,'')));
  v_current bigint := public.cps_current_alumno_id();
  v_stage smallint;
  v_stage_label text;
  v_route_tomos_total int:=0;
  v_route_tomos_completed int:=0;
  v_stage_tomos_total int:=0;
  v_stage_tomos_completed int:=0;
  v_stage_questions_total int:=0;
  v_stage_questions_approved int:=0;
  v_stage_cards_total int:=0;
  v_stage_cards_completed int:=0;
  v_route_pct numeric:=0;
  v_stage_pct numeric:=0;
  v_stage_requirements_total int:=0;
  v_stage_requirements_completed int:=0;
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED' using errcode='42501'; end if;
  if v_path not in ('BOXING','KICKBOXING') then raise exception 'INVALID_CPS_PATH' using errcode='22023'; end if;
  if not (
    p_alumno_id=v_current
    or public.cps_is_admin()
    or public.cps_can_coach_student(p_alumno_id)
  ) then
    raise exception 'FORBIDDEN' using errcode='42501';
  end if;

  select e.current_stage_order,s.label
  into v_stage,v_stage_label
  from public.cps_student_enrollments e
  join public.cps_stages s on s.route_code=e.route_code and s.stage_order=e.current_stage_order
  where e.alumno_id=p_alumno_id and e.route_code=v_path and e.status='ACTIVE';

  if v_stage is null then
    return jsonb_build_object('enrolled',false,'route_code',v_path);
  end if;

  select count(distinct st.tomo_no) into v_route_tomos_total
  from public.cps_stage_tomos st where st.route_code=v_path;

  select count(distinct st.tomo_no) into v_stage_tomos_total
  from public.cps_stage_tomos st where st.route_code=v_path and st.stage_order=v_stage;

  select count(distinct ta.tomo_no) into v_route_tomos_completed
  from public.cps_tomo_access ta
  where ta.alumno_id=p_alumno_id and ta.route_code=v_path
    and ta.status='TOMO_COMPLETED'
    and ta.tomo_no in (select tomo_no from public.cps_stage_tomos where route_code=v_path);

  select count(distinct ta.tomo_no) into v_stage_tomos_completed
  from public.cps_tomo_access ta
  where ta.alumno_id=p_alumno_id and ta.route_code=v_path
    and ta.status='TOMO_COMPLETED'
    and ta.tomo_no in (
      select tomo_no from public.cps_stage_tomos where route_code=v_path and stage_order=v_stage
    );

  select count(*) into v_stage_questions_total
  from public.cps_exam_items ei
  where ei.active=true
    and (ei.route_code is null or upper(ei.route_code)=v_path)
    and ei.tomo_no in (
      select tomo_no from public.cps_stage_tomos where route_code=v_path and stage_order=v_stage
    );

  select count(*) into v_stage_questions_approved
  from public.cps_tomo_question_answers qa
  join public.cps_exam_items ei on ei.id=qa.exam_item_id
  where qa.alumno_id=p_alumno_id and qa.route_code=v_path
    and qa.status='APPROVED'
    and ei.active=true
    and ei.tomo_no in (
      select tomo_no from public.cps_stage_tomos where route_code=v_path and stage_order=v_stage
    )
    and (ei.route_code is null or upper(ei.route_code)=v_path);

  select count(*) into v_stage_cards_total
  from public.cps_cards c
  where c.active=true
    and c.path_code in ('BOTH',v_path)
    and c.tomo_no in (
      select tomo_no from public.cps_stage_tomos where route_code=v_path and stage_order=v_stage
    );

  select count(*) into v_stage_cards_completed
  from public.cps_card_progress cp
  join public.cps_cards c on c.id=cp.card_id
  where cp.alumno_id=p_alumno_id and cp.route_code=v_path
    and cp.status='COMPLETED'
    and coalesce(cp.critical_fail_open,false)=false
    and c.active=true
    and c.path_code in ('BOTH',v_path)
    and c.tomo_no in (
      select tomo_no from public.cps_stage_tomos where route_code=v_path and stage_order=v_stage
    );

  v_route_pct:=case when v_route_tomos_total=0 then 0 else round(100.0*v_route_tomos_completed/v_route_tomos_total,1) end;
  v_stage_requirements_total:=v_stage_questions_total+v_stage_cards_total+v_stage_tomos_total;
  v_stage_requirements_completed:=v_stage_questions_approved+v_stage_cards_completed+v_stage_tomos_completed;
  v_stage_pct:=case when v_stage_requirements_total=0 then 0 else round(100.0*v_stage_requirements_completed/v_stage_requirements_total,1) end;

  return jsonb_build_object(
    'enrolled',true,
    'route_code',v_path,
    'stage_order',v_stage,
    'stage_label',v_stage_label,
    'stage_tomos_total',v_stage_tomos_total,
    'stage_tomos_completed',v_stage_tomos_completed,
    'stage_questions_total',v_stage_questions_total,
    'stage_questions_approved',v_stage_questions_approved,
    'stage_cards_total',v_stage_cards_total,
    'stage_cards_completed',v_stage_cards_completed,
    'stage_requirements_total',v_stage_requirements_total,
    'stage_requirements_completed',v_stage_requirements_completed,
    'stage_progress_pct',v_stage_pct,
    'route_tomos_total',v_route_tomos_total,
    'route_tomos_completed',v_route_tomos_completed,
    'route_progress_pct',v_route_pct,
    'stage_ready_for_exam',
      v_stage_tomos_total>0
      and v_stage_tomos_completed=v_stage_tomos_total
      and (v_stage_questions_total=0 or v_stage_questions_approved=v_stage_questions_total)
      and (v_stage_cards_total=0 or v_stage_cards_completed=v_stage_cards_total)
  );
end;
$$;

revoke all on function public.get_powerfit_cps_route_progress_secure(bigint,text) from public, anon;
grant execute on function public.get_powerfit_cps_route_progress_secure(bigint,text) to authenticated;

create or replace function public.get_powerfit_cps_admin_students_secure()
returns jsonb
language plpgsql
security definer
stable
set search_path to 'public','auth'
as $$
begin
  if auth.uid() is null or not public.cps_is_admin() then
    raise exception 'ADMIN_REQUIRED' using errcode='42501';
  end if;

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
      select jsonb_agg(
        jsonb_build_object(
          'route_code',e.route_code,
          'status',e.status,
          'stage_order',e.current_stage_order,
          'stage_label',s.label,
          'progress',public.get_powerfit_cps_route_progress_secure(a.id,e.route_code)
        ) order by e.route_code
      ) as routes
      from public.cps_student_enrollments e
      join public.cps_stages s
        on s.route_code=e.route_code and s.stage_order=e.current_stage_order
      where e.alumno_id=a.id and e.status='ACTIVE'
    ) routes on routes.routes is not null
    left join lateral (
      select count(*)::int as unlocked_tomos
      from public.cps_tomo_access ta
      where ta.alumno_id=a.id
        and ta.status in ('UNLOCKED','IN_PROGRESS','CARDS_COMPLETE','TOMO_TEST_ELIGIBLE','TOMO_TEST_PASSED','TOMO_COMPLETED')
    ) access on true
  );
end;
$$;
