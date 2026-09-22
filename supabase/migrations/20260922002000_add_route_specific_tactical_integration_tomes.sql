-- Adds route-specific tactical integration tomes.
-- BOXING: Tome 16 is the special closing tome of the boxing path.
-- KICKBOXING: Tome 17 is required content of Negro 1er Dan.

alter table public.cps_tomos
  drop constraint if exists cps_tomos_tomo_no_check;

alter table public.cps_tomos
  add constraint cps_tomos_tomo_no_check
  check (tomo_no >= 1 and tomo_no <= 17);

update public.cps_stages
set label = 'Negro 1er Dan'
where route_code = 'KICKBOXING' and stage_order = 7;

insert into public.cps_tomos
  (tomo_no, title, school_price_clp, active, study_version, study_content)
values
(
  16,
  'Tomo Especial de Boxeo — Integración Táctica y Planificación por Objetivos',
  5000,
  true,
  'study-v1-boxing-integration',
  $box$TOMO ESPECIAL DE BOXEO — INTEGRACIÓN TÁCTICA Y PLANIFICACIÓN POR OBJETIVOS

PROPÓSITO
Cerrar el Camino de Boxeo enseñando al alumno a integrar los conocimientos técnicos adquiridos dentro de una planificación con sentido táctico.

PRINCIPIO CENTRAL
La técnica responde a una intención. El alumno debe saber qué entrena, para qué lo entrena y cómo comprobar si puede aplicarlo.

EJES PRINCIPALES
1. Ataque: iniciar, combinar, variar altura y terminar seguro.
2. Defensa: evitar, desviar, cubrir o reducir el ataque rival.
3. Contraataque: transformar defensa o lectura en respuesta ofensiva.
4. Desplazamiento: controlar distancia, ángulo y posición.
5. Integración: unir ataque, defensa, contraataque y desplazamiento en una secuencia coherente.

NOMENCLATURA
Recto izquierda (jab).
Recto derecha (cross).
Cruzado izquierda / Cruzado derecha.
Gancho izquierda / derecha al mentón.
Golpes al cuerpo.
Parada.
Esquiva.
Cobertura.
Avance.
Retroceso.
Pivote.
Cambio de ángulo.
Drill.
Sparring condicionado.

ATAQUE CON PROPÓSITO
Un ataque debe tener entrada, objetivo y salida.
Ejemplo: Avance → Recto izquierda → Recto derecha → Cruzado izquierda → Pivote izquierda.

DEFENSA
Defender sin perder postura ni visión.
La defensa debe terminar en una posición útil para salir, reposicionarse o contraatacar.

CONTRAATAQUE
Ejemplos:
Parada → Recto derecha.
Esquiva derecha → Recto derecha.
Cobertura → Cruzado izquierda.
Retroceso → Recto derecha.
Segunda intención: provocar → defender → contraatacar.

DESPLAZAMIENTO
Avance para acortar distancia.
Retroceso para crear espacio.
Desplazamiento lateral para salir de línea.
Pivote para cambiar ángulo.
Paso diagonal para entrar o salir evitando el eje frontal.

INTEGRACIÓN TÁCTICA
Modelo:
Entrada → Ataque → Respuesta rival → Defensa → Contraataque → Salida.

DRILLS
Drill técnico: corregir ejecución.
Drill de repetición: automatizar.
Drill cooperativo: coordinar con compañero.
Drill reactivo: responder a estímulo variable.
Drill de decisión: elegir entre soluciones.
Drill situacional: resolver un problema real.
Sparring condicionado: aplicar con reglas.
Sparring libre: transferir al combate abierto.

PLANIFICACIÓN SEMANAL
Sesión 1: adquisición.
Sesión 2: asociación.
Sesión 3: reacción.
Sesión 4: decisión.
Sesión 5: aplicación y evaluación.

REGLA 70 / 20 / 10
70% consolidación.
20% progresión.
10% contenido nuevo.

EJEMPLO — DEFENSA + CONTRAATAQUE
1. Parada y esquiva con compañero pasivo.
2. Parada → Recto derecha → Pivote.
3. Recto izquierda rival en momento variable → defensa + respuesta.
4. Rival puede lanzar recto izquierda o derecha → elegir defensa y contraataque.
5. Sparring condicionado: el punto solo vale si nace después de una defensa correcta.

EJEMPLO — ENTRAR Y SALIR SIN RECIBIR
1. Avance + Recto izquierda + Retroceso.
2. Recto izquierda + Recto derecha + salida lateral.
3. Compañero responde después de la combinación.
4. Elegir salida lateral o pivote.
5. Sparring condicionado: el ataque puntúa solo si termina sin recibir respuesta limpia.

CONSTRUIR UNA PLANIFICACIÓN
1. Definir problema táctico.
2. Elegir eje dominante.
3. Seleccionar técnica principal.
4. Agregar defensa o desplazamiento compatible.
5. Elegir drill.
6. Ajustar oposición.
7. Definir evaluación.

EVALUACIÓN 1 A 5
1: no puede ejecutar sin ayuda.
2: inestable.
3: funcional en drill controlado.
4: aplicable bajo oposición.
5: espontáneo y funcional en combate.

COMPETENCIA FINAL
Comprender → seleccionar → integrar → aplicar → evaluar.
$box$
),
(
  17,
  'Kickboxing Negro 1er Dan — Integración Táctica y Planificación por Objetivos',
  5000,
  true,
  'study-v1-kickboxing-black-1dan',
  $kick$KICKBOXING — NEGRO 1ER DAN
INTEGRACIÓN TÁCTICA Y PLANIFICACIÓN POR OBJETIVOS

PROPÓSITO
Este tomo forma parte del grado Negro 1er Dan. El practicante debe demostrar que puede organizar y aplicar puños, patadas, rodillas, defensa y desplazamiento dentro de una planificación táctica coherente.

PRINCIPIO DEL NEGRO 1ER DAN
La maestría inicial comienza cuando el practicante deja de coleccionar técnicas y empieza a organizar decisiones.

EJES PRINCIPALES
Ataque.
Defensa.
Contraataque.
Desplazamiento.
Integración de manos, piernas y rodillas.

ATAQUE INTEGRADO
Recto izquierda / derecha: entrada, distancia e interrupción.
Cruzados y ganchos: cambiar línea y altura.
Patada baja: atacar base, frenar avance y cerrar combinaciones.
Patada media: variar altura y trabajar zona media.
Patada alta: amenaza superior con preparación técnica.
Patada frontal (teep): controlar distancia y detener presión.
Rodilla frontal: resolver corta distancia cuando corresponde.

CADENA MODELO
Recto izquierda → Recto derecha → Patada baja derecha → salida lateral.

DEFENSA
Ataque de puños: parada, esquiva, cobertura o retroceso.
Patada baja: chequeo/bloqueo y reposicionamiento.
Patada media/alta: bloqueo, distancia y salida.
Presión: patada frontal, cobertura, salida lateral o pivote.

CONTRAATAQUE
Parada → Recto derecha → Patada baja.
Esquiva → Recto derecha → Patada media.
Bloqueo de patada → respuesta con manos o patada.
Retroceso → Recto derecha → Patada baja.
Segunda intención: provocar → defender → contraatacar.

DISTANCIA
Larga: patada frontal, recto izquierda y patadas.
Media: rectos, cruzados, patadas medias y bajas.
Corta: ganchos, rodillas y salida rápida.
Ángulo: pivote o desplazamiento lateral antes o después de atacar.

INTEGRACIÓN MANOS-PIERNAS
Recto izquierda → Recto derecha → Patada baja derecha.
Recto izquierda → Cruzado izquierda → Patada media derecha.
Patada frontal → Recto derecha → Patada baja.
Parada → Recto derecha → Patada baja → salida.
Cobertura → Cruzado → Rodilla frontal → salida lateral.

DRILLS DEL NEGRO 1ER DAN
Técnico: precisión y control.
Cooperativo: secuencia acordada.
Reactivo: estímulo variable.
Decisión: dos o más respuestas.
Situacional: resolver presión, distancia o esquina.
Sparring condicionado: objetivo con reglas.
Sparring libre: transferencia global bajo supervisión.

PLANIFICACIÓN SEMANAL
Sesión 1: adquisición.
Sesión 2: asociación.
Sesión 3: reacción.
Sesión 4: decisión.
Sesión 5: aplicación y evaluación.

REGLA 70 / 20 / 10
70% consolidación.
20% progresión.
10% contenido nuevo.

SEMANA EJEMPLO — CONTROLAR DISTANCIA
1. Recto izquierda + patada frontal.
2. Recto izquierda + retroceso + patada baja de detención.
3. Avance rival variable → elegir recto izquierda o patada frontal.
4. Presión con puños → defender, crear distancia y responder.
5. Sparring condicionado: puntúa el control de distancia y salida limpia.

SEMANA EJEMPLO — CONTRAATAQUE
1. Parada + Recto derecha.
2. Parada + Recto derecha + Patada baja.
3. Esquiva + Recto derecha + Patada media.
4. Elegir defensa ante recto izquierda, recto derecha o patada baja.
5. Sparring condicionado: no iniciar; puntuar después de defender y responder.

TRABAJO FINAL DEL NEGRO 1ER DAN
Construir y explicar una semana con un objetivo táctico central.
Debe incluir:
- progresión de técnica a decisión;
- drill reactivo;
- drill de decisión;
- sparring condicionado;
- justificación de herramientas;
- criterios de evaluación.

EVALUACIÓN 1 A 5
1: no resuelve sin ayuda.
2: inestable.
3: funcional en drill.
4: aplicable bajo oposición.
5: espontáneo, controlado y transferible al combate.

COMPETENCIA FINAL
Comprender → seleccionar → combinar → adaptar → aplicar → evaluar.
$kick$
)
on conflict (tomo_no) do update set
  title = excluded.title,
  school_price_clp = excluded.school_price_clp,
  active = excluded.active,
  study_version = excluded.study_version,
  study_content = excluded.study_content;

