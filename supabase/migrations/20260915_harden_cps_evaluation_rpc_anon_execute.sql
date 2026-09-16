-- Security hardening: CPS evaluation RPCs require an authenticated session.
-- Revoke PUBLIC as well because PostgreSQL can otherwise keep effective EXECUTE
-- through the PUBLIC role even after revoking it directly from anon.
-- The functions keep their existing internal role/ownership checks.

revoke execute on function public.submit_powerfit_card_video_secure(text,bigint,text,text) from public;
revoke execute on function public.review_powerfit_card_video_secure(bigint,text,text,jsonb,boolean) from public;
revoke execute on function public.save_powerfit_live_assessment_secure(bigint,text,bigint,text,jsonb,boolean,text) from public;

revoke execute on function public.submit_powerfit_card_video_secure(text,bigint,text,text) from anon;
revoke execute on function public.review_powerfit_card_video_secure(bigint,text,text,jsonb,boolean) from anon;
revoke execute on function public.save_powerfit_live_assessment_secure(bigint,text,bigint,text,jsonb,boolean,text) from anon;

grant execute on function public.submit_powerfit_card_video_secure(text,bigint,text,text) to authenticated;
grant execute on function public.review_powerfit_card_video_secure(bigint,text,text,jsonb,boolean) to authenticated;
grant execute on function public.save_powerfit_live_assessment_secure(bigint,text,bigint,text,jsonb,boolean,text) to authenticated;
