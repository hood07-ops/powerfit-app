export const CONSULTANT_RULES_VERSION = 'powerfit-consultant-v2'
export const CONSULTANT_SOURCES = Object.freeze([
  { id: 'acsm-2026', title: 'ACSM: individualización y entrenamiento de fuerza, 2026', url: 'https://acsm.org/resistance-training-guidelines-update-2026/' },
  { id: 'who-activity', title: 'OMS: actividad física por grupo de edad', url: 'https://www.who.int/initiatives/behealthy/physical-activity/' },
])

export const CONSULTANT_EQUIPMENT = Object.freeze({
  none: 'Sin materiales', bands: 'Bandas elásticas', dumbbells: 'Mancuernas', gym: 'Gimnasio completo',
})
const LEVELS = ['inicial', 'basico', 'intermedio', 'avanzado', 'competidor']
const GOALS = ['fighter', 'tenis', 'fuerza', 'perdida_grasa', 'cardio', 'casa_principiante']
const clean = (value, max = 240) => String(value || '').trim().slice(0, max)
const optionalInteger = (value, min, max) => {
  if (value === null || value === undefined || value === '') return null
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed >= min && parsed <= max ? parsed : null
}

export function normalizeConsultantProfile(input = {}) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) input = {}
  const equipmentMap = { 'sin materiales': 'none', bandas: 'bands', mancuernas: 'dumbbells', 'gimnasio completo': 'gym' }
  const equipment = equipmentMap[input.equipment] || input.equipment
  return {
    goal: GOALS.includes(input.goal) ? input.goal : null,
    priority: ['general', 'tecnica', 'fuerza', 'resistencia'].includes(input.priority) ? input.priority : 'general',
    level: LEVELS.includes(input.level) ? input.level : null,
    daysPerWeek: optionalInteger(input.daysPerWeek, 1, 7),
    durationMinutes: optionalInteger(input.durationMinutes, 20, 90),
    equipment: Object.hasOwn(CONSULTANT_EQUIPMENT, equipment) ? equipment : null,
    adultConfirmed: input.adultConfirmed === true,
    needsReview: input.needsReview === true,
    technicalSessions: optionalInteger(input.technicalSessions, 0, 14),
    target: clean(input.target),
    // A calendar date is declarative context, never a promise of performance.
    eventDate: typeof input.eventDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(input.eventDate) && !Number.isNaN(Date.parse(`${input.eventDate}T12:00:00Z`)) && new Date(`${input.eventDate}T12:00:00Z`).toISOString().slice(0, 10) === input.eventDate ? input.eventDate : null,
  }
}

export function assessConsultantReadiness(input = {}) {
  const profile = normalizeConsultantProfile(input)
  const missing = []
  if (!profile.goal) missing.push('objetivo principal')
  if (!profile.level) missing.push('nivel')
  if (!profile.daysPerWeek) missing.push('días por semana (1–7)')
  if (!profile.durationMinutes) missing.push('tiempo por sesión (20–90 minutos)')
  if (!profile.equipment) missing.push('equipamiento')
  if (!profile.adultConfirmed) missing.push('confirmación de que esta propuesta es para una persona adulta')
  return {
    profile, missing,
    state: profile.needsReview ? 'HUMAN_REQUIRED' : missing.length ? 'INTAKE_REQUIRED' : 'DRAFT_READY',
    canGenerate: !profile.needsReview && missing.length === 0,
    explanation: profile.needsReview
      ? 'La limitación indicada requiere revisión profesional antes de proponer ejercicios. No se ha contactado a un entrenador automáticamente.'
      : missing.length ? `Falta confirmar: ${missing.join(', ')}.` : 'Perfil suficiente para una propuesta general revisable; no constituye autorización clínica.',
  }
}

