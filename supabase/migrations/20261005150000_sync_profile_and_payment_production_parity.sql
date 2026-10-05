create or replace function public.get_powerfit_student_directory_full_secure()
returns jsonb
language plpgsql
stable security definer
set search_path to 'public'
as $$
declare
  v_uid uuid := auth.uid();
  v_role text;
  v_rows jsonb;
begin
  if v_uid is null then raise exception 'Authentication required' using errcode='42501'; end if;
  v_role := public.get_powerfit_effective_role();
  with visible as (
    select a.* from public.alumnos a
    where v_role='admin'
      or (v_role='alumno' and a.user_id=v_uid)
      or (v_role='coach' and exists(
        select 1 from public.powerfit_coach_assignments ca
        where ca.coach_user_id=v_uid and ca.alumno_id=a.id and ca.active=true
      ))
  )
  select coalesce(jsonb_agg(jsonb_build_object(
    'id',id,'nombre',nombre,'rut',case when v_role='admin' or user_id=v_uid then rut else null end,
    'telefono',telefono,'categoria',categoria,'estado',estado,'created_at',created_at,'fecha_ingreso',fecha_ingreso,
    'edad',case when fecha_nacimiento is null then null else extract(year from age(public.powerfit_finance_today(),fecha_nacimiento))::integer end,
    'peso',peso,'altura',altura,'nivel',nivel,'bloque_actual',bloque_actual,'record_personal',record_personal,
    'mejor_tiempo',mejor_tiempo,'estado_powerfit',estado_powerfit,'xp',xp,'rango',rango,'medalla',medalla,
    'streak',streak,'puntos_semanales',puntos_semanales,'matatoa_mes',matatoa_mes,'record_semanal',record_semanal,
    'record_historico',record_historico,
    'user_id',case when v_role='admin' or user_id=v_uid then user_id else null end,
    'email',case when v_role='admin' or user_id=v_uid then email else null end,
    'plan',case when v_role='admin' or user_id=v_uid then plan else null end,
    'estado_pago',case when v_role='admin' or user_id=v_uid then estado_pago else null end,
    'fecha_pago',case when v_role='admin' or user_id=v_uid then fecha_pago else null end,
    'fecha_vencimiento',case when v_role='admin' or user_id=v_uid then fecha_vencimiento else null end,
    'monto',case when v_role='admin' or user_id=v_uid then monto else null end,
    'contacto_emergencia',case when v_role='admin' or user_id=v_uid then contacto_emergencia else null end,
    'observaciones',case when v_role='admin' or user_id=v_uid then observaciones else null end,
    'role',case when v_role='admin' or user_id=v_uid then role else null end,
    'bloques_premium',case when v_role='admin' or user_id=v_uid then bloques_premium else null end,
    'generaciones_disponibles',case when v_role='admin' or user_id=v_uid then generaciones_disponibles else null end,
    'fecha_ultima_generacion',case when v_role='admin' or user_id=v_uid then fecha_ultima_generacion else null end,
    'nivel_matatoa',nivel_matatoa,'foto_url',foto_url,'foto_storage_path',foto_storage_path,'avatar_template',avatar_template,
    'terminos_aceptados',case when v_role='admin' or user_id=v_uid then terminos_aceptados else null end,
    'terminos_version',case when v_role='admin' or user_id=v_uid then terminos_version else null end,
    'terminos_aceptados_at',case when v_role='admin' or user_id=v_uid then terminos_aceptados_at else null end,
    'fecha_nacimiento',case when v_role='admin' or user_id=v_uid then fecha_nacimiento else null end
  ) order by id desc),'[]'::jsonb) into v_rows from visible;
  return jsonb_build_object(
    'version','student-directory-full-secure-v2',
    'viewer_role',v_role,
    'count',jsonb_array_length(v_rows),
    'students',v_rows,
    'privacy_rule','Admin sees full operational fields; coach sees assigned athletes while RUT, finance, emergency-contact and auth-sensitive fields remain hidden; athlete sees self only.'
  );
end;
$$;

create or replace function public.register_powerfit_payment(
  p_alumno_id bigint,
  p_amount integer default null,
  p_paid_on date default current_date,
  p_period_start date default null,
  p_months smallint default 1,
  p_payment_method text default null,
  p_notes text default null
) returns jsonb
language plpgsql
security definer
set search_path to 'public'
set "TimeZone" to 'Pacific/Easter'
as $$
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
  if p_paid_on is null or (p_paid_on > (now() at time zone 'Pacific/Easter')::date and p_paid_on > (now() at time zone 'America/Santiago')::date) then raise exception 'payment_received_on cannot be in the future'; end if;

  select * into v_a from public.alumnos where id=p_alumno_id for update;
  if not found then raise exception 'Athlete not found'; end if;

  select * into v_profile from public.powerfit_billing_profiles where alumno_id=p_alumno_id and active=true;
  select * into v_settings from public.powerfit_finance_settings where id=1;
  select * into v_cycle from public.powerfit_billing_cycles where alumno_id=p_alumno_id and active=true for update;

  v_fee:=coalesce(v_profile.monthly_fee,v_settings.default_monthly_fee);
  v_source:=case when v_profile.monthly_fee is not null then 'student_override' when v_settings.default_monthly_fee is not null then 'school_default' else 'unconfigured' end;
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
  if v_start is null or (v_start > (now() at time zone 'Pacific/Easter')::date and v_start > (now() at time zone 'America/Santiago')::date) then raise exception 'period_start cannot be in the future'; end if;

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
    'message',case when v_status='Moroso' then 'Pago registrado. El alumno continúa moroso porque aún quedan períodos pendientes.' else 'Pago registrado y período actualizado.' end
  );
end;
$$;