insert into public.cps_stage_tomos(route_code, stage_order, tomo_no, required)
values
  ('BOXING', 7, 16, true),
  ('KICKBOXING', 7, 17, true)
on conflict (route_code, stage_order, tomo_no)
do update set required = excluded.required;

insert into public.cps_cards
(code,path_code,level_order,tomo_no,name,category,objective,explanation,steps,common_errors,critical_errors,corrections,drill,repetitions,video_required,live_required,critical,display_order)
values
(
 'BOXING-T16-PLAN','BOXING',7,16,'Diseño de semana táctica','planificación',
 'Construir una semana de Boxeo alrededor de un objetivo táctico.',
 'El alumno debe conectar objetivo, técnica, drill, oposición, aplicación y evaluación.',
 array['Define un objetivo táctico','Selecciona eje dominante','Elige técnica principal y secundarias','Ordena adquisición, reacción, decisión y aplicación','Define criterios de evaluación'],
 array['Cambiar de objetivo cada sesión','Agregar demasiadas técnicas','No incluir desplazamiento ni evaluación'],
 array['Plan sin objetivo central','Progresión incompatible con el nivel'],
 array['Reducir la semana a un objetivo y reconstruir la progresión'],
 'Presentar y defender una semana de 5 sesiones',
 '1 planificación completa',
 false,true,true,600
),
(
 'BOXING-T16-INTEGRATE','BOXING',7,16,'Integración ataque-defensa-contra-salida','aplicación',
 'Resolver una cadena completa de combate con decisión.',
 'Integra fases sin convertirlas en una combinación memorizada.',
 array['Entrada','Ataque','Leer respuesta','Defender','Contraatacar','Salir o reposicionarse'],
 array['Ejecutar por memoria','Quedarse después de atacar','Perder guardia al salir'],
 array['No responder al estímulo real','Perder balance de forma repetida'],
 array['Bajar velocidad, limitar opciones y volver a aumentar incertidumbre'],
 'Drill reactivo → drill de decisión → sparring condicionado',
 '3 bloques progresivos',
 true,true,true,610
),
(
 'KICK-T17-PLAN','KICKBOXING',7,17,'Planificación táctica Negro 1er Dan','planificación',
 'Construir una semana que integre manos, piernas, defensa y desplazamiento.',
 'El practicante debe justificar por qué cada herramienta corresponde al objetivo y a la distancia.',
 array['Define objetivo','Define distancia dominante','Selecciona manos/piernas compatibles','Agrega defensa y salida','Incluye drill reactivo y de decisión','Finaliza con sparring condicionado','Define evaluación'],
 array['Agregar técnicas sin función','No diferenciar distancias','No progresar la oposición'],
 array['Plan sin progresión','Selección técnica incompatible con la situación'],
 array['Simplificar objetivo, distancia y herramientas antes de reconstruir'],
 'Presentación de semana táctica Negro 1er Dan',
 '1 planificación completa',
 false,true,true,620
),
(
 'KICK-T17-INTEGRATE','KICKBOXING',7,17,'Integración avanzada manos-piernas','aplicación',
 'Aplicar puños, patadas, defensa, contraataque y salida bajo estímulo.',
 'El alumno debe cambiar de herramienta según distancia y respuesta rival.',
 array['Controla distancia','Ataca con intención','Reconoce respuesta','Defiende','Contraataca','Reposiciona'],
 array['Patear fuera de distancia','Quedar frontal tras combinación','Forzar secuencias sin lectura'],
 array['Pérdida repetida de equilibrio','Ignorar seguridad o control'],
 array['Volver a drill cooperativo, luego reactivo y finalmente decisión'],
 'Drill de decisión + sparring condicionado',
 '3 a 5 rounds controlados',
 true,true,true,630
)
on conflict (code) do update set
  path_code=excluded.path_code,
  level_order=excluded.level_order,
  tomo_no=excluded.tomo_no,
  name=excluded.name,
  category=excluded.category,
  objective=excluded.objective,
  explanation=excluded.explanation,
  steps=excluded.steps,
  common_errors=excluded.common_errors,
  critical_errors=excluded.critical_errors,
  corrections=excluded.corrections,
  drill=excluded.drill,
  repetitions=excluded.repetitions,
  video_required=excluded.video_required,
  live_required=excluded.live_required,
  critical=excluded.critical,
  display_order=excluded.display_order,
  active=true;

