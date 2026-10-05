create or replace function public.get_powerfit_tomo_theory_progress_secure(
  p_alumno_id bigint,
  p_path_code text,
  p_tomo_no smallint
) returns jsonb
language plpgsql
security definer
stable
set search_path to 'public','auth'
as $$
declare
  v_path text := upper(trim(coalesce(p_path_code,'')));
  v_current bigint := public.cps_current_alumno_id();
  v_total integer := 0;
  v_answered integer := 0;
  v_approved integer := 0;
  v_correction integer := 0;
  v_avg numeric := null;
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED' using errcode='42501'; end if;
  if not (
    p_alumno_id=v_current
    or public.cps_is_admin()
    or public.cps_can_coach_student(p_alumno_id)
  ) then
    raise exception 'FORBIDDEN' using errcode='42501';
  end if;

  select count(*) into v_total
  from public.cps_exam_items e
  where e.active=true and e.tomo_no=p_tomo_no
    and (e.route_code is null or upper(e.route_code)=v_path);

  select
    count(*) filter(where qa.answer_text is not null and trim(qa.answer_text)<>''),
    count(*) filter(where qa.status='APPROVED'),
    count(*) filter(where qa.status='CORRECTION_REQUIRED'),
    round(avg(qa.score) filter(where qa.status='APPROVED' and qa.score is not null),1)
  into v_answered,v_approved,v_correction,v_avg
  from public.cps_exam_items e
  left join public.cps_tomo_question_answers qa
    on qa.exam_item_id=e.id
   and qa.alumno_id=p_alumno_id
   and qa.route_code=v_path
   and qa.tomo_no=p_tomo_no
  where e.active=true and e.tomo_no=p_tomo_no
    and (e.route_code is null or upper(e.route_code)=v_path);

  return jsonb_build_object(
    'total_questions',v_total,
    'answered',coalesce(v_answered,0),
    'approved',coalesce(v_approved,0),
    'correction_required',coalesce(v_correction,0),
    'average_score',v_avg,
    'ready',case when v_total=0 then true else coalesce(v_approved,0)=v_total and v_avg is not null end,
    'score_source',case when v_total=0 then 'legacy_manual' else 'approved_question_average' end
  );
end;
$$;

create or replace function public.finalize_powerfit_tomo_test_secure(
  p_alumno_id bigint,
  p_path_code text,
  p_tomo_no smallint,
  p_status text,
  p_theory_score smallint,
  p_practical_score smallint,
  p_critical_fail boolean default false,
  p_notes text default null
) returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $$
declare
 v_path text:=upper(trim(coalesce(p_path_code,'')));
 v_stage smallint;
 v_required_cards int:=0;
 v_completed_cards int:=0;
 v_final_status text;
 v_average numeric;
 v_min numeric:=80;
 v_cfg public.cps_evaluation_settings%rowtype;
 v_theory_questions int:=0;
 v_theory_approved int:=0;
 v_theory_average numeric:=null;
 v_effective_theory_score smallint;
 v_theory_source text;
begin
 if auth.uid() is null or not (public.cps_is_admin() or public.cps_can_coach_student(p_alumno_id)) then
   raise exception 'FORBIDDEN' using errcode='42501';
 end if;

 select current_stage_order into v_stage
 from public.cps_student_enrollments
 where alumno_id=p_alumno_id and route_code=v_path and status='ACTIVE';
 if v_stage is null then raise exception 'ACTIVE_ENROLLMENT_NOT_FOUND' using errcode='22023'; end if;

 select * into v_cfg
 from public.cps_evaluation_settings
 where route_code=v_path and stage_order=v_stage and active=true;
 v_min:=coalesce(v_cfg.minimum_tomo_score,80);

 select count(*) into v_required_cards
 from public.cps_cards c
 where c.active=true and c.tomo_no=p_tomo_no and c.level_order=v_stage
   and (c.path_code='BOTH' or c.path_code=v_path);

 select count(*) into v_completed_cards
 from public.cps_cards c
 join public.cps_card_progress cp
   on cp.card_id=c.id and cp.alumno_id=p_alumno_id and cp.route_code=v_path
 where c.active=true and c.tomo_no=p_tomo_no and c.level_order=v_stage
   and (c.path_code='BOTH' or c.path_code=v_path)
   and cp.status='COMPLETED'
   and coalesce(cp.critical_fail_open,false)=false;

 if coalesce(v_cfg.require_all_cards,true)
    and v_required_cards>0
    and v_completed_cards<>v_required_cards then
   raise exception 'TOMO_CARDS_NOT_COMPLETE' using errcode='22023';
 end if;

 select count(*) into v_theory_questions
 from public.cps_exam_items e
 where e.active=true and e.tomo_no=p_tomo_no
   and (e.route_code is null or upper(e.route_code)=v_path);

 if v_theory_questions>0 then
   select
     count(*) filter(where qa.status='APPROVED'),
     avg(qa.score) filter(where qa.status='APPROVED' and qa.score is not null)
   into v_theory_approved,v_theory_average
   from public.cps_exam_items e
   left join public.cps_tomo_question_answers qa
     on qa.exam_item_id=e.id
    and qa.alumno_id=p_alumno_id
    and qa.route_code=v_path
    and qa.tomo_no=p_tomo_no
   where e.active=true and e.tomo_no=p_tomo_no
     and (e.route_code is null or upper(e.route_code)=v_path);

   if coalesce(v_theory_approved,0)<>v_theory_questions or v_theory_average is null then
     raise exception 'TOMO_THEORY_NOT_COMPLETE' using errcode='22023';
   end if;

   v_effective_theory_score:=round(v_theory_average)::smallint;
   v_theory_source:='approved_question_average';
 else
   if p_theory_score is null or p_theory_score not between 0 and 100 then
     raise exception 'INVALID_TOMO_SCORE' using errcode='22023';
   end if;
   v_effective_theory_score:=p_theory_score;
   v_theory_source:='legacy_manual';
 end if;

 if p_practical_score is null or p_practical_score not between 0 and 100 then
   raise exception 'INVALID_TOMO_SCORE' using errcode='22023';
 end if;

 v_average:=(v_effective_theory_score+p_practical_score)/2.0;
 v_final_status:=case
   when p_critical_fail and coalesce(v_cfg.require_no_critical_fail,true) then 'FAILED'
   when upper(trim(coalesce(p_status,'')))='PASSED' and v_average>=v_min then 'PASSED'
   else 'FAILED'
 end;

 insert into public.cps_tomo_tests(
   alumno_id,route_code,tomo_no,stage_order,status,theory_score,practical_score,
   critical_fail,coach_id,notes,completed_at
 )
 values(
   p_alumno_id,v_path,p_tomo_no,v_stage,v_final_status,v_effective_theory_score,
   p_practical_score,p_critical_fail,auth.uid(),p_notes,now()
 );

 return jsonb_build_object(
   'ok',true,'status',v_final_status,'stage_order',v_stage,
   'average_score',v_average,'minimum_score',v_min,
   'required_cards',v_required_cards,'completed_cards',v_completed_cards,
   'theory_questions',v_theory_questions,'theory_approved',v_theory_approved,
   'theory_score',v_effective_theory_score,'theory_score_source',v_theory_source
 );
end;
$$;

revoke all on function public.get_powerfit_tomo_theory_progress_secure(bigint,text,smallint) from public, anon;
grant execute on function public.get_powerfit_tomo_theory_progress_secure(bigint,text,smallint) to authenticated;
