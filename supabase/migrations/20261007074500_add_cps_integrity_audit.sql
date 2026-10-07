create or replace function public.audit_powerfit_cps_integrity_secure()
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
  if not public.cps_is_admin() then raise exception 'ADMIN_REQUIRED' using errcode='42501'; end if;

  with completed_tomos as (
    select ta.alumno_id,ta.route_code,ta.tomo_no,ta.status,e.current_stage_order
    from public.cps_tomo_access ta
    join public.cps_student_enrollments e
      on e.alumno_id=ta.alumno_id and e.route_code=ta.route_code and e.status in ('ACTIVE','COMPLETED')
    where ta.status='TOMO_COMPLETED'
  ),
  tomo_checks as (
    select ct.alumno_id,ct.route_code,ct.tomo_no,ct.current_stage_order,
      (select count(*) from public.cps_exam_items qi
       where qi.active=true and qi.tomo_no=ct.tomo_no
         and (qi.route_code is null or upper(qi.route_code)=ct.route_code)) q_total,
      (select count(*) from public.cps_tomo_question_answers qa
       join public.cps_exam_items qi on qi.id=qa.exam_item_id
       where qa.alumno_id=ct.alumno_id and qa.route_code=ct.route_code
         and qa.tomo_no=ct.tomo_no and qa.status='APPROVED' and qi.active=true) q_ok,
      (select count(*) from public.cps_cards c
       where c.active=true and c.tomo_no=ct.tomo_no
         and c.level_order=ct.current_stage_order
         and (c.path_code='BOTH' or c.path_code=ct.route_code)) c_total,
      (select count(*) from public.cps_card_progress cp
       join public.cps_cards c on c.id=cp.card_id
       where cp.alumno_id=ct.alumno_id and cp.route_code=ct.route_code
         and c.active=true and c.tomo_no=ct.tomo_no
         and c.level_order=ct.current_stage_order
         and (c.path_code='BOTH' or c.path_code=ct.route_code)
         and cp.status='COMPLETED'
         and coalesce(cp.critical_fail_open,false)=false) c_ok
    from completed_tomos ct
  ),
  issues as (
    select tc.alumno_id,tc.route_code,tc.tomo_no,
      'COMPLETED_TOMO_WITH_PENDING_THEORY'::text issue_code,
      ('Tomo marcado completado con teoría '||tc.q_ok||'/'||tc.q_total)::text detail
    from tomo_checks tc
    where tc.q_ok<tc.q_total

    union all

    select tc.alumno_id,tc.route_code,tc.tomo_no,
      'COMPLETED_TOMO_WITH_PENDING_TECHNIQUE',
      ('Tomo marcado completado con técnicas '||tc.c_ok||'/'||tc.c_total)::text
    from tomo_checks tc
    where tc.c_ok<tc.c_total

    union all

    select e.alumno_id,e.route_code,null::smallint,
      'INVALID_STAGE_ORDER',
      ('Etapa actual fuera de rango: '||e.current_stage_order)::text
    from public.cps_student_enrollments e
    where e.status='ACTIVE'
      and not exists(
        select 1 from public.cps_stages s
        where s.route_code=e.route_code and s.stage_order=e.current_stage_order
      )

    union all

    select qa.alumno_id,qa.route_code,qa.tomo_no,
      'ANSWER_WITHOUT_TOMO_ACCESS',
      'Existe respuesta teórica sin acceso al tomo'::text
    from public.cps_tomo_question_answers qa
    where not exists(
      select 1 from public.cps_tomo_access ta
      where ta.alumno_id=qa.alumno_id and ta.route_code=qa.route_code and ta.tomo_no=qa.tomo_no
    )
    group by qa.alumno_id,qa.route_code,qa.tomo_no

    union all

    select cp.alumno_id,cp.route_code,c.tomo_no,
      'CARD_PROGRESS_WITHOUT_TOMO_ACCESS',
      'Existe progreso técnico sin acceso al tomo'::text
    from public.cps_card_progress cp
    join public.cps_cards c on c.id=cp.card_id
    where not exists(
      select 1 from public.cps_tomo_access ta
      where ta.alumno_id=cp.alumno_id and ta.route_code=cp.route_code and ta.tomo_no=c.tomo_no
    )
    group by cp.alumno_id,cp.route_code,c.tomo_no
  )
  select coalesce(jsonb_agg(jsonb_build_object(
    'alumno_id',i.alumno_id,'alumno_nombre',a.nombre,'route_code',i.route_code,
    'tomo_no',i.tomo_no,'issue_code',i.issue_code,'detail',i.detail
  ) order by a.nombre,i.route_code,i.tomo_no nulls first),'[]'::jsonb)
  into v_rows
  from issues i
  left join public.alumnos a on a.id=i.alumno_id;

  return jsonb_build_object('ok',true,'issue_count',jsonb_array_length(v_rows),'issues',v_rows);
end;
$$;

revoke all on function public.audit_powerfit_cps_integrity_secure() from public, anon;
grant execute on function public.audit_powerfit_cps_integrity_secure() to authenticated;
