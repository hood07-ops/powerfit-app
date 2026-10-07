update public.alumnos
set altura = round(altura * 100, 1)
where altura between 1 and 2.5;

comment on column public.alumnos.altura is
  'Height in centimeters. Legacy meter values were normalized to centimeters on 2026-10-07.';
