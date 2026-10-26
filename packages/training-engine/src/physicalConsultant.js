// Local, reviewable coaching rules. No network, clinical assessment or account actions.
export const PHYSICAL_GOALS = Object.freeze({
  fighter: {
    label: 'Rendimiento en deportes de combate',
    focus: 'Relacionar preparación física con la técnica, los desplazamientos y la demanda de los rounds.',
    priorities: ['Calidad técnica y control de la postura.', 'Transferencia de fuerza y rotación al gesto deportivo.', 'Acondicionamiento específico según las sesiones técnicas.'],
    metrics: ['Calidad técnica al final del round.', 'Rounds completados y esfuerzo percibido con una tarea comparable.'],
    question: '¿Qué deporte practicas y buscas técnica, potencia o sostener mejor los rounds? ¿Tienes fecha de competencia?',
  },
  tenis: {
    label: 'Rendimiento en tenis',
    focus: 'Relacionar fuerza, aceleración, frenado y rotación con las demandas de la cancha.',
    priorities: ['Desplazamientos y frenado con control.', 'Transferencia de fuerza entre piernas, tronco y golpe.', 'Coordinar la preparación física con partidos y práctica técnica.'],
    metrics: ['Calidad de los desplazamientos en una tarea repetible.', 'Esfuerzo percibido y recuperación tras sesiones comparables.'],
    question: '¿Qué quieres mejorar en cancha y cuántas prácticas o partidos tienes por semana?',
  },
  fuerza: {
    label: 'Mejorar fuerza',
    focus: 'Progresar en movimientos concretos con técnica consistente y registro de las cargas.',
    priorities: ['Elegir los movimientos que quieres mejorar.', 'Registrar carga, repeticiones y calidad de ejecución.', 'Ajustar una variable por vez después de revisar la respuesta a la sesión anterior.'],
    metrics: ['Carga y repeticiones con técnica comparable.', 'Esfuerzo percibido en el mismo ejercicio.'],
    question: '¿En qué movimientos buscas ganar fuerza? ¿Tienes cargas recientes verificadas?',
  },
  perdida_grasa: {
    label: 'Pérdida de grasa',
    focus: 'Construir una rutina sostenible y revisar tendencias sin prometer una cantidad de kilos ni una fecha de resultado.',
    priorities: ['Adherencia al entrenamiento y actividad habitual.', 'Mantener trabajo de fuerza adaptado a tu experiencia.', 'Revisar recuperación y coordinar el objetivo nutricional con un profesional competente.'],
    metrics: ['Sesiones realizadas frente a las previstas.', 'Tendencia de medidas registradas voluntariamente y rendimiento.'],
    question: '¿Cómo es tu actividad actual y qué rutina puedes mantener de forma realista?',
  },
  cardio: {
    label: 'Mejorar resistencia',
    focus: 'Usar una actividad repetible para comparar tolerancia al esfuerzo y progresar según la respuesta individual.',
    priorities: ['Definir la actividad y la demanda que quieres sostener.', 'Registrar duración y esfuerzo percibido.', 'Revisar la recuperación antes de aumentar la exigencia.'],
    metrics: ['Duración o distancia en condiciones comparables.', 'Esfuerzo percibido para la misma tarea.'],
    question: '¿Qué actividad quieres sostener mejor y cuánto haces actualmente?',
  },
  casa_principiante: {
    label: 'Comenzar en casa sin materiales',
    focus: 'Crear el hábito y aprender movimientos que puedas realizar en tu espacio.',
    priorities: ['Control de movimientos básicos.', 'Regularidad antes de aumentar la dificultad.', 'Comprobar que el espacio y los apoyos sean adecuados.'],
    metrics: ['Sesiones completadas.', 'Control y confianza en los mismos movimientos.'],
    question: '¿Qué espacio tienes y cuál es tu experiencia con ejercicios en casa?',
  },
})

export function buildPhysicalConsultation({ goal, level, daysPerWeek, durationMinutes, equipment, historyCount = 0, rmCount = 0, needsReview = false } = {}) {
  const strategy = PHYSICAL_GOALS[goal]
  if (!strategy) return null
  const knownLevel = ['inicial', 'basico', 'intermedio', 'avanzado', 'competidor'].includes(level)
  const days = Number.isInteger(daysPerWeek) && daysPerWeek >= 1 && daysPerWeek <= 7 ? daysPerWeek : null
  const minutes = Number.isInteger(durationMinutes) && durationMinutes >= 10 && durationMinutes <= 180 ? durationMinutes : null
  return {
    goal,
    ...strategy,
    needsReview,
    level: knownLevel ? level : null,
    approach: !knownLevel
      ? 'Falta confirmar tu nivel antes de concretar volumen, intensidad y ejercicios.'
      : ['inicial', 'basico'].includes(level)
        ? 'Priorizar aprendizaje y regularidad; revisar la ejecución antes de aumentar la exigencia.'
        : 'Partir de lo que ya toleras, contrastar con el historial y ajustar una variable por vez.',
    evidence: [
      days && minutes ? `Disponibilidad declarada: ${days} días por semana, ${minutes} minutos por sesión.` : 'Disponibilidad semanal y duración por confirmar.',
      equipment ? `Equipamiento declarado: ${equipment}.` : 'Equipamiento por confirmar: no se asume acceso a gimnasio.',
      Number(historyCount) > 0 ? `${Number(historyCount)} planificaciones disponibles para revisión; no equivalen a sesiones realizadas.` : 'Sin historial de planificaciones disponible en esta vista.',
      Number(rmCount) > 0 ? `${Number(rmCount)} registros de RM disponibles; no se ha verificado su vigencia.` : 'Sin RM verificados: no se prescriben kilos desde esta asesoría.',
    ],
    nextQuestions: [
      strategy.question,
      !knownLevel ? '¿Tu nivel actual es inicial, básico, intermedio o avanzado?' : null,
      !days ? '¿Cuántos días por semana puedes entrenar?' : null,
      !minutes ? '¿Cuántos minutos tienes por sesión?' : null,
      !equipment ? '¿Qué equipamiento puedes usar?' : null,
      '¿Hay limitaciones o molestias pendientes de revisar con tu entrenador?',
    ].filter(Boolean),
    review: needsReview
      ? 'Se necesita revisión del entrenador antes de generar o progresar una sesión. Esta pantalla no contacta a un profesional automáticamente.'
      : 'Propuesta orientativa para revisar con tu entrenador. No garantiza resultados ni sustituye una evaluación individual.',
    source: 'Reglas locales PowerFit · preparación física v1 · propuesta para revisión',
  }
}

