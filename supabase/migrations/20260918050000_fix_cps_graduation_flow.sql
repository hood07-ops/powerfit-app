-- Harden CPS academic closing operations and keep tomo access in sync with test outcomes.
-- RLS remains enabled. Direct INSERT on cps_tomo_access remains unavailable to authenticated users.

alter function public.finalize_powerfit_tomo_test_secure(bigint,text,smallint,text,smallint,smallint,boolean,text) security definer;
alter function public.get_powerfit_final_exam_eligibility_secure(bigint,text) security definer;
alter function public.create_powerfit_final_exam_secure(bigint,text) security definer;
alter function public.score_powerfit_final_exam_secure(bigint,jsonb,boolean,boolean,text) security definer;
alter function public.promote_powerfit_combat_stage_secure(bigint,text) security definer;

revoke all on function public.finalize_powerfit_tomo_test_secure(bigint,text,smallint,text,smallint,smallint,boolean,text) from public, anon;
revoke all on function public.get_powerfit_final_exam_eligibility_secure(bigint,text) from public, anon;
revoke all on function public.create_powerfit_final_exam_secure(bigint,text) from public, anon;
revoke all on function public.score_powerfit_final_exam_secure(bigint,jsonb,boolean,boolean,text) from public, anon;
revoke all on function public.promote_powerfit_combat_stage_secure(bigint,text) from public, anon;

grant execute on function public.finalize_powerfit_tomo_test_secure(bigint,text,smallint,text,smallint,smallint,boolean,text) to authenticated, service_role;
grant execute on function public.get_powerfit_final_exam_eligibility_secure(bigint,text) to authenticated, service_role;
grant execute on function public.create_powerfit_final_exam_secure(bigint,text) to authenticated, service_role;
grant execute on function public.score_powerfit_final_exam_secure(bigint,jsonb,boolean,boolean,text) to authenticated, service_role;
grant execute on function public.promote_powerfit_combat_stage_secure(bigint,text) to authenticated, service_role;

create or replace function public.cps_sync_tomo_access_after_test()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.cps_tomo_access
  set status = case
      when new.status = 'PASSED' then 'TOMO_COMPLETED'
      when new.status = 'FAILED'
           and status in ('CARDS_COMPLETE','TOMO_TEST_ELIGIBLE','TOMO_TEST_PASSED','TOMO_COMPLETED')
        then 'TOMO_TEST_ELIGIBLE'
      else status
    end,
    updated_at = now()
  where alumno_id = new.alumno_id
    and route_code = new.route_code
    and tomo_no = new.tomo_no;

  return new;
end;
$$;

revoke all on function public.cps_sync_tomo_access_after_test() from public, anon, authenticated;
grant execute on function public.cps_sync_tomo_access_after_test() to postgres, service_role;

drop trigger if exists trg_cps_sync_tomo_access_after_test on public.cps_tomo_tests;
create trigger trg_cps_sync_tomo_access_after_test
after insert or update of status on public.cps_tomo_tests
for each row
execute function public.cps_sync_tomo_access_after_test();
