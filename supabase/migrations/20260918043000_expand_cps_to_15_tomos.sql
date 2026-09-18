-- CPS 15-tomo expansion.
-- Keeps RLS and payment logic unchanged. Adds Tomos 13-15 to the final stage of both routes.

alter table public.cps_tomos
  drop constraint if exists cps_tomos_tomo_no_check;

alter table public.cps_tomos
  add constraint cps_tomos_tomo_no_check
  check (tomo_no >= 1 and tomo_no <= 15);

insert into public.cps_tomos
  (tomo_no, title, school_price_clp, active, study_version, study_content)
values
(
  13,
  'Programas de Entrenamiento',
  5000,
  true,
  'study-v1',
  $t13$TOMO 13 — PROGRAMAS DE ENTRENAMIENTO
Sesiones, semanas y progresiones CPS

OBJETIVOS
- Construir sesiones y semanas.
- Adaptar frecuencia.
- Aplicar el programa CPS Fighter de 8 semanas.

REGLA CPS
Primero control. Luego velocidad. La potencia se agrega cuando la técnica puede repetirse sin perder base, trayectoria ni protección.

CAPÍTULO 38 — CONSTRUCCIÓN DE PROGRAMAS
Un programa une objetivo, sesiones, progresión y evaluación. CPS trabaja con estructuras de 3, 4, 5 y 6 días y un programa Fighter de 8 semanas.

PROGRAMA CPS FIGHTER — 8 SEMANAS
Semana 1: Guardia + movimiento.
Semana 2: Jab + distancia.
Semana 3: Cross + 1-2.
Semana 4: Hook + Uppercut.
Semana 5: Defensa + contraataque.
Semana 6: Especialización por disciplina.
Semana 7: Reacción + decisión.
Semana 8: Integración + evaluación final.

FRECUENCIA
3 días: priorizar sesiones críticas; complemento opcional.
4 días: 3 críticas + 1 fuerza/conditioning.
5 días: estructura CPS completa.
6 días: agregar trabajo suave/técnico; no duplicar intensidad.

PLANTILLA DE SESIÓN
1. Calentamiento.
2. Técnica.
3. Drill/aplicación.
4. Fuerza/potencia o conditioning.
5. Integración.
6. Vuelta a la calma + registro.

SESIÓN MODELO DE 60 MINUTOS
10 min calentamiento y movilidad específica.
15 min técnica principal.
10 min drill progresivo.
10 min integración táctica.
10 min conditioning/fuerza según objetivo.
5 min vuelta a la calma y registro RPE.

CIERRE
El Tomo 13 se considera estudiado cuando el alumno puede explicar, demostrar y aplicar sus principios con control.
$t13$
),
(
  14,
  'Errores y Correcciones',
  5000,
  true,
  'study-v1',
  $t14$TOMO 14 — ERRORES Y CORRECCIONES
Diagnóstico técnico y sistema de corrección

OBJETIVOS
- Diagnosticar errores técnicos.
- Priorizar correcciones.
- Diseñar drills correctivos.

REGLA CPS
Primero control. Luego velocidad. La potencia se agrega cuando la técnica puede repetirse sin perder base, trayectoria ni protección.

CAPÍTULO 39 — DETECTAR EL ERROR REAL
El error visible puede ser consecuencia de otro problema. Un hook amplio puede nacer de una distancia incorrecta; un cross sin potencia puede nacer del apoyo o de la sincronización.

CAPÍTULO 40 — CORREGIR SIN DESTRUIR FLUIDEZ
Corrige una prioridad a la vez: seguridad, equilibrio, trayectoria y después velocidad/potencia. Usa consignas cortas y drills que obliguen al cuerpo a encontrar la solución.

MATRIZ DE CORRECCIÓN
Guardia — pies juntos: marcar ancho y congelar postura.
Jab — carga hacia atrás: salida directa desde guardia.
Cross — golpe de brazo: separar pivote/rotación y volver a integrar.
Hook — swing amplio: manopla cercana + pared para limitar arco.
Uppercut — bajar mano: trayectoria corta desde guardia.
Slip — doblar cintura: cuerda + desplazamiento mínimo.
Low kick — no pivotar: drill de pivote sin impacto.

JERARQUÍA DE CORRECCIÓN
1. Seguridad y dolor.
2. Equilibrio/base.
3. Protección.
4. Trayectoria.
5. Secuencia/ritmo.
6. Velocidad y potencia.

CICLO CORRECTIVO
Observar → nombrar un error → simplificar tarea → repetir lento → agregar velocidad → volver al contexto.

DRILL CORRECTIVO
Restricción → repetición → contexto.
Restringe el error, repite a baja velocidad hasta estabilizar y vuelve al contexto con una sola decisión adicional.

CIERRE
El Tomo 14 se considera estudiado cuando el alumno puede explicar, demostrar y aplicar sus principios con control.
$t14$
),
(
  15,
  'Maestría, Coaching y Legado',
  5000,
  true,
  'study-v1',
  $t15$TOMO 15 — MAESTRÍA, COACHING Y LEGADO
Enseñar, evaluar y construir un sistema propio

OBJETIVOS
- Enseñar con método.
- Respetar límites profesionales.
- Documentar conocimiento y legado.

CAPÍTULO 41 — METODOLOGÍA DEL COACH CPS
El coach organiza aprendizaje, observa, corrige, mide y adapta dentro de su alcance. Debe diferenciar entrenamiento de diagnóstico clínico, usar progresiones y dejar evidencia del proceso.

MAESTRÍA
La maestría no es acumular técnicas: es poder ejecutar fundamentos bajo presión, elegir soluciones simples y transmitirlas a otros con claridad.

MÉTODO DE ENSEÑANZA CPS
Demostrar, explicar, practicar, observar, corregir, repetir y evaluar.
- Explicación breve.
- Demostración desde dos ángulos.
- Práctica lenta.
- Drill con restricción.
- Aplicación táctica.
- Feedback.
- Registro.

ÉTICA Y ALCANCE
El entrenador educa y adapta entrenamiento. No diagnostica lesiones ni prescribe medicación; deriva cuando el problema supera su competencia.

CONSTRUIR LEGADO
Un sistema perdura cuando otra persona puede entenderlo y aplicarlo sin depender de explicaciones orales.
- Crear biblioteca técnica.
- Registrar progresiones.
- Filmar ejemplos correctos.
- Actualizar materiales cuando se encuentre una mejor forma de enseñar.

EVALUACIÓN FINAL DE LA COLECCIÓN
- Explicar la cadena cinética de un golpe recto.
- Demostrar guardia y cuatro desplazamientos sin perder base.
- Ejecutar Jab, Cross, Hook y Uppercut con retorno.
- Resolver Jab con Parry o Slip y contraataque.
- Construir una sesión con objetivo, dosis y registro.
- Diseñar una semana que combine técnica, físico y recuperación.
- Analizar un video y priorizar un error.
- Explicar límites profesionales del entrenador.

CERTIFICADO CPS
El certificado asociado a esta colección es un certificado interno de finalización CPS. No es título profesional, licencia federativa ni acreditación estatal salvo convenio formal futuro.

CIERRE
El Tomo 15 se considera estudiado cuando el alumno puede explicar, demostrar y aplicar sus principios con control.
$t15$
)
on conflict (tomo_no) do update set
  title = excluded.title,
  school_price_clp = excluded.school_price_clp,
  active = excluded.active,
  study_version = excluded.study_version,
  study_content = excluded.study_content;

