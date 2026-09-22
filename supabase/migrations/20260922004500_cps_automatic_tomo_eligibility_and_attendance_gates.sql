-- CPS automatic access gates.
-- Applied to canonical production project sabsmurhriohwmczaktn.
-- Removes authenticated manual grants and centralizes tome eligibility.

create or replace function public.powerfit_cps_tomo_purchase_eligibility(
  p_alumno_id bigint,
  p_path_code text,
  p_tomo_no smallint
)
returns jsonb
language plpgsql
stable
security definer
set search_path=public
as $$
declare
  v_path text:=upper(trim(coalesce(p_path_code,'')));
  v_enrollment public.cps_student_enrollments%rowtype;
  v_stage_order smallint;
  v_stage public.cps_stages%rowtype;
  v_stage_start date;
  v_elapsed_months integer:=0;
  v_attendance_count integer:=0;
  v_tomo_count integer:=0;
  v_tomo_position integer:=0;
  v_required_months integer:=0;
  v_required_attendance integer:=0;
  v_prior_pending integer:=0;
  v_access_status text;
begin
  if v_path not in ('BOXING','KICKBOXING') then
    return jsonb_build_object('eligible',false,'reason','INVALID_PATH');
  end if;

  select * into v_enrollment
  from public.cps_student_enrollments
  where alumno_id=p_alumno_id and route_code=v_path and status='ACTIVE'
  limit 1;

  if not found then
    return jsonb_build_object('eligible',false,'reason','NOT_ENROLLED','message','Debes estar matriculado en este camino.');
  end if;

  select st.stage_order into v_stage_order
  from public.cps_stage_tomos st
  where st.route_code=v_path and st.tomo_no=p_tomo_no
  limit 1;

  if v_stage_order is null then
    return jsonb_build_object('eligible',false,'reason','TOMO_NOT_IN_PATH');
  end if;

  select status into v_access_status
  from public.cps_tomo_access
  where alumno_id=p_alumno_id and route_code=v_path and tomo_no=p_tomo_no
  limit 1;

  if coalesce(v_access_status,'LOCKED') <> 'LOCKED' then
    return jsonb_build_object(
      'eligible',false,'already_unlocked',true,'reason','ALREADY_UNLOCKED',
      'access_status',v_access_status,'message','Este tomo ya está desbloqueado.'
    );
  end if;

  if v_stage_order <> v_enrollment.current_stage_order then
    return jsonb_build_object(
      'eligible',false,
      'reason',case when v_stage_order>v_enrollment.current_stage_order then 'FUTURE_STAGE' else 'PAST_STAGE' end,
      'current_stage_order',v_enrollment.current_stage_order,
      'tomo_stage_order',v_stage_order,
      'message',case
        when v_stage_order>v_enrollment.current_stage_order then 'Este tomo pertenece a un nivel o grado que aún no has alcanzado.'
        else 'Este tomo no corresponde a tu nivel o grado actual.'
      end
    );
  end if;

  select * into v_stage
  from public.cps_stages
  where route_code=v_path and stage_order=v_stage_order;

  select coalesce(
    (select max(p.promoted_at::date)
     from public.cps_promotions p
     where p.alumno_id=p_alumno_id and p.route_code=v_path and p.new_stage_order=v_stage_order),
    v_enrollment.enrolled_at
  ) into v_stage_start;

  v_elapsed_months:=greatest(
    0,
    extract(year from age(current_date,v_stage_start))::int*12
    + extract(month from age(current_date,v_stage_start))::int
  );

  select count(distinct (a.fecha at time zone 'Pacific/Easter')::date)
  into v_attendance_count
  from public.asistencias a
  where a.alumno_id=p_alumno_id
    and (a.fecha at time zone 'Pacific/Easter')::date between v_stage_start and current_date;

  select
    count(*) filter(where st.required),
    count(*) filter(where st.required and st.tomo_no<=p_tomo_no)
  into v_tomo_count,v_tomo_position
  from public.cps_stage_tomos st
  where st.route_code=v_path and st.stage_order=v_stage_order;

  v_tomo_count:=greatest(v_tomo_count,1);
  v_tomo_position:=greatest(v_tomo_position,1);
  v_required_months:=floor((v_stage.minimum_months::numeric*(v_tomo_position-1))/v_tomo_count)::int;
  v_required_attendance:=v_required_months*8;

  select count(*) into v_prior_pending
  from public.cps_stage_tomos st
  left join public.cps_tomo_access ta
    on ta.alumno_id=p_alumno_id and ta.route_code=st.route_code and ta.tomo_no=st.tomo_no
  where st.route_code=v_path
    and st.stage_order=v_stage_order
    and st.required=true
    and st.tomo_no<p_tomo_no
    and coalesce(ta.status,'LOCKED')<>'TOMO_COMPLETED';

  if v_prior_pending>0 then
    return jsonb_build_object(
      'eligible',false,'reason','PREVIOUS_TOMOS_PENDING','stage_start',v_stage_start,
      'elapsed_months',v_elapsed_months,'required_months',v_required_months,
      'attendance_count',v_attendance_count,'attendance_required',v_required_attendance,
      'prior_tomos_pending',v_prior_pending,
      'message','Debes completar los tomos anteriores de este nivel o grado.'
    );
  end if;

  if v_elapsed_months<v_required_months then
    return jsonb_build_object(
      'eligible',false,'reason','MINIMUM_TIME_NOT_MET','stage_start',v_stage_start,
      'elapsed_months',v_elapsed_months,'required_months',v_required_months,
      'attendance_count',v_attendance_count,'attendance_required',v_required_attendance,
      'prior_tomos_pending',0,'message','Aún no cumples el tiempo mínimo de progresión para este tomo.'
    );
  end if;

  if v_attendance_count<v_required_attendance then
    return jsonb_build_object(
      'eligible',false,'reason','MINIMUM_ATTENDANCE_NOT_MET','stage_start',v_stage_start,
      'elapsed_months',v_elapsed_months,'required_months',v_required_months,
      'attendance_count',v_attendance_count,'attendance_required',v_required_attendance,
      'prior_tomos_pending',0,'message','Aún no cumples la asistencia mínima para este tomo.'
    );
  end if;

  return jsonb_build_object(
    'eligible',true,'reason','ELIGIBLE','message','Requisitos cumplidos. Puedes adquirir este tomo.',
    'current_stage_order',v_enrollment.current_stage_order,'stage_start',v_stage_start,
    'elapsed_months',v_elapsed_months,'required_months',v_required_months,
    'attendance_count',v_attendance_count,'attendance_required',v_required_attendance,
    'prior_tomos_pending',0
  );
