revoke execute on function public.register_powerfit_tomo_payment_secure(text, bigint, text, smallint, integer, date) from public;
revoke execute on function public.register_powerfit_tomo_payment_secure(text, bigint, text, smallint, integer, date) from anon;
revoke execute on function public.register_powerfit_tomo_payment_secure(text, bigint, text, smallint, integer, date) from authenticated;
grant execute on function public.register_powerfit_tomo_payment_secure(text, bigint, text, smallint, integer, date) to service_role;

drop policy if exists cps_exam_items_admin_all on public.cps_exam_items;
drop policy if exists cps_exam_items_admin_insert on public.cps_exam_items;
drop policy if exists cps_exam_items_admin_update on public.cps_exam_items;
drop policy if exists cps_exam_items_admin_delete on public.cps_exam_items;
create policy cps_exam_items_admin_insert on public.cps_exam_items
for insert to authenticated
with check (public.cps_is_admin());
create policy cps_exam_items_admin_update on public.cps_exam_items
for update to authenticated
using (public.cps_is_admin())
with check (public.cps_is_admin());
create policy cps_exam_items_admin_delete on public.cps_exam_items
for delete to authenticated
using (public.cps_is_admin());

drop policy if exists cps_enrollments_admin_write on public.cps_student_enrollments;
drop policy if exists cps_enrollments_admin_insert on public.cps_student_enrollments;
drop policy if exists cps_enrollments_admin_update on public.cps_student_enrollments;
drop policy if exists cps_enrollments_admin_delete on public.cps_student_enrollments;
create policy cps_enrollments_admin_insert on public.cps_student_enrollments
for insert to authenticated
with check (public.cps_is_admin());
create policy cps_enrollments_admin_update on public.cps_student_enrollments
for update to authenticated
using (public.cps_is_admin())
with check (public.cps_is_admin());
create policy cps_enrollments_admin_delete on public.cps_student_enrollments
for delete to authenticated
using (public.cps_is_admin());

drop policy if exists cps_coach_assignments_admin_write on public.cps_coach_assignments;
drop policy if exists cps_coach_assignments_admin_insert on public.cps_coach_assignments;
drop policy if exists cps_coach_assignments_admin_update on public.cps_coach_assignments;
drop policy if exists cps_coach_assignments_admin_delete on public.cps_coach_assignments;
create policy cps_coach_assignments_admin_insert on public.cps_coach_assignments
for insert to authenticated
with check (public.cps_is_admin());
create policy cps_coach_assignments_admin_update on public.cps_coach_assignments
for update to authenticated
using (public.cps_is_admin())
with check (public.cps_is_admin());
create policy cps_coach_assignments_admin_delete on public.cps_coach_assignments
for delete to authenticated
using (public.cps_is_admin());
