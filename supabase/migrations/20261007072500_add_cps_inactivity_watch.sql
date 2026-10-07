create or replace function public.get_powerfit_cps_inactivity_secure(
  p_days integer default 14
) returns jsonb
language plpgsql
security definer
stable
set search_path to 'public','auth'
as $$
declare
  v_days integer := greatest(1,least(coalesce(p_days,14),180));
  v_rows jsonb;
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED' using errcode='42501'; end if;

  if not (
    public.cps_is_admin()
    or exists(
      select 1 from public.cps_coach_assignments ca
      where ca.coach_alumno_id=public.cps_current_alumno_id() and ca.active=true
    )
  ) then
    raise exception 'FORBIDDEN' using errcode='42501';
  end if;

  with active_routes as (
    select e.alumno_id,e.route_code,e.current_stage_order,e.enrolled_at,a.nombre,a.email
    from public.cps_student_enrollments e
    join public.alumnos a on a.id=e.alumno_id
    where e.status='ACTIVE'
      and (public.cps_is_admin() or public.cps_can_coach_student(e.alumno_id))
  ),
  activity as (
    select ar.*,
      greatest(
        coalesce((select max(coalesce(qa.reviewed_at,qa.updated_at,qa.created_at))
          from public.cps_tomo_question_answers qa
          where qa.alumno_id=ar.alumno_id and qa.route_code=ar.route_code),'-infinity'::timestamptz),
        coalesce((select max(vs.created_at)
          from public.cps_video_submissions vs
          where vs.alumno_id=ar.alumno_id and vs.route_code=ar.route_code),'-infinity'::timestamptz),
        coalesce((select max(la.assessed_at)
          from public.cps_live_assessments la
          where la.alumno_id=ar.alumno_id and la.route_code=ar.route_code),'-infinity'::timestamptz),
        coalesce((select max(coalesce(tt.completed_at,tt.created_at))
          from public.cps_tomo_tests tt
          where tt.alumno_id=ar.alumno_id and tt.route_code=ar.route_code),'-infinity'::timestamptz),
        coalesce((select max(p.promoted_at)
          from public.cps_promotions p
          where p.alumno_id=ar.alumno_id and p.route_code=ar.route_code),'-infinity'::timestamptz),
        ar.enrolled_at::timestamptz
      ) as last_activity_at
    from active_routes ar
  ),
  stale as (
    select *,
      greatest(0,floor(extract(epoch from (now()-last_activity_at))/86400))::int as inactive_days
    from activity
  )
  select coalesce(jsonb_agg(jsonb_build_object(
    'alumno_id',alumno_id,'nombre',nombre,'email',email,'route_code',route_code,
    'current_stage_order',current_stage_order,'last_activity_at',last_activity_at,'inactive_days',inactive_days
  ) order by inactive_days desc,nombre),'[]'::jsonb)
  into v_rows
  from stale
  where inactive_days>=v_days;

  return v_rows;
end;
$$;

revoke all on function public.get_powerfit_cps_inactivity_secure(integer) from public, anon;
grant execute on function public.get_powerfit_cps_inactivity_secure(integer) to authenticated;
