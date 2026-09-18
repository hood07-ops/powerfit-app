create schema if not exists private;

create table if not exists private.powerfit_rate_limits (
  bucket_key text not null,
  window_started_at timestamptz not null,
  request_count integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key (bucket_key, window_started_at)
);

revoke all on schema private from public, anon, authenticated;
revoke all on table private.powerfit_rate_limits from public, anon, authenticated;

create index if not exists powerfit_rate_limits_updated_at_idx
  on private.powerfit_rate_limits(updated_at);

create or replace function public.server_consume_powerfit_rate_limit(
  p_bucket_key text,
  p_limit integer,
  p_window_seconds integer
) returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, private
as $$
declare
  v_now timestamptz := clock_timestamp();
  v_window timestamptz;
  v_count integer;
  v_retry_after integer;
begin
  if p_bucket_key is null or length(p_bucket_key) < 3 or length(p_bucket_key) > 240 then
    raise exception 'INVALID_RATE_LIMIT_KEY';
  end if;
  if p_limit < 1 or p_limit > 10000 then
    raise exception 'INVALID_RATE_LIMIT_LIMIT';
  end if;
  if p_window_seconds < 1 or p_window_seconds > 86400 then
    raise exception 'INVALID_RATE_LIMIT_WINDOW';
  end if;

  v_window := to_timestamp(floor(extract(epoch from v_now) / p_window_seconds) * p_window_seconds);

  insert into private.powerfit_rate_limits(bucket_key, window_started_at, request_count, updated_at)
  values (p_bucket_key, v_window, 1, v_now)
  on conflict (bucket_key, window_started_at)
  do update set
    request_count = private.powerfit_rate_limits.request_count + 1,
    updated_at = excluded.updated_at
  returning request_count into v_count;

  if random() < 0.01 then
    delete from private.powerfit_rate_limits
    where updated_at < v_now - interval '2 days';
  end if;

  v_retry_after := greatest(1, p_window_seconds - mod(floor(extract(epoch from v_now))::integer, p_window_seconds));

  return jsonb_build_object(
    'allowed', v_count <= p_limit,
    'count', v_count,
    'limit', p_limit,
    'retry_after_seconds', v_retry_after
  );
end;
$$;

revoke all on function public.server_consume_powerfit_rate_limit(text, integer, integer) from public, anon, authenticated;
grant execute on function public.server_consume_powerfit_rate_limit(text, integer, integer) to service_role;
