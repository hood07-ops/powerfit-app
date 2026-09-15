-- PowerFit 360 CPS Graduation System v1
-- Additive schema only. Do not edit prior migrations.

create table if not exists public.cps_routes (
  code text primary key,
  name text not null,
  display_order smallint not null unique,
  uses_belts boolean not null default false,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint cps_routes_code_check check (code in ('BOXING','KICKBOXING'))
);

create table if not exists public.cps_stages (
  id bigserial primary key,
  route_code text not null references public.cps_routes(code) on delete restrict,
  stage_order smallint not null,
  label text not null,
  minimum_months smallint not null,
  minimum_exam_score smallint not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique(route_code, stage_order),
  constraint cps_stages_stage_order_check check (stage_order between 1 and 7),
  constraint cps_stages_minimum_months_check check (minimum_months > 0),
  constraint cps_stages_minimum_exam_score_check check (minimum_exam_score between 0 and 100)
);

create table if not exists public.cps_tomos (
  tomo_no smallint primary key,
  title text not null,
  school_price_clp integer not null default 5000,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint cps_tomos_tomo_no_check check (tomo_no between 1 and 12),
  constraint cps_tomos_price_check check (school_price_clp > 0)
);

create table if not exists public.cps_stage_tomos (
  route_code text not null references public.cps_routes(code) on delete cascade,
  stage_order smallint not null,
  tomo_no smallint not null references public.cps_tomos(tomo_no) on delete restrict,
  required boolean not null default true,
  created_at timestamptz not null default now(),
  primary key(route_code, stage_order, tomo_no),
  foreign key(route_code, stage_order) references public.cps_stages(route_code, stage_order) on delete cascade
);

create table if not exists public.cps_student_enrollments (
  id bigserial primary key,
  alumno_id bigint not null references public.alumnos(id) on delete cascade,
  route_code text not null references public.cps_routes(code) on delete restrict,
  current_stage_order smallint not null default 1,
  status text not null default 'ACTIVE',
  enrolled_at date not null default current_date,
  paused_at timestamptz,
  reactivated_at timestamptz,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(alumno_id, route_code),
  foreign key(route_code, current_stage_order) references public.cps_stages(route_code, stage_order),
  constraint cps_enrollments_status_check check (status in ('ACTIVE','PAUSED','COMPLETED','WITHDRAWN'))
);

create table if not exists public.cps_coach_assignments (
  id bigserial primary key,
  coach_alumno_id bigint not null references public.alumnos(id) on delete cascade,
  student_alumno_id bigint not null references public.alumnos(id) on delete cascade,
  active boolean not null default true,
  created_by uuid,
  created_at timestamptz not null default now(),
  unique(coach_alumno_id, student_alumno_id),
  constraint cps_coach_assignment_not_self check (coach_alumno_id <> student_alumno_id)
);

create table if not exists public.cps_tomo_access (
  id bigserial primary key,
  alumno_id bigint not null references public.alumnos(id) on delete cascade,
  route_code text not null references public.cps_routes(code) on delete restrict,
  tomo_no smallint not null references public.cps_tomos(tomo_no) on delete restrict,
  status text not null default 'LOCKED',
  source text not null default 'manual',
  amount_clp integer,
  external_provider text,
  external_payment_id text,
  granted_by uuid,
  granted_reason text,
  unlocked_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(alumno_id, route_code, tomo_no),
  unique(external_provider, external_payment_id),
  constraint cps_tomo_access_status_check check (status in ('LOCKED','PAYMENT_PENDING','UNLOCKED','IN_PROGRESS','CARDS_COMPLETE','TOMO_TEST_ELIGIBLE','TOMO_TEST_PASSED','TOMO_COMPLETED')),
  constraint cps_tomo_access_source_check check (source in ('manual','mercadopago','admin_grant','legacy_import')),
  constraint cps_tomo_access_manual_reason_check check (source <> 'admin_grant' or nullif(trim(coalesce(granted_reason,'')),'') is not null)
);

create table if not exists public.cps_cards (
  id bigserial primary key,
  code text not null unique,
  path_code text not null,
  level_order smallint not null,
  tomo_no smallint not null references public.cps_tomos(tomo_no) on delete restrict,
  name text not null,
  category text not null,
  objective text not null default '',
  explanation text not null default '',
  steps text[] not null default '{}',
  common_errors text[] not null default '{}',
  critical_errors text[] not null default '{}',
  corrections text[] not null default '{}',
  drill text not null default '',
  repetitions text not null default '',
  demo_video_url text,
  video_required boolean not null default true,
  live_required boolean not null default true,
  critical boolean not null default false,
  display_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint cps_cards_path_code_check check (path_code in ('BOTH','BOXING','KICKBOXING'))
);

create table if not exists public.cps_card_progress (
  id bigserial primary key,
  alumno_id bigint not null references public.alumnos(id) on delete cascade,
  route_code text not null references public.cps_routes(code) on delete restrict,
  card_id bigint not null references public.cps_cards(id) on delete cascade,
  status text not null default 'AVAILABLE',
  video_status text,
  live_status text,
  last_video_submission_id bigint,
  last_live_assessment_id bigint,
  critical_fail_open boolean not null default false,
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  unique(alumno_id, route_code, card_id),
  constraint cps_card_progress_status_check check (status in ('LOCKED','AVAILABLE','LEARNING','VIDEO_REQUIRED','VIDEO_SUBMITTED','VIDEO_UNDER_REVIEW','VIDEO_CORRECTION_REQUIRED','VIDEO_APPROVED','LIVE_PENDING','LIVE_CORRECTION_REQUIRED','LIVE_APPROVED','COMPLETED'))
);

create table if not exists public.cps_video_submissions (
  id bigserial primary key,
  alumno_id bigint not null references public.alumnos(id) on delete cascade,
  route_code text not null references public.cps_routes(code) on delete restrict,
  card_id bigint not null references public.cps_cards(id) on delete cascade,
  attempt_no integer not null,
  storage_path text not null,
  original_filename text,
  status text not null default 'VIDEO_SUBMITTED',
  submitted_by uuid not null,
  created_at timestamptz not null default now(),
  unique(alumno_id, route_code, card_id, attempt_no),
  constraint cps_video_submission_status_check check (status in ('VIDEO_SUBMITTED','VIDEO_UNDER_REVIEW','VIDEO_CORRECTION_REQUIRED','VIDEO_APPROVED','ARCHIVED'))
);

create table if not exists public.cps_video_reviews (
  id bigserial primary key,
  submission_id bigint not null references public.cps_video_submissions(id) on delete cascade,
  reviewer_id uuid not null,
  reviewer_alumno_id bigint references public.alumnos(id) on delete set null,
  guard_score smallint not null default 0,
  base_score smallint not null default 0,
  mechanics_score smallint not null default 0,
  kinetic_chain_score smallint not null default 0,
  coordination_score smallint not null default 0,
  recovery_score smallint not null default 0,
  control_score smallint not null default 0,
  complete_execution_score smallint not null default 0,
  total_score smallint generated always as (guard_score + base_score + mechanics_score + kinetic_chain_score + coordination_score + recovery_score + control_score + complete_execution_score) stored,
  critical_fail boolean not null default false,
  decision text not null,
  feedback text not null,
  reviewed_at timestamptz not null default now(),
  constraint cps_video_reviews_decision_check check (decision in ('CORRECTION_REQUIRED','APPROVED')),
  constraint cps_video_scores_check check (
    guard_score between 0 and 20 and base_score between 0 and 15 and mechanics_score between 0 and 15 and
    kinetic_chain_score between 0 and 15 and coordination_score between 0 and 10 and recovery_score between 0 and 10 and
    control_score between 0 and 10 and complete_execution_score between 0 and 5
  )
);

create table if not exists public.cps_live_assessments (
  id bigserial primary key,
  alumno_id bigint not null references public.alumnos(id) on delete cascade,
  route_code text not null references public.cps_routes(code) on delete restrict,
  card_id bigint not null references public.cps_cards(id) on delete cascade,
  attempt_no integer not null,
  assessor_id uuid not null,
  reproduce_score smallint not null default 0,
  guard_score smallint not null default 0,
  base_score smallint not null default 0,
  correction_score smallint not null default 0,
  speed_score smallint not null default 0,
  movement_score smallint not null default 0,
  combination_score smallint not null default 0,
  partner_score smallint not null default 0,
  safety_score smallint not null default 0,
  total_score smallint generated always as (reproduce_score + guard_score + base_score + correction_score + speed_score + movement_score + combination_score + partner_score + safety_score) stored,
  critical_fail boolean not null default false,
  decision text not null,
  notes text,
  assessed_at timestamptz not null default now(),
  unique(alumno_id, route_code, card_id, attempt_no),
  constraint cps_live_decision_check check (decision in ('CORRECTION_REQUIRED','APPROVED')),
  constraint cps_live_scores_check check (
    reproduce_score between 0 and 15 and guard_score between 0 and 15 and base_score between 0 and 15 and
    correction_score between 0 and 10 and speed_score between 0 and 10 and movement_score between 0 and 10 and
    combination_score between 0 and 10 and partner_score between 0 and 10 and safety_score between 0 and 5
  )
);