export function formatPhysicalConsultation(report) {
  if (!report) return ''
  return [
    `ASESORÍA DE PREPARACIÓN FÍSICA · ${report.label}`,
    `Nivel: ${report.level || 'por confirmar'}`,
    report.focus,
    report.approach,
    'Prioridades:', ...report.priorities.map((text) => `- ${text}`),
    'Cómo revisar el progreso:', ...report.metrics.map((text) => `- ${text}`),
    'Datos disponibles:', ...report.evidence.map((text) => `- ${text}`),
    'Antes de afinar la planificación:', ...report.nextQuestions.map((text) => `- ${text}`),
    report.review,
    `Fuente: ${report.source}`,
  ].join('\n')
}

const GOAL_PATTERNS = {
  fighter: /\b(boxeo|boxear|kickboxing|combate|fighter|rounds|mma)\b/,
  tenis: /\b(tenis|tennis)\b/,
  fuerza: /\b(fuerza|strength)\b/,
  perdida_grasa: /\b(adelgazar|perder grasa|perdida de grasa|bajar de peso|perdida_grasa)\b/,
  cardio: /\b(cardio|resistencia|resistir|correr)\b/,
  casa_principiante: /\b(empezar en casa|entrenar en casa|casa_principiante)\b/,
}

export function respondToPhysicalConsultation({ message, previousGoal = null, profile = {}, level = null } = {}) {
  const normalized = String(message || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
  const goals = Object.entries(GOAL_PATTERNS).filter(([, pattern]) => pattern.test(normalized)).map(([goal]) => goal)
  const trainingIntent = /objetivo|preparador|entren|progres|planifica|rutina|quiero mejorar|ganar|consultor/.test(normalized)
  // Account/navigation questions continue to the existing authorized chat service.
  if (/\b(pago|pagar|mensualidad|generaciones|credito|subir|video|cps|tomo)\b/.test(normalized)) return null
  const daysMatch = normalized.match(/\b([1-7])\s*(?:dias|veces)\b/)
  const minutesMatch = normalized.match(/\b(\d{2,3})\s*min/)
  const levelMatch = normalized.match(/\b(inicial|principiante|basico|intermedio|avanzado|competidor)\b/)
  const equipment = /\bsin material(?:es)?\b/.test(normalized) ? 'sin materiales'
    : /\b(mancuernas|bandas|gimnasio completo)\b/.exec(normalized)?.[0]
  const intakeReply = previousGoal && (daysMatch || minutesMatch || levelMatch || equipment)
  if (!goals.length && !trainingIntent && !intakeReply && !previousGoal) return null
  if (!goals.length && !trainingIntent && !intakeReply && !/dolor|lesion|mareo|desmayo|sintomas/.test(normalized)) return null
  const concernText = normalized.replace(/\bsin (dolor|lesiones|lesion)\b/g, '')
  if (/\b(dolor|lesion|lesiones|mareo|desmayo|sintomas)\b/.test(concernText)) {
    return { goal: previousGoal, needsReview: true, reply: 'Para adaptar una planificación con molestias o una lesión, solicita una evaluación al profesional competente y revisión de tu entrenador. No voy a proponer cargas ni ejercicios para tratar esos síntomas. No se ha enviado ninguna solicitud ni mensaje automáticamente.' }
  }
  if (goals.length > 1 || /\b(no quiero|no busco|ya no)\b/.test(normalized)) {
    return { goal: null, reply: 'Antes de orientar la preparación, confirma un objetivo principal: combate, tenis, fuerza, pérdida de grasa, resistencia o empezar en casa. Podemos coordinar objetivos secundarios después.' }
  }
  const goal = goals[0] || previousGoal
  const nextProfile = {
    ...profile,
    ...(daysMatch ? { daysPerWeek: Number(daysMatch[1]) } : {}),
    ...(minutesMatch ? { durationMinutes: Number(minutesMatch[1]) } : {}),
    ...(equipment ? { equipment } : {}),
    ...(levelMatch ? { level: levelMatch[1] === 'principiante' ? 'inicial' : levelMatch[1] } : {}),
  }
  const report = buildPhysicalConsultation({ ...nextProfile, goal, level: nextProfile.level || level })
  return { goal: goal || null, profile: nextProfile, reply: report ? formatPhysicalConsultation(report) : 'Para orientarte como preparador físico, dime tu objetivo principal, nivel actual, días y minutos disponibles, equipamiento y limitaciones. ¿Qué quieres mejorar primero?' }
}
