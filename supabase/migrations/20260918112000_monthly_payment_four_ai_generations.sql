create table if not exists private.powerfit_monthly_generation_grants (
  payment_transaction_id bigint primary key references public.powerfit_payment_transactions(id) on delete restrict,
  alumno_id bigint not null references public.alumnos(id) on delete restrict,
  months_paid smallint not null check (months_paid > 0),
  generations_granted integer not null check (generations_granted > 0),
  generations_reversed integer not null default 0 check (generations_reversed >= 0),
  granted_at timestamptz not null default now(),
  reversed_at timestamptz,
  updated_at timestamptz not null default now()
);

revoke all on table private.powerfit_monthly_generation_grants from public, anon, authenticated;

create or replace function private.apply_powerfit_monthly_generation_grant()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public, private
as $$
declare
  v_grant integer;
  v_current integer;
  v_revoke integer;
begin
  if new.transaction_status = 'posted' and coalesce(new.months_paid,0) > 0 then
    v_grant := new.months_paid::integer * 4;

    insert into private.powerfit_monthly_generation_grants(
      payment_transaction_id, alumno_id, months_paid, generations_granted
    ) values (
      new.id, new.alumno_id, new.months_paid, v_grant
    )
    on conflict (payment_transaction_id) do nothing;

    if found then
      update public.alumnos
      set generaciones_disponibles = coalesce(generaciones_disponibles,0) + v_grant
      where id = new.alumno_id;
    end if;
  end if;

  if new.transaction_status = 'reversed'
     and old.transaction_status is distinct from 'reversed' then
    select generations_granted - generations_reversed
      into v_grant
    from private.powerfit_monthly_generation_grants
    where payment_transaction_id = new.id
    for update;

    if coalesce(v_grant,0) > 0 then
      select coalesce(generaciones_disponibles,0)
        into v_current
      from public.alumnos
      where id = new.alumno_id
      for update;

      v_revoke := least(greatest(v_current,0), v_grant);

      update public.alumnos
      set generaciones_disponibles = greatest(coalesce(generaciones_disponibles,0) - v_revoke,0)
      where id = new.alumno_id;

      update private.powerfit_monthly_generation_grants
      set generations_reversed = generations_reversed + v_revoke,
          reversed_at = now(),
          updated_at = now()
      where payment_transaction_id = new.id;
    end if;
  end if;

  return new;
end;
$$;

revoke all on function private.apply_powerfit_monthly_generation_grant() from public, anon, authenticated;

drop trigger if exists trg_powerfit_monthly_generation_grant on public.powerfit_payment_transactions;
create trigger trg_powerfit_monthly_generation_grant
after insert or update of transaction_status, months_paid
on public.powerfit_payment_transactions
for each row execute function private.apply_powerfit_monthly_generation_grant();

with eligible as (
  select t.id,t.alumno_id,t.months_paid,(t.months_paid::integer * 4) as grant_count
  from public.powerfit_payment_transactions t
  where t.transaction_status='posted'
    and coalesce(t.months_paid,0)>0
    and t.payment_received_on >= date_trunc('month', current_date)::date
),
ins as (
  insert into private.powerfit_monthly_generation_grants(
    payment_transaction_id,alumno_id,months_paid,generations_granted
  )
  select e.id,e.alumno_id,e.months_paid,e.grant_count
  from eligible e
  on conflict (payment_transaction_id) do nothing
  returning alumno_id,generations_granted
),
agg as (
  select alumno_id,sum(generations_granted)::integer total
  from ins group by alumno_id
)
update public.alumnos a
set generaciones_disponibles = coalesce(a.generaciones_disponibles,0) + agg.total
from agg
where a.id=agg.alumno_id;