create table if not exists public.cps_tomo_tests (
  id bigserial primary key,
  alumno_id bigint not null references public.alumnos(id) on delete cascade,
  route_code text not null references public.cps_routes(code) on delete restrict,
  tomo_no smallint not null references public.cps_tomos(tomo_no) on delete restrict,
  status text not null default 'NOT_ELIGIBLE',
  theory_score smallint,
  practical_score smallint,
  critical_fail boolean not null default false,
  coach_id uuid,
  notes text,
  scheduled_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  constraint cps_tomo_test_status_check check (status in ('NOT_ELIGIBLE','ELIGIBLE','SCHEDULED','IN_PROGRESS','FAILED','PASSED'))
);

create table if not exists public.cps_final_exams (
  id bigserial primary key,
  alumno_id bigint not null references public.alumnos(id) on delete cascade,
  route_code text not null references public.cps_routes(code) on delete restrict,
  stage_order smallint not null,
  status text not null default 'SCHEDULED',
  technique_score numeric(5,2) not null default 0,
  defense_score numeric(5,2) not null default 0,
  combinations_score numeric(5,2) not null default 0,
  tactics_score numeric(5,2) not null default 0,
  application_score numeric(5,2) not null default 0,
  physical_score numeric(5,2) not null default 0,
  theory_score numeric(5,2) not null default 0,
  final_score numeric(5,2) generated always as (
    technique_score * 0.30 + defense_score * 0.15 + combinations_score * 0.15 + tactics_score * 0.10 +
    application_score * 0.10 + physical_score * 0.10 + theory_score * 0.10
  ) stored,
  critical_fail boolean not null default false,
  coach_approved boolean not null default false,
  examiner_id uuid,
  notes text,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  constraint cps_final_exam_status_check check (status in ('SCHEDULED','IN_PROGRESS','FAILED','PASSED','COACH_APPROVAL_PENDING','PROMOTION_READY'))
);

create table if not exists public.cps_exam_items (
  id bigserial primary key,
  tomo_no smallint references public.cps_tomos(tomo_no) on delete cascade,
  route_code text references public.cps_routes(code) on delete cascade,
  question_type text not null,
  prompt text not null,
  expected_answer text,
  options jsonb not null default '[]'::jsonb,
  active boolean not null default true,
  created_by uuid,
  created_at timestamptz not null default now(),
  constraint cps_exam_items_question_type_check check (question_type in ('multiple_choice','true_false','short_answer','oral'))
);

create table if not exists public.cps_promotions (
  id bigserial primary key,
  alumno_id bigint not null references public.alumnos(id) on delete cascade,
  route_code text not null references public.cps_routes(code) on delete restrict,
  previous_stage_order smallint not null,
  new_stage_order smallint not null,
  final_exam_id bigint not null references public.cps_final_exams(id) on delete restrict,
  final_score numeric(5,2) not null,
  coach_id uuid not null,
  observations text,
  certificate_id bigint,
  promoted_at timestamptz not null default now(),
  unique(final_exam_id),
  constraint cps_promotions_stage_check check (new_stage_order = previous_stage_order + 1)
);

create table if not exists public.cps_certificates (
  id bigserial primary key,
  alumno_id bigint not null references public.alumnos(id) on delete cascade,
  route_code text not null references public.cps_routes(code) on delete restrict,
  stage_order smallint not null,
  certificate_code text not null unique,
  title text not null,
  final_score numeric(5,2) not null,
  coach_id uuid not null,
  promotion_id bigint unique references public.cps_promotions(id) on delete restrict,
  issued_at timestamptz not null default now()
);

alter table public.cps_promotions
  drop constraint if exists cps_promotions_certificate_fk;
alter table public.cps_promotions
  add constraint cps_promotions_certificate_fk foreign key (certificate_id) references public.cps_certificates(id);

create table if not exists public.cps_audit_log (
  id bigserial primary key,
  actor_id uuid,
  action text not null,
  entity_table text not null,
  entity_id text,
  before_data jsonb,
  after_data jsonb,
  reason text,
  created_at timestamptz not null default now()
);

create or replace function public.cps_current_alumno_id()
returns bigint
language sql
stable
security invoker
set search_path = public
as $$
  select id from public.alumnos where user_id = (select auth.uid()) limit 1
$$;

create or replace function public.cps_is_admin()
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
  select coalesce(public.is_powerfit_admin(), false)
$$;

create or replace function public.cps_can_coach_student(p_alumno_id bigint)
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
  select exists (
    select 1
    from public.cps_coach_assignments ca
    join public.alumnos coach on coach.id = ca.coach_alumno_id
    where ca.student_alumno_id = p_alumno_id
      and ca.active = true
      and coach.user_id = (select auth.uid())
  )
$$;

create or replace function public.cps_can_read_student(p_alumno_id bigint)
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
  select
    public.cps_is_admin()
    or p_alumno_id = public.cps_current_alumno_id()
    or public.cps_can_coach_student(p_alumno_id)
$$;

alter table public.cps_routes enable row level security;
alter table public.cps_stages enable row level security;
alter table public.cps_tomos enable row level security;
alter table public.cps_stage_tomos enable row level security;
alter table public.cps_student_enrollments enable row level security;
alter table public.cps_coach_assignments enable row level security;
alter table public.cps_tomo_access enable row level security;
alter table public.cps_cards enable row level security;
alter table public.cps_card_progress enable row level security;
alter table public.cps_video_submissions enable row level security;
alter table public.cps_video_reviews enable row level security;
alter table public.cps_live_assessments enable row level security;
alter table public.cps_tomo_tests enable row level security;
alter table public.cps_final_exams enable row level security;
alter table public.cps_exam_items enable row level security;
alter table public.cps_promotions enable row level security;
alter table public.cps_certificates enable row level security;
alter table public.cps_audit_log enable row level security;

drop policy if exists cps_catalog_read on public.cps_routes;
create policy cps_catalog_read on public.cps_routes for select to authenticated using (true);
drop policy if exists cps_stages_read on public.cps_stages;
create policy cps_stages_read on public.cps_stages for select to authenticated using (true);
drop policy if exists cps_tomos_read on public.cps_tomos;
create policy cps_tomos_read on public.cps_tomos for select to authenticated using (true);
drop policy if exists cps_stage_tomos_read on public.cps_stage_tomos;
create policy cps_stage_tomos_read on public.cps_stage_tomos for select to authenticated using (true);
drop policy if exists cps_cards_read on public.cps_cards;
create policy cps_cards_read on public.cps_cards for select to authenticated using (true);
drop policy if exists cps_exam_items_admin_all on public.cps_exam_items;
create policy cps_exam_items_admin_all on public.cps_exam_items for all to authenticated using (public.cps_is_admin()) with check (public.cps_is_admin());
drop policy if exists cps_exam_items_read on public.cps_exam_items;
create policy cps_exam_items_read on public.cps_exam_items for select to authenticated using (active = true);

drop policy if exists cps_enrollments_read on public.cps_student_enrollments;
create policy cps_enrollments_read on public.cps_student_enrollments for select to authenticated using (public.cps_can_read_student(alumno_id));
drop policy if exists cps_enrollments_admin_write on public.cps_student_enrollments;
create policy cps_enrollments_admin_write on public.cps_student_enrollments for all to authenticated using (public.cps_is_admin()) with check (public.cps_is_admin());
drop policy if exists cps_coach_assignments_read on public.cps_coach_assignments;
create policy cps_coach_assignments_read on public.cps_coach_assignments for select to authenticated using (
  public.cps_is_admin()
  or coach_alumno_id = public.cps_current_alumno_id()
  or student_alumno_id = public.cps_current_alumno_id()
);
drop policy if exists cps_coach_assignments_admin_write on public.cps_coach_assignments;
create policy cps_coach_assignments_admin_write on public.cps_coach_assignments for all to authenticated using (public.cps_is_admin()) with check (public.cps_is_admin());

drop policy if exists cps_tomo_access_read on public.cps_tomo_access;
create policy cps_tomo_access_read on public.cps_tomo_access for select to authenticated using (public.cps_can_read_student(alumno_id));
drop policy if exists cps_card_progress_read on public.cps_card_progress;
create policy cps_card_progress_read on public.cps_card_progress for select to authenticated using (public.cps_can_read_student(alumno_id));
drop policy if exists cps_video_submissions_read on public.cps_video_submissions;
create policy cps_video_submissions_read on public.cps_video_submissions for select to authenticated using (public.cps_can_read_student(alumno_id));
drop policy if exists cps_video_reviews_read on public.cps_video_reviews;
create policy cps_video_reviews_read on public.cps_video_reviews for select to authenticated using (
  exists (select 1 from public.cps_video_submissions s where s.id = submission_id and public.cps_can_read_student(s.alumno_id))
);
drop policy if exists cps_live_assessments_read on public.cps_live_assessments;
create policy cps_live_assessments_read on public.cps_live_assessments for select to authenticated using (public.cps_can_read_student(alumno_id));
drop policy if exists cps_tomo_tests_read on public.cps_tomo_tests;
create policy cps_tomo_tests_read on public.cps_tomo_tests for select to authenticated using (public.cps_can_read_student(alumno_id));
drop policy if exists cps_final_exams_read on public.cps_final_exams;
create policy cps_final_exams_read on public.cps_final_exams for select to authenticated using (public.cps_can_read_student(alumno_id));
drop policy if exists cps_promotions_read on public.cps_promotions;
create policy cps_promotions_read on public.cps_promotions for select to authenticated using (public.cps_can_read_student(alumno_id));
drop policy if exists cps_certificates_read on public.cps_certificates;
create policy cps_certificates_read on public.cps_certificates for select to authenticated using (public.cps_can_read_student(alumno_id));
drop policy if exists cps_audit_admin_read on public.cps_audit_log;
create policy cps_audit_admin_read on public.cps_audit_log for select to authenticated using (public.cps_is_admin());

