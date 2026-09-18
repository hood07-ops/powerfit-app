-- Make CPS final-exam creation idempotent.
-- One open exam per student / route / stage. Repeated requests reuse the existing exam.

create unique index if not exists cps_final_exams_one_open_per_stage
on public.cps_final_exams(alumno_id, route_code, stage_order)
where status in ('SCHEDULED','IN_PROGRESS','COACH_APPROVAL_PENDING','PROMOTION_READY');

create or replace function public.create_powerfit_final_exam_secure(
  p_alumno_id bigint,
  p_path_code text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_path text := upper(trim(coalesce(p_path_code,'')));
  v_elig jsonb;
  v_enrollment public.cps_student_enrollments%rowtype;
  v_exam public.cps_final_exams%rowtype;
begin
  if auth.uid() is null
     or not (public.cps_is_admin() or public.cps_can_coach_student(p_alumno_id)) then
    raise exception 'FORBIDDEN' using errcode='42501';
  end if;

  if v_path not in ('BOXING','KICKBOXING') then
    raise exception 'INVALID_CPS_PATH' using errcode='22023';
  end if;

  v_elig := public.get_powerfit_final_exam_eligibility_secure(p_alumno_id,v_path);
  if coalesce((v_elig->>'eligible')::boolean,false) is not true then
    raise exception 'FINAL_EXAM_NOT_ELIGIBLE: %', coalesce(v_elig->>'reason','UNKNOWN')
      using errcode='22023';
  end if;

  select *
  into v_enrollment
  from public.cps_student_enrollments
  where alumno_id=p_alumno_id
    and route_code=v_path
    and status='ACTIVE';

  if not found then
    raise exception 'ACTIVE_ENROLLMENT_NOT_FOUND' using errcode='22023';
  end if;

  select *
  into v_exam
  from public.cps_final_exams
  where alumno_id=p_alumno_id
    and route_code=v_path
    and stage_order=v_enrollment.current_stage_order
    and status in ('SCHEDULED','IN_PROGRESS','COACH_APPROVAL_PENDING','PROMOTION_READY')
  order by id desc
  limit 1;

  if found then
    return jsonb_build_object(
      'ok',true,
      'reused',true,
      'exam',to_jsonb(v_exam)
    );
  end if;

  begin
    insert into public.cps_final_exams(
      alumno_id,route_code,stage_order,examiner_id
    )
    values(
      p_alumno_id,v_path,v_enrollment.current_stage_order,auth.uid()
    )
    returning * into v_exam;
  exception
    when unique_violation then
      select *
      into v_exam
      from public.cps_final_exams
      where alumno_id=p_alumno_id
        and route_code=v_path
        and stage_order=v_enrollment.current_stage_order
        and status in ('SCHEDULED','IN_PROGRESS','COACH_APPROVAL_PENDING','PROMOTION_READY')
      order by id desc
      limit 1;

      if not found then
        raise;
      end if;

      return jsonb_build_object(
        'ok',true,
        'reused',true,
        'exam',to_jsonb(v_exam)
      );
  end;

  return jsonb_build_object(
    'ok',true,
    'reused',false,
    'exam',to_jsonb(v_exam)
  );
end;
$$;

revoke all on function public.create_powerfit_final_exam_secure(bigint,text) from public, anon;
grant execute on function public.create_powerfit_final_exam_secure(bigint,text) to authenticated, service_role;
