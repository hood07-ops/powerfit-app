-- Fill CPS assessment banks to 10 active questions per tomo without replacing existing items.
-- Existing question IDs and student answers remain untouched.

with seed(tomo_no,route_code,question_type,prompt,expected_answer,options,active) as (
  values
  (2::smallint,NULL::text,'short_answer'::text,'¿Qué debe evitar el jab antes de salir desde la guardia?','Cargar la mano hacia atrás; debe salir directo desde la guardia.','[]'::jsonb,true),
  (2::smallint,NULL::text,'short_answer'::text,'¿Qué protege el mentón durante la extensión del jab?','La mano posterior y el hombro delantero elevado.','[]'::jsonb,true),
  (2::smallint,NULL::text,'short_answer'::text,'¿Cuál es la secuencia cinética principal del cross?','Pie posterior, rodilla/cadera, rotación de tronco, hombro posterior y extensión del brazo.','[]'::jsonb,true),
  (2::smallint,NULL::text,'short_answer'::text,'¿Qué error aparece si el cross se ejecuta sólo con el brazo?','Se pierde transferencia de fuerza y coordinación de la cadena cinética.','[]'::jsonb,true),
  (2::smallint,NULL::text,'short_answer'::text,'¿Qué debe hacer la mano del jab mientras sale el cross en el 1-2?','Retornar a proteger mientras el cross se extiende.','[]'::jsonb,true),
  (2::smallint,NULL::text,'short_answer'::text,'¿Por qué no debe existir una pausa larga entre jab y cross?','Porque rompe la fluidez y da tiempo al rival para reorganizarse.','[]'::jsonb,true),
  (2::smallint,NULL::text,'short_answer'::text,'¿Qué caracteriza a un hook compacto?','Arco corto, pivote coordinado, cadera/tronco activos y mano contraria protegiendo.','[]'::jsonb,true),
  (2::smallint,NULL::text,'short_answer'::text,'¿Qué principio de seguridad se mantiene en jab, cross, hook y uppercut?','Golpear sin perder base, protección ni recuperación inmediata de la guardia.','[]'::jsonb,true),
  (2::smallint,NULL::text,'short_answer'::text,'¿Cuándo se agrega potencia según la regla CPS?','Cuando la técnica puede repetirse con control, base, trayectoria y protección.','[]'::jsonb,true),
  (3::smallint,NULL::text,'short_answer'::text,'¿Cuál es el objetivo central de una defensa CPS?','Reducir daño, conservar equilibrio y quedar en condiciones de responder.','[]'::jsonb,true),
  (3::smallint,NULL::text,'short_answer'::text,'¿Qué diferencia al parry del bloqueo?','El parry desvía ligeramente la trayectoria; el bloqueo cierra una línea con estructura compacta.','[]'::jsonb,true),
  (3::smallint,NULL::text,'short_answer'::text,'¿Cuánto debe moverse la mano en un parry eficaz?','Sólo lo necesario para sacar el golpe de la línea, sin perseguirlo.','[]'::jsonb,true),
  (3::smallint,NULL::text,'short_answer'::text,'¿Qué debe ocurrir inmediatamente después de un parry?','La mano vuelve al mentón o se transforma en contraataque.','[]'::jsonb,true),
  (3::smallint,NULL::text,'short_answer'::text,'¿Qué caracteriza a un slip eficiente?','Mover la cabeza lo mínimo necesario manteniendo base, manos y visión.','[]'::jsonb,true),
  (3::smallint,NULL::text,'short_answer'::text,'¿Por qué es incorrecto doblarse sólo desde la cintura al hacer slip?','Porque rompe la base y dificulta la recuperación o el contraataque.','[]'::jsonb,true),
  (3::smallint,NULL::text,'short_answer'::text,'¿Qué elementos componen una defensa completa además de la técnica de manos?','Distancia, lectura, guardia y economía de movimiento.','[]'::jsonb,true),
  (3::smallint,NULL::text,'short_answer'::text,'¿Qué debe conservarse al enlazar defensa y contraataque?','Equilibrio, guardia y una posición desde la cual responder de inmediato.','[]'::jsonb,true),
  (3::smallint,NULL::text,'short_answer'::text,'¿Qué regla práctica limita el tamaño de una evasión?','Mover sólo lo suficiente para evitar el golpe sin destruir la posición para la acción siguiente.','[]'::jsonb,true),
  (4::smallint,NULL::text,'short_answer'::text,'¿Qué determina la distancia en un combate?','Qué herramientas están disponibles sin romper la base.','[]'::jsonb,true),
  (4::smallint,NULL::text,'short_answer'::text,'¿Qué función cumple variar el ritmo?','Obligar al rival a reajustar su lectura mediante cambios de pausa, velocidad y longitud de combinación.','[]'::jsonb,true),
  (4::smallint,NULL::text,'short_answer'::text,'¿Qué tres preguntas propone CPS antes de elegir una acción táctica?','Si puedo alcanzar sin romper base, qué respuesta quiero provocar y cómo salgo después.','[]'::jsonb,true),
  (4::smallint,NULL::text,'short_answer'::text,'¿Qué función puede cumplir el primer golpe de una combinación?','Medir, distraer, cubrir entrada u obligar a una reacción.','[]'::jsonb,true),
  (4::smallint,NULL::text,'short_answer'::text,'¿Por qué una combinación no debe ser sólo una lista memorizada?','Porque debe provocar una reacción y explotar la respuesta del rival.','[]'::jsonb,true),
  (4::smallint,NULL::text,'short_answer'::text,'¿Qué significa la secuencia táctica ''Leer, Fijar, Acelerar, Salir''?','Observar, provocar o fijar una respuesta, atacar el momento creado y terminar seguro.','[]'::jsonb,true),
  (4::smallint,NULL::text,'short_answer'::text,'¿Cómo debe terminar toda combinación según la regla táctica CPS?','Con guardia, ángulo o distancia segura.','[]'::jsonb,true),
  (4::smallint,NULL::text,'short_answer'::text,'¿Qué diferencia una acción técnica de una táctica?','La técnica es la ejecución; la táctica decide cuándo, por qué y para qué usarla.','[]'::jsonb,true),
  (4::smallint,NULL::text,'short_answer'::text,'¿Qué busca una salida lateral después de atacar?','Salir de la línea de respuesta y recuperar una posición segura.','[]'::jsonb,true),
  (5::smallint,NULL::text,'short_answer'::text,'¿Por qué el pivote del pie de apoyo es clave en las patadas?','Libera la cadera y permite una trayectoria coordinada sin perder el equilibrio.','[]'::jsonb,true),
  (5::smallint,NULL::text,'short_answer'::text,'¿Qué superficie de impacto prioriza CPS en el low kick?','La tibia, con contacto controlado.','[]'::jsonb,true),
  (5::smallint,NULL::text,'short_answer'::text,'¿Qué debe ocurrir después del impacto de una patada?','Retraer o completar la tarea y recuperar guardia y base.','[]'::jsonb,true),
  (5::smallint,NULL::text,'short_answer'::text,'¿Por qué no debe forzarse un high kick antes de dominar rangos inferiores?','Porque la altura aumenta la demanda de movilidad y control y puede deteriorar la técnica.','[]'::jsonb,true),
  (5::smallint,NULL::text,'short_answer'::text,'¿Qué error produce una patada ejecutada sólo con la pierna?','Falta de transferencia desde apoyo, pivote y cadera.','[]'::jsonb,true),
  (5::smallint,NULL::text,'short_answer'::text,'¿Qué mantiene segura una rodilla frontal?','Apoyo estable, cadera organizada, manos protegiendo y recuperación de la guardia.','[]'::jsonb,true),
  (5::smallint,NULL::text,'short_answer'::text,'¿Qué debe conservar una transición puño-patada?','Estructura, guardia, distancia y una distribución de peso que permita la patada.','[]'::jsonb,true),
  (5::smallint,NULL::text,'short_answer'::text,'¿Qué combinación ejemplifica integración puño-patada en el tomo?','Jab-Cross-Low Kick, entre otras combinaciones propuestas.','[]'::jsonb,true),
  (5::smallint,NULL::text,'short_answer'::text,'¿Qué regla CPS se aplica antes de aumentar potencia o altura?','Primero control y técnica repetible; luego velocidad y potencia.','[]'::jsonb,true),
  (6::smallint,NULL::text,'short_answer'::text,'¿Cuáles son los patrones de fuerza base que prioriza CPS?','Sentadilla, bisagra, empuje, tracción, zancada/unilateral, transporte y tronco.','[]'::jsonb,true),
  (6::smallint,NULL::text,'short_answer'::text,'¿Qué significa potencia en preparación física?','Producir fuerza rápidamente.','[]'::jsonb,true),
  (6::smallint,NULL::text,'short_answer'::text,'¿Cuándo debe terminar una serie de potencia?','Cuando cae de forma clara la velocidad o se deteriora la técnica.','[]'::jsonb,true),
  (6::smallint,NULL::text,'short_answer'::text,'¿Por qué el gimnasio no debe imitar literalmente una pelea?','Porque debe desarrollar cualidades físicas que luego la técnica deportiva convierte en rendimiento.','[]'::jsonb,true),
  (6::smallint,NULL::text,'short_answer'::text,'¿Qué principio rige las repeticiones de ejercicios explosivos?','Pocas repeticiones de alta calidad con pausas suficientes para conservar velocidad.','[]'::jsonb,true),
  (6::smallint,NULL::text,'short_answer'::text,'¿Cuál es el orden recomendado de una sesión fuerza-potencia?','Calentamiento, potencia, fuerza principal, accesorios, tronco y vuelta a la calma.','[]'::jsonb,true),
  (6::smallint,NULL::text,'short_answer'::text,'¿Qué aporta el patrón de bisagra al peleador?','Trabajo de cadena posterior y capacidad de acelerar la cadera.','[]'::jsonb,true),
  (6::smallint,NULL::text,'short_answer'::text,'¿Qué objetivo tiene una semana de descarga en la progresión de cuatro semanas?','Reducir volumen para controlar fatiga manteniendo calidad técnica.','[]'::jsonb,true),
  (6::smallint,NULL::text,'short_answer'::text,'¿Qué condición debe cumplirse antes de aumentar carga?','Mantener una técnica estable y medible.','[]'::jsonb,true),
  (7::smallint,NULL::text,'short_answer'::text,'¿Qué sistema sostiene principalmente la recuperación entre esfuerzos?','El sistema aeróbico.','[]'::jsonb,true),
  (7::smallint,NULL::text,'short_answer'::text,'¿Qué caracteriza a la potencia aláctica?','Esfuerzos muy breves y explosivos con descansos amplios para conservar velocidad.','[]'::jsonb,true),
  (7::smallint,NULL::text,'short_answer'::text,'¿Por qué Tabata, EMOM o AMRAP no son sistemas energéticos por sí mismos?','Porque son formatos; la respuesta depende de ejercicio, intensidad, duración y descanso.','[]'::jsonb,true),
  (7::smallint,NULL::text,'short_answer'::text,'¿Qué riesgo tiene abusar del trabajo glucolítico?','Genera alta fatiga y puede deteriorar la técnica y la recuperación.','[]'::jsonb,true),
  (7::smallint,NULL::text,'short_answer'::text,'¿Cuál es el objetivo de la base aeróbica en un peleador?','Mejorar recuperación entre esfuerzos y tolerar mayor volumen sin elevar siempre la intensidad.','[]'::jsonb,true),
  (7::smallint,NULL::text,'short_answer'::text,'¿Qué diferencia un sprint aláctico de un round glucolítico?','El aláctico es muy breve con recuperación amplia; el glucolítico dura más y acumula mayor fatiga.','[]'::jsonb,true),
  (7::smallint,NULL::text,'short_answer'::text,'¿Qué RPE propone el ejemplo de round técnico de 3 minutos?','RPE 6-7.','[]'::jsonb,true),
  (7::smallint,NULL::text,'short_answer'::text,'¿Qué debe conservarse durante conditioning específico?','La calidad técnica y un objetivo energético claro.','[]'::jsonb,true),
  (7::smallint,NULL::text,'short_answer'::text,'¿Qué principio resume el tomo respecto a fatigarse?','Sentirse destruido no equivale a mejorar; la dosis debe responder al objetivo.','[]'::jsonb,true),
  (8::smallint,NULL::text,'short_answer'::text,'¿Cuáles son los cinco indicadores del check-in de recuperación CPS?','Sueño, energía, recuperación muscular, control del estrés y motivación.','[]'::jsonb,true),
  (8::smallint,NULL::text,'short_answer'::text,'¿Qué significa el promedio del check-in diario?','Es una señal operativa del estado de recuperación, no un diagnóstico.','[]'::jsonb,true),
  (8::smallint,NULL::text,'short_answer'::text,'¿Qué prácticas de corte de peso no promueve CPS?','Cortes extremos de agua, laxantes/diuréticos y sesiones de calor usadas como castigo.','[]'::jsonb,true),
  (8::smallint,NULL::text,'short_answer'::text,'¿Cuándo corresponde derivar a un nutricionista deportivo?','Cuando el objetivo de peso o la alimentación requieren una intervención profesional individualizada.','[]'::jsonb,true),
  (8::smallint,NULL::text,'short_answer'::text,'¿Qué función cumplen los carbohidratos alrededor del entrenamiento?','Aportar combustible para sesiones intensas.','[]'::jsonb,true),
  (8::smallint,NULL::text,'short_answer'::text,'¿Qué función cumple distribuir proteína durante el día?','Apoyar reparación y recuperación.','[]'::jsonb,true),
  (8::smallint,NULL::text,'short_answer'::text,'¿Cómo debe planificarse el peso de competencia?','Con anticipación de semanas, no con medidas desesperadas de último minuto.','[]'::jsonb,true),
  (8::smallint,NULL::text,'short_answer'::text,'¿Qué conducta básica recomienda CPS para hidratación en una sesión?','Comenzar sin sed intensa, disponer de líquido y reponer tras sudoración importante.','[]'::jsonb,true),
  (8::smallint,NULL::text,'short_answer'::text,'¿Qué debe hacerse si la recuperación está baja?','Revisar contexto y evitar aumentar exigencia automáticamente.','[]'::jsonb,true),
  (9::smallint,NULL::text,'short_answer'::text,'¿Cuál es el objetivo de la regulación emocional CPS?','Actuar con claridad a pesar de las emociones, no eliminarlas.','[]'::jsonb,true),
  (9::smallint,NULL::text,'short_answer'::text,'¿Qué patrón respiratorio propone la rutina de 90 segundos?','Exhalar más largo que la inhalación durante 3-5 ciclos.','[]'::jsonb,true),
  (9::smallint,NULL::text,'short_answer'::text,'¿Cómo debe ser una consigna mental útil?','Observable, breve y accionable.','[]'::jsonb,true),
  (9::smallint,NULL::text,'short_answer'::text,'¿Qué construye confianza sostenible según CPS?','Evidencia del proceso: técnica practicada, carga tolerada, sparring controlado y objetivos cumplidos.','[]'::jsonb,true),
  (9::smallint,NULL::text,'short_answer'::text,'¿Qué elementos debe incluir el pre-combate mental?','Plan A, Plan B, palabra o consigna de calma y una idea clara para el inicio.','[]'::jsonb,true),
  (9::smallint,NULL::text,'short_answer'::text,'¿Por qué conviene limitar las consignas de esquina?','Para evitar sobrecarga de información y conservar el foco.','[]'::jsonb,true),
  (9::smallint,NULL::text,'short_answer'::text,'¿Qué entrenan los drills de decisión?','Lectura, selección y ejecución bajo presión.','[]'::jsonb,true),
  (9::smallint,NULL::text,'short_answer'::text,'¿Qué se registra después de entrenar o competir?','Qué funcionó, qué corregir y una acción concreta para la siguiente etapa.','[]'::jsonb,true),
  (9::smallint,NULL::text,'short_answer'::text,'¿Qué diferencia una frase como ''respira, mira, jab'' de ''tienes que ganar''?','La primera indica acciones controlables; la segunda es vaga y orientada sólo al resultado.','[]'::jsonb,true),
  (10::smallint,NULL::text,'short_answer'::text,'¿Cómo se calcula el sRPE?','RPE de la sesión multiplicado por los minutos reales de duración.','[]'::jsonb,true),
  (10::smallint,NULL::text,'short_answer'::text,'Si una sesión dura 60 minutos a RPE 6, ¿cuál es su sRPE?','360 unidades arbitrarias.','[]'::jsonb,true),
  (10::smallint,NULL::text,'short_answer'::text,'¿Qué significa Acumulación en el modelo ATR?','Construir bases con mayor volumen general y técnico.','[]'::jsonb,true),
  (10::smallint,NULL::text,'short_answer'::text,'¿Qué significa Transformación en ATR?','Convertir la base hacia demandas específicas con más especificidad, potencia y decisión.','[]'::jsonb,true),
  (10::smallint,NULL::text,'short_answer'::text,'¿Qué significa Realización en ATR?','Reducir fatiga y volumen manteniendo cualidades competitivas, velocidad y confianza.','[]'::jsonb,true),
  (10::smallint,NULL::text,'short_answer'::text,'¿Qué debe organizar un Fight Camp además de técnica?','Preparación física, sparring, recuperación y taper.','[]'::jsonb,true),
  (10::smallint,NULL::text,'short_answer'::text,'¿Cuál es el objetivo final del taper o la realización?','Llegar disponible para rendir, no llegar más cansado.','[]'::jsonb,true),
  (10::smallint,NULL::text,'short_answer'::text,'¿Qué debe compararse al controlar carga semanal?','La suma de sRPE y su tendencia respecto de semanas previas, junto con recuperación y calidad técnica.','[]'::jsonb,true),
  (10::smallint,NULL::text,'short_answer'::text,'¿Qué variable conviene ajustar antes de aumentar intensidad si aparece fatiga?','El volumen y la distribución de carga.','[]'::jsonb,true),
  (11::smallint,NULL::text,'short_answer'::text,'¿Qué diferencia un sparring técnico de una simulación?','El técnico prioriza forma a intensidad moderada; la simulación reproduce la estructura competitiva de manera controlada.','[]'::jsonb,true),
  (11::smallint,NULL::text,'short_answer'::text,'¿Qué caracteriza a un sparring situacional?','Comenzar desde una condición o escena específica para resolverla.','[]'::jsonb,true),
  (11::smallint,NULL::text,'short_answer'::text,'¿Qué caracteriza a un sparring táctico?','Resolver un problema de estilo, distancia o plan de combate.','[]'::jsonb,true),
  (11::smallint,NULL::text,'short_answer'::text,'¿Por qué cada sparring debe tener un propósito?','Porque aumentar intensidad sin objetivo eleva costo y riesgo sin asegurar aprendizaje.','[]'::jsonb,true),
  (11::smallint,NULL::text,'short_answer'::text,'¿Cuántas consignas tácticas máximas recomienda el tomo para competencia?','Dos consignas claras como máximo.','[]'::jsonb,true),
  (11::smallint,NULL::text,'short_answer'::text,'¿Qué se prioriza entre rounds antes de corregir táctica?','Recuperar respiración y postura.','[]'::jsonb,true),
  (11::smallint,NULL::text,'short_answer'::text,'¿Cuál es la secuencia de esquina propuesta?','Respira, escucha, un ajuste defensivo, un ajuste ofensivo y salida al siguiente round.','[]'::jsonb,true),
  (11::smallint,NULL::text,'short_answer'::text,'¿Qué debe estar preparado antes del día de competencia?','Equipamiento/documentos, peso y horario, comida e hidratación conocidas, calentamiento y plan A/B.','[]'::jsonb,true),
  (11::smallint,NULL::text,'short_answer'::text,'¿Cómo debe revisarse el combate después del evento?','Analizando el proceso y los ajustes sin dramatizar sólo el resultado.','[]'::jsonb,true),
  (12::smallint,NULL::text,'short_answer'::text,'¿Qué debe permitir ver un video técnico útil?','Pies, cadera, manos y distancia.','[]'::jsonb,true),
  (12::smallint,NULL::text,'short_answer'::text,'¿Qué aporta un plano lateral?','Permite observar mejor trayectoria y rotación.','[]'::jsonb,true),
  (12::smallint,NULL::text,'short_answer'::text,'¿Qué aporta un plano frontal?','Permite revisar simetría y guardia.','[]'::jsonb,true),
  (12::smallint,NULL::text,'short_answer'::text,'¿Por qué conviene mantener la misma distancia de cámara entre semanas?','Para que las comparaciones sean más consistentes.','[]'::jsonb,true),
  (12::smallint,NULL::text,'short_answer'::text,'¿Qué criterios observables incluye el checklist CPS de video?','Base, apoyos/pivote, transferencia, trayectoria, protección, recuperación y decisión.','[]'::jsonb,true),
  (12::smallint,NULL::text,'short_answer'::text,'¿Por qué un promedio alto no debe ocultar un error crítico?','Porque una falla repetida de seguridad, equilibrio o protección requiere corrección aunque el promedio sea bueno.','[]'::jsonb,true),
  (12::smallint,NULL::text,'short_answer'::text,'¿Qué escala propone el tomo para calidad técnica?','Una escala de 1 a 5, registrando errores críticos por separado.','[]'::jsonb,true),
  (12::smallint,NULL::text,'short_answer'::text,'¿Cuántos errores conviene corregir a la vez en video?','Uno prioritario, el de mayor impacto.','[]'::jsonb,true),
  (12::smallint,NULL::text,'short_answer'::text,'¿Qué debe hacerse después de elegir un error principal?','Aplicar un drill correctivo y volver a grabar para reevaluar.','[]'::jsonb,true),
  (13::smallint,NULL::text,'short_answer'::text,'¿Qué cuatro elementos une un programa de entrenamiento según CPS?','Objetivo, sesiones, progresión y evaluación.','[]'::jsonb,true),
  (13::smallint,NULL::text,'short_answer'::text,'¿Qué prioridad tiene una semana de 3 días?','Priorizar las sesiones críticas y dejar el complemento como opcional.','[]'::jsonb,true),
  (13::smallint,NULL::text,'short_answer'::text,'¿Cómo se estructura una semana CPS de 5 días?','Tres sesiones críticas, una complementaria y una de recuperación/revisión.','[]'::jsonb,true),
  (13::smallint,NULL::text,'short_answer'::text,'¿Qué precaución se toma al entrenar 6 días?','Agregar trabajo suave o técnico sin duplicar intensidad.','[]'::jsonb,true),
  (13::smallint,NULL::text,'short_answer'::text,'¿Cuáles son los seis bloques de una sesión CPS?','Calentamiento, técnica, drill/aplicación, fuerza-potencia o conditioning, integración y vuelta a la calma/registro.','[]'::jsonb,true),
  (13::smallint,NULL::text,'short_answer'::text,'¿Cuánto dura la técnica principal en la sesión modelo de 60 minutos?','15 minutos.','[]'::jsonb,true),
  (13::smallint,NULL::text,'short_answer'::text,'¿Qué se trabaja en la semana 5 del programa CPS Fighter?','Defensa y contraataque.','[]'::jsonb,true),
  (13::smallint,NULL::text,'short_answer'::text,'¿Qué se trabaja en la semana 7 del programa CPS Fighter?','Reacción y decisión.','[]'::jsonb,true),
  (13::smallint,NULL::text,'short_answer'::text,'¿Cómo cierra la semana 8 del programa?','Con integración y evaluación final.','[]'::jsonb,true),
  (14::smallint,NULL::text,'short_answer'::text,'¿Por qué un error visible puede no ser la causa real del problema?','Porque puede ser consecuencia de distancia, apoyo, sincronización u otra falla anterior.','[]'::jsonb,true),
  (14::smallint,NULL::text,'short_answer'::text,'¿Qué corrección propone CPS para una guardia con pies juntos?','Marcar el ancho y congelar la postura.','[]'::jsonb,true),
  (14::smallint,NULL::text,'short_answer'::text,'¿Qué corrección propone para un jab que carga hacia atrás?','Salida directa desde la guardia.','[]'::jsonb,true),
  (14::smallint,NULL::text,'short_answer'::text,'¿Qué corrección propone para un cross ejecutado sólo con el brazo?','Separar pivote y rotación y después volver a integrarlos.','[]'::jsonb,true),
  (14::smallint,NULL::text,'short_answer'::text,'¿Qué corrección propone para un hook demasiado amplio?','Usar manopla cercana y una pared o restricción que limite el arco.','[]'::jsonb,true),
  (14::smallint,NULL::text,'short_answer'::text,'¿Qué corrección propone para un slip que dobla demasiado la cintura?','Usar cuerda y un desplazamiento mínimo.','[]'::jsonb,true),
  (14::smallint,NULL::text,'short_answer'::text,'¿Cuál es el ciclo correctivo CPS completo?','Observar, nombrar un error, simplificar la tarea, repetir lento, agregar velocidad y volver al contexto.','[]'::jsonb,true),
  (14::smallint,NULL::text,'short_answer'::text,'¿Qué significa la fórmula Restricción → Repetición → Contexto?','Limitar el error, estabilizar el patrón con repetición y después reintroducir una decisión real.','[]'::jsonb,true),
  (14::smallint,NULL::text,'short_answer'::text,'¿Por qué CPS corrige una prioridad a la vez?','Para no destruir la fluidez y poder medir si la corrección realmente funciona.','[]'::jsonb,true),
  (15::smallint,NULL::text,'short_answer'::text,'¿Qué funciones cumple el Coach CPS en el proceso de aprendizaje?','Organiza, observa, corrige, mide y adapta dentro de su alcance.','[]'::jsonb,true),
  (15::smallint,NULL::text,'short_answer'::text,'¿Cómo define CPS la maestría?','Ejecutar fundamentos bajo presión, elegir soluciones simples y transmitirlas con claridad.','[]'::jsonb,true),
  (15::smallint,NULL::text,'short_answer'::text,'¿Cuál es la secuencia del método de enseñanza CPS?','Demostrar, explicar, practicar, observar, corregir, repetir y evaluar.','[]'::jsonb,true),
  (15::smallint,NULL::text,'short_answer'::text,'¿Qué debe hacer un coach cuando un problema supera su competencia profesional?','Derivar al profesional correspondiente.','[]'::jsonb,true),
  (15::smallint,NULL::text,'short_answer'::text,'¿Qué no debe hacer un entrenador respecto de lesiones o medicación?','No diagnosticar lesiones ni prescribir medicación.','[]'::jsonb,true),
  (15::smallint,NULL::text,'short_answer'::text,'¿Qué acciones ayudan a construir legado dentro del sistema?','Crear biblioteca técnica, registrar progresiones, filmar ejemplos y actualizar materiales.','[]'::jsonb,true),
  (15::smallint,NULL::text,'short_answer'::text,'¿Qué debe poder hacer otra persona para que exista verdadero legado?','Entender y aplicar el sistema sin depender de explicaciones orales del creador.','[]'::jsonb,true),
  (15::smallint,NULL::text,'short_answer'::text,'¿Qué incluye la evaluación final respecto de planificación?','Construir una sesión y diseñar una semana combinando técnica, físico y recuperación.','[]'::jsonb,true),
  (15::smallint,NULL::text,'short_answer'::text,'¿Qué incluye la evaluación final respecto del análisis técnico?','Analizar un video y priorizar un error antes de proponer la corrección.','[]'::jsonb,true)
)
insert into public.cps_exam_items
  (tomo_no,route_code,question_type,prompt,expected_answer,options,active)
select tomo_no,route_code,question_type,prompt,expected_answer,options,active
from seed q
where not exists (
  select 1 from public.cps_exam_items e
  where e.tomo_no=q.tomo_no and e.prompt=q.prompt
);

do $$
declare
  v_bad text;
begin
  select string_agg(tomo_no::text || ':' || n::text, ', ' order by tomo_no)
  into v_bad
  from (
    select t.tomo_no, count(e.id) filter (where e.active) as n
    from generate_series(1,15) t(tomo_no)
    left join public.cps_exam_items e on e.tomo_no=t.tomo_no
    group by t.tomo_no
  ) s
  where n <> 10;

  if v_bad is not null then
    raise exception 'CPS_QUESTION_BANK_COUNT_INVALID %', v_bad;
  end if;
end $$;