grant select on public.cps_routes, public.cps_stages, public.cps_tomos, public.cps_stage_tomos, public.cps_cards, public.cps_exam_items to authenticated;
grant select on public.cps_student_enrollments, public.cps_coach_assignments, public.cps_tomo_access, public.cps_card_progress, public.cps_video_submissions, public.cps_video_reviews, public.cps_live_assessments, public.cps_tomo_tests, public.cps_final_exams, public.cps_promotions, public.cps_certificates, public.cps_audit_log to authenticated;

insert into public.cps_routes(code, name, display_order, uses_belts) values
  ('BOXING','Boxeo',1,false),
  ('KICKBOXING','Kickboxing',2,true)
on conflict (code) do update set name=excluded.name, display_order=excluded.display_order, uses_belts=excluded.uses_belts;

insert into public.cps_stages(route_code, stage_order, label, minimum_months, minimum_exam_score) values
  ('BOXING',1,'Boxeo Nivel 1',4,75),('BOXING',2,'Boxeo Nivel 2',4,75),('BOXING',3,'Boxeo Nivel 3',5,78),
  ('BOXING',4,'Boxeo Nivel 4',6,80),('BOXING',5,'Boxeo Nivel 5',7,82),('BOXING',6,'Boxeo Nivel 6',8,85),('BOXING',7,'Boxeo Nivel 7',8,85),
  ('KICKBOXING',1,'Blanco',4,75),('KICKBOXING',2,'Naranjo',4,75),('KICKBOXING',3,'Verde',5,78),
  ('KICKBOXING',4,'Azul',6,80),('KICKBOXING',5,'Café',7,82),('KICKBOXING',6,'Café-Negro',8,85),('KICKBOXING',7,'Negro',8,85)
on conflict (route_code, stage_order) do update set label=excluded.label, minimum_months=excluded.minimum_months, minimum_exam_score=excluded.minimum_exam_score;

insert into public.cps_tomos(tomo_no, title, school_price_clp) values
  (1,'Fundamentos del Peleador',5000),(2,'Técnica de Golpes',5000),(3,'Defensa y Movimiento',5000),(4,'Táctica y Estrategia',5000),
  (5,'Kickboxing y K1',5000),(6,'Fuerza y Potencia',5000),(7,'Resistencia y Conditioning',5000),(8,'Recuperación y Nutrición',5000),
  (9,'Preparación Mental',5000),(10,'Planificación del Entrenamiento',5000),(11,'Combate y Competencia',5000),(12,'Análisis Técnico y Video',5000)
on conflict (tomo_no) do update set title=excluded.title, school_price_clp=excluded.school_price_clp;

insert into public.cps_stage_tomos(route_code, stage_order, tomo_no) values
  ('BOXING',1,1),('BOXING',2,2),('BOXING',3,3),('BOXING',4,4),('BOXING',5,6),('BOXING',5,7),('BOXING',6,8),('BOXING',6,9),('BOXING',6,10),('BOXING',7,11),('BOXING',7,12),
  ('KICKBOXING',1,1),('KICKBOXING',2,2),('KICKBOXING',2,5),('KICKBOXING',3,3),('KICKBOXING',3,5),('KICKBOXING',4,4),('KICKBOXING',4,5),
  ('KICKBOXING',5,6),('KICKBOXING',5,7),('KICKBOXING',6,8),('KICKBOXING',6,9),('KICKBOXING',6,10),('KICKBOXING',7,11),('KICKBOXING',7,12)
on conflict do nothing;

