create or replace function public.get_powerfit_video_review_queue_secure()
returns jsonb
language sql
set search_path to 'public'
as $function$
  select coalesce(jsonb_agg(jsonb_build_object(
    'submission_id',s.id,
    'alumno_id',s.alumno_id,
    'alumno_nombre',a.nombre,
    'route_code',s.route_code,
    'card_id',s.card_id,
    'card_name',c.name,
    'attempt_no',s.attempt_no,
    'status',s.status,
    'created_at',s.created_at,
    'critical',c.critical,
    'storage_path',s.storage_path,
    'original_filename',s.original_filename
  ) order by c.critical desc, s.created_at asc),'[]'::jsonb)
  from public.cps_video_submissions s
  join public.alumnos a on a.id=s.alumno_id
  join public.cps_cards c on c.id=s.card_id
  where s.status in ('VIDEO_SUBMITTED','VIDEO_UNDER_REVIEW')
    and (public.cps_is_admin() or public.cps_can_coach_student(s.alumno_id))
$function$;

create or replace function public.get_powerfit_live_assessment_queue_secure()
returns jsonb
language sql
set search_path to 'public'
as $function$
  select coalesce(jsonb_agg(jsonb_build_object(
    'alumno_id',cp.alumno_id,
    'alumno_nombre',a.nombre,
    'route_code',cp.route_code,
    'card_id',cp.card_id,
    'status',cp.status,
    'card_name',c.name,
    'critical',c.critical,
    'updated_at',cp.updated_at
  ) order by c.critical desc, cp.updated_at asc),'[]'::jsonb)
  from public.cps_card_progress cp
  join public.alumnos a on a.id=cp.alumno_id
  join public.cps_cards c on c.id=cp.card_id
  where cp.status in ('LIVE_PENDING','LIVE_CORRECTION_REQUIRED')
    and (public.cps_is_admin() or public.cps_can_coach_student(cp.alumno_id))
$function$;
