CREATE OR REPLACE FUNCTION public.register_powerfit_payment(p_alumno_id bigint, p_amount integer DEFAULT NULL::integer, p_paid_on date DEFAULT CURRENT_DATE, p_period_start date DEFAULT NULL::date, p_months smallint DEFAULT 1, p_payment_method text DEFAULT NULL::text, p_notes text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
 SET "TimeZone" TO 'Pacific/Easter'
AS $function$
declare
  v_a public.alumnos%rowtype;
  v_profile public.powerfit_billing_profiles%rowtype;
  v_settings public.powerfit_finance_settings%rowtype;
  v_cycle public.powerfit_billing_cycles%rowtype;
  v_start date;
  v_new_due date;
  v_status text;
  v_tx public.powerfit_payment_transactions%rowtype;
  v_fee integer;
  v_expected integer;
  v_catalog_amount integer;
  v_amount integer;
  v_receipt text;
  v_source text;
  v_cycle_override boolean := false;
  v_previous_anchor int;
  v_new_anchor int;
  v_plan_code text;
begin
  if auth.uid() is null or not public.is_powerfit_admin() then raise exception 'FORBIDDEN' using errcode='42501'; end if;
  if p_months is null or p_months<1 or p_months>24 then raise exception 'months must be between 1 and 24'; end if;
  if p_paid_on is null or (p_paid_on > (now() at time zone 'Pacific/Easter')::date and p_paid_on > (now() at time zone 'America/Santiago')::date) then
    raise exception 'payment_received_on cannot be in the future';
  end if;

  select * into v_a from public.alumnos where id=p_alumno_id for update;
  if not found then raise exception 'Athlete not found'; end if;

  select * into v_profile from public.powerfit_billing_profiles where alumno_id=p_alumno_id and active=true;
  select * into v_settings from public.powerfit_finance_settings where id=1;
  select * into v_cycle from public.powerfit_billing_cycles where alumno_id=p_alumno_id and active=true for update;

  v_fee:=coalesce(v_profile.monthly_fee,v_settings.default_monthly_fee);
  v_source:=case
    when v_profile.monthly_fee is not null then 'student_override'
    when v_settings.default_monthly_fee is not null then 'school_default'
    else 'unconfigured'
  end;
  if v_fee is null or v_fee<=0 then raise exception 'MONTHLY_FEE_NOT_CONFIGURED'; end if;

  v_expected:=v_fee*p_months;
  v_catalog_amount:=case p_months when 1 then 40000 when 3 then 105000 when 6 then 190000 when 12 then 360000 else null end;
  v_plan_code:=case p_months when 1 then 'monthly' when 3 then 'quarterly' when 6 then 'semiannual' when 12 then 'annual' else null end;
  v_amount:=coalesce(p_amount,case when p_months in (1,3,6,12) then v_catalog_amount else v_expected end);

  if v_amount<=0 then raise exception 'PAYMENT_AMOUNT_MUST_BE_POSITIVE'; end if;
  if v_amount<>v_expected and (v_catalog_amount is null or v_amount<>v_catalog_amount) then
    raise exception 'PAYMENT_AMOUNT_NOT_ALLOWED: configured %, plan %, received %',v_expected,coalesce(v_catalog_amount,0),v_amount using errcode='22023';
  end if;

  v_start:=coalesce(p_period_start,p_paid_on);
  if v_start is null or (v_start > (now() at time zone 'Pacific/Easter')::date and v_start > (now() at time zone 'America/Santiago')::date) then
    raise exception 'period_start cannot be in the future';
  end if;

  v_previous_anchor:=v_cycle.anchor_day;
  v_new_anchor:=extract(day from v_start)::int;
  v_new_due:=public.powerfit_billing_date_after(v_start,p_months,v_new_anchor);
  v_status:=case when v_new_due<current_date then 'Moroso' else 'Pagado' end;

  insert into public.powerfit_payment_transactions(
    alumno_id,payment_received_on,period_start,previous_due_date,new_due_date,months_paid,amount,payment_method,notes,
    resulting_payment_status,created_by,previous_payment_date,previous_payment_status,transaction_status,previous_anchor_day,new_anchor_day
  ) values(
    p_alumno_id,p_paid_on,v_start,v_a.fecha_vencimiento,v_new_due,p_months,v_amount,nullif(trim(p_payment_method),''),nullif(trim(p_notes),''),
    v_status,auth.uid(),v_a.fecha_pago,v_a.estado_pago,'posted',v_previous_anchor,v_new_anchor
  ) returning * into v_tx;

  if v_cycle.id is null then
    insert into public.powerfit_billing_cycles(alumno_id,anchor_day,origin,active,created_by,updated_by)
    values(p_alumno_id,v_new_anchor,'payment_cycle_override',true,auth.uid(),auth.uid());
  elsif v_previous_anchor is distinct from v_new_anchor then
    update public.powerfit_billing_cycles
    set anchor_day=v_new_anchor,origin='payment_cycle_override',updated_by=auth.uid(),updated_at=now()
    where id=v_cycle.id;
  end if;

  v_receipt:='PF-'||to_char(p_paid_on,'YYYYMMDD')||'-'||lpad(v_tx.id::text,6,'0');
  update public.powerfit_payment_transactions set receipt_code=v_receipt where id=v_tx.id;
  update public.alumnos set fecha_pago=p_paid_on,fecha_vencimiento=v_new_due,estado_pago=v_status where id=p_alumno_id;
  perform public.refresh_powerfit_alert_instances();
  perform public.refresh_powerfit_finance_alert_details();

  return jsonb_build_object(
    'version','payment-ledger-v3.5-calendar-membership-from-period-start-or-paid-date',
    'payment_id',v_tx.id,'receipt_code',v_receipt,'alumno_id',p_alumno_id,
    'payment_received_on',p_paid_on,'period_start',v_start,'previous_due_date',v_a.fecha_vencimiento,'new_due_date',v_new_due,
    'previous_anchor_day',v_previous_anchor,'new_anchor_day',v_new_anchor,'months_paid',p_months,'amount',v_amount,
    'configured_monthly_fee',v_fee,'billing_source',v_source,'expected_amount',v_expected,
    'membership_plan',v_plan_code,'catalog_amount',v_catalog_amount,'cycle_override',v_cycle_override,
    'resulting_payment_status',v_status,'still_overdue',v_status='Moroso',
    'amount_rule','Configured complete-month amount or approved PowerFit membership catalog amount.',
    'membership_expiry_rule','Calendar months from period_start or payment_received_on. Previous due date is audit-only and never the normal base.',
    'message',case
      when v_status='Moroso' then 'Pago registrado. El alumno continúa moroso porque aún quedan períodos pendientes.'
      else 'Pago registrado y período actualizado.'
    end
  );
end;
$function$