insert into public.cps_cards(code,path_code,level_order,tomo_no,name,category,objective,explanation,steps,common_errors,critical_errors,corrections,drill,repetitions,video_required,live_required,critical,display_order) values
  ('CPS-T01-GUARD','BOTH',1,1,'Guardia funcional','fundamento','Protegerse sin perder visión ni salida.','Base defensiva para boxeo y kickboxing.',array['Mentón abajo','Manos activas','Codos protegen línea media'],array['Manos bajas','Mirada al piso'],array['Bajar protección en tarjeta crítica'],array['Trabajo frente al espejo'], '3 rounds técnicos', '3x1 minuto', true,true,true,10),
  ('CPS-T01-BASE','BOTH',1,1,'Base y postura','fundamento','Sostener equilibrio y capacidad de atacar/defender.','Postura estable, atlética y móvil.',array['Pies al ancho correcto','Peso repartido','Rodillas flexibles'],array['Cruzar pies','Quedar plano'],array['Perder equilibrio'],array['Step and hold'], '3x10 desplazamientos', '3 series', true,true,true,20),
  ('CPS-T01-FWD','BOTH',1,1,'Desplazamiento adelante','movimiento','Avanzar sin perder guardia.', 'Movimiento básico ofensivo.', array['Empuja con pierna trasera','Paso corto','Recupera base'], array['Juntar pies','Saltar demasiado'], array['Cruzar pies'], array['Línea marcada en el suelo'], '4x10 pasos', '4 series', true,true,true,30),
  ('CPS-T01-BACK','BOTH',1,1,'Desplazamiento atrás','movimiento','Retroceder con control.', 'Movimiento defensivo básico.', array['Sale pie trasero','Base constante','Guardia cerrada'], array['Levantar mentón','Quedar lineal'], array['Perder equilibrio'], array['Retroceso con pausa'], '4x10 pasos', '4 series', true,true,true,40),
  ('CPS-T01-LAT','BOTH',1,1,'Desplazamiento lateral','movimiento','Salir de la línea central.', 'Movimiento para ángulos.', array['Paso lateral corto','No cruzar pies','Recuperar base'], array['Arrastrar pies sin control','Abrir demasiado'], array['Cruzar pies'], array['Conos laterales'], '4x8 por lado', '4 series', true,true,true,50),
  ('CPS-T02-JAB','BOTH',1,2,'Jab','golpe','Puntuar, medir y preparar combinaciones.', 'Golpe recto principal de mano adelantada.', array['Sale directo','Hombro protege mentón','Vuelve a guardia'], array['Telegráfiar','No volver'], array['No recuperar guardia'], array['Jab con pared lateral'], '5x10', '5 series', true,true,true,60),
  ('CPS-T02-CROSS','BOTH',1,2,'Cross / recto de derecha','golpe','Golpear con cadena cinética completa.', 'Recto potente de mano retrasada.', array['Gira cadera','Pie acompaña','Vuelve a base'], array['Solo brazo','Caer hacia adelante'], array['Perder equilibrio'], array['Cross lento con pausa'], '5x8', '5 series', true,true,true,70),
  ('CPS-T02-12','BOTH',1,2,'Combinación 1-2','combinación','Integrar jab y cross con ritmo.', 'Primera combinación base.', array['Jab abre línea','Cross entra recto','Salir con guardia'], array['Pausar de más','Abrirse'], array['No recuperar guardia'], array['1-2 + paso atrás'], '5x6', '5 series', true,true,false,80),
  ('CPS-T02-LHOOK','BOTH',2,2,'Cruzado/Hook izquierdo','golpe','Golpear en arco con control.', 'Hook corto de mano izquierda.', array['Codo alineado','Rotación tronco','Base firme'], array['Brazo largo','Hombro bajo'], array['Superficie de impacto incorrecta'], array['Hook a escudo'], '4x8', '4 series', true,true,true,90),
  ('CPS-T02-RHOOK','BOTH',2,2,'Cruzado/Hook derecho','golpe','Golpear en arco con mano derecha.', 'Hook derecho con giro.', array['Giro de cadera','Codo estable','Retorno'], array['Telegrafiar','Pasarse de giro'], array['Perder equilibrio'], array['Hook controlado'], '4x8', '4 series', true,true,true,100),
  ('CPS-T02-LUP','BOTH',2,2,'Uppercut izquierdo','golpe','Atacar línea ascendente.', 'Upper corto desde base.', array['Piernas cargan','Trayectoria vertical','Vuelve a guardia'], array['Bajar mano previa','Extender demasiado'], array['Bajar protección'], array['Upper al saco bajo'], '4x8', '4 series', true,true,true,110),
  ('CPS-T02-RUP','BOTH',2,2,'Uppercut derecho','golpe','Atacar línea ascendente derecha.', 'Upper de mano retrasada.', array['Carga breve','Sube compacto','Recupera base'], array['Inclinarse','Abrir codo'], array['Perder equilibrio'], array['Upper con pausa'], '4x8', '4 series', true,true,true,120),
  ('CPS-T02-BODYR','BOTH',2,2,'Recto derecho al cuerpo','golpe','Cambiar altura de ataque.', 'Recto al cuerpo con salida segura.', array['Flexiona piernas','No baja mirada','Sale con guardia'], array['Agacharse sin defensa','Cabeza centrada'], array['Ejecución insegura'], array['Recto al cuerpo + salida'], '4x6', '4 series', true,true,true,130),
  ('CPS-T02-COMB3','BOTH',2,2,'Combinación de 3 golpes','combinación','Unir golpes sin perder estructura.', 'Trabajo de fluidez básica.', array['Orden claro','Respira','Salida final'], array['Forzar velocidad','Perder base'], array['No recuperar guardia'], array['Combinación lenta a rápida'], '5x5', '5 series', true,true,false,140),
  ('CPS-T03-PARRY','BOTH',3,3,'Parry','defensa','Desviar sin abrir la guardia.', 'Defensa activa contra rectos.', array['Movimiento corto','Ojos arriba','Contra disponible'], array['Manotear grande','Perder base'], array['Bajar protección'], array['Parry + jab'], '4x10', '4 series', true,true,true,150),
  ('CPS-T03-SLIP','BOTH',3,3,'Slip','defensa','Salir de la línea del golpe.', 'Movimiento de cabeza controlado.', array['Pequeña inclinación','Base firme','Vuelve al centro'], array['Agacharse demasiado','Mirar abajo'], array['Perder equilibrio'], array['Slip rope'], '4x10', '4 series', true,true,true,160),
  ('CPS-T03-BLOCK','BOTH',3,3,'Bloqueo','defensa','Absorber con estructura segura.', 'Bloqueo de golpes base.', array['Codo/mano en línea','Mentón protegido','Contra después'], array['Cerrar ojos','Abrirse'], array['Ejecución insegura'], array['Bloqueo + contra'], '4x8', '4 series', true,true,true,170),
  ('CPS-T03-DEFCOUNTER','BOTH',3,3,'Defensa + contraataque','aplicación','Responder después de defender.', 'Aplicación básica defensiva.', array['Defiende primero','Contra directo','Salida'], array['Contra sin defensa','Quedar en línea'], array['Ignorar orden de control'], array['Defensa + 1-2'], '5x5', '5 series', true,true,false,180),
  ('CPS-T04-DIST','BOTH',4,4,'Control de distancia','táctica','Entrar y salir de rango.', 'Lectura táctica base.', array['Mide con jab','Pies antes que manos','Sale por ángulo'], array['Quedarse estático','Forzar entrada'], array['Ejecución insegura'], array['Rango con compañero'], '4 rounds', '4x1 minuto', true,true,false,190),
  ('CPS-T04-RHYTHM','BOTH',4,4,'Cambio de ritmo','táctica','Variar velocidad sin perder técnica.', 'Ritmo táctico.', array['Lento-rápido-lento','Control respiración','No regalar patrón'], array['Acelerar sin técnica','Tensión alta'], array['Perder equilibrio'], array['Cadencia 2-1-3'], '4 rounds', '4x1 minuto', true,true,false,200),
  ('CPS-T04-ANGLE','BOTH',4,4,'Salida por ángulo','táctica','No salir recto después de atacar.', 'Ángulo defensivo/ofensivo.', array['Golpea','Paso lateral','Rearma guardia'], array['Cruzar pies','Mirar abajo'], array['Cruzar pies'], array['1-2 + ángulo'], '5x5', '5 series', true,true,false,210),
  ('CPS-T04-FEINT','BOTH',4,4,'Finta + ataque','táctica','Crear reacción antes de entrar.', 'Finta simple funcional.', array['Finta pequeña','Lee reacción','Ataca claro'], array['Finta exagerada','Sin intención'], array['Bajar protección'], array['Finta jab + cross'], '5x5', '5 series', true,true,false,220),
  ('CPS-T04-COUNTER','BOTH',4,4,'Contraataque táctico','táctica','Responder con selección.', 'Contra según acción rival.', array['Defensa','Contra','Salida'], array['Responder tarde','Quedarse mirando'], array['Ejecución insegura'], array['Parry + cross'], '5x5', '5 series', true,true,false,230),
  ('CPS-T05-LOWL','KICKBOXING',2,5,'Low kick izquierda','patada','Atacar pierna con control.', 'Low kick inicial.', array['Base estable','Cadera rota','Recupera guardia'], array['Patear con pie','Caer cruzado'], array['Superficie de impacto incorrecta'], array['Low kick a escudo'], '4x8', '4 series', true,true,true,240),
  ('CPS-T05-LOWR','KICKBOXING',2,5,'Low kick derecha','patada','Atacar pierna con pierna derecha.', 'Low kick con rotación.', array['Paso o pivote','Impacto controlado','Vuelve a base'], array['No girar cadera','Manos bajas'], array['Perder equilibrio'], array['Low kick derecha control'], '4x8', '4 series', true,true,true,250),
  ('CPS-T05-CHECK','KICKBOXING',2,5,'Check low kick','defensa','Defender low kick con seguridad.', 'Bloqueo de low kick.', array['Rodilla sube','Tibia afuera','Guardia activa'], array['Abrir cadera tarde','Mirar abajo'], array['Ejecución insegura'], array['Check + respuesta'], '4x8', '4 series', true,true,true,260),
  ('CPS-T05-JABLOW','KICKBOXING',2,5,'Jab + low kick','combinación','Integrar mano y pierna.', 'Entrada básica puño-patada.', array['Jab mide','Low kick sale fluida','Recupera'], array['Pausar demasiado','No cubrirse'], array['No recuperar guardia'], array['Jab-low al escudo'], '5x5', '5 series', true,true,false,270),
  ('CPS-T05-12LOW','KICKBOXING',2,5,'1-2 + low kick','combinación','Cerrar combinación con low kick.', 'Secuencia base K1.', array['1-2 recto','Sale low','Ángulo final'], array['Quedar frontal','Bajar manos'], array['Perder equilibrio'], array['1-2-low'], '5x5', '5 series', true,true,false,280),
  ('CPS-T05-MIDL','KICKBOXING',3,5,'Middle kick izquierda','patada','Patear zona media con control.', 'Middle kick de pierna izquierda.', array['Cadera gira','Brazo equilibra','Retorno seguro'], array['Golpear con pie','Caer abierto'], array['Superficie de impacto incorrecta'], array['Middle a escudo'], '4x8', '4 series', true,true,true,290),
  ('CPS-T05-MIDR','KICKBOXING',3,5,'Middle kick derecha','patada','Patear zona media derecha.', 'Middle kick potente y controlada.', array['Pivote','Cadera','Recupera base'], array['No pivotar','Manos bajas'], array['Perder equilibrio'], array['Middle derecha'], '4x8', '4 series', true,true,true,300),
  ('CPS-T05-KNEE','KICKBOXING',3,5,'Rodilla frontal','rodilla','Usar rodilla frontal con seguridad.', 'Rodilla recta/controlada.', array['Cadera entra','Punta abajo','Guardia o clinch'], array['Saltar sin control','Cabeza atrás'], array['Ejecución insegura'], array['Rodilla a escudo'], '4x8', '4 series', true,true,true,310),
  ('CPS-T05-PKINT','KICKBOXING',3,5,'Integración puño-patada','combinación','Unir manos y patadas.', 'Integración media.', array['Golpes abren línea','Patada limpia','Salida'], array['Forzar potencia','Perder distancia'], array['No recuperar guardia'], array['Combinaciones mixtas'], '5x5', '5 series', true,true,false,320),
  ('CPS-T05-HIGHL','KICKBOXING',4,5,'High kick izquierda controlada','patada','High kick segura y técnica.', 'Patada alta con control.', array['Movilidad previa','Cadera gira','Control retorno'], array['Forzar rango','Caer sin base'], array['Ejecución insegura'], array['High kick bajo supervisión'], '3x6', '3 series', true,true,true,330),
  ('CPS-T05-HIGHR','KICKBOXING',4,5,'High kick derecha controlada','patada','High kick derecha segura.', 'Patada alta de pierna derecha.', array['Pivote','Control altura','Base final'], array['Patear frío','Bajar manos'], array['Perder equilibrio'], array['High derecha controlada'], '3x6', '3 series', true,true,true,340),
  ('CPS-T05-TEEP','KICKBOXING',4,5,'Teep / front kick','patada','Controlar distancia con patada frontal.', 'Patada frontal táctica.', array['Rodilla sube','Extiende cadera','Recoge pierna'], array['Empujar sin base','Caer adelante'], array['Superficie de impacto incorrecta'], array['Teep a escudo'], '4x8', '4 series', true,true,true,350),
  ('CPS-T05-KCOMB','KICKBOXING',4,5,'Combinación avanzada puño-patada-rodilla','combinación','Integrar armas con control.', 'Secuencia avanzada K1.', array['Orden claro','Control distancia','Salida segura'], array['Hacerlo rápido sin técnica','Chocar'], array['Ignorar orden de detención/control'], array['Secuencia por segmentos'], '5x4', '5 series', true,true,false,360)
