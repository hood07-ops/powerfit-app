create or replace function public.register_powerfit_tomo_payment_secure(
  p_external_payment_id text,
  p_alumno_id bigint,
  p_path_code text,
  p_tomo_no smallint,
  p_amount integer,
  p_paid_on date default public.powerfit_finance_today()
) returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_path text := upper(trim(coalesce(p_path_code,'')));
  v_expected integer;
  v_existing_by_payment public.cps_tomo_access%rowtype;
  v_existing_access public.cps_tomo_access%rowtype;
  v_access public.cps_tomo_access%rowtype;
  v_elig jsonb;
begin
  if nullif(trim(coalesce(p_external_payment_id,'')),'') is null then
    raise exception 'MISSING_EXTERNAL_PAYMENT_ID' using errcode='22023';
  end if;

  select * into v_existing_by_payment
  from public.cps_tomo_access
  where external_provider='mercadopago'
    and external_payment_id=trim(p_external_payment_id)
  limit 1;

  if found then
    return jsonb_build_object('ok',true,'idempotent',true,'access',to_jsonb(v_existing_by_payment));
  end if;

  if v_path not in ('BOXING','KICKBOXING') then raise exception 'INVALID_CPS_PATH' using errcode='22023'; end if;
  if not exists(select 1 from public.cps_tomos where tomo_no=p_tomo_no and active=true) then
    raise exception 'INVALID_TOMO' using errcode='22023';
  end if;
  if not exists(select 1 from public.cps_stage_tomos where route_code=v_path and tomo_no=p_tomo_no) then
    raise exception 'TOMO_NOT_IN_PATH' using errcode='22023';
  end if;
  if not exists(select 1 from public.cps_student_enrollments
    where alumno_id=p_alumno_id and route_code=v_path and status='ACTIVE') then
    raise exception 'ACTIVE_ENROLLMENT_NOT_FOUND' using errcode='22023';
  end if;

  v_expected := case
    when exists(
      select 1 from public.alumnos a
      where a.id=p_alumno_id and a.estado_pago='Pagado'
        and a.fecha_vencimiento >= coalesce(p_paid_on,public.powerfit_finance_today())
    ) then 5000 else 10000 end;

  if p_amount <> v_expected then
    raise exception 'PAYMENT_AMOUNT_MISMATCH expected %, received %',v_expected,p_amount using errcode='22023';
  end if;

  select * into v_existing_access
  from public.cps_tomo_access
  where alumno_id=p_alumno_id and route_code=v_path and tomo_no=p_tomo_no
  limit 1;

  if not found or coalesce(v_existing_access.status,'LOCKED')='LOCKED' then
    v_elig := public.powerfit_cps_tomo_purchase_eligibility(p_alumno_id,v_path,p_tomo_no);
    if coalesce((v_elig->>'eligible')::boolean,false) is not true then
      raise exception 'TOMO_NOT_ELIGIBLE: %',coalesce(v_elig->>'reason','UNKNOWN') using errcode='22023';
    end if;
  end if;

  insert into public.cps_tomo_access(
    alumno_id,route_code,tomo_no,status,source,amount_clp,
    external_provider,external_payment_id,unlocked_at
  )
  values(
    p_alumno_id,v_path,p_tomo_no,'UNLOCKED','mercadopago',p_amount,
    'mercadopago',trim(p_external_payment_id),now()
  )
  on conflict(alumno_id,route_code,tomo_no) do update set
    status=case
      when public.cps_tomo_access.status in (
        'UNLOCKED','IN_PROGRESS','CARDS_COMPLETE',
        'TOMO_TEST_ELIGIBLE','TOMO_TEST_PASSED','TOMO_COMPLETED'
      ) then public.cps_tomo_access.status
      else 'UNLOCKED' end,
    source=case
      when public.cps_tomo_access.status in (
        'UNLOCKED','IN_PROGRESS','CARDS_COMPLETE',
        'TOMO_TEST_ELIGIBLE','TOMO_TEST_PASSED','TOMO_COMPLETED'
      ) then public.cps_tomo_access.source
      else 'mercadopago' end,
    amount_clp=p_amount,
    external_provider='mercadopago',
    external_payment_id=trim(p_external_payment_id),
    unlocked_at=coalesce(public.cps_tomo_access.unlocked_at,now()),
    updated_at=now()
  returning * into v_access;

  insert into public.cps_audit_log(actor_id,action,entity_table,entity_id,after_data,reason)
  values(
    null,'mercadopago_tomo_unlock','cps_tomo_access',v_access.id::text,to_jsonb(v_access),
    case
      when v_existing_access.id is not null and coalesce(v_existing_access.status,'LOCKED')<>'LOCKED'
        then 'Pago CPS aprobado por Mercado Pago; estado y origen académico preservados'
      else 'Pago CPS aprobado por Mercado Pago' end
  );

  return jsonb_build_object(
    'ok',true,'idempotent',false,'expected_amount_clp',v_expected,
    'paid_on_local',coalesce(p_paid_on,public.powerfit_finance_today()),
    'eligibility_checked',v_existing_access.id is null or coalesce(v_existing_access.status,'LOCKED')='LOCKED',
    'academic_status_preserved',v_existing_access.id is not null and coalesce(v_existing_access.status,'LOCKED')<>'LOCKED',
    'academic_source_preserved',v_existing_access.id is not null and coalesce(v_existing_access.status,'LOCKED')<>'LOCKED',
    'access',to_jsonb(v_access)
  );
end;
$$;
