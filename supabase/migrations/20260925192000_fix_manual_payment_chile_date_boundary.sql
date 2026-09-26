-- Allow same-calendar-day manual payments across Chile mainland and Rapa Nui date boundaries.
-- Prevents a valid payment date from being rejected as "future" when admin/device and DB are on different Chile timezones.

do $$
declare
  v_oid oid;
  v_def text;
begin
  select p.oid into v_oid
  from pg_proc p
  join pg_namespace n on n.oid=p.pronamespace
  where n.nspname='public'
    and p.proname='register_powerfit_payment'
    and pg_get_function_identity_arguments(p.oid) =
      'p_alumno_id bigint, p_amount integer, p_paid_on date, p_period_start date, p_months smallint, p_payment_method text, p_notes text'
  limit 1;

  if v_oid is null then
    raise exception 'register_powerfit_payment signature not found';
  end if;

  v_def := pg_get_functiondef(v_oid);

  v_def := replace(
    v_def,
    'if p_paid_on is null or p_paid_on>current_date then raise exception ''payment_received_on cannot be in the future''; end if;',
    'if p_paid_on is null or (p_paid_on > (now() at time zone ''Pacific/Easter'')::date and p_paid_on > (now() at time zone ''America/Santiago'')::date) then raise exception ''payment_received_on cannot be in the future''; end if;'
  );

  v_def := replace(
    v_def,
    'if v_start is null or v_start>current_date then raise exception ''period_start cannot be in the future''; end if;',
    'if v_start is null or (v_start > (now() at time zone ''Pacific/Easter'')::date and v_start > (now() at time zone ''America/Santiago'')::date) then raise exception ''period_start cannot be in the future''; end if;'
  );

  execute v_def;
end
$$;
