create or replace function public.get_powerfit_cps_attention_secure()
returns jsonb
language plpgsql
security definer
stable
set search_path to 'public','auth'
as $$
declare
  v_alumno_id bigint := public.cps_current_alumno_id();
  v_theory_corrections int:=0;
  v_theory_waiting int:=0;
  v_video_corrections int:=0;
  v_video_waiting int:=0;
  v_live_corrections int:=0;
  v_live_pending int:=0;
  v_items jsonb:='[]'::jsonb;
begin
  if auth.uid() is null or v_alumno_id is null then
    raise exception 'AUTH_REQUIRED' using errcode='42501';
  end if;

  select count(*) filter(where status='CORRECTION_REQUIRED'),
         count(*) filter(where status='SUBMITTED')
  into v_theory_corrections,v_theory_waiting
  from public.cps_tomo_question_answers
  where alumno_id=v_alumno_id;

  with latest_video as (
    select distinct on (v.route_code,v.card_id)
      v.id,v.route_code,v.card_id,v.status,v.attempt_no
    from public.cps_video_submissions v
    where v.alumno_id=v_alumno_id
    order by v.route_code,v.card_id,v.attempt_no desc,v.id desc
  )
  select
    count(*) filter(where status='VIDEO_CORRECTION_REQUIRED'),
    count(*) filter(where status in ('VIDEO_SUBMITTED','VIDEO_UNDER_REVIEW'))
  into v_video_corrections,v_video_waiting
  from latest_video;

  select
    count(*) filter(where status='LIVE_CORRECTION_REQUIRED'),
    count(*) filter(where status='LIVE_PENDING')
  into v_live_corrections,v_live_pending
  from public.cps_card_progress
  where alumno_id=v_alumno_id;

  with latest_video as (
    select distinct on (v.route_code,v.card_id)
      v.id,v.route_code,v.card_id,v.status,v.attempt_no
    from public.cps_video_submissions v
    where v.alumno_id=v_alumno_id
    order by v.route_code,v.card_id,v.attempt_no desc,v.id desc
  ),
  action_items as (
    select
      qa.route_code,
      qa.tomo_no,
      'THEORY_CORRECTION'::text as item_type,
      null::bigint as card_id,
      left(ei.prompt,180) as title,
      coalesce(nullif(trim(qa.feedback),''),'Revisa tu respuesta y envía una nueva versión.') as detail,
      qa.updated_at as sort_at
    from public.cps_tomo_question_answers qa
    join public.cps_exam_items ei on ei.id=qa.exam_item_id
    where qa.alumno_id=v_alumno_id and qa.status='CORRECTION_REQUIRED'

    union all

    select
      lv.route_code,
      c.tomo_no,
      'VIDEO_CORRECTION'::text,
      c.id,
      c.name,
      coalesce(
        (select nullif(trim(vr.feedback),'') from public.cps_video_reviews vr where vr.submission_id=lv.id order by vr.reviewed_at desc limit 1),
        'Corrige la ejecución y sube un nuevo video.'
      ),
      now()
    from latest_video lv
    join public.cps_cards c on c.id=lv.card_id
    where lv.status='VIDEO_CORRECTION_REQUIRED'

    union all

    select
      cp.route_code,
      c.tomo_no,
      case when cp.status='LIVE_CORRECTION_REQUIRED' then 'LIVE_CORRECTION' else 'LIVE_PENDING' end,
      c.id,
      c.name,
      case
        when cp.status='LIVE_CORRECTION_REQUIRED' then 'Repite la evaluación presencial después de corregir la técnica.'
        else 'Tu video está aprobado. Falta la evaluación presencial con el coach.'
      end,
      cp.updated_at
    from public.cps_card_progress cp
    join public.cps_cards c on c.id=cp.card_id
    where cp.alumno_id=v_alumno_id
      and cp.status in ('LIVE_CORRECTION_REQUIRED','LIVE_PENDING')
  )
  select coalesce(jsonb_agg(jsonb_build_object(
    'route_code',route_code,
    'tomo_no',tomo_no,
    'item_type',item_type,
    'card_id',card_id,
    'title',title,
    'detail',detail
  ) order by sort_at desc),'[]'::jsonb)
  into v_items
  from action_items;

  return jsonb_build_object(
    'action_required',
      coalesce(v_theory_corrections,0)+coalesce(v_video_corrections,0)+coalesce(v_live_corrections,0)+coalesce(v_live_pending,0),
    'waiting_review',coalesce(v_theory_waiting,0)+coalesce(v_video_waiting,0),
    'theory_corrections',coalesce(v_theory_corrections,0),
    'theory_waiting',coalesce(v_theory_waiting,0),
    'video_corrections',coalesce(v_video_corrections,0),
    'video_waiting',coalesce(v_video_waiting,0),
    'live_corrections',coalesce(v_live_corrections,0),
    'live_pending',coalesce(v_live_pending,0),
    'items',v_items
  );
end;
$$;

revoke all on function public.get_powerfit_cps_attention_secure() from public, anon;
grant execute on function public.get_powerfit_cps_attention_secure() to authenticated;
