create or replace function public.get_powerfit_cps_certificates_secure(
  p_alumno_id bigint
) returns jsonb
language plpgsql
security definer
stable
set search_path to 'public','auth'
as $$
declare
  v_self bigint := public.cps_current_alumno_id();
  v_rows jsonb;
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED' using errcode='42501'; end if;
  if not (p_alumno_id=v_self or public.cps_is_admin() or public.cps_can_coach_student(p_alumno_id)) then
    raise exception 'FORBIDDEN' using errcode='42501';
  end if;

  select coalesce(jsonb_agg(jsonb_build_object(
    'id',c.id,'route_code',c.route_code,'stage_order',c.stage_order,'stage_label',s.label,
    'certificate_code',c.certificate_code,'title',c.title,'final_score',c.final_score,
    'issued_at',c.issued_at,'promotion_id',c.promotion_id
  ) order by c.issued_at desc,c.id desc),'[]'::jsonb)
  into v_rows
  from public.cps_certificates c
  left join public.cps_stages s on s.route_code=c.route_code and s.stage_order=c.stage_order
  where c.alumno_id=p_alumno_id;

  return v_rows;
end;
$$;

revoke all on function public.get_powerfit_cps_certificates_secure(bigint) from public, anon;
grant execute on function public.get_powerfit_cps_certificates_secure(bigint) to authenticated;

create index if not exists cps_certificates_student_issued_idx
  on public.cps_certificates(alumno_id,issued_at desc,id desc);
