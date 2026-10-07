create or replace function public.get_powerfit_cps_certificate_secure(
  p_certificate_code text
) returns jsonb
language plpgsql
security definer
stable
set search_path to 'public','auth'
as $$
declare
  v_self bigint := public.cps_current_alumno_id();
  v_cert public.cps_certificates%rowtype;
  v_student_name text;
  v_stage_label text;
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED' using errcode='42501'; end if;

  select c.* into v_cert
  from public.cps_certificates c
  where c.certificate_code=trim(coalesce(p_certificate_code,''))
  limit 1;

  if not found then raise exception 'CERTIFICATE_NOT_FOUND' using errcode='22023'; end if;

  if not (v_cert.alumno_id=v_self or public.cps_is_admin() or public.cps_can_coach_student(v_cert.alumno_id)) then
    raise exception 'FORBIDDEN' using errcode='42501';
  end if;

  select a.nombre into v_student_name from public.alumnos a where a.id=v_cert.alumno_id;
  select s.label into v_stage_label from public.cps_stages s
  where s.route_code=v_cert.route_code and s.stage_order=v_cert.stage_order;

  return jsonb_build_object(
    'id',v_cert.id,'alumno_id',v_cert.alumno_id,'student_name',v_student_name,
    'route_code',v_cert.route_code,'stage_order',v_cert.stage_order,'stage_label',v_stage_label,
    'certificate_code',v_cert.certificate_code,'title',v_cert.title,'final_score',v_cert.final_score,
    'issued_at',v_cert.issued_at,'promotion_id',v_cert.promotion_id
  );
end;
$$;

revoke all on function public.get_powerfit_cps_certificate_secure(text) from public, anon;
grant execute on function public.get_powerfit_cps_certificate_secure(text) to authenticated;

create unique index if not exists cps_certificates_code_unique_idx
  on public.cps_certificates(certificate_code);