insert into public.cps_exam_items
  (tomo_no, route_code, question_type, prompt, expected_answer, options, active)
select *
from (values
  (16::smallint,'BOXING'::text,'short_answer'::text,
   '¿Cuál es la cadena general de integración táctica del Tomo Especial de Boxeo?',
   'Entrada, ataque, respuesta rival, defensa, contraataque y salida.',
   '[]'::jsonb,true),
  (16::smallint,'BOXING'::text,'short_answer'::text,
   '¿Qué representa la regla 70/20/10 en una semana técnica?',
   '70% consolidación, 20% progresión y 10% contenido nuevo.',
   '[]'::jsonb,true),
  (16::smallint,'BOXING'::text,'short_answer'::text,
   '¿Qué debe incluir una planificación táctica básica?',
   'Objetivo, eje dominante, técnicas compatibles, drill, oposición, aplicación y evaluación.',
   '[]'::jsonb,true),
  (17::smallint,'KICKBOXING'::text,'short_answer'::text,
   '¿Qué debe demostrar el practicante en el trabajo final del Negro 1er Dan?',
   'Construir y explicar una semana con objetivo táctico central, progresión, drill reactivo, drill de decisión, sparring condicionado y criterios de evaluación.',
   '[]'::jsonb,true),
  (17::smallint,'KICKBOXING'::text,'short_answer'::text,
   '¿Cómo cambia la selección técnica según la distancia en Kickboxing?',
   'La herramienta se elige según rango: larga, media, corta o ángulo; no por preferencia aislada.',
   '[]'::jsonb,true),
  (17::smallint,'KICKBOXING'::text,'short_answer'::text,
   '¿Cuál es el principio del Negro 1er Dan en este tomo?',
   'Dejar de coleccionar técnicas y comenzar a organizar decisiones.',
   '[]'::jsonb,true)
) as q(tomo_no,route_code,question_type,prompt,expected_answer,options,active)
where not exists (
  select 1 from public.cps_exam_items e
  where e.tomo_no=q.tomo_no and e.route_code=q.route_code and e.prompt=q.prompt
);
