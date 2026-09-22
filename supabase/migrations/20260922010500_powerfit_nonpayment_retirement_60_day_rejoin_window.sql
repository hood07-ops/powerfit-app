-- PowerFit nonpayment retirement with a 60-day minimal rejoin checkpoint.
-- Sports/profile history is purged immediately; accounting/audit records remain.
-- After 60 days, the checkpoint is deleted and the retired student row is anonymized.

create table if not exists public.powerfit_rejoin_retention (
  id bigserial primary key,
  original_alumno_id bigint not null,
  user_id uuid,
  progress_snapshot jsonb not null default '{}'::jsonb,
  retired_at timestamptz not null default now(),
  retain_until timestamptz not null default (now() + interval '60 days'),
  reason text not null default 'morosidad',
  restored_at timestamptz,
  restored_to_alumno_id bigint,
  created_by uuid,
  unique(original_alumno_id)
);

alter table public.powerfit_rejoin_retention enable row level security;

drop policy if exists powerfit_rejoin_retention_admin_read on public.powerfit_rejoin_retention;
create policy powerfit_rejoin_retention_admin_read
on public.powerfit_rejoin_retention
for select to authenticated
using (public.is_powerfit_admin());

revoke all on public.powerfit_rejoin_retention from public, anon, authenticated;
grant select on public.powerfit_rejoin_retention to authenticated;
grant all on public.powerfit_rejoin_retention to service_role;

create or replace function public.retire_powerfit_student_for_nonpayment_secure(
  p_alumno_id bigint
)
returns jsonb
language plpgsql
security definer
set search_path=public
as $$
declare
  v_a public.alumnos%rowtype;
  v_snapshot jsonb;
begin
  if auth.uid() is null or not public.is_powerfit_admin() then
    raise exception 'FORBIDDEN' using errcode='42501';
  end if;

  select * into v_a from public.alumnos where id=p_alumno_id for update;
  if not found then raise exception 'STUDENT_NOT_FOUND' using errcode='22023'; end if;

  if coalesce(v_a.estado_pago,'') not in ('Moroso','Pendiente') then
    raise exception 'STUDENT_NOT_DELINQUENT' using errcode='22023';
  end if;

  select jsonb_build_object(
    'routes',coalesce(jsonb_agg(jsonb_build_object(
      'route_code',e.route_code,
      'current_stage_order',e.current_stage_order,
      'completed_tomos',coalesce((
        select jsonb_agg(ta.tomo_no order by ta.tomo_no)
        from public.cps_tomo_access ta
        where ta.alumno_id=e.alumno_id
          and ta.route_code=e.route_code
          and ta.status='TOMO_COMPLETED'
      ),'[]'::jsonb)
    )),'[]'::jsonb),
    'nivel',v_a.nivel,
    'rango',v_a.rango
  )
  into v_snapshot
  from public.cps_student_enrollments e
  where e.alumno_id=p_alumno_id;

  insert into public.powerfit_rejoin_retention(
    original_alumno_id,user_id,progress_snapshot,retired_at,retain_until,reason,created_by
  )
  values(
    v_a.id,v_a.user_id,coalesce(v_snapshot,'{}'::jsonb),now(),now()+interval '60 days','morosidad',auth.uid()
  )
  on conflict(original_alumno_id) do update set
    user_id=excluded.user_id,
    progress_snapshot=excluded.progress_snapshot,
    retired_at=excluded.retired_at,
    retain_until=excluded.retain_until,
    reason='morosidad',
    restored_at=null,
    restored_to_alumno_id=null,
    created_by=auth.uid();

  delete from public.cps_video_submissions where alumno_id=p_alumno_id;
  delete from public.cps_live_assessments where alumno_id=p_alumno_id;
  delete from public.cps_tomo_question_answers where alumno_id=p_alumno_id;
  delete from public.cps_tomo_tests where alumno_id=p_alumno_id;
  delete from public.cps_final_exams where alumno_id=p_alumno_id;
  delete from public.cps_certificates where alumno_id=p_alumno_id;
  delete from public.cps_promotions where alumno_id=p_alumno_id;
  delete from public.cps_card_progress where alumno_id=p_alumno_id;
  delete from public.cps_tomo_access where alumno_id=p_alumno_id;
  delete from public.cps_student_enrollments where alumno_id=p_alumno_id;

  delete from public.asistencias where alumno_id=p_alumno_id;
  delete from public.asistencia where alumno_id=p_alumno_id;
  delete from public.powerfit_session_feedback where alumno_id=p_alumno_id;
  delete from public.records_entrenamiento where alumno_id=p_alumno_id;
  delete from public.rm_alumnos where alumno_id=p_alumno_id;
  delete from public.intentos_powerfit where alumno_id=p_alumno_id;
  delete from public.rendimiento_powerfit where alumno_id=p_alumno_id;
  delete from public.bloques_powerfit where alumno_id=p_alumno_id;
  delete from public.planificaciones_generadas where alumno_id=p_alumno_id;
  delete from public.powerfit_athlete_schedule where alumno_id=p_alumno_id;
  delete from public.powerfit_student_sport_profile where alumno_id=p_alumno_id;

  update public.alumnos
  set estado_powerfit='RETIRADO_MOROSIDAD',
      generaciones_disponibles=0
  where id=p_alumno_id;

  return jsonb_build_object(
    'ok',true,
    'status','RETIRADO_MOROSIDAD',
    'retained_until',now()+interval '60 days',
    'rejoin_window_days',60,
    'financial_records_preserved',true
  );
end;
$$;