insert into public.cps_stage_tomos (route_code, stage_order, tomo_no)
values
  ('BOXING', 7, 13),
  ('BOXING', 7, 14),
  ('BOXING', 7, 15),
  ('KICKBOXING', 7, 13),
  ('KICKBOXING', 7, 14),
  ('KICKBOXING', 7, 15)
on conflict do nothing;

insert into public.cps_exam_items
  (tomo_no, route_code, question_type, prompt, expected_answer, options, active)
select *
from (values
  (13::smallint, null::text, 'short_answer'::text,
   '¿Cuáles son las ocho semanas del programa CPS Fighter?',
   'Guardia + movimiento; Jab + distancia; Cross + 1-2; Hook + Uppercut; Defensa + contraataque; Especialización por disciplina; Reacción + decisión; Integración + evaluación final.',
   '[]'::jsonb, true),
  (14::smallint, null::text, 'short_answer'::text,
   '¿Cuál es la jerarquía CPS para priorizar una corrección técnica?',
   'Seguridad y dolor; equilibrio/base; protección; trayectoria; secuencia/ritmo; velocidad y potencia.',
   '[]'::jsonb, true),
  (15::smallint, null::text, 'short_answer'::text,
   '¿Qué representa un certificado CPS al finalizar la colección?',
   'Un certificado interno de finalización CPS; no es título profesional, licencia federativa ni acreditación estatal salvo convenio formal.',
   '[]'::jsonb, true)
) as q(tomo_no, route_code, question_type, prompt, expected_answer, options, active)
where not exists (
  select 1
  from public.cps_exam_items e
  where e.tomo_no=q.tomo_no and e.prompt=q.prompt
);
