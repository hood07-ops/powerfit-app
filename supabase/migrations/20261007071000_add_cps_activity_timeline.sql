create or replace function public.get_powerfit_cps_activity_secure(
  p_alumno_id bigint,
  p_limit integer default 20
) returns jsonb
language plpgsql
security definer
stable
set search_path to 'public','auth'
as $$
declare
  v_self bigint := public.cps_current_alumno_id();
  v_limit integer := greatest(1,least(coalesce(p_limit,20),50));
  v_rows jsonb;
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED' using errcode='42501'; end if;
  if not (p_alumno_id=v_self or public.cps_is_admin() or public.cps_can_coach_student(p_alumno_id)) then
    raise exception 'FORBIDDEN' using errcode='42501';
  end if;

  with events as (
    select 'THEORY'::text event_type, qa.route_code, qa.tomo_no, null::bigint card_id,
      'Pregunta teórica · Tomo '||qa.tomo_no title, qa.status,
      qa.score::numeric score, nullif(qa.feedback,'') detail,
      coalesce(qa.reviewed_at,qa.updated_at,qa.created_at) occurred_at
    from public.cps_tomo_question_answers qa
    where qa.alumno_id=p_alumno_id

    union all

    select 'VIDEO',vs.route_code,c.tomo_no,vs.card_id,coalesce(c.name,'Video técnico'),vs.status,
      null::numeric,'Intento '||vs.attempt_no||coalesce(' · '||nullif(vs.original_filename,''),''),
      vs.created_at
    from public.cps_video_submissions vs
    left join public.cps_cards c on c.id=vs.card_id
    where vs.alumno_id=p_alumno_id

    union all

    select 'LIVE',la.route_code,c.tomo_no,la.card_id,coalesce(c.name,'Evaluación presencial'),
      la.decision,la.total_score::numeric,nullif(la.notes,''),la.assessed_at
    from public.cps_live_assessments la
    left join public.cps_cards c on c.id=la.card_id
    where la.alumno_id=p_alumno_id

    union all

    select 'TOMO_TEST',tt.route_code,tt.tomo_no,null::bigint,'Evaluación Tomo '||tt.tomo_no,
      tt.status,round((coalesce(tt.theory_score,0)+coalesce(tt.practical_score,0))/2.0,1),
      nullif(tt.notes,''),coalesce(tt.completed_at,tt.created_at)
    from public.cps_tomo_tests tt
    where tt.alumno_id=p_alumno_id

    union all

    select 'PROMOTION',p.route_code,null::smallint,null::bigint,
      case when p.route_code='BOXING' then 'Promoción a Boxeo Nivel '||p.new_stage_order
           else 'Promoción a '||coalesce(s.label,'Kickboxing') end,
      'PROMOTED',p.final_score,nullif(p.observations,''),p.promoted_at
    from public.cps_promotions p
    left join public.cps_stages s on s.route_code=p.route_code and s.stage_order=p.new_stage_order
    where p.alumno_id=p_alumno_id
  ),
  recent as (
    select * from events
    where occurred_at is not null
    order by occurred_at desc
    limit v_limit
  )
  select coalesce(jsonb_agg(jsonb_build_object(
    'event_type',event_type,'route_code',route_code,'tomo_no',tomo_no,'card_id',card_id,
    'title',title,'status',status,'score',score,'detail',detail,'occurred_at',occurred_at
  ) order by occurred_at desc),'[]'::jsonb)
  into v_rows
  from recent;

  return v_rows;
end;
$$;

revoke all on function public.get_powerfit_cps_activity_secure(bigint,integer) from public, anon;
grant execute on function public.get_powerfit_cps_activity_secure(bigint,integer) to authenticated;

create index if not exists cps_live_assessments_student_assessed_idx
  on public.cps_live_assessments(alumno_id,assessed_at desc,id desc);
create index if not exists cps_promotions_student_promoted_idx
  on public.cps_promotions(alumno_id,promoted_at desc,id desc);
