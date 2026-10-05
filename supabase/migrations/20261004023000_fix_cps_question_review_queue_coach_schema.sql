create or replace function public.get_powerfit_question_review_queue_secure()
returns jsonb
language plpgsql
security definer
stable
set search_path to 'public','auth'
as $$
declare
  v_rows jsonb;
  v_current_alumno_id bigint := public.cps_current_alumno_id();
begin
  if auth.uid() is null then
    raise exception 'AUTH_REQUIRED' using errcode='42501';
  end if;

  if not (
    public.cps_is_admin()
    or exists(
      select 1
      from public.cps_coach_assignments ca
      where ca.coach_alumno_id=v_current_alumno_id
        and ca.active=true
    )
  ) then
    raise exception 'FORBIDDEN' using errcode='42501';
  end if;

  select coalesce(jsonb_agg(jsonb_build_object(
    'answer_id',qa.id,
    'alumno_id',qa.alumno_id,
    'alumno_nombre',a.nombre,
    'route_code',qa.route_code,
    'tomo_no',qa.tomo_no,
    'tomo_title',t.title,
    'question_id',e.id,
    'question_type',e.question_type,
    'prompt',e.prompt,
    'expected_answer',e.expected_answer,
    'answer_text',qa.answer_text,
    'status',qa.status,
    'updated_at',qa.updated_at
  ) order by qa.updated_at asc),'[]'::jsonb)
  into v_rows
  from public.cps_tomo_question_answers qa
  join public.alumnos a on a.id=qa.alumno_id
  join public.cps_exam_items e on e.id=qa.exam_item_id
  join public.cps_tomos t on t.tomo_no=qa.tomo_no
  where qa.status in ('SUBMITTED','CORRECTION_REQUIRED')
    and (public.cps_is_admin() or public.cps_can_coach_student(qa.alumno_id));

  return v_rows;
end;
$$;

revoke all on function public.get_powerfit_question_review_queue_secure() from public, anon;
grant execute on function public.get_powerfit_question_review_queue_secure() to authenticated;
