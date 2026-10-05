create index if not exists cps_promotions_student_route_stage_date_idx
on public.cps_promotions(alumno_id,route_code,new_stage_order,promoted_at desc);
