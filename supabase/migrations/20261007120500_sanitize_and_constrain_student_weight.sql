update public.alumnos
set peso = null
where peso is not null and not (peso between 20 and 350);

alter table public.alumnos
  add constraint alumnos_peso_plausible_check
  check (peso is null or peso between 20 and 350);