// Each option lists every piece of equipment it actually needs. Bodyweight is
// always available; chairs, benches, bars, anchors and medicine balls are not assumed.
const EXERCISES = {
  squat: [
    { id: 'goblet', name: 'Sentadilla goblet', requires: ['dumbbells'], cue: 'Usar una carga conocida que permita controlar todo el recorrido.' },
    { id: 'squat', name: 'Sentadilla sin carga', requires: [], cue: 'Recorrido cómodo y controlado; revisar la ejecución con el entrenador.' },
  ],
  hinge: [
    { id: 'db-hinge', name: 'Bisagra de cadera con mancuernas', requires: ['dumbbells'], cue: 'Mantener control del tronco; usar una carga previamente tolerada.' },
    { id: 'bridge', name: 'Puente de cadera en el suelo', requires: [], cue: 'Movimiento controlado, sin forzar el rango.' },
  ],
  push: [
    { id: 'floor-press', name: 'Press de suelo con mancuernas', requires: ['dumbbells'], cue: 'Preparar y finalizar cada serie de forma controlada.' },
    { id: 'wall-push', name: 'Flexión contra pared', requires: [], cue: 'Regular la distancia a la pared según el control del movimiento.' },
  ],
  pull: [
    { id: 'db-row', name: 'Remo con mancuerna sin banco', requires: ['dumbbells'], cue: 'Tronco estable; no compensar con giros.' },
    { id: 'band-pull', name: 'Apertura de banda al frente', requires: ['bands'], cue: 'Banda en buen estado; movimiento controlado sin anclajes improvisados.' },
    { id: 'scapula', name: 'Retracción escapular de pie sin carga', requires: [], cue: 'Trabajo de control escapular; no reemplaza un ejercicio de tracción con resistencia.' },
  ],
  trunk: [{ id: 'dead-bug', name: 'Dead bug controlado', requires: [], cue: 'Priorizar control del tronco y respiración.' }],
  combat: [{ id: 'shadow', name: 'Sombra técnica con desplazamiento', requires: [], cue: 'Sin contacto; usar técnicas conocidas. Detener el bloque si se pierde control técnico.' }],
  tennis: [{ id: 'lateral', name: 'Desplazamiento lateral y frenado técnico', requires: [], cue: 'Espacio despejado; velocidad que permita frenar con control.' }],
  aerobic: [{ id: 'march', name: 'Marcha continua en el lugar o caminata', requires: [], cue: 'Ritmo que permita hablar en frases; adaptar según tolerancia.' }],
}

function selectExercise(pattern, equipment) {
  const available = equipment === 'gym' ? ['bands', 'dumbbells'] : [equipment]
  const exercise = EXERCISES[pattern].find((item) => item.requires.every((value) => available.includes(value)))
  return { ...exercise, pattern, requires: [...exercise.requires] }
}

const PATTERNS = {
  fighter: ['squat', 'push', 'pull', 'trunk', 'combat'],
  tenis: ['hinge', 'push', 'pull', 'trunk', 'tennis'],
  fuerza: ['squat', 'hinge', 'push', 'pull', 'trunk'],
  perdida_grasa: ['squat', 'push', 'pull', 'hinge', 'aerobic'],
  cardio: ['aerobic', 'squat', 'pull', 'trunk', 'aerobic'],
  casa_principiante: ['squat', 'push', 'hinge', 'pull', 'aerobic'],
}