on conflict (code) do update set
  name=excluded.name, category=excluded.category, objective=excluded.objective, explanation=excluded.explanation,
  steps=excluded.steps, common_errors=excluded.common_errors, critical_errors=excluded.critical_errors,
  corrections=excluded.corrections, drill=excluded.drill, repetitions=excluded.repetitions,
  video_required=excluded.video_required, live_required=excluded.live_required, critical=excluded.critical,
  display_order=excluded.display_order;

insert into public.cps_cards(code,path_code,level_order,tomo_no,name,category,objective,explanation,video_required,live_required,critical,display_order) values
  ('BOXING-T06-POWER','BOXING',5,6,'Potencia con técnica estable','físico','Aumentar potencia sin perder mecánica.','Etapa superior de rendimiento.',false,true,false,370),
  ('BOXING-T07-ROUNDS','BOXING',5,7,'Conditioning por rounds','físico','Sostener trabajo por rounds.','Acondicionamiento específico.',false,true,false,380),
  ('BOXING-T07-FATIGUE','BOXING',5,7,'Técnica bajo fatiga','aplicación','Mantener técnica fatigado.','Control técnico bajo carga.',true,true,true,390),
  ('BOXING-T08-RECOVERY','BOXING',6,8,'Protocolo personal de recuperación','teoría','Construir recuperación individual.','Recuperación y carga.',false,true,false,400),
  ('BOXING-T09-MENTAL','BOXING',6,9,'Rutina mental pre-entrenamiento/competencia','mental','Preparar foco y regulación.','Mentalidad aplicada.',false,true,false,410),
  ('BOXING-T10-PLAN','BOXING',6,10,'Planificación básica + RPE/sRPE','planificación','Comprender carga interna.','Planificación básica.',false,true,false,420),
  ('BOXING-T11-FIGHT','BOXING',7,11,'Plan de combate y aplicación','competencia','Crear plan táctico.','Competencia y táctica.',true,true,true,430),
  ('BOXING-T12-VIDEO','BOXING',7,12,'Análisis técnico de video','análisis','Analizar video técnico.','Lectura y corrección.',false,true,false,440),
  ('BOXING-T12-COACH','BOXING',7,12,'Detectar error y proponer corrección','coaching','Corregir técnicamente.','Cierre formativo.',false,true,false,450),
  ('KICKBOXING-T06-POWER','KICKBOXING',5,6,'Potencia con técnica estable','físico','Aumentar potencia sin perder mecánica.','Etapa superior de rendimiento.',false,true,false,460),
  ('KICKBOXING-T07-ROUNDS','KICKBOXING',5,7,'Conditioning por rounds','físico','Sostener trabajo por rounds.','Acondicionamiento específico.',false,true,false,470),
  ('KICKBOXING-T07-FATIGUE','KICKBOXING',5,7,'Técnica bajo fatiga','aplicación','Mantener técnica fatigado.','Control técnico bajo carga.',true,true,true,480),
  ('KICKBOXING-T08-RECOVERY','KICKBOXING',6,8,'Protocolo personal de recuperación','teoría','Construir recuperación individual.','Recuperación y carga.',false,true,false,490),
  ('KICKBOXING-T09-MENTAL','KICKBOXING',6,9,'Rutina mental pre-entrenamiento/competencia','mental','Preparar foco y regulación.','Mentalidad aplicada.',false,true,false,500),
  ('KICKBOXING-T10-PLAN','KICKBOXING',6,10,'Planificación básica + RPE/sRPE','planificación','Comprender carga interna.','Planificación básica.',false,true,false,510),
  ('KICKBOXING-T11-FIGHT','KICKBOXING',7,11,'Plan de combate y aplicación','competencia','Crear plan táctico.','Competencia y táctica.',true,true,true,520),
  ('KICKBOXING-T12-VIDEO','KICKBOXING',7,12,'Análisis técnico de video','análisis','Analizar video técnico.','Lectura y corrección.',false,true,false,530),
  ('KICKBOXING-T12-COACH','KICKBOXING',7,12,'Detectar error y proponer corrección','coaching','Corregir técnicamente.','Cierre formativo.',false,true,false,540)
on conflict (code) do update set name=excluded.name, objective=excluded.objective, explanation=excluded.explanation, video_required=excluded.video_required, live_required=excluded.live_required, critical=excluded.critical;

insert into public.cps_exam_items(tomo_no, question_type, prompt, expected_answer) values
  (1,'oral','Explica el objetivo principal del tomo.','Comprender fundamentos, base, guardia y desplazamientos.'),
  (1,'short_answer','Nombra dos errores comunes.','Manos bajas, cruzar pies, perder equilibrio.'),
  (1,'oral','Explica un criterio de seguridad/control.','Mantener guardia, equilibrio y ejecución controlada.'),
  (2,'oral','Explica cuándo aplicar jab, cross o combinación 1-2.','Según distancia, apertura y oportunidad táctica.'),
  (3,'oral','Explica defensa + contraataque.','Defender primero, responder y salir con control.'),
  (4,'oral','Explica cómo usar distancia, ritmo y ángulo.','Gestionar rango, variar tempo y salir de línea.'),
  (5,'oral','Explica seguridad en low/middle/high kick.','Base, superficie correcta, control y retorno.'),
  (6,'short_answer','Describe potencia con técnica estable.','Potencia sin sacrificar base, guardia ni mecánica.'),
  (7,'short_answer','Qué exige conditioning por rounds.','Sostener esfuerzo específico con técnica.'),
  (8,'oral','Explica recuperación responsable.','Sueño, carga, movilidad, nutrición y señales de fatiga.'),
  (9,'oral','Explica rutina mental.','Preparar foco, respiración y control emocional.'),
  (10,'short_answer','Define RPE/sRPE.','Escala de esfuerzo percibido de sesión.'),
  (11,'oral','Qué contiene un plan de combate.','Objetivo, distancia, tácticas, ajustes y seguridad.'),
  (12,'oral','Cómo detectar error y proponer corrección.','Observar, priorizar error crítico y prescribir drill.')
on conflict do nothing;

insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
values ('cps-technique-submissions','cps-technique-submissions',false,104857600,array['video/mp4','video/webm','video/quicktime'])
on conflict (id) do update set public=false, file_size_limit=excluded.file_size_limit, allowed_mime_types=excluded.allowed_mime_types;

drop policy if exists cps_storage_student_insert_own on storage.objects;
create policy cps_storage_student_insert_own on storage.objects for insert to authenticated
with check (
  bucket_id = 'cps-technique-submissions'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);
drop policy if exists cps_storage_read_authorized on storage.objects;
create policy cps_storage_read_authorized on storage.objects for select to authenticated
using (
  bucket_id = 'cps-technique-submissions'
  and (
    (storage.foldername(name))[1] = (select auth.uid())::text
    or public.cps_is_admin()
    or exists (
      select 1
      from public.cps_video_submissions s
      join public.alumnos a on a.id = s.alumno_id
      where s.storage_path = storage.objects.name
        and public.cps_can_coach_student(a.id)
    )
  )
);

create or replace function public.get_powerfit_combat_home_secure()
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_alumno_id bigint := public.cps_current_alumno_id();
  v_is_admin boolean := public.cps_is_admin();
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED' using errcode='42501'; end if;

  return jsonb_build_object(
    'version','cps-home-v1',
    'price_school_member_clp',5000,
    'is_admin',v_is_admin,
    'student_alumno_id',v_alumno_id,
    'routes',(
      select coalesce(jsonb_agg(jsonb_build_object(
        'code',r.code,
        'name',r.name,
        'uses_belts',r.uses_belts,
        'enrollment',(
          select to_jsonb(e) from public.cps_student_enrollments e
          where e.alumno_id = v_alumno_id and e.route_code = r.code
        ),
        'stages',(
          select jsonb_agg(jsonb_build_object(
            'stage_order',s.stage_order,
            'label',s.label,
            'minimum_months',s.minimum_months,
            'minimum_exam_score',s.minimum_exam_score,
            'tomos',(
              select jsonb_agg(jsonb_build_object(
                'tomo_no',t.tomo_no,
                'title',t.title,
                'price_clp',t.school_price_clp,
                'access_status',coalesce(ta.status,'LOCKED'),
                'completed_at',ta.completed_at
              ) order by t.tomo_no)
              from public.cps_stage_tomos st
              join public.cps_tomos t on t.tomo_no = st.tomo_no
              left join public.cps_tomo_access ta on ta.alumno_id = v_alumno_id and ta.route_code = r.code and ta.tomo_no = t.tomo_no
              where st.route_code = r.code and st.stage_order = s.stage_order
            )
          ) order by s.stage_order)
          from public.cps_stages s where s.route_code = r.code
        )
      ) order by r.display_order),'[]'::jsonb)
      from public.cps_routes r
    ),
    'coach_queue',case when v_is_admin then public.get_powerfit_video_review_queue_secure() else '[]'::jsonb end
  );
end;
$$;

