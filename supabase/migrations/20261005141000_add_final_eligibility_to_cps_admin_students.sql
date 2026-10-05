create or replace function public.get_powerfit_cps_admin_students_secure()
returns jsonb
language plpgsql
security definer
stable
set search_path to 'public','auth'
as $$
begin
  if auth.uid() is null or not public.cps_is_admin() then
    raise exception 'ADMIN_REQUIRED' using errcode='42501';
  end if;

  return (
    select coalesce(jsonb_agg(jsonb_build_object(
      'alumno_id',a.id,
      'nombre',a.nombre,
      'email',a.email,
      'estado_pago',a.estado_pago,
      'fecha_vencimiento',a.fecha_vencimiento,
      'routes',routes.routes,
      'unlocked_tomos',coalesce(access.unlocked_tomos,0)
    ) order by a.nombre),'[]'::jsonb)
    from public.alumnos a
    join lateral (
      select jsonb_agg(
        jsonb_build_object(
          'route_code',e.route_code,
          'status',e.status,
          'stage_order',e.current_stage_order,
          'stage_label',s.label,
          'progress',public.get_powerfit_cps_route_progress_secure(a.id,e.route_code),
          'eligibility',public.get_powerfit_final_exam_eligibility_secure(a.id,e.route_code)
        ) order by e.route_code
      ) as routes
      from public.cps_student_enrollments e
      join public.cps_stages s
        on s.route_code=e.route_code and s.stage_order=e.current_stage_order
      where e.alumno_id=a.id and e.status='ACTIVE'
    ) routes on routes.routes is not null
    left join lateral (
      select count(*)::int as unlocked_tomos
      from public.cps_tomo_access ta
      where ta.alumno_id=a.id
        and ta.status in ('UNLOCKED','IN_PROGRESS','CARDS_COMPLETE','TOMO_TEST_ELIGIBLE','TOMO_TEST_PASSED','TOMO_COMPLETED')
    ) access on true
  );
end;
$$;
