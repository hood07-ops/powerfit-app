-- Backward-compatible CPS tomo detail payload.
-- Exposes unlocked study content both under study.content and tomo.study_content
-- so current and cached clients render the same material.

create or replace function public.get_powerfit_tomo_detail_secure(p_path_code text, p_tomo_no smallint)
returns jsonb
language plpgsql
set search_path to 'public'
as $function$
declare
  v_alumno_id bigint := public.cps_current_alumno_id();
  v_path text := upper(trim(coalesce(p_path_code,'')));
  v_stage smallint;
  v_access text;
  v_tomo public.cps_tomos%rowtype;
  v_eval_cards jsonb := '[]'::jsonb;
  v_price integer;
  v_study_content text;
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED' using errcode='42501'; end if;
  if v_path not in ('BOXING','KICKBOXING') then raise exception 'INVALID_CPS_PATH' using errcode='22023'; end if;
  if not exists (select 1 from public.cps_stage_tomos where route_code=v_path and tomo_no=p_tomo_no) then
    raise exception 'TOMO_NOT_IN_PATH' using errcode='22023';
  end if;

  select current_stage_order into v_stage
  from public.cps_student_enrollments
  where alumno_id=v_alumno_id and route_code=v_path and status='ACTIVE';
  if v_stage is null then raise exception 'ACTIVE_ENROLLMENT_NOT_FOUND' using errcode='22023'; end if;

  select * into v_tomo from public.cps_tomos where tomo_no=p_tomo_no and active=true;
  if not found then raise exception 'TOMO_NOT_FOUND' using errcode='22023'; end if;

  select status into v_access
  from public.cps_tomo_access
  where alumno_id=v_alumno_id and route_code=v_path and tomo_no=p_tomo_no;

  v_price := case
    when exists(
      select 1 from public.alumnos a
      where a.id=v_alumno_id and a.estado_pago='Pagado' and a.fecha_vencimiento >= current_date
    ) then 5000 else 10000 end;

  v_study_content := case
    when coalesce(v_access,'LOCKED') in (
      'UNLOCKED','IN_PROGRESS','CARDS_COMPLETE','TOMO_TEST_ELIGIBLE','TOMO_TEST_PASSED','TOMO_COMPLETED'
    ) then v_tomo.study_content
    else null
  end;

  select coalesce(jsonb_agg(jsonb_build_object(
    'id',c.id,'code',c.code,'name',c.name,'category',c.category,'objective',c.objective,'explanation',c.explanation,
    'steps',c.steps,'common_errors',c.common_errors,'critical_errors',c.critical_errors,'corrections',c.corrections,
    'drill',c.drill,'repetitions',c.repetitions,'demo_video_url',c.demo_video_url,'video_required',c.video_required,
    'live_required',c.live_required,'critical',c.critical,
    'status',coalesce(cp.status,'AVAILABLE')
  ) order by c.display_order),'[]'::jsonb) into v_eval_cards
  from public.cps_cards c
  left join public.cps_card_progress cp
    on cp.alumno_id=v_alumno_id and cp.route_code=v_path and cp.card_id=c.id
  where c.tomo_no=p_tomo_no
    and c.active=true
    and (c.path_code='BOTH' or c.path_code=v_path);

  return jsonb_build_object(
    'path_code',v_path,
    'stage_order',v_stage,
    'tomo',(to_jsonb(v_tomo) - 'study_content') || jsonb_build_object(
      'study_content',v_study_content,
      'download_allowed',v_study_content is not null
    ),
    'price_clp',v_price,
    'access_status',coalesce(v_access,'LOCKED'),
    'study',jsonb_build_object(
      'available',nullif(trim(coalesce(v_tomo.study_content,'')),'') is not null,
      'title',v_tomo.title,
      'version',v_tomo.study_version,
      'content',v_study_content,
      'download_allowed',v_study_content is not null
    ),
    'cards',v_eval_cards
  );
end;
$function$;
