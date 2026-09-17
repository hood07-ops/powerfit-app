create or replace function public.review_powerfit_card_video_secure(
  p_submission_id bigint,
  p_decision text,
  p_feedback text,
  p_scores jsonb default '{}'::jsonb,
  p_critical_fail boolean default false
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_submission public.cps_video_submissions%rowtype;
  v_decision text := upper(trim(coalesce(p_decision,'')));
  v_review public.cps_video_reviews%rowtype;
  v_status text;
begin
  if auth.uid() is null then
    raise exception 'AUTH_REQUIRED' using errcode='42501';
  end if;

  select * into v_submission
  from public.cps_video_submissions
  where id=p_submission_id
  for update;

  if not found then
    raise exception 'SUBMISSION_NOT_FOUND' using errcode='22023';
  end if;

  if not (public.cps_is_admin() or public.cps_can_coach_student(v_submission.alumno_id)) then
    raise exception 'FORBIDDEN' using errcode='42501';
  end if;

  if v_decision not in ('CORRECTION_REQUIRED','APPROVED') then
    raise exception 'INVALID_DECISION' using errcode='22023';
  end if;

  if nullif(trim(coalesce(p_feedback,'')),'') is null then
    raise exception 'FEEDBACK_REQUIRED' using errcode='22023';
  end if;

  if p_critical_fail then
    v_decision := 'CORRECTION_REQUIRED';
  end if;

  v_status := case when v_decision='APPROVED' then 'VIDEO_APPROVED' else 'VIDEO_CORRECTION_REQUIRED' end;

  insert into public.cps_video_reviews(
    submission_id,reviewer_id,reviewer_alumno_id,
    guard_score,base_score,mechanics_score,kinetic_chain_score,
    coordination_score,recovery_score,control_score,complete_execution_score,
    critical_fail,decision,feedback
  ) values (
    p_submission_id,auth.uid(),public.cps_current_alumno_id(),
    coalesce((p_scores->>'guard')::smallint,0),
    coalesce((p_scores->>'base')::smallint,0),
    coalesce((p_scores->>'mechanics')::smallint,0),
    coalesce((p_scores->>'kinetic_chain')::smallint,0),
    coalesce((p_scores->>'coordination')::smallint,0),
    coalesce((p_scores->>'recovery')::smallint,0),
    coalesce((p_scores->>'control')::smallint,0),
    coalesce((p_scores->>'complete_execution')::smallint,0),
    p_critical_fail,v_decision,p_feedback
  ) returning * into v_review;

  update public.cps_video_submissions
  set status=v_status
  where id=p_submission_id;

  update public.cps_card_progress
  set status=case when v_status='VIDEO_APPROVED' then 'LIVE_PENDING' else v_status end,
      video_status=v_status,
      critical_fail_open=p_critical_fail,
      updated_at=now()
  where alumno_id=v_submission.alumno_id
    and route_code=v_submission.route_code
    and card_id=v_submission.card_id;

  insert into public.cps_audit_log(actor_id,action,entity_table,entity_id,after_data,reason)
  values(auth.uid(),'review_video','cps_video_reviews',v_review.id::text,to_jsonb(v_review),p_feedback);

  return jsonb_build_object('ok',true,'review',to_jsonb(v_review));
end;
$$;

revoke all on function public.review_powerfit_card_video_secure(bigint,text,text,jsonb,boolean) from public, anon;
grant execute on function public.review_powerfit_card_video_secure(bigint,text,text,jsonb,boolean) to authenticated, service_role;

create or replace function public.save_powerfit_live_assessment_secure(
  p_alumno_id bigint,
  p_path_code text,
  p_card_id bigint,
  p_decision text,
  p_scores jsonb default '{}'::jsonb,
  p_critical_fail boolean default false,
  p_notes text default null::text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_path text := upper(trim(coalesce(p_path_code,'')));
  v_decision text := upper(trim(coalesce(p_decision,'')));
  v_attempt integer;
begin
  if auth.uid() is null then
    raise exception 'AUTH_REQUIRED' using errcode='42501';
  end if;

  if not (public.cps_is_admin() or public.cps_can_coach_student(p_alumno_id)) then
    raise exception 'FORBIDDEN' using errcode='42501';
  end if;

  if v_path not in ('BOXING','KICKBOXING') then
    raise exception 'INVALID_CPS_PATH' using errcode='22023';
  end if;

  if v_decision not in ('CORRECTION_REQUIRED','APPROVED') then
    raise exception 'INVALID_DECISION' using errcode='22023';
  end if;

  if not exists (
    select 1 from public.cps_card_progress cp
    where cp.alumno_id=p_alumno_id
      and cp.route_code=v_path
      and cp.card_id=p_card_id
      and cp.status in ('LIVE_PENDING','LIVE_CORRECTION_REQUIRED')
  ) then
    raise exception 'LIVE_ASSESSMENT_NOT_PENDING' using errcode='22023';
  end if;

  select coalesce(max(attempt_no),0)+1 into v_attempt
  from public.cps_live_assessments
  where alumno_id=p_alumno_id and route_code=v_path and card_id=p_card_id;

  insert into public.cps_live_assessments(
    alumno_id,route_code,card_id,attempt_no,assessor_id,
    reproduce_score,guard_score,base_score,correction_score,speed_score,
    movement_score,combination_score,partner_score,safety_score,
    critical_fail,decision,notes
  ) values (
    p_alumno_id,v_path,p_card_id,v_attempt,auth.uid(),
    coalesce((p_scores->>'reproduce')::smallint,0),
    coalesce((p_scores->>'guard')::smallint,0),
    coalesce((p_scores->>'base')::smallint,0),
    coalesce((p_scores->>'correction')::smallint,0),
    coalesce((p_scores->>'speed')::smallint,0),
    coalesce((p_scores->>'movement')::smallint,0),
    coalesce((p_scores->>'combination')::smallint,0),
    coalesce((p_scores->>'partner')::smallint,0),
    coalesce((p_scores->>'safety')::smallint,0),
    p_critical_fail,
    case when p_critical_fail then 'CORRECTION_REQUIRED' else v_decision end,
    p_notes
  );

  update public.cps_card_progress
  set status=case when p_critical_fail or v_decision<>'APPROVED' then 'LIVE_CORRECTION_REQUIRED' else 'COMPLETED' end,
      live_status=case when p_critical_fail or v_decision<>'APPROVED' then 'LIVE_CORRECTION_REQUIRED' else 'LIVE_APPROVED' end,
      critical_fail_open=p_critical_fail,
      completed_at=case when not p_critical_fail and v_decision='APPROVED' then now() else completed_at end,
      updated_at=now()
  where alumno_id=p_alumno_id and route_code=v_path and card_id=p_card_id;

  return jsonb_build_object('ok',true,'attempt_no',v_attempt);
end;
$$;

revoke all on function public.save_powerfit_live_assessment_secure(bigint,text,bigint,text,jsonb,boolean,text) from public, anon;
grant execute on function public.save_powerfit_live_assessment_secure(bigint,text,bigint,text,jsonb,boolean,text) to authenticated, service_role;

revoke all on function public.get_powerfit_video_review_queue_secure() from public, anon;
grant execute on function public.get_powerfit_video_review_queue_secure() to authenticated, service_role;

revoke all on function public.get_powerfit_live_assessment_queue_secure() from public, anon;
grant execute on function public.get_powerfit_live_assessment_queue_secure() to authenticated, service_role;