revoke all on function public.retire_powerfit_student_for_nonpayment_secure(bigint)
from public,anon;
grant execute on function public.retire_powerfit_student_for_nonpayment_secure(bigint)
to authenticated,service_role;

create or replace function public.restore_powerfit_student_from_retention_secure(
  p_alumno_id bigint
)
returns jsonb
language plpgsql
security definer
set search_path=public
as $$
declare
  v_a public.alumnos%rowtype;
  v_r public.powerfit_rejoin_retention%rowtype;
  v_route jsonb;
  v_tomo jsonb;
begin
  if auth.uid() is null or not public.is_powerfit_admin() then
    raise exception 'FORBIDDEN' using errcode='42501';
  end if;

  select * into v_a from public.alumnos where id=p_alumno_id for update;
  if not found then raise exception 'STUDENT_NOT_FOUND' using errcode='22023'; end if;

  select * into v_r
  from public.powerfit_rejoin_retention
  where user_id=v_a.user_id
    and restored_at is null
    and retain_until>=now()
  order by retired_at desc
  limit 1;

  if not found then
    raise exception 'NO_ACTIVE_REJOIN_CHECKPOINT' using errcode='22023';
  end if;

  for v_route in
    select value from jsonb_array_elements(coalesce(v_r.progress_snapshot->'routes','[]'::jsonb))
  loop
    insert into public.cps_student_enrollments(
      alumno_id,route_code,current_stage_order,status,enrolled_at,created_by,updated_by
    )
    values(
      p_alumno_id,
      v_route->>'route_code',
      greatest(1,least(7,coalesce((v_route->>'current_stage_order')::int,1))),
      'ACTIVE',
      current_date,
      auth.uid(),
      auth.uid()
    )
    on conflict(alumno_id,route_code) do update set
      current_stage_order=excluded.current_stage_order,
      status='ACTIVE',
      updated_by=auth.uid(),
      updated_at=now();

    for v_tomo in
      select value from jsonb_array_elements(coalesce(v_route->'completed_tomos','[]'::jsonb))
    loop
      insert into public.cps_tomo_access(
        alumno_id,route_code,tomo_no,status,source,amount_clp,unlocked_at,completed_at
      )
      values(
        p_alumno_id,
        v_route->>'route_code',
        (v_tomo #>> '{}')::smallint,
        'TOMO_COMPLETED',
        'legacy_import',
        0,
        now(),
        now()
      )
      on conflict(alumno_id,route_code,tomo_no) do update set
        status='TOMO_COMPLETED',
        source='legacy_import',
        completed_at=coalesce(public.cps_tomo_access.completed_at,now()),
        updated_at=now();
    end loop;
  end loop;

  update public.alumnos set estado_powerfit='EN CURSO' where id=p_alumno_id;

  update public.powerfit_rejoin_retention
  set restored_at=now(),
      restored_to_alumno_id=p_alumno_id
  where id=v_r.id;

  return jsonb_build_object(
    'ok',true,
    'restored',true,
    'checkpoint_id',v_r.id,
    'retained_until',v_r.retain_until
  );
end;
$$;

revoke all on function public.restore_powerfit_student_from_retention_secure(bigint)
from public,anon;
grant execute on function public.restore_powerfit_student_from_retention_secure(bigint)
to authenticated,service_role;

create or replace function public.cleanup_powerfit_expired_rejoin_retention()
returns void
language plpgsql
security definer
set search_path=public
as $$
declare
  rec record;
begin
  for rec in
    select r.id,r.original_alumno_id
    from public.powerfit_rejoin_retention r
    where r.retain_until<now() and r.restored_at is null
  loop
    update public.alumnos set
      nombre='Alumno eliminado',
      telefono=null,
      categoria=null,
      estado=null,
      edad=null,
      peso=null,
      altura=null,
      nivel=null,
      bloque_actual=null,
      record_personal=null,
      mejor_tiempo=null,
      xp=0,
      rango=null,
      medalla=null,
      streak=0,
      puntos_semanales=0,
      matatoa_mes=false,
      record_semanal=null,
      record_historico=null,
      user_id=null,
      email=null,
      plan=null,
      estado_pago=null,
      fecha_pago=null,
      fecha_vencimiento=null,
      monto=0,
      contacto_emergencia=null,
      observaciones=null,
      role=null,
      bloques_premium=0,
      generaciones_disponibles=0,
      fecha_ultima_generacion=null,
      nivel_matatoa=null,
      foto_url=null,
      foto_storage_path=null,
      rut=null,
      fecha_nacimiento=null,
      terminos_aceptados=false,
      terminos_version=null,
      terminos_aceptados_at=null,
      estado_powerfit='ELIMINADO'
    where id=rec.original_alumno_id
      and estado_powerfit='RETIRADO_MOROSIDAD';

    delete from public.powerfit_rejoin_retention where id=rec.id;
  end loop;
end;
$$;

revoke all on function public.cleanup_powerfit_expired_rejoin_retention()
from public,anon,authenticated;
grant execute on function public.cleanup_powerfit_expired_rejoin_retention()
to service_role,postgres;

do $$
declare
  v_job bigint;
begin
  select jobid into v_job
  from cron.job
  where jobname='powerfit_cleanup_rejoin_retention'
  limit 1;

  if v_job is not null then
    perform cron.unschedule(v_job);
  end if;

  perform cron.schedule(
    'powerfit_cleanup_rejoin_retention',
    '15 4 * * *',
    'select public.cleanup_powerfit_expired_rejoin_retention();'
  );
end $$;
