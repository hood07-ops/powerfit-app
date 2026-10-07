create or replace function public.get_powerfit_cps_stage_dashboard_secure(
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
  v_self bigint := public.cps_current_alumno_id();
  v_stage smallint;
  v_stage_label text;
  v_rows jsonb;
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED' using errcode='42501'; end if;
  if v_path not in ('BOXING','KICKBOXING') then raise exception 'INVALID_CPS_PATH' using errcode='22023'; end if;
  if not (p_alumno_id=v_self or public.cps_is_admin() or public.cps_can_coach_student(p_alumno_id)) then
    raise exception 'FORBIDDEN' using errcode='42501';
  end if;

  select e.current_stage_order, s.label into v_stage, v_stage_label
  from public.cps_student_enrollments e
  join public.cps_stages s on s.route_code=e.route_code and s.stage_order=e.current_stage_order
  where e.alumno_id=p_alumno_id and e.route_code=v_path and e.status='ACTIVE';

  if v_stage is null then raise exception 'ACTIVE_ENROLLMENT_NOT_FOUND' using errcode='22023'; end if;

  with stage_tomos as (
    select st.tomo_no, t.title, st.tomo_order
    from public.cps_stage_tomos st
    join public.cps_tomos t on t.tomo_no=st.tomo_no
    where st.route_code=v_path and st.stage_order=v_stage
  ),
  stats as (
    select
      x.tomo_no,x.title,x.tomo_order,
      coalesce((select ta.status from public.cps_tomo_access ta
        where ta.alumno_id=p_alumno_id and ta.route_code=v_path and ta.tomo_no=x.tomo_no),'LOCKED') as access_status,
      (select count(*) from public.cps_exam_items qi
        where qi.active=true and qi.tomo_no=x.tomo_no and (qi.route_code is null or upper(qi.route_code)=v_path)) as questions_total,
      (select count(*) from public.cps_tomo_question_answers qa
        join public.cps_exam_items qi on qi.id=qa.exam_item_id
        where qa.alumno_id=p_alumno_id and qa.route_code=v_path and qa.tomo_no=x.tomo_no
          and qi.active=true and qa.status='APPROVED') as questions_approved,
      (select count(*) from public.cps_cards c
        where c.active=true and c.tomo_no=x.tomo_no and c.level_order=v_stage
          and (c.path_code='BOTH' or c.path_code=v_path)) as cards_total,
      (select count(*) from public.cps_card_progress cp
        join public.cps_cards c on c.id=cp.card_id
        where cp.alumno_id=p_alumno_id and cp.route_code=v_path
          and c.active=true and c.tomo_no=x.tomo_no and c.level_order=v_stage
          and (c.path_code='BOTH' or c.path_code=v_path)
          and cp.status='COMPLETED' and coalesce(cp.critical_fail_open,false)=false) as cards_completed,
      (select tt.status from public.cps_tomo_tests tt
        where tt.alumno_id=p_alumno_id and tt.route_code=v_path and tt.tomo_no=x.tomo_no
        order by tt.completed_at desc nulls last, tt.id desc limit 1) as latest_test_status
    from stage_tomos x
  )
  select coalesce(jsonb_agg(jsonb_build_object(
    'tomo_no',tomo_no,'title',title,'tomo_order',tomo_order,'access_status',access_status,
    'questions_total',questions_total,'questions_approved',questions_approved,
    'cards_total',cards_total,'cards_completed',cards_completed,'latest_test_status',latest_test_status,
    'progress_pct',
      case when access_status='TOMO_COMPLETED' then 100 else round((
        (case when questions_total=0 then 1 else questions_approved::numeric/greatest(questions_total,1) end) +
        (case when cards_total=0 then 1 else cards_completed::numeric/greatest(cards_total,1) end) +
        (case when latest_test_status='PASSED' then 1 else 0 end)
      ) / 3 * 100)::int end,
    'next_action',
      case
        when access_status not in ('UNLOCKED','GRANTED','IN_PROGRESS','CARDS_COMPLETE','TOMO_TEST_ELIGIBLE','TOMO_TEST_PASSED','TOMO_COMPLETED') then 'LOCKED'
        when questions_approved < questions_total then 'THEORY'
        when cards_completed < cards_total then 'TECHNIQUE'
        when coalesce(latest_test_status,'') <> 'PASSED' then 'TOMO_TEST'
        else 'COMPLETE'
      end
  ) order by tomo_order,tomo_no),'[]'::jsonb)
  into v_rows from stats;

  return jsonb_build_object(
    'alumno_id',p_alumno_id,'route_code',v_path,'stage_order',v_stage,'stage_label',v_stage_label,'tomos',v_rows
  );
end;
$$;

revoke all on function public.get_powerfit_cps_stage_dashboard_secure(bigint,text) from public, anon;
grant execute on function public.get_powerfit_cps_stage_dashboard_secure(bigint,text) to authenticated;

create index if not exists cps_tomo_tests_student_route_tomo_latest_idx
  on public.cps_tomo_tests(alumno_id,route_code,tomo_no,completed_at desc,id desc);
