create or replace function public.get_powerfit_final_exam_eligibility_secure(
  p_alumno_id bigint,
  p_path_code text
) returns jsonb
language plpgsql
stable security definer
set search_path to 'public'
as $$
declare
  v_path text := upper(trim(coalesce(p_path_code,'')));
  v_enrollment public.cps_student_enrollments%rowtype;
  v_stage public.cps_stages%rowtype;
  v_stage_start date;
  v_today date := public.powerfit_finance_today();
  v_months integer := 0;
  v_attendance integer := 0;
  v_attendance_required integer := 0;
  v_attendance_pct numeric := 0;
  v_tomos_total integer := 0;
  v_tomos_completed integer := 0;
  v_cards_total integer := 0;
  v_cards_completed integer := 0;
  v_questions_total integer := 0;
  v_questions_approved integer := 0;
  v_open_critical integer := 0;
  v_eligible boolean := false;
  v_reason text := null;
  v_message text := null;
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED' using errcode='42501'; end if;
  if not public.cps_can_read_student(p_alumno_id) then raise exception 'FORBIDDEN' using errcode='42501'; end if;
  if v_path not in ('BOXING','KICKBOXING') then raise exception 'INVALID_CPS_PATH' using errcode='22023'; end if;

  select * into v_enrollment
  from public.cps_student_enrollments
  where alumno_id=p_alumno_id and route_code=v_path and status='ACTIVE';

  if not found then
    return jsonb_build_object('eligible',false,'reason','NOT_ENROLLED','message','NO INSCRITO EN ESTA RUTA');
  end if;

  select * into v_stage
  from public.cps_stages
  where route_code=v_enrollment.route_code
    and stage_order=v_enrollment.current_stage_order;

  select coalesce(
    (
      select max(p.promoted_at::date)
      from public.cps_promotions p
      where p.alumno_id=p_alumno_id
        and p.route_code=v_path
        and p.new_stage_order=v_enrollment.current_stage_order
    ),
    v_enrollment.enrolled_at
  ) into v_stage_start;

  v_months :=
    greatest(
      0,
      (extract(year from age(v_today,v_stage_start))::int * 12)
      + extract(month from age(v_today,v_stage_start))::int
    );

  select count(distinct (a.fecha at time zone 'Pacific/Easter')::date)
  into v_attendance
  from public.asistencias a
  where a.alumno_id=p_alumno_id
    and (a.fecha at time zone 'Pacific/Easter')::date >= v_stage_start
    and (a.fecha at time zone 'Pacific/Easter')::date <= v_today;

  v_attendance_required := v_stage.minimum_months * 8;
  v_attendance_pct := case
    when v_attendance_required<=0 then 100
    else round(100.0*v_attendance/v_attendance_required,1)
  end;

  select count(*) into v_tomos_total
  from public.cps_stage_tomos
  where route_code=v_enrollment.route_code
    and stage_order=v_enrollment.current_stage_order
    and required=true;

  select count(*) into v_tomos_completed
  from public.cps_stage_tomos st
  join public.cps_tomo_access ta
    on ta.alumno_id=p_alumno_id
   and ta.route_code=st.route_code
   and ta.tomo_no=st.tomo_no
   and ta.status='TOMO_COMPLETED'
  where st.route_code=v_enrollment.route_code
    and st.stage_order=v_enrollment.current_stage_order
    and st.required=true;

  select count(*) into v_cards_total
  from public.cps_cards c
  where c.active=true
    and c.path_code in ('BOTH',v_path)
    and c.tomo_no in (
      select tomo_no from public.cps_stage_tomos
      where route_code=v_path and stage_order=v_enrollment.current_stage_order and required=true
    );

  select count(*) into v_cards_completed
  from public.cps_card_progress cp
  join public.cps_cards c on c.id=cp.card_id
  where cp.alumno_id=p_alumno_id
    and cp.route_code=v_path
    and cp.status='COMPLETED'
    and coalesce(cp.critical_fail_open,false)=false
    and c.active=true
    and c.path_code in ('BOTH',v_path)
    and c.tomo_no in (
      select tomo_no from public.cps_stage_tomos
      where route_code=v_path and stage_order=v_enrollment.current_stage_order and required=true
    );

  select count(*) into v_questions_total
  from public.cps_exam_items ei
  where ei.active=true
    and (ei.route_code is null or upper(ei.route_code)=v_path)
    and ei.tomo_no in (
      select tomo_no from public.cps_stage_tomos
      where route_code=v_path and stage_order=v_enrollment.current_stage_order and required=true
    );

  select count(*) into v_questions_approved
  from public.cps_tomo_question_answers qa
  join public.cps_exam_items ei on ei.id=qa.exam_item_id
  where qa.alumno_id=p_alumno_id
    and qa.route_code=v_path
    and qa.status='APPROVED'
    and ei.active=true
    and (ei.route_code is null or upper(ei.route_code)=v_path)
    and ei.tomo_no in (
      select tomo_no from public.cps_stage_tomos
      where route_code=v_path and stage_order=v_enrollment.current_stage_order and required=true
    );

  select count(*) into v_open_critical
  from public.cps_card_progress cp
  join public.cps_cards c on c.id=cp.card_id
  where cp.alumno_id=p_alumno_id
    and cp.route_code=v_path
    and c.active=true
    and c.path_code in ('BOTH',v_path)
    and c.tomo_no in (
      select tomo_no from public.cps_stage_tomos
      where route_code=v_path and stage_order=v_enrollment.current_stage_order and required=true
    )
    and coalesce(cp.critical_fail_open,false)=true;

  v_eligible :=
    v_months >= v_stage.minimum_months
    and v_attendance >= v_attendance_required
    and v_questions_approved = v_questions_total
    and v_cards_completed = v_cards_total
    and v_tomos_completed = v_tomos_total
    and v_open_critical = 0;

  if v_months < v_stage.minimum_months then
    v_reason:='MINIMUM_TIME'; v_message:='AÚN NO CUMPLE TIEMPO MÍNIMO';
  elsif v_attendance < v_attendance_required then
    v_reason:='MINIMUM_ATTENDANCE'; v_message:='AÚN NO CUMPLE ASISTENCIA MÍNIMA';
  elsif v_questions_approved < v_questions_total then
    v_reason:='THEORY_PENDING'; v_message:='AÚN HAY PREGUNTAS TEÓRICAS PENDIENTES';
  elsif v_cards_completed < v_cards_total then
    v_reason:='TECHNICAL_CARDS_PENDING'; v_message:='AÚN HAY TARJETAS TÉCNICAS PENDIENTES';
  elsif v_tomos_completed < v_tomos_total then
    v_reason:='TOMOS_PENDING'; v_message:='AÚN FALTAN TOMOS OBLIGATORIOS';
  elsif v_open_critical > 0 then
    v_reason:='CRITICAL_FAIL_OPEN'; v_message:='AÚN HAY FALLOS CRÍTICOS ABIERTOS';
  else
    v_reason:='ELIGIBLE'; v_message:='HABILITADO PARA EXAMEN FINAL';
  end if;

  return jsonb_build_object(
    'eligible',v_eligible,'reason',v_reason,'message',v_message,'stage_label',v_stage.label,
    'stage_start',v_stage_start,'today_local',v_today,
    'months_in_stage',v_months,'minimum_months',v_stage.minimum_months,
    'attendance_count',v_attendance,'attendance_required',v_attendance_required,'attendance_pct',v_attendance_pct,
    'tomos_completed',v_tomos_completed,'tomos_required',v_tomos_total,
    'cards_completed',v_cards_completed,'cards_required',v_cards_total,
    'questions_approved',v_questions_approved,'questions_required',v_questions_total,
    'open_critical_fail',v_open_critical
  );
end;
$$;