export function generateAdaptiveSession(input, { sessionIndex = 0 } = {}) {
  const readiness = assessConsultantReadiness(input)
  if (!readiness.canGenerate) return { ok: false, ...readiness, session: null }
  const p = readiness.profile
  const warmupMinutes = p.durationMinutes <= 30 ? 4 : 6
  const cooldownMinutes = p.durationMinutes <= 30 ? 3 : 4
  const mainMinutes = p.durationMinutes - warmupMinutes - cooldownMinutes
  const patterns = [...PATTERNS[p.goal]]
  if (['fighter', 'tenis'].includes(p.goal) && p.priority === 'resistencia') patterns[3] = 'aerobic'
  if (['fighter', 'tenis'].includes(p.goal) && p.priority === 'tecnica') patterns[0] = p.goal === 'fighter' ? 'combat' : 'tennis'
  if (sessionIndex % 2 === 1) [patterns[0], patterns[1]] = [patterns[1], patterns[0]]
  const exercises = patterns.map((pattern, index) => {
    const timeBudgetMinutes = Math.floor(mainMinutes / patterns.length) + (index < mainMinutes % patterns.length ? 1 : 0)
    return {
      ...selectExercise(pattern, p.equipment),
      timeBudgetMinutes,
      prescription: ['aerobic', 'combat', 'tennis'].includes(pattern)
        ? 'Alternar práctica y recuperación dentro del tiempo disponible, manteniendo control y sin buscar agotamiento.'
        : `Hasta ${['inicial', 'basico'].includes(p.level) ? 2 : 3} series de práctica de 6–10 repeticiones controladas, solo si caben con descanso cómodo. No es obligatorio completar el máximo.`,
    }
  })
  return {
    ok: true, ...readiness,
    session: {
      version: CONSULTANT_RULES_VERSION,
      goal: p.goal, priority: p.priority, target: p.target, durationMinutes: p.durationMinutes,
      warmup: { minutes: warmupMinutes, description: 'Marcha suave y ensayo sin carga de los movimientos de la sesión.' },
      exercises,
      cooldown: { minutes: cooldownMinutes, description: 'Bajar el ritmo y registrar esfuerzo, molestias y ejecución.' },
      load: 'Sin kilos automáticos ni porcentajes de RM. Usar resistencias ya toleradas y confirmar la carga con el entrenador.',
      notes: [
        'Los minutos son presupuestos de práctica y descanso, no trabajo continuo obligatorio.',
        'Con síntomas o dolor, detener la propuesta y solicitar revisión profesional.',
        p.equipment === 'none' ? 'El control escapular sin material no sustituye la tracción cargada: revisar esta limitación al organizar el programa.' : 'El material declarado debe estar disponible y en buen estado.',
        'Las dosis y selección exacta son reglas conservadoras de PowerFit para revisión, no una prescripción atribuida a las fuentes generales.',
      ],
      sources: CONSULTANT_SOURCES,
    },
  }
}

export function buildAdaptiveMicrocycle(input, { now = new Date() } = {}) {
  const readiness = assessConsultantReadiness(input)
  if (!readiness.canGenerate) return { ok: false, ...readiness, days: [], weeks: [] }
  const p = readiness.profile
  const slots = { 1: [0], 2: [0, 3], 3: [0, 2, 4], 4: [0, 2, 4, 6], 5: [0, 1, 3, 4, 6], 6: [0, 1, 2, 4, 5, 6], 7: [0, 1, 2, 3, 4, 5, 6] }[p.daysPerWeek]
  const strengthSlots = slots.filter((_, index) => index % 2 === 0).slice(0, 3)
  const days = Array.from({ length: 7 }, (_, day) => {
    const scheduled = slots.includes(day)
    const physical = strengthSlots.includes(day)
    return {
      day: day + 1,
      type: !scheduled ? 'recovery' : physical ? 'physical' : 'easy',
      focus: !scheduled ? 'Descanso o actividad habitual según tolerancia.' : physical ? 'Preparación física según el objetivo.' : ['fighter', 'tenis'].includes(p.goal) ? 'Técnica conocida sin contacto; coordinar con la práctica deportiva existente.' : 'Actividad fácil elegida por la persona y revisión de técnica.',
      durationMinutes: scheduled ? p.durationMinutes : 0,
      session: physical ? generateAdaptiveSession(p, { sessionIndex: strengthSlots.indexOf(day) }).session : null,
    }
  })
  const daysToEvent = p.eventDate ? Math.ceil((Date.parse(`${p.eventDate}T12:00:00Z`) - now.getTime()) / 86400000) : null
  return {
    ok: true, ...readiness, days,
    weeks: [
      { week: 1, focus: 'Calibrar', condition: 'Confirmar ejecución, tolerancia y disponibilidad; no realizar pruebas máximas.' },
      { week: 2, focus: 'Consolidar', condition: 'Repetir y comparar registros antes de decidir cambios.' },
      { week: 3, focus: 'Ajuste revisable', condition: 'Solo si la respuesta es estable y el entrenador lo valida, cambiar una variable; no aumentar automáticamente.' },
      { week: 4, focus: 'Evaluar', condition: 'Revisar adherencia y respuesta; mantener, simplificar o reorganizar según datos reales.' },
    ],
    warnings: [
      p.technicalSessions === null ? 'Falta indicar otras sesiones técnicas o deportivas; este borrador puede solaparse con ellas.' : `${p.technicalSessions} sesiones deportivas adicionales declaradas: coordinar horarios y carga antes de aplicar el calendario.`,
      p.daysPerWeek === 1 ? 'Un día disponible limita la distribución; no se agregan días que la persona no declaró.' : 'Los días disponibles no se convierten automáticamente en días exigentes.',
      daysToEvent !== null ? daysToEvent < 0 ? 'La fecha del evento ya pasó; confirmar una nueva fecha.' : daysToEvent <= 14 ? 'Evento próximo: el entrenador debe revisar la propuesta. No se aplica una puesta a punto automática.' : 'La fecha del evento es contexto declarado, no garantía de preparación ni de resultados.' : 'Sin fecha de competencia confirmada.',
    ],
    sources: CONSULTANT_SOURCES,
  }
}