end;
$$;

revoke all on function public.powerfit_cps_tomo_purchase_eligibility(bigint,text,smallint)
from public,anon,authenticated;
grant execute on function public.powerfit_cps_tomo_purchase_eligibility(bigint,text,smallint)
to service_role,postgres;

create or replace function public.get_powerfit_tomo_purchase_eligibility_secure(
  p_path_code text,
  p_tomo_no smallint
)
returns jsonb
language plpgsql
stable
security definer
set search_path=public
as $$
declare
  v_alumno_id bigint:=public.cps_current_alumno_id();
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED' using errcode='42501'; end if;
  return public.powerfit_cps_tomo_purchase_eligibility(v_alumno_id,p_path_code,p_tomo_no);
end;
$$;

revoke all on function public.get_powerfit_tomo_purchase_eligibility_secure(text,smallint)
from public,anon;
grant execute on function public.get_powerfit_tomo_purchase_eligibility_secure(text,smallint)
to authenticated,service_role;

create or replace function public.get_powerfit_cps_payment_quote_server(
  p_alumno_id bigint,
  p_path_code text,
  p_tomo_no smallint,
  p_user_id uuid
)
returns jsonb
language plpgsql
stable
security definer
set search_path=public
as $$
declare
  v_path text:=upper(trim(coalesce(p_path_code,'')));
  v_a public.alumnos%rowtype;
  v_price integer;
  v_tomo public.cps_tomos%rowtype;
  v_elig jsonb;
begin
  if p_user_id is null then raise exception 'AUTH_REQUIRED' using errcode='42501'; end if;
  if v_path not in ('BOXING','KICKBOXING') then raise exception 'INVALID_CPS_PATH' using errcode='22023'; end if;

  select * into v_a from public.alumnos where id=p_alumno_id;
  if not found then raise exception 'STUDENT_NOT_FOUND' using errcode='22023'; end if;
  if v_a.user_id is distinct from p_user_id then raise exception 'FORBIDDEN' using errcode='42501'; end if;

  select * into v_tomo from public.cps_tomos where tomo_no=p_tomo_no and active=true;
  if not found then raise exception 'TOMO_NOT_FOUND' using errcode='22023'; end if;

  v_elig:=public.powerfit_cps_tomo_purchase_eligibility(p_alumno_id,v_path,p_tomo_no);
  if coalesce((v_elig->>'eligible')::boolean,false) is not true then
    raise exception 'CPS_TOMO_NOT_ELIGIBLE:%',coalesce(v_elig->>'reason','UNKNOWN') using errcode='22023';
  end if;

  v_price:=case
    when v_a.estado_pago='Pagado' and v_a.fecha_vencimiento>=current_date then 5000
    else 10000
  end;

  return jsonb_build_object(
    'alumno_id',p_alumno_id,'path_code',v_path,'tomo_no',p_tomo_no,'title',v_tomo.title,
    'amount_clp',v_price,'membership_current',v_price=5000,
    'membership_status',coalesce(v_a.estado_pago,'Pendiente'),
    'membership_due',v_a.fecha_vencimiento,'eligibility',v_elig
  );
end;
$$;

revoke all on function public.get_powerfit_cps_payment_quote_server(bigint,text,smallint,uuid)
from public,anon,authenticated;
grant execute on function public.get_powerfit_cps_payment_quote_server(bigint,text,smallint,uuid)
to service_role;

-- Manual/admin grants are not part of the user/admin workflow anymore.
revoke execute on function public.grant_powerfit_tomo_access_secure(bigint,text,smallint,text)
from authenticated,public,anon;
grant execute on function public.grant_powerfit_tomo_access_secure(bigint,text,smallint,text)
to service_role;
