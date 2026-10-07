create or replace function public.powerfit_cps_tomo_purchase_eligibility(
  p_alumno_id bigint,
  p_path_code text,
  p_tomo_no smallint
) returns jsonb
language plpgsql
stable
security definer
set search_path to 'public'
as $$
declare
  v_path text := upper(trim(coalesce(p_path_code,'')));
  v_enrollment public.cps_student_enrollments%rowtype;
  v_stage_order smallint;
  v_stage public.cps_stages%rowtype;
  v_stage_start date;
  v_today date := public.powerfit_finance_today();
  v_elapsed_months integer := 0;
  v_attendance_count integer := 0;
  v_tomo_count integer := 0;
  v_tomo_position integer := 0;
  v_required_months integer := 0;
  v_required_attendance integer := 0;
  v_prior_pending integer := 0;
  v_access_status text;
  v_min_stage smallint;
  v_max_stage smallint;
begin
  if v_path not in ('BOXING','KICKBOXING') then
    return jsonb_build_object('eligible',false,'reason','INVALID_PATH');
  end if;

  select * into v_enrollment
  from public.cps_student_enrollments
  where alumno_id=p_alumno_id and route_code=v_path and status='ACTIVE'
  limit 1;

  if not found then
    return jsonb_build_object('eligible',false,'reason','NOT_ENROLLED','message','Debes estar matriculado en este camino.');
  end if;

  select status into v_access_status
  from public.cps_tomo_access
  where alumno_id=p_alumno_id and route_code=v_path and tomo_no=p_tomo_no
  limit 1;

  if coalesce(v_access_status,'LOCKED') <> 'LOCKED' then
    return jsonb_build_object(
      'eligible',false,'already_unlocked',true,'reason','ALREADY_UNLOCKED',
      'access_status',v_access_status,'message','Este tomo ya está desbloqueado.'
    );
  end if;

  select st.stage_order into v_stage_order
  from public.cps_stage_tomos st
  where st.route_code=v_path and st.tomo_no=p_tomo_no
    and st.stage_order=v_enrollment.current_stage_order
  limit 1;

  if v_stage_order is null then
    select min(st.stage_order),max(st.stage_order)
    into v_min_stage,v_max_stage
    from public.cps_stage_tomos st
    where st.route_code=v_path and st.tomo_no=p_tomo_no;

    if v_min_stage is null then
      return jsonb_build_object('eligible',false,'reason','TOMO_NOT_IN_PATH');
    end if;

    return jsonb_build_object(
      'eligible',false,
      'reason',case
        when v_min_stage > v_enrollment.current_stage_order then 'FUTURE_STAGE'
        when v_max_stage < v_enrollment.current_stage_order then 'PAST_STAGE'
        else 'TOMO_NOT_IN_CURRENT_STAGE'
      end,
      'current_stage_order',v_enrollment.current_stage_order,
      'tomo_stage_min',v_min_stage,'tomo_stage_max',v_max_stage,
      'message',case
        when v_min_stage > v_enrollment.current_stage_order then 'Este tomo pertenece a un nivel o grado que aún no has alcanzado.'
        when v_max_stage < v_enrollment.current_stage_order then 'Este tomo pertenece a un nivel o grado anterior.'
        else 'Este tomo no corresponde a tu nivel o grado actual.'
      end
    );
  end if;

  select * into v_stage
  from public.cps_stages
  where route_code=v_path and stage_order=v_stage_order;

  select coalesce(
    (select max(p.promoted_at::date)
     from public.cps_promotions p
     where p.alumno_id=p_alumno_id and p.route_code=v_path and p.new_stage_order=v_stage_order),
    v_enrollment.enrolled_at
  ) into v_stage_start;

  v_elapsed_months := greatest(
    0,
    (extract(year from age(v_today,v_stage_start))::int * 12)
    + extract(month from age(v_today,v_stage_start))::int
  );

  select count(distinct (a.fecha at time zone 'Pacific/Easter')::date)
  into v_attendance_count
  from public.asistencias a
  where a.alumno_id=p_alumno_id
    and (a.fecha at time zone 'Pacific/Easter')::date >= v_stage_start
    and (a.fecha at time zone 'Pacific/Easter')::date <= v_today;

  select
    count(*) filter (where st.required),
    count(*) filter (where st.required and st.tomo_no <= p_tomo_no)
  into v_tomo_count,v_tomo_position
  from public.cps_stage_tomos st
  where st.route_code=v_path and st.stage_order=v_stage_order;

  v_tomo_count := greatest(v_tomo_count,1);
  v_tomo_position := greatest(v_tomo_position,1);
  v_required_months := floor((v_stage.minimum_months::numeric * (v_tomo_position - 1)) / v_tomo_count)::int;
  v_required_attendance := v_required_months * 8;

  select count(*) into v_prior_pending
  from public.cps_stage_tomos st
  left join public.cps_tomo_access ta
    on ta.alumno_id=p_alumno_id and ta.route_code=st.route_code and ta.tomo_no=st.tomo_no
  where st.route_code=v_path and st.stage_order=v_stage_order and st.required=true
    and st.tomo_no < p_tomo_no
    and coalesce(ta.status,'LOCKED') <> 'TOMO_COMPLETED';

  if v_prior_pending > 0 then
    return jsonb_build_object(
      'eligible',false,'reason','PREVIOUS_TOMOS_PENDING','stage_order',v_stage_order,
      'stage_start',v_stage_start,'today_local',v_today,'elapsed_months',v_elapsed_months,
      'required_months',v_required_months,'attendance_count',v_attendance_count,
      'attendance_required',v_required_attendance,'prior_tomos_pending',v_prior_pending,
      'message','Debes completar los tomos anteriores de este nivel o grado.'
    );
  end if;

  if v_elapsed_months < v_required_months then
    return jsonb_build_object(
      'eligible',false,'reason','MINIMUM_TIME_NOT_MET','stage_order',v_stage_order,
      'stage_start',v_stage_start,'today_local',v_today,'elapsed_months',v_elapsed_months,
      'required_months',v_required_months,'attendance_count',v_attendance_count,
      'attendance_required',v_required_attendance,'prior_tomos_pending',0,
      'message','Aún no cumples el tiempo mínimo de progresión para este tomo.'
    );
  end if;

  if v_attendance_count < v_required_attendance then
    return jsonb_build_object(
      'eligible',false,'reason','MINIMUM_ATTENDANCE_NOT_MET','stage_order',v_stage_order,
      'stage_start',v_stage_start,'today_local',v_today,'elapsed_months',v_elapsed_months,
      'required_months',v_required_months,'attendance_count',v_attendance_count,
      'attendance_required',v_required_attendance,'prior_tomos_pending',0,
      'message','Aún no cumples la asistencia mínima para este tomo.'
    );
  end if;

  return jsonb_build_object(
    'eligible',true,'reason','ELIGIBLE','message','Requisitos cumplidos. Puedes adquirir este tomo.',
    'current_stage_order',v_enrollment.current_stage_order,'stage_order',v_stage_order,
    'stage_start',v_stage_start,'today_local',v_today,'elapsed_months',v_elapsed_months,
    'required_months',v_required_months,'attendance_count',v_attendance_count,
    'attendance_required',v_required_attendance,'prior_tomos_pending',0
  );