export function analyzeCompletedTraining(records = []) {
  if (!Array.isArray(records)) records = []
  const valid = records.filter((record) => record?.status === 'completed' && typeof record.durationMinutes === 'number' && Number.isFinite(record.durationMinutes) && record.durationMinutes > 0 && record.durationMinutes <= 300 && typeof record.srpe === 'number' && Number.isFinite(record.srpe) && record.srpe >= 1 && record.srpe <= 10)
  const totalMinutes = valid.reduce((sum, item) => sum + item.durationMinutes, 0)
  const totalLoad = valid.reduce((sum, item) => sum + item.durationMinutes * item.srpe, 0)
  const needsReview = records.some((item) => item?.reportedConcern === true)
  return {
    sampleSize: valid.length, rejected: records.length - valid.length, totalMinutes,
    totalLoad: Math.round(totalLoad),
    averageSrpe: valid.length ? Math.round(valid.reduce((sum, item) => sum + item.srpe, 0) / valid.length * 10) / 10 : null,
    recommendation: needsReview ? 'human_review' : valid.length < 3 ? 'collect_more_data' : 'review_before_adjusting',
    explanation: needsReview ? 'Existe una molestia declarada en sesiones completadas; solicitar revisión.' : valid.length < 3 ? 'Muestra insuficiente para sugerir progresión; registrar respuesta a más sesiones comparables.' : 'Hay registros para revisión. La carga sRPE es descriptiva y no determina por sí sola si debes progresar ni predice lesiones.',
  }
}

export function formatAdaptiveSession(session) {
  const labels = { fighter: 'Deportes de combate', tenis: 'Tenis', fuerza: 'Fuerza', perdida_grasa: 'Pérdida de grasa', cardio: 'Resistencia', casa_principiante: 'Inicio en casa' }
  return [
    `SESIÓN ADAPTADA POWERFIT · ${session.durationMinutes} minutos`,
    `Objetivo: ${labels[session.goal] || session.goal}`,
    `Prioridad: ${session.priority}${session.target ? ` · Meta declarada: ${session.target}` : ''}`,
    `Preparación · ${session.warmup.minutes} min: ${session.warmup.description}`,
    ...session.exercises.map((item, index) => `${index + 1}. ${item.name} · hasta ${item.timeBudgetMinutes} min\n${item.prescription}\nCriterio: ${item.cue}`),
    `Cierre · ${session.cooldown.minutes} min: ${session.cooldown.description}`,
    session.load, ...session.notes,
    'Fuentes generales (no validan la dosis individual):', ...session.sources.map((source) => `${source.title}: ${source.url}`),
  ].join('\n\n')
}
