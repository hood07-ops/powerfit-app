insert into public.cps_exam_items(tomo_no,route_code,question_type,prompt,expected_answer,options,active)
select * from (values
(16::smallint,'BOXING','short_answer','¿Qué diferencia un ataque con propósito de una combinación ejecutada sin intención táctica?','Un ataque con propósito tiene entrada, objetivo y salida, y responde a un problema táctico concreto.','[]'::jsonb,true),
(16::smallint,'BOXING','short_answer','¿Qué opciones debe conservar una defensa correcta al terminar?','Debe dejar al boxeador en posición útil para salir, reposicionarse o contraatacar sin perder postura ni visión.','[]'::jsonb,true),
(16::smallint,'BOXING','short_answer','¿Qué busca un drill de decisión y en qué se diferencia de uno de repetición?','El drill de decisión obliga a elegir entre soluciones según estímulos; el de repetición busca automatizar una respuesta conocida.','[]'::jsonb,true),
(16::smallint,'BOXING','short_answer','Explica la progresión semanal adquisición → asociación → reacción → decisión → aplicación.','Pasa de aprender la técnica, enlazarla, responder a estímulos, elegir soluciones y finalmente aplicarlas/evaluarlas bajo oposición.','[]'::jsonb,true),
(16::smallint,'BOXING','short_answer','¿Qué significa alcanzar nivel 4 en la escala de evaluación 1 a 5?','Que la habilidad ya es aplicable bajo oposición, aunque aún no necesariamente espontánea en combate libre.','[]'::jsonb,true),
(16::smallint,'BOXING','short_answer','¿Qué debe definirse primero al construir una planificación táctica y por qué?','El problema u objetivo táctico, porque determina el eje dominante, las técnicas, drills y criterios de evaluación.','[]'::jsonb,true),
(16::smallint,'BOXING','short_answer','¿Qué competencia final resume este tomo especial de Boxeo?','Comprender, seleccionar, integrar, aplicar y evaluar soluciones técnicas dentro de una intención táctica.','[]'::jsonb,true),
(17::smallint,'KICKBOXING','short_answer','¿Qué diferencia al Negro 1er Dan de un practicante que sólo acumula técnicas?','El Negro 1er Dan organiza decisiones, integra herramientas y selecciona respuestas según distancia, problema y contexto.','[]'::jsonb,true),
(17::smallint,'KICKBOXING','short_answer','¿Qué función táctica puede cumplir la patada frontal dentro del control de distancia?','Detener presión, mantener o recuperar distancia y preparar una respuesta posterior.','[]'::jsonb,true),
(17::smallint,'KICKBOXING','short_answer','¿Cómo debe integrarse una defensa ante patada baja con el contraataque?','Primero se chequea/bloquea y se recupera postura, luego se responde con manos o patada manteniendo control y salida.','[]'::jsonb,true),
(17::smallint,'KICKBOXING','short_answer','¿Por qué la distancia condiciona la selección técnica en Kickboxing?','Porque cada rango favorece herramientas distintas: larga, media, corta o trabajo de ángulo.','[]'::jsonb,true),
(17::smallint,'KICKBOXING','short_answer','Explica la progresión adquisición → asociación → reacción → decisión → aplicación para Negro 1er Dan.','La técnica se aprende, se conecta, responde a estímulos, se selecciona bajo incertidumbre y finalmente se aplica/evalúa en oposición.','[]'::jsonb,true),
(17::smallint,'KICKBOXING','short_answer','¿Qué debe contener un sparring condicionado bien diseñado?','Un objetivo táctico claro, reglas que obliguen a trabajarlo, control de intensidad y un criterio observable de éxito.','[]'::jsonb,true),
(17::smallint,'KICKBOXING','short_answer','¿Qué competencia final resume el trabajo del Negro 1er Dan?','Comprender, seleccionar, combinar, adaptar, aplicar y evaluar decisiones técnicas de forma controlada y transferible al combate.','[]'::jsonb,true)
) v(tomo_no,route_code,question_type,prompt,expected_answer,options,active)
where not exists (
  select 1 from public.cps_exam_items e
  where e.tomo_no=v.tomo_no and coalesce(e.route_code,'')=v.route_code and e.prompt=v.prompt
);
