create or replace function public.register_powerfit_mercadopago_payment_secure(
  p_external_payment_id text,
  p_alumno_id bigint,
  p_plan_code text,
  p_amount integer,
  p_paid_on date default current_date,
  p_external_reference text default null::text
)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
set "TimeZone" to 'Pacific/Easter'
as $function$
declare
  v_a public.alumnos%rowtype;
  v_cycle public.powerfit_billing_cycles%rowtype;
  v_existing public.powerfit_payment_transactions%rowtype;
  v_plan text := lower(trim(coalesce(p_plan_code,'')));
  v_months smallint;
  v_expected integer;
  v_start date;
  v_new_due date;
  v_status text;
  v_tx public.powerfit_payment_transactions%rowtype;
  v_receipt text;
  v_anchor int;
begin
  if nullif(trim(coalesce(p_external_payment_id,'')),'') is null then
    raise exception 'MISSING_EXTERNAL_PAYMENT_ID' using errcode='22023';
  end if;
  if p_paid_on is null or p_paid_on > current_date then
    raise exception 'INVALID_PAYMENT_DATE' using errcode='22023';
  end if;

  case v_plan
    when 'monthly' then v_months:=1; v_expected:=40000;
    when 'quarterly' then v_months:=3; v_expected:=105000;
    when 'semiannual' then v_months:=6; v_expected:=190000;
    when 'annual' then v_months:=12; v_expected:=360000;
    else raise exception 'INVALID_MEMBERSHIP_PLAN' using errcode='22023';
  end case;

  if p_amount is null or p_amount <> v_expected then
    raise exception 'PAYMENT_AMOUNT_MISMATCH: expected %, received %', v_expected, p_amount using errcode='22023';
  end if;

  select * into v_existing
  from public.powerfit_payment_transactions
  where external_provider='mercadopago'
    and external_payment_id=trim(p_external_payment_id)
  limit 1;

  if found then
    if v_existing.alumno_id <> p_alumno_id then
      raise exception 'EXTERNAL_PAYMENT_ALREADY_LINKED_TO_OTHER_STUDENT' using errcode='23505';
    end if;

    select * into v_a from public.alumnos where id=v_existing.alumno_id;

    return jsonb_build_object(
      'version','mercadopago-plan-payment-v1',
      'idempotent',true,
      'plan_code',v_plan,
      'payment_id',v_existing.id,
      'receipt_code',v_existing.receipt_code,
      'alumno_id',v_existing.alumno_id,
      'alumno_nombre',v_a.nombre,
      'payment_received_on',v_existing.payment_received_on,
      'period_start',v_existing.period_start,
      'previous_due_date',v_existing.previous_due_date,
      'new_due_date',v_existing.new_due_date,
      'months_paid',v_existing.months_paid,
      'amount',v_existing.amount,
      'payment_method',v_existing.payment_method,
      'transaction_status',v_existing.transaction_status,
      'resulting_payment_status',v_existing.resulting_payment_status,
      'created_at',v_existing.created_at
    );
  end if;

  select * into v_a from public.alumnos where id=p_alumno_id for update;
  if not found then raise exception 'Athlete not found'; end if;

  select * into v_cycle
  from public.powerfit_billing_cycles
  where alumno_id=p_alumno_id and active=true
  for update;

  v_start:=p_paid_on;
  v_anchor:=extract(day from v_start)::int;
  v_new_due:=public.powerfit_billing_date_after(v_start,v_months,v_anchor);
  v_status:=case when v_new_due<current_date then 'Moroso' else 'Pagado' end;

  insert into public.powerfit_payment_transactions(
    alumno_id,payment_received_on,period_start,previous_due_date,new_due_date,
    months_paid,amount,payment_method,notes,resulting_payment_status,created_by,
    previous_payment_date,previous_payment_status,transaction_status,
    previous_anchor_day,new_anchor_day,external_provider,external_payment_id,
    external_reference,external_verified_at
  ) values(
    p_alumno_id,p_paid_on,v_start,v_a.fecha_vencimiento,v_new_due,
    v_months,p_amount,'mercadopago',
    'Pago '||v_plan||' confirmado por Mercado Pago',v_status,null,
    v_a.fecha_pago,v_a.estado_pago,'posted',v_cycle.anchor_day,v_anchor,
    'mercadopago',trim(p_external_payment_id),nullif(trim(coalesce(p_external_reference,'')),''),now()
  ) returning * into v_tx;

  if v_cycle.id is null then
    insert into public.powerfit_billing_cycles(alumno_id,anchor_day,origin,active,created_by,updated_by)
    values(p_alumno_id,v_anchor,'legacy_payment_date',true,null,null);
  elsif v_cycle.anchor_day is distinct from v_anchor then
    update public.powerfit_billing_cycles set anchor_day=v_anchor,origin='legacy_payment_date',updated_by=null,updated_at=now() where id=v_cycle.id;
  end if;

  v_receipt:='PF-MP-'||to_char(p_paid_on,'YYYYMMDD')||'-'||lpad(v_tx.id::text,6,'0');
  update public.powerfit_payment_transactions set receipt_code=v_receipt where id=v_tx.id;
  update public.alumnos
     set fecha_pago=p_paid_on, fecha_vencimiento=v_new_due, estado_pago=v_status
   where id=p_alumno_id;

  if auth.uid() is not null and public.is_powerfit_admin() then
    perform public.refresh_powerfit_alert_instances();
    perform public.refresh_powerfit_finance_alert_details();
  end if;

  return jsonb_build_object(
    'version','mercadopago-plan-payment-v1.2-webhook-safe-calendar-membership',
    'idempotent',false,
    'plan_code',v_plan,
    'payment_id',v_tx.id,
    'receipt_code',v_receipt,
    'alumno_id',p_alumno_id,
    'alumno_nombre',v_a.nombre,
    'payment_received_on',p_paid_on,
    'period_start',v_start,
    'previous_due_date',v_a.fecha_vencimiento,
    'new_due_date',v_new_due,
    'months_paid',v_months,
    'amount',p_amount,
    'payment_method','mercadopago',
    'transaction_status','posted',
    'resulting_payment_status',v_status,
    'membership_expiry_rule','Calendar months from payment_received_on. Previous due date is audit-only and never the normal base.',
    'finance_is_sports_authorization',false,
    'sports_never_blocked_only_because_payment_is_pending_or_overdue',true
  );
end;
$function$;