create or replace function public.get_powerfit_combat_path_secure(p_path_code text)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_alumno_id bigint := public.cps_current_alumno_id();
  v_path text := upper(trim(coalesce(p_path_code,'')));
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED' using errcode='42501'; end if;
  if v_path not in ('BOXING','KICKBOXING') then raise exception 'INVALID_CPS_PATH' using errcode='22023'; end if;
  return jsonb_build_object('path_code',v_path,'home',public.get_powerfit_combat_home_secure());
end;
$$;

create or replace function public.get_powerfit_tomo_detail_secure(p_path_code text, p_tomo_no smallint)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_alumno_id bigint := public.cps_current_alumno_id();
  v_path text := upper(trim(coalesce(p_path_code,'')));
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED' using errcode='42501'; end if;
  if v_path not in ('BOXING','KICKBOXING') then raise exception 'INVALID_CPS_PATH' using errcode='22023'; end if;
  return (
    select jsonb_build_object(
      'path_code',v_path,
      'tomo',to_jsonb(t),
      'access_status',coalesce(ta.status,'LOCKED'),
      'cards',(
        select coalesce(jsonb_agg(jsonb_build_object(
          'id',c.id,'code',c.code,'name',c.name,'category',c.category,'objective',c.objective,'explanation',c.explanation,
          'steps',c.steps,'common_errors',c.common_errors,'critical_errors',c.critical_errors,'corrections',c.corrections,
          'drill',c.drill,'repetitions',c.repetitions,'demo_video_url',c.demo_video_url,'video_required',c.video_required,
          'live_required',c.live_required,'critical',c.critical,'status',coalesce(cp.status,'LOCKED')
        ) order by c.display_order),'[]'::jsonb)
        from public.cps_cards c
        left join public.cps_card_progress cp on cp.alumno_id=v_alumno_id and cp.route_code=v_path and cp.card_id=c.id
        where c.tomo_no = p_tomo_no and c.active=true and (c.path_code='BOTH' or c.path_code=v_path)
      )
    )
    from public.cps_tomos t
    left join public.cps_tomo_access ta on ta.alumno_id=v_alumno_id and ta.route_code=v_path and ta.tomo_no=t.tomo_no
    where t.tomo_no = p_tomo_no
  );
end;
$$;

create or replace function public.get_powerfit_card_detail_secure(p_card_id bigint)
returns jsonb
language sql
security invoker
set search_path = public
as $$
  select to_jsonb(c) from public.cps_cards c where c.id = p_card_id
$$;

create or replace function public.get_powerfit_video_review_queue_secure()
returns jsonb
language sql
security invoker
set search_path = public
as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'submission_id',s.id,
    'alumno_id',s.alumno_id,
    'alumno_nombre',a.nombre,
    'route_code',s.route_code,
    'card_id',s.card_id,
    'card_name',c.name,
    'attempt_no',s.attempt_no,
    'status',s.status,
    'created_at',s.created_at,
    'critical',c.critical
  ) order by c.critical desc, s.created_at asc),'[]'::jsonb)
  from public.cps_video_submissions s
  join public.alumnos a on a.id=s.alumno_id
  join public.cps_cards c on c.id=s.card_id
  where s.status in ('VIDEO_SUBMITTED','VIDEO_UNDER_REVIEW')
    and (public.cps_is_admin() or public.cps_can_coach_student(s.alumno_id))
$$;

create or replace function public.get_powerfit_live_assessment_queue_secure()
returns jsonb
language sql
security invoker
set search_path = public
as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'alumno_id',cp.alumno_id,'route_code',cp.route_code,'card_id',cp.card_id,'status',cp.status,'card_name',c.name
  ) order by cp.updated_at asc),'[]'::jsonb)
  from public.cps_card_progress cp
  join public.cps_cards c on c.id=cp.card_id
  where cp.status in ('LIVE_PENDING','LIVE_CORRECTION_REQUIRED')
    and (public.cps_is_admin() or public.cps_can_coach_student(cp.alumno_id))
$$;

create or replace function public.enroll_powerfit_combat_path_secure(p_alumno_id bigint, p_path_code text, p_reason text default null)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_path text := upper(trim(coalesce(p_path_code,'')));
  v_target bigint := coalesce(p_alumno_id, public.cps_current_alumno_id());
  v_allowed boolean;
  v_row public.cps_student_enrollments%rowtype;
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED' using errcode='42501'; end if;
  v_allowed := public.cps_is_admin() or v_target = public.cps_current_alumno_id();
  if not v_allowed then raise exception 'FORBIDDEN' using errcode='42501'; end if;
  if v_path not in ('BOXING','KICKBOXING') then raise exception 'INVALID_CPS_PATH' using errcode='22023'; end if;

  insert into public.cps_student_enrollments(alumno_id,route_code,created_by,updated_by)
  values(v_target,v_path,auth.uid(),auth.uid())
  on conflict(alumno_id,route_code) do update set status='ACTIVE', updated_by=auth.uid(), updated_at=now()
  returning * into v_row;

  insert into public.cps_audit_log(actor_id,action,entity_table,entity_id,after_data,reason)
  values(auth.uid(),'enroll_path','cps_student_enrollments',v_row.id::text,to_jsonb(v_row),p_reason);
  return jsonb_build_object('ok',true,'enrollment',to_jsonb(v_row));
end;
$$;

create or replace function public.grant_powerfit_tomo_access_secure(p_alumno_id bigint, p_path_code text, p_tomo_no smallint, p_reason text)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_path text := upper(trim(coalesce(p_path_code,'')));
  v_access public.cps_tomo_access%rowtype;
begin
  if auth.uid() is null or not public.cps_is_admin() then raise exception 'FORBIDDEN' using errcode='42501'; end if;
  if nullif(trim(coalesce(p_reason,'')),'') is null then raise exception 'REASON_REQUIRED' using errcode='22023'; end if;

  insert into public.cps_tomo_access(alumno_id,route_code,tomo_no,status,source,amount_clp,granted_by,granted_reason,unlocked_at)
  values(p_alumno_id,v_path,p_tomo_no,'UNLOCKED','admin_grant',0,auth.uid(),p_reason,now())
  on conflict(alumno_id,route_code,tomo_no) do update set status='UNLOCKED', source='admin_grant', granted_by=auth.uid(), granted_reason=p_reason, unlocked_at=coalesce(public.cps_tomo_access.unlocked_at,now()), updated_at=now()
  returning * into v_access;

  insert into public.cps_audit_log(actor_id,action,entity_table,entity_id,after_data,reason)
  values(auth.uid(),'grant_tomo_access','cps_tomo_access',v_access.id::text,to_jsonb(v_access),p_reason);
  return jsonb_build_object('ok',true,'access',to_jsonb(v_access));
end;
$$;