end;
$$;

create or replace function public.register_powerfit_tomo_payment_secure(
  p_external_payment_id text,
  p_alumno_id bigint,
  p_path_code text,
  p_tomo_no smallint,
  p_amount integer,
  p_paid_on date default current_date
) returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_path text := upper(trim(coalesce(p_path_code,'')));
  v_expected integer;
  v_existing_by_payment public.cps_tomo_access%rowtype;
  v_existing_access public.cps_tomo_access%rowtype;
  v_access public.cps_tomo_access%rowtype;
  v_elig jsonb;
  v_new_status text;
  v_new_source text;
begin
  if nullif(trim(coalesce(p_external_payment_id,'')),'') is null then
    raise exception 'MISSING_EXTERNAL_PAYMENT_ID' using errcode='22023';
  end if;

  select * into v_existing_by_payment
  from public.cps_tomo_access
  where external_provider='mercadopago' and external_payment_id=trim(p_external_payment_id)
  limit 1;

  if found then
    return jsonb_build_object('ok',true,'idempotent',true,'access',to_jsonb(v_existing_by_payment));
  end if;

  if v_path not in ('BOXING','KICKBOXING') then raise exception 'INVALID_CPS_PATH' using errcode='22023'; end if;
  if not exists(select 1 from public.cps_tomos where tomo_no=p_tomo_no and active=true) then
    raise exception 'INVALID_TOMO' using errcode='22023';
  end if;
  if not exists(select 1 from public.cps_stage_tomos where route_code=v_path and tomo_no=p_tomo_no) then
    raise exception 'TOMO_NOT_IN_PATH' using errcode='22023';
  end if;
  if not exists(select 1 from public.cps_student_enrollments
    where alumno_id=p_alumno_id and route_code=v_path and status='ACTIVE') then
    raise exception 'ACTIVE_ENROLLMENT_NOT_FOUND' using errcode='22023';
  end if;

  v_expected := case
    when exists(
      select 1 from public.alumnos a
      where a.id=p_alumno_id and a.estado_pago='Pagado'
        and a.fecha_vencimiento >= coalesce(p_paid_on,public.powerfit_finance_today())
    ) then 5000 else 10000 end;

  if p_amount <> v_expected then
    raise exception 'PAYMENT_AMOUNT_MISMATCH expected %, received %',v_expected,p_amount using errcode='22023';
  end if;

  select * into v_existing_access
  from public.cps_tomo_access
  where alumno_id=p_alumno_id and route_code=v_path and tomo_no=p_tomo_no
  limit 1;

  if not found or coalesce(v_existing_access.status,'LOCKED')='LOCKED' then
    v_elig := public.powerfit_cps_tomo_purchase_eligibility(p_alumno_id,v_path,p_tomo_no);
    if coalesce((v_elig->>'eligible')::boolean,false) is not true then
      raise exception 'TOMO_NOT_ELIGIBLE: %',coalesce(v_elig->>'reason','UNKNOWN') using errcode='22023';
    end if;
    v_new_status := 'UNLOCKED';
    v_new_source := 'mercadopago';
  else
    v_new_status := v_existing_access.status;
    v_new_source := v_existing_access.source;
  end if;

  insert into public.cps_tomo_access(
    alumno_id,route_code,tomo_no,status,source,amount_clp,
    external_provider,external_payment_id,unlocked_at
  )
  values(
    p_alumno_id,v_path,p_tomo_no,v_new_status,v_new_source,p_amount,
    'mercadopago',trim(p_external_payment_id),now()
  )
  on conflict(alumno_id,route_code,tomo_no) do update set
    status=case
      when public.cps_tomo_access.status in (
        'UNLOCKED','GRANTED','IN_PROGRESS','CARDS_COMPLETE',
        'TOMO_TEST_ELIGIBLE','TOMO_TEST_PASSED','TOMO_COMPLETED'
      ) then public.cps_tomo_access.status
      else 'UNLOCKED' end,
    source=case
      when public.cps_tomo_access.status in (
        'UNLOCKED','GRANTED','IN_PROGRESS','CARDS_COMPLETE',
        'TOMO_TEST_ELIGIBLE','TOMO_TEST_PASSED','TOMO_COMPLETED'
      ) then public.cps_tomo_access.source
      else 'mercadopago' end,
    amount_clp=p_amount,
    external_provider='mercadopago',
    external_payment_id=trim(p_external_payment_id),
    unlocked_at=coalesce(public.cps_tomo_access.unlocked_at,now()),
    updated_at=now()
  returning * into v_access;

  insert into public.cps_audit_log(actor_id,action,entity_table,entity_id,after_data,reason)
  values(
    null,'mercadopago_tomo_unlock','cps_tomo_access',v_access.id::text,to_jsonb(v_access),
    case
      when v_existing_access.id is not null and coalesce(v_existing_access.status,'LOCKED')<>'LOCKED'
        then 'Pago CPS aprobado por Mercado Pago; estado y origen académico preservados'
      else 'Pago CPS aprobado por Mercado Pago' end
  );

  return jsonb_build_object(
    'ok',true,'idempotent',false,'expected_amount_clp',v_expected,
    'eligibility_checked',v_existing_access.id is null or coalesce(v_existing_access.status,'LOCKED')='LOCKED',
    'academic_status_preserved',v_existing_access.id is not null and coalesce(v_existing_access.status,'LOCKED')<>'LOCKED',
    'academic_source_preserved',v_existing_access.id is not null and coalesce(v_existing_access.status,'LOCKED')<>'LOCKED',
    'access',to_jsonb(v_access)
  );
end;
$$;
