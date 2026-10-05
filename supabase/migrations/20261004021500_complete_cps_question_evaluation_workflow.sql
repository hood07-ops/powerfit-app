-- Complete CPS theory-answer evaluation workflow.
-- Production parity migration for question submission/review.

create or replace function public.save_powerfit_tomo_question_answer_secure(
  p_path_code text,
  p_tomo_no smallint,
  p_exam_item_id bigint,
  p_answer_text text
) returns jsonb
language plpgsql
security definer
set search_path to 'public','auth'
as $$
declare
  v_uid uuid := auth.uid();
  v_alumno_id bigint := public.cps_current_alumno_id();
  v_path text := upper(trim(coalesce(p_path_code,'')));
  v_answer public.cps_tomo_question_answers%rowtype;
begin
  if v_uid is null or v_alumno_id is null then
    raise exception 'AUTH_REQUIRED' using errcode='42501';
  end if;
  if nullif(trim(coalesce(p_answer_text,'')),'') is null then
    raise exception 'ANSWER_REQUIRED' using errcode='22023';
  end if;
  if not exists (
    select 1 from public.cps_tomo_access ta
    where ta.alumno_id=v_alumno_id
      and ta.route_code=v_path
      and ta.tomo_no=p_tomo_no
      and ta.status in ('UNLOCKED','GRANTED','IN_PROGRESS','CARDS_COMPLETE','TOMO_TEST_ELIGIBLE','TOMO_TEST_PASSED','TOMO_COMPLETED')
  ) and not public.cps_is_admin() then
    raise exception 'TOMO_ACCESS_REQUIRED' using errcode='42501';
  end if;
  if not exists (
    select 1 from public.cps_exam_items e
    where e.id=p_exam_item_id and e.active=true and e.tomo_no=p_tomo_no
      and (e.route_code is null or upper(e.route_code)=v_path)
  ) then
    raise exception 'QUESTION_NOT_FOUND' using errcode='22023';
  end if;

  insert into public.cps_tomo_question_answers(
    alumno_id,route_code,tomo_no,exam_item_id,answer_text,status,score,feedback,reviewed_by,reviewed_at,updated_at
  )
  values(v_alumno_id,v_path,p_tomo_no,p_exam_item_id,trim(p_answer_text),'SUBMITTED',null,null,null,null,now())
  on conflict(alumno_id,route_code,tomo_no,exam_item_id)
  do update set answer_text=excluded.answer_text,status='SUBMITTED',score=null,feedback=null,reviewed_by=null,reviewed_at=null,updated_at=now()
  returning * into v_answer;

  return jsonb_build_object('ok',true,'answer',to_jsonb(v_answer));
end;
$$;

create or replace function public.get_powerfit_question_review_queue_secure()
returns jsonb
language plpgsql
security definer
stable
set search_path to 'public','auth'
as $$
declare
  v_rows jsonb;
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED' using errcode='42501'; end if;
  if not (public.cps_is_admin() or exists(
    select 1 from public.cps_coach_assignments ca where ca.coach_user_id=auth.uid() and ca.active=true
  )) then
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

create or replace function public.review_powerfit_tomo_question_answer_secure(
  p_answer_id bigint,
  p_decision text,
  p_score smallint,
  p_feedback text
) returns jsonb
language plpgsql
security definer
set search_path to 'public','auth'
as $$
declare
  v_answer public.cps_tomo_question_answers%rowtype;
  v_decision text := upper(trim(coalesce(p_decision,'')));
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED' using errcode='42501'; end if;

  select * into v_answer
  from public.cps_tomo_question_answers
  where id=p_answer_id
  for update;

  if not found then raise exception 'ANSWER_NOT_FOUND' using errcode='22023'; end if;
  if not (public.cps_is_admin() or public.cps_can_coach_student(v_answer.alumno_id)) then
    raise exception 'FORBIDDEN' using errcode='42501';
  end if;
  if v_decision not in ('APPROVED','CORRECTION_REQUIRED') then
    raise exception 'INVALID_DECISION' using errcode='22023';
  end if;
  if p_score is null or p_score < 0 or p_score > 100 then
    raise exception 'INVALID_SCORE' using errcode='22023';
  end if;
  if nullif(trim(coalesce(p_feedback,'')),'') is null then
    raise exception 'FEEDBACK_REQUIRED' using errcode='22023';
  end if;

  update public.cps_tomo_question_answers
  set status=v_decision, score=p_score, feedback=trim(p_feedback),
      reviewed_by=auth.uid(), reviewed_at=now(), updated_at=now()
  where id=p_answer_id
  returning * into v_answer;

  return jsonb_build_object('ok',true,'answer',to_jsonb(v_answer));
end;
$$;

revoke all on function public.save_powerfit_tomo_question_answer_secure(text,smallint,bigint,text) from public, anon;
revoke all on function public.get_powerfit_question_review_queue_secure() from public, anon;
revoke all on function public.review_powerfit_tomo_question_answer_secure(bigint,text,smallint,text) from public, anon;

grant execute on function public.save_powerfit_tomo_question_answer_secure(text,smallint,bigint,text) to authenticated;
grant execute on function public.get_powerfit_question_review_queue_secure() to authenticated;
grant execute on function public.review_powerfit_tomo_question_answer_secure(bigint,text,smallint,text) to authenticated;