create or replace function public.register_powerfit_tomo_payment_secure(
  p_external_payment_id text,
  p_alumno_id bigint,
  p_path_code text,
  p_tomo_no smallint,
  p_amount integer,
  p_paid_on date default current_date
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_path text := upper(trim(coalesce(p_path_code,'')));
  v_expected integer;
  v_existing public.cps_tomo_access%rowtype;
  v_access public.cps_tomo_access%rowtype;
begin
  if nullif(trim(coalesce(p_external_payment_id,'')),'') is null then raise exception 'MISSING_EXTERNAL_PAYMENT_ID' using errcode='22023'; end if;
  select school_price_clp into v_expected from public.cps_tomos where tomo_no=p_tomo_no;
  if v_expected is null then raise exception 'INVALID_TOMO' using errcode='22023'; end if;
  if p_amount <> v_expected then raise exception 'PAYMENT_AMOUNT_MISMATCH' using errcode='22023'; end if;

  select * into v_existing from public.cps_tomo_access
  where external_provider='mercadopago' and external_payment_id=trim(p_external_payment_id)
  limit 1;
  if found then
    return jsonb_build_object('ok',true,'idempotent',true,'access',to_jsonb(v_existing));
  end if;

  insert into public.cps_tomo_access(alumno_id,route_code,tomo_no,status,source,amount_clp,external_provider,external_payment_id,unlocked_at)
  values(p_alumno_id,v_path,p_tomo_no,'UNLOCKED','mercadopago',p_amount,'mercadopago',trim(p_external_payment_id),now())
  on conflict(alumno_id,route_code,tomo_no) do update set
    status='UNLOCKED', source='mercadopago', amount_clp=p_amount, external_provider='mercadopago', external_payment_id=trim(p_external_payment_id),
    unlocked_at=coalesce(public.cps_tomo_access.unlocked_at,now()), updated_at=now()
  returning * into v_access;

  insert into public.cps_audit_log(actor_id,action,entity_table,entity_id,after_data,reason)
  values(null,'mercadopago_tomo_unlock','cps_tomo_access',v_access.id::text,to_jsonb(v_access),'Pago CPS aprobado por Mercado Pago');
  return jsonb_build_object('ok',true,'idempotent',false,'access',to_jsonb(v_access));
end;
$$;

create or replace function public.submit_powerfit_card_video_secure(p_path_code text, p_card_id bigint, p_storage_path text, p_original_filename text default null)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_alumno_id bigint := public.cps_current_alumno_id();
  v_path text := upper(trim(coalesce(p_path_code,'')));
  v_attempt integer;
  v_submission public.cps_video_submissions%rowtype;
begin
  if auth.uid() is null or v_alumno_id is null then raise exception 'AUTH_REQUIRED' using errcode='42501'; end if;
  if split_part(p_storage_path,'/',1) <> auth.uid()::text then raise exception 'INVALID_STORAGE_OWNER' using errcode='42501'; end if;
  select coalesce(max(attempt_no),0)+1 into v_attempt from public.cps_video_submissions where alumno_id=v_alumno_id and route_code=v_path and card_id=p_card_id;

  insert into public.cps_video_submissions(alumno_id,route_code,card_id,attempt_no,storage_path,original_filename,submitted_by)
  values(v_alumno_id,v_path,p_card_id,v_attempt,p_storage_path,p_original_filename,auth.uid())
  returning * into v_submission;

  insert into public.cps_card_progress(alumno_id,route_code,card_id,status,video_status,last_video_submission_id,updated_at)
  values(v_alumno_id,v_path,p_card_id,'VIDEO_UNDER_REVIEW','VIDEO_UNDER_REVIEW',v_submission.id,now())
  on conflict(alumno_id,route_code,card_id) do update set status='VIDEO_UNDER_REVIEW', video_status='VIDEO_UNDER_REVIEW', last_video_submission_id=v_submission.id, updated_at=now();

  return jsonb_build_object('ok',true,'submission',to_jsonb(v_submission));
end;
$$;

create or replace function public.review_powerfit_card_video_secure(
  p_submission_id bigint,
  p_decision text,
  p_feedback text,
  p_scores jsonb default '{}'::jsonb,
  p_critical_fail boolean default false
)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_submission public.cps_video_submissions%rowtype;
  v_decision text := upper(trim(coalesce(p_decision,'')));
  v_review public.cps_video_reviews%rowtype;
  v_status text;
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED' using errcode='42501'; end if;
  select * into v_submission from public.cps_video_submissions where id=p_submission_id for update;
  if not found then raise exception 'SUBMISSION_NOT_FOUND' using errcode='22023'; end if;
  if not (public.cps_is_admin() or public.cps_can_coach_student(v_submission.alumno_id)) then raise exception 'FORBIDDEN' using errcode='42501'; end if;
  if v_decision not in ('CORRECTION_REQUIRED','APPROVED') then raise exception 'INVALID_DECISION' using errcode='22023'; end if;
  if nullif(trim(coalesce(p_feedback,'')),'') is null then raise exception 'FEEDBACK_REQUIRED' using errcode='22023'; end if;
  if p_critical_fail then v_decision := 'CORRECTION_REQUIRED'; end if;
  v_status := case when v_decision='APPROVED' then 'VIDEO_APPROVED' else 'VIDEO_CORRECTION_REQUIRED' end;

  insert into public.cps_video_reviews(
    submission_id,reviewer_id,reviewer_alumno_id,guard_score,base_score,mechanics_score,kinetic_chain_score,coordination_score,recovery_score,control_score,complete_execution_score,critical_fail,decision,feedback
  ) values (
    p_submission_id,auth.uid(),public.cps_current_alumno_id(),
    coalesce((p_scores->>'guard')::smallint,0),coalesce((p_scores->>'base')::smallint,0),coalesce((p_scores->>'mechanics')::smallint,0),coalesce((p_scores->>'kinetic_chain')::smallint,0),
    coalesce((p_scores->>'coordination')::smallint,0),coalesce((p_scores->>'recovery')::smallint,0),coalesce((p_scores->>'control')::smallint,0),coalesce((p_scores->>'complete_execution')::smallint,0),
    p_critical_fail,v_decision,p_feedback
  ) returning * into v_review;

  update public.cps_video_submissions set status=v_status where id=p_submission_id;
  update public.cps_card_progress set status=case when v_status='VIDEO_APPROVED' then 'LIVE_PENDING' else v_status end, video_status=v_status, critical_fail_open=p_critical_fail, updated_at=now()
  where alumno_id=v_submission.alumno_id and route_code=v_submission.route_code and card_id=v_submission.card_id;

  insert into public.cps_audit_log(actor_id,action,entity_table,entity_id,after_data,reason)
  values(auth.uid(),'review_video','cps_video_reviews',v_review.id::text,to_jsonb(v_review),p_feedback);
  return jsonb_build_object('ok',true,'review',to_jsonb(v_review));
end;
$$;

create or replace function public.save_powerfit_live_assessment_secure(p_alumno_id bigint, p_path_code text, p_card_id bigint, p_decision text, p_scores jsonb default '{}'::jsonb, p_critical_fail boolean default false, p_notes text default null)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
begin
  if auth.uid() is null or not (public.cps_is_admin() or public.cps_can_coach_student(p_alumno_id)) then raise exception 'FORBIDDEN' using errcode='42501'; end if;
  insert into public.cps_live_assessments(alumno_id,route_code,card_id,attempt_no,assessor_id,reproduce_score,guard_score,base_score,correction_score,speed_score,movement_score,combination_score,partner_score,safety_score,critical_fail,decision,notes)
  values(p_alumno_id,upper(p_path_code),p_card_id,
    (select coalesce(max(attempt_no),0)+1 from public.cps_live_assessments where alumno_id=p_alumno_id and route_code=upper(p_path_code) and card_id=p_card_id),
    auth.uid(),coalesce((p_scores->>'reproduce')::smallint,0),coalesce((p_scores->>'guard')::smallint,0),coalesce((p_scores->>'base')::smallint,0),coalesce((p_scores->>'correction')::smallint,0),
    coalesce((p_scores->>'speed')::smallint,0),coalesce((p_scores->>'movement')::smallint,0),coalesce((p_scores->>'combination')::smallint,0),coalesce((p_scores->>'partner')::smallint,0),coalesce((p_scores->>'safety')::smallint,0),
    p_critical_fail,case when p_critical_fail then 'CORRECTION_REQUIRED' else upper(p_decision) end,p_notes);
  update public.cps_card_progress set status=case when p_critical_fail or upper(p_decision)<>'APPROVED' then 'LIVE_CORRECTION_REQUIRED' else 'COMPLETED' end, live_status=case when p_critical_fail or upper(p_decision)<>'APPROVED' then 'LIVE_CORRECTION_REQUIRED' else 'LIVE_APPROVED' end, critical_fail_open=p_critical_fail, completed_at=case when not p_critical_fail and upper(p_decision)='APPROVED' then now() else completed_at end, updated_at=now()
  where alumno_id=p_alumno_id and route_code=upper(p_path_code) and card_id=p_card_id;
  return jsonb_build_object('ok',true);
end;
$$;

create or replace function public.finalize_powerfit_tomo_test_secure(p_alumno_id bigint, p_path_code text, p_tomo_no smallint, p_status text, p_theory_score smallint, p_practical_score smallint, p_critical_fail boolean default false, p_notes text default null)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
begin
  if auth.uid() is null or not (public.cps_is_admin() or public.cps_can_coach_student(p_alumno_id)) then raise exception 'FORBIDDEN' using errcode='42501'; end if;
  insert into public.cps_tomo_tests(alumno_id,route_code,tomo_no,status,theory_score,practical_score,critical_fail,coach_id,notes,completed_at)
  values(p_alumno_id,upper(p_path_code),p_tomo_no,upper(p_status),p_theory_score,p_practical_score,p_critical_fail,auth.uid(),p_notes,now());
  if upper(p_status)='PASSED' and not p_critical_fail then
    update public.cps_tomo_access set status='TOMO_COMPLETED', completed_at=now(), updated_at=now()
    where alumno_id=p_alumno_id and route_code=upper(p_path_code) and tomo_no=p_tomo_no;
  end if;
  return jsonb_build_object('ok',true);
end;
$$;

create or replace function public.get_powerfit_final_exam_eligibility_secure(p_alumno_id bigint, p_path_code text)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_enrollment public.cps_student_enrollments%rowtype;
  v_stage public.cps_stages%rowtype;
  v_months int;
  v_tomos_total int;
  v_tomos_completed int;
  v_open_critical int;
begin
  if auth.uid() is null or not public.cps_can_read_student(p_alumno_id) then raise exception 'FORBIDDEN' using errcode='42501'; end if;
  select * into v_enrollment from public.cps_student_enrollments where alumno_id=p_alumno_id and route_code=upper(p_path_code);
  if not found then return jsonb_build_object('eligible',false,'reason','NOT_ENROLLED'); end if;
  select * into v_stage from public.cps_stages where route_code=v_enrollment.route_code and stage_order=v_enrollment.current_stage_order;
  v_months := (date_part('year', age(current_date, v_enrollment.enrolled_at))::int * 12 + date_part('month', age(current_date, v_enrollment.enrolled_at))::int);
  select count(*) into v_tomos_total from public.cps_stage_tomos where route_code=v_enrollment.route_code and stage_order=v_enrollment.current_stage_order and required=true;
  select count(*) into v_tomos_completed from public.cps_stage_tomos st join public.cps_tomo_access ta on ta.alumno_id=p_alumno_id and ta.route_code=st.route_code and ta.tomo_no=st.tomo_no and ta.status='TOMO_COMPLETED' where st.route_code=v_enrollment.route_code and st.stage_order=v_enrollment.current_stage_order and st.required=true;
  select count(*) into v_open_critical from public.cps_card_progress where alumno_id=p_alumno_id and route_code=v_enrollment.route_code and critical_fail_open=true;
  return jsonb_build_object('eligible',v_months>=v_stage.minimum_months and v_tomos_completed=v_tomos_total and v_open_critical=0,'months_in_stage',v_months,'minimum_months',v_stage.minimum_months,'tomos_completed',v_tomos_completed,'tomos_required',v_tomos_total,'open_critical_fail',v_open_critical,'message',case when v_tomos_completed=v_tomos_total and v_months<v_stage.minimum_months then 'CONTENIDO COMPLETADO — AÚN NO HABILITADO PARA EXAMEN FINAL' else null end);
end;
$$;

create or replace function public.create_powerfit_final_exam_secure(p_alumno_id bigint, p_path_code text)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_elig jsonb;
  v_enrollment public.cps_student_enrollments%rowtype;
  v_exam public.cps_final_exams%rowtype;
begin
  if auth.uid() is null or not (public.cps_is_admin() or public.cps_can_coach_student(p_alumno_id)) then raise exception 'FORBIDDEN' using errcode='42501'; end if;
  v_elig := public.get_powerfit_final_exam_eligibility_secure(p_alumno_id,p_path_code);
  if coalesce((v_elig->>'eligible')::boolean,false) is not true then raise exception 'FINAL_EXAM_NOT_ELIGIBLE' using errcode='22023'; end if;
  select * into v_enrollment from public.cps_student_enrollments where alumno_id=p_alumno_id and route_code=upper(p_path_code);
  insert into public.cps_final_exams(alumno_id,route_code,stage_order,examiner_id)
  values(p_alumno_id,upper(p_path_code),v_enrollment.current_stage_order,auth.uid())
  returning * into v_exam;
  return jsonb_build_object('ok',true,'exam',to_jsonb(v_exam));
end;
$$;

create or replace function public.score_powerfit_final_exam_secure(p_exam_id bigint, p_scores jsonb, p_critical_fail boolean default false, p_coach_approved boolean default false, p_notes text default null)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_exam public.cps_final_exams%rowtype;
  v_min smallint;
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED' using errcode='42501'; end if;
  select * into v_exam from public.cps_final_exams where id=p_exam_id for update;
  if not found then raise exception 'EXAM_NOT_FOUND' using errcode='22023'; end if;
  if not (public.cps_is_admin() or public.cps_can_coach_student(v_exam.alumno_id)) then raise exception 'FORBIDDEN' using errcode='42501'; end if;
  select minimum_exam_score into v_min from public.cps_stages where route_code=v_exam.route_code and stage_order=v_exam.stage_order;
  update public.cps_final_exams set
    technique_score=coalesce((p_scores->>'technique')::numeric,0), defense_score=coalesce((p_scores->>'defense')::numeric,0),
    combinations_score=coalesce((p_scores->>'combinations')::numeric,0), tactics_score=coalesce((p_scores->>'tactics')::numeric,0),
    application_score=coalesce((p_scores->>'application')::numeric,0), physical_score=coalesce((p_scores->>'physical')::numeric,0),
    theory_score=coalesce((p_scores->>'theory')::numeric,0), critical_fail=p_critical_fail, coach_approved=p_coach_approved,
    notes=p_notes, completed_at=now()
  where id=p_exam_id
  returning * into v_exam;
  update public.cps_final_exams set status=case when critical_fail then 'FAILED' when final_score >= v_min and coach_approved then 'PROMOTION_READY' when final_score >= v_min then 'COACH_APPROVAL_PENDING' else 'FAILED' end where id=p_exam_id returning * into v_exam;
  return jsonb_build_object('ok',true,'exam',to_jsonb(v_exam),'minimum_score',v_min);
end;
$$;

create or replace function public.promote_powerfit_combat_stage_secure(p_exam_id bigint, p_observations text default null)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_exam public.cps_final_exams%rowtype;
  v_enrollment public.cps_student_enrollments%rowtype;
  v_promotion public.cps_promotions%rowtype;
  v_certificate public.cps_certificates%rowtype;
  v_new_stage smallint;
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED' using errcode='42501'; end if;
  select * into v_exam from public.cps_final_exams where id=p_exam_id for update;
  if not found then raise exception 'EXAM_NOT_FOUND' using errcode='22023'; end if;
  if not (public.cps_is_admin() or public.cps_can_coach_student(v_exam.alumno_id)) then raise exception 'FORBIDDEN' using errcode='42501'; end if;
  if v_exam.status <> 'PROMOTION_READY' or not v_exam.coach_approved or v_exam.critical_fail then raise exception 'PROMOTION_GATES_NOT_MET' using errcode='22023'; end if;
  select * into v_enrollment from public.cps_student_enrollments where alumno_id=v_exam.alumno_id and route_code=v_exam.route_code for update;
  v_new_stage := least(v_enrollment.current_stage_order + 1, 7);
  insert into public.cps_promotions(alumno_id,route_code,previous_stage_order,new_stage_order,final_exam_id,final_score,coach_id,observations)
  values(v_exam.alumno_id,v_exam.route_code,v_enrollment.current_stage_order,v_new_stage,v_exam.id,v_exam.final_score,auth.uid(),p_observations)
  returning * into v_promotion;
  insert into public.cps_certificates(alumno_id,route_code,stage_order,certificate_code,title,final_score,coach_id,promotion_id)
  values(v_exam.alumno_id,v_exam.route_code,v_exam.stage_order,'CPS-'||v_exam.route_code||'-'||v_exam.alumno_id||'-'||v_promotion.id,
    case when v_exam.route_code='BOXING' then 'CPS Boxeo — Nivel '||v_exam.stage_order else 'CPS Kickboxing — '||(select label from public.cps_stages where route_code=v_exam.route_code and stage_order=v_exam.stage_order) end,
    v_exam.final_score,auth.uid(),v_promotion.id)
  returning * into v_certificate;
  update public.cps_promotions set certificate_id=v_certificate.id where id=v_promotion.id;
  update public.cps_student_enrollments set current_stage_order=v_new_stage, updated_by=auth.uid(), updated_at=now() where id=v_enrollment.id;
  return jsonb_build_object('ok',true,'promotion',to_jsonb(v_promotion),'certificate',to_jsonb(v_certificate));
end;
$$;

create or replace function public.issue_powerfit_combat_certificate_secure(p_promotion_id bigint)
returns jsonb
language sql
security invoker
set search_path = public
as $$
  select case
    when auth.uid() is null then jsonb_build_object('ok',false,'error','AUTH_REQUIRED')
    else coalesce((select jsonb_build_object('ok',true,'certificate',to_jsonb(c)) from public.cps_certificates c where c.promotion_id=p_promotion_id and public.cps_can_read_student(c.alumno_id)), jsonb_build_object('ok',false,'error','CERTIFICATE_NOT_FOUND'))
  end
$$;

grant execute on function public.cps_current_alumno_id() to authenticated;
grant execute on function public.cps_is_admin() to authenticated;
grant execute on function public.cps_can_coach_student(bigint) to authenticated;
grant execute on function public.cps_can_read_student(bigint) to authenticated;
grant execute on function public.get_powerfit_combat_home_secure() to authenticated;
grant execute on function public.get_powerfit_combat_path_secure(text) to authenticated;
grant execute on function public.get_powerfit_tomo_detail_secure(text, smallint) to authenticated;
grant execute on function public.get_powerfit_card_detail_secure(bigint) to authenticated;
grant execute on function public.get_powerfit_video_review_queue_secure() to authenticated;
grant execute on function public.get_powerfit_live_assessment_queue_secure() to authenticated;
grant execute on function public.enroll_powerfit_combat_path_secure(bigint, text, text) to authenticated;
grant execute on function public.grant_powerfit_tomo_access_secure(bigint, text, smallint, text) to authenticated;
grant execute on function public.register_powerfit_tomo_payment_secure(text, bigint, text, smallint, integer, date) to service_role;
grant execute on function public.submit_powerfit_card_video_secure(text, bigint, text, text) to authenticated;
grant execute on function public.review_powerfit_card_video_secure(bigint, text, text, jsonb, boolean) to authenticated;
grant execute on function public.save_powerfit_live_assessment_secure(bigint, text, bigint, text, jsonb, boolean, text) to authenticated;
grant execute on function public.finalize_powerfit_tomo_test_secure(bigint, text, smallint, text, smallint, smallint, boolean, text) to authenticated;
grant execute on function public.get_powerfit_final_exam_eligibility_secure(bigint, text) to authenticated;
grant execute on function public.create_powerfit_final_exam_secure(bigint, text) to authenticated;
grant execute on function public.score_powerfit_final_exam_secure(bigint, jsonb, boolean, boolean, text) to authenticated;
grant execute on function public.promote_powerfit_combat_stage_secure(bigint, text) to authenticated;
grant execute on function public.issue_powerfit_combat_certificate_secure(bigint) to authenticated;
