drop policy if exists powerfit_visual_profile_changes_read on public.powerfit_visual_profile_changes;

create policy powerfit_visual_profile_changes_read
on public.powerfit_visual_profile_changes
for select
to authenticated
using (
  public.is_powerfit_admin()
  or exists (
    select 1
    from public.alumnos a
    where a.id = powerfit_visual_profile_changes.alumno_id
      and a.user_id = (select auth.uid())
  )
);
