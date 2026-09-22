export const TECHNICAL_SPORTS = [
  { value: 'boxeo', label: 'Boxeo' },
  { value: 'kickboxing', label: 'Kickboxing' },
  { value: 'k1', label: 'K1' },
]


export const COMBAT_STAGES = {
  boxeo: [
    { value: 'boxing_1', label: 'Boxeo Nivel 1', order: 1 },
    { value: 'boxing_2', label: 'Boxeo Nivel 2', order: 2 },
    { value: 'boxing_3', label: 'Boxeo Nivel 3', order: 3 },
    { value: 'boxing_4', label: 'Boxeo Nivel 4', order: 4 },
    { value: 'boxing_5', label: 'Boxeo Nivel 5', order: 5 },
    { value: 'boxing_6', label: 'Boxeo Nivel 6', order: 6 },
    { value: 'boxing_7', label: 'Boxeo Nivel 7', order: 7 },
  ],
  kickboxing: [
    { value: 'kick_blanco', label: 'Kickboxing Blanco', order: 1 },
    { value: 'kick_naranjo', label: 'Kickboxing Naranjo', order: 2 },
    { value: 'kick_verde', label: 'Kickboxing Verde', order: 3 },
    { value: 'kick_azul', label: 'Kickboxing Azul', order: 4 },
    { value: 'kick_cafe', label: 'Kickboxing Café', order: 5 },
    { value: 'kick_cafe_negro', label: 'Kickboxing Café-Negro', order: 6 },
    { value: 'kick_negro', label: 'Kickboxing Negro', order: 7 },
  ],
  k1: [
    { value: 'k1_blanco', label: 'K1 Blanco', order: 1 },
    { value: 'k1_naranjo', label: 'K1 Naranjo', order: 2 },
    { value: 'k1_verde', label: 'K1 Verde', order: 3 },
    { value: 'k1_azul', label: 'K1 Azul', order: 4 },
    { value: 'k1_cafe', label: 'K1 Café', order: 5 },
    { value: 'k1_cafe_negro', label: 'K1 Café-Negro', order: 6 },
    { value: 'k1_negro', label: 'K1 Negro', order: 7 },
  ],
}

// Currículo interno del generador. No se presenta al alumno en Mi Camino.
// Cada grado/nivel acumula los objetivos anteriores y habilita mayor complejidad.
const STAGE_CURRICULUM = {
  boxing_1: { goals: ['control_distancia', 'entrar_salir', 'iniciar_ataque'], skills: ['jab', 'cross', 'step_forward', 'step_back'] },
  boxing_2: { goals: ['combinar', 'defender_rectos'], skills: ['lead_hook', 'rear_hook', 'parry', 'slip_left', 'slip_right'] },
  boxing_3: { goals: ['defender_combinacion', 'contra_recto_izq'], skills: ['cover', 'lead_uppercut', 'rear_uppercut', 'pivot_left', 'pivot_right'] },
  boxing_4: { goals: ['contra_despues_defensa', 'crear_angulo'], skills: ['angle', 'jab_body', 'cross_body', 'lead_body_hook', 'rear_body_hook'] },
  boxing_5: { goals: ['salir_presion', 'ataque_defensa_salida'], skills: ['lead_body_uppercut', 'rear_body_uppercut', 'step_left', 'step_right'] },
  boxing_6: { goals: ['provocar_defender_contra'], skills: [] },
  boxing_7: { goals: ['control_distancia', 'entrar_salir', 'combinar', 'contra_despues_defensa', 'crear_angulo', 'salir_presion', 'ataque_defensa_salida', 'provocar_defender_contra'], skills: [] },

  kick_blanco: { goals: ['control_distancia', 'entrar_salir', 'iniciar_ataque'], skills: ['jab', 'cross', 'step_forward', 'step_back', 'teep'] },
  kick_naranjo: { goals: ['combinar', 'defender_rectos'], skills: ['lead_hook', 'rear_hook', 'low_kick_left', 'low_kick_right', 'parry'] },
  kick_verde: { goals: ['defender_combinacion', 'contra_recto_izq'], skills: ['middle_kick_left', 'middle_kick_right', 'slip_left', 'slip_right', 'cover'] },
  kick_azul: { goals: ['contra_despues_defensa', 'crear_angulo'], skills: ['high_kick_left', 'high_kick_right', 'pivot_left', 'pivot_right', 'angle'] },
  kick_cafe: { goals: ['salir_presion', 'ataque_defensa_salida'], skills: ['knee_front', 'step_left', 'step_right'] },
  kick_cafe_negro: { goals: ['provocar_defender_contra'], skills: [] },
  kick_negro: { goals: ['control_distancia', 'entrar_salir', 'combinar', 'contra_despues_defensa', 'crear_angulo', 'salir_presion', 'ataque_defensa_salida', 'provocar_defender_contra'], skills: [] },

  k1_blanco: { goals: ['control_distancia', 'entrar_salir', 'iniciar_ataque'], skills: ['jab', 'cross', 'step_forward', 'step_back', 'teep'] },
  k1_naranjo: { goals: ['combinar', 'defender_rectos'], skills: ['lead_hook', 'rear_hook', 'low_kick_left', 'low_kick_right', 'parry'] },
  k1_verde: { goals: ['defender_combinacion', 'contra_recto_izq'], skills: ['middle_kick_left', 'middle_kick_right', 'slip_left', 'slip_right', 'cover'] },
  k1_azul: { goals: ['contra_despues_defensa', 'crear_angulo'], skills: ['high_kick_left', 'high_kick_right', 'pivot_left', 'pivot_right', 'angle'] },
  k1_cafe: { goals: ['salir_presion', 'ataque_defensa_salida'], skills: ['knee_front', 'step_left', 'step_right'] },
  k1_cafe_negro: { goals: ['provocar_defender_contra'], skills: [] },
  k1_negro: { goals: ['control_distancia', 'entrar_salir', 'combinar', 'contra_despues_defensa', 'crear_angulo', 'salir_presion', 'ataque_defensa_salida', 'provocar_defender_contra'], skills: [] },
}

function stageOrder(stageId, sport) {
  const list = COMBAT_STAGES[sport] || COMBAT_STAGES.boxeo
  return list.find((item) => item.value === stageId)?.order || 1
}

function accumulatedCurriculum(stageId, sport) {
  const list = COMBAT_STAGES[sport] || COMBAT_STAGES.boxeo
  const maxOrder = stageOrder(stageId, sport)
  const goals = new Set()
  const skills = new Set()
  list.filter((stage) => stage.order <= maxOrder).forEach((stage) => {
    const item = STAGE_CURRICULUM[stage.value]
    ;(item?.goals || []).forEach((goal) => goals.add(goal))
    ;(item?.skills || []).forEach((skill) => skills.add(skill))
  })
  return { goals: [...goals], skills: [...skills] }
}

export function goalsForCombatStage(sport, stageId) {
  const allowed = accumulatedCurriculum(stageId, sport).goals
  return WEEKLY_GOALS.filter((goal) => allowed.includes(goal.value))
}

export const WEEKLY_LEVELS = [
  { value: 'basico', label: 'Básico' },
  { value: 'intermedio', label: 'Intermedio' },
  { value: 'avanzado', label: 'Avanzado' },
  { value: 'competitivo', label: 'Competitivo' },
]

export const WEEKLY_GOALS = [
  { value: 'control_distancia', label: 'Controlar distancia', axis: 'Desplazamiento' },
  { value: 'entrar_salir', label: 'Entrar y salir sin recibir', axis: 'Desplazamiento' },
  { value: 'iniciar_ataque', label: 'Iniciar ataque con seguridad', axis: 'Ataque' },
  { value: 'combinar', label: 'Combinar ataque y salida', axis: 'Ataque' },
  { value: 'defender_rectos', label: 'Defender rectos y reposicionarse', axis: 'Defensa' },
  { value: 'defender_combinacion', label: 'Defender combinaciones', axis: 'Defensa' },
  { value: 'contra_recto_izq', label: 'Contraatacar el recto izquierda', axis: 'Contraataque' },
  { value: 'contra_despues_defensa', label: 'Contraatacar después de defender', axis: 'Contraataque' },
  { value: 'crear_angulo', label: 'Crear ángulos', axis: 'Desplazamiento' },
  { value: 'salir_presion', label: 'Salir de presión', axis: 'Desplazamiento' },
  { value: 'ataque_defensa_salida', label: 'Ataque + defensa + salida', axis: 'Integración' },
  { value: 'provocar_defender_contra', label: 'Provocar + defender + contraatacar', axis: 'Integración' },
]

export const DRILL_TYPES = {
  tecnico: 'Drill técnico',
  repeticion: 'Drill de repetición',
  desplazamiento: 'Drill de desplazamiento',
  companero: 'Drill con compañero',
  cooperativo: 'Drill cooperativo',
  reactivo: 'Drill reactivo',
  decision: 'Drill de decisión',
  situacional: 'Drill situacional',
  integracion: 'Drill de integración',
  sparring_condicionado: 'Sparring condicionado',
  sparring_libre: 'Sparring libre',
}

const NAMES = {
  jab: 'Recto izquierda (jab)',
  cross: 'Recto derecha (cross)',
  lead_hook: 'Cruzado izquierda',
  rear_hook: 'Cruzado derecha',
  lead_uppercut: 'Gancho izquierda al mentón',
  rear_uppercut: 'Gancho derecha al mentón',
  lead_body_uppercut: 'Gancho izquierda al estómago',
  rear_body_uppercut: 'Gancho derecha al estómago',
  jab_body: 'Recto izquierda al cuerpo',
  cross_body: 'Recto derecha al cuerpo',
  lead_body_hook: 'Cruzado izquierda al cuerpo',
  rear_body_hook: 'Cruzado derecha al cuerpo',
  parry: 'Parada',
  slip_left: 'Esquiva izquierda',
  slip_right: 'Esquiva derecha',
  cover: 'Cobertura',
  block_high: 'Bloqueo alto',
  step_forward: 'Avance',
  step_back: 'Retroceso',
  step_left: 'Desplazamiento izquierda',
  step_right: 'Desplazamiento derecha',
  pivot_left: 'Pivote izquierda',
  pivot_right: 'Pivote derecha',
  angle: 'Cambio de ángulo',
  teep: 'Patada frontal (teep)',
  low_kick_left: 'Patada baja izquierda',
  low_kick_right: 'Patada baja derecha',
  middle_kick_left: 'Patada media izquierda',
  middle_kick_right: 'Patada media derecha',
  high_kick_left: 'Patada alta izquierda',
  high_kick_right: 'Patada alta derecha',
  knee_front: 'Rodilla frontal',
}

const GOAL_LIBRARY = {
  control_distancia: {
    dominant: 'Desplazamiento',
    secondary: ['Ataque', 'Defensa'],
    boxing: ['jab', 'step_forward', 'step_back', 'pivot_left', 'pivot_right'],
    kickboxing: ['jab', 'teep', 'step_back', 'pivot_left', 'low_kick_right'],
    k1: ['jab', 'teep', 'step_back', 'pivot_left', 'low_kick_right'],
    chain: ['jab', 'step_back', 'jab', 'pivot_left'],
    sparring: 'Puntúa solo si controla la distancia y termina fuera del alcance rival.',
  },
  entrar_salir: {
    dominant: 'Desplazamiento',
    secondary: ['Ataque', 'Defensa'],
    boxing: ['step_forward', 'jab', 'cross', 'step_back', 'pivot_left'],
    kickboxing: ['step_forward', 'jab', 'cross', 'low_kick_right', 'step_back'],
    k1: ['step_forward', 'jab', 'cross', 'low_kick_right', 'pivot_left'],
    chain: ['step_forward', 'jab', 'cross', 'pivot_left'],
    sparring: 'La acción puntúa solo si el atleta entra, golpea y sale sin recibir.',
  },
  iniciar_ataque: {
    dominant: 'Ataque',
    secondary: ['Desplazamiento', 'Integración'],
    boxing: ['jab', 'cross', 'lead_hook', 'step_forward', 'pivot_left'],
    kickboxing: ['jab', 'cross', 'low_kick_right', 'teep', 'step_forward'],
    k1: ['jab', 'cross', 'low_kick_right', 'knee_front', 'step_forward'],
    chain: ['jab', 'cross', 'lead_hook', 'pivot_left'],
    sparring: 'El atacante debe iniciar con una entrada ordenada y terminar reposicionado.',
  },
  combinar: {
    dominant: 'Ataque',
    secondary: ['Integración', 'Desplazamiento'],
    boxing: ['jab', 'cross', 'lead_hook', 'rear_uppercut', 'pivot_left'],
    kickboxing: ['jab', 'cross', 'lead_hook', 'low_kick_right', 'middle_kick_left'],
    k1: ['jab', 'cross', 'lead_hook', 'low_kick_right', 'knee_front'],
    chain: ['jab', 'cross', 'lead_hook', 'pivot_left'],
    sparring: 'Solo puntúan combinaciones de al menos tres acciones que terminen con salida o ángulo.',
  },
  defender_rectos: {
    dominant: 'Defensa',
    secondary: ['Contraataque', 'Desplazamiento'],
    boxing: ['parry', 'slip_left', 'slip_right', 'step_back', 'cross'],
    kickboxing: ['parry', 'slip_left', 'slip_right', 'step_back', 'cross'],
    k1: ['parry', 'slip_left', 'slip_right', 'step_back', 'cross'],
    chain: ['parry', 'cross', 'pivot_left'],
    sparring: 'El defensor puntúa si evita el recto y sale o responde de forma controlada.',
  },
  defender_combinacion: {
    dominant: 'Defensa',
    secondary: ['Desplazamiento', 'Contraataque'],
    boxing: ['cover', 'slip_left', 'slip_right', 'step_back', 'pivot_left'],
    kickboxing: ['cover', 'block_high', 'step_back', 'pivot_left', 'parry'],
    k1: ['cover', 'block_high', 'step_back', 'pivot_left', 'parry'],
    chain: ['cover', 'slip_right', 'pivot_left'],
    sparring: 'El atacante lanza 2-4 acciones y el defensor debe cerrar la secuencia con salida o contraataque.',
  },
  contra_recto_izq: {
    dominant: 'Contraataque',
    secondary: ['Defensa', 'Decisión'],
    boxing: ['parry', 'slip_right', 'cross', 'lead_hook', 'pivot_left'],
    kickboxing: ['parry', 'slip_right', 'cross', 'low_kick_right', 'pivot_left'],
    k1: ['parry', 'slip_right', 'cross', 'low_kick_right', 'knee_front'],
    chain: ['parry', 'cross', 'lead_hook', 'pivot_left'],
    sparring: 'El punto vale únicamente si nace después de defender correctamente el recto izquierda rival.',
  },
  contra_despues_defensa: {
    dominant: 'Contraataque',
    secondary: ['Defensa', 'Integración'],
    boxing: ['parry', 'cover', 'slip_right', 'cross', 'lead_hook'],
    kickboxing: ['parry', 'cover', 'cross', 'low_kick_right', 'middle_kick_left'],
    k1: ['parry', 'cover', 'cross', 'low_kick_right', 'knee_front'],
    chain: ['slip_right', 'cross', 'lead_hook', 'pivot_left'],
    sparring: 'No se permite iniciar el ataque: se puntúa al defender y contraatacar con control.',
  },
  crear_angulo: {
    dominant: 'Desplazamiento',
    secondary: ['Ataque', 'Integración'],
    boxing: ['jab', 'cross', 'pivot_left', 'pivot_right', 'angle'],
    kickboxing: ['jab', 'cross', 'pivot_left', 'angle', 'low_kick_right'],
    k1: ['jab', 'cross', 'pivot_left', 'angle', 'low_kick_right'],
    chain: ['jab', 'cross', 'pivot_left', 'lead_hook'],
    sparring: 'Punto extra por atacar desde un ángulo creado con pivote o desplazamiento lateral.',
  },
  salir_presion: {
    dominant: 'Desplazamiento',
    secondary: ['Defensa', 'Contraataque'],
    boxing: ['cover', 'step_back', 'step_left', 'step_right', 'pivot_left'],
    kickboxing: ['cover', 'step_back', 'step_left', 'pivot_left', 'teep'],
    k1: ['cover', 'step_back', 'step_left', 'pivot_left', 'teep'],
    chain: ['cover', 'step_left', 'pivot_left', 'jab'],
    sparring: 'El defensor comienza cerca de cuerdas y debe salir lateralmente sin cruzar los pies.',
  },
  ataque_defensa_salida: {
    dominant: 'Integración',
    secondary: ['Ataque', 'Defensa', 'Desplazamiento'],
    boxing: ['jab', 'cross', 'slip_right', 'lead_hook', 'pivot_left'],
    kickboxing: ['jab', 'cross', 'slip_right', 'low_kick_right', 'pivot_left'],
    k1: ['jab', 'cross', 'slip_right', 'low_kick_right', 'pivot_left'],
    chain: ['jab', 'cross', 'slip_right', 'cross', 'pivot_left'],
    sparring: 'Cada secuencia debe contener ataque, una defensa real y una salida.',
  },
  provocar_defender_contra: {
    dominant: 'Integración',
    secondary: ['Contraataque', 'Decisión'],
    boxing: ['jab', 'parry', 'slip_right', 'cross', 'lead_hook'],
    kickboxing: ['jab', 'parry', 'cross', 'low_kick_right', 'pivot_left'],
    k1: ['jab', 'parry', 'cross', 'low_kick_right', 'knee_front'],
    chain: ['jab', 'parry', 'cross', 'lead_hook', 'pivot_left'],
    sparring: 'El atleta debe provocar una respuesta antes de defender y contraatacar.',
  },
}

const ROLES_BY_COUNT = {
  3: ['Adquisición y repaso', 'Reacción y decisión', 'Aplicación y evaluación'],
  4: ['Adquisición', 'Asociación', 'Reacción y decisión', 'Aplicación'],
  5: ['Adquisición', 'Asociación', 'Reacción', 'Decisión', 'Aplicación y evaluación'],
  6: ['Adquisición', 'Asociación', 'Reacción', 'Decisión', 'Situacional', 'Evaluación y sparring'],
}

const DRILLS_BY_ROLE = {
  'Adquisición y repaso': ['tecnico', 'repeticion'],
  Adquisición: ['tecnico', 'repeticion'],
  Asociación: ['companero', 'cooperativo'],
  Reacción: ['reactivo'],
  'Reacción y decisión': ['reactivo', 'decision'],
  Decisión: ['decision'],
  Situacional: ['situacional'],
  Aplicación: ['integracion', 'sparring_condicionado'],
  'Aplicación y evaluación': ['sparring_condicionado'],
  'Evaluación y sparring': ['sparring_condicionado', 'sparring_libre'],
}

function labelSkill(id) {
  return NAMES[id] || id
}

function sportKey(sport) {
  if (sport === 'kickboxing') return 'kickboxing'
  if (sport === 'k1') return 'k1'
  return 'boxing'
}

function seedNumber(value) {
  return String(value || '').split('').reduce((sum, char) => ((sum * 31) + char.charCodeAt(0)) >>> 0, 2166136261)
}

function choose(items, seed, offset = 0) {
  if (!Array.isArray(items) || items.length === 0) return null
  return items[(seed + offset) % items.length]
}

function rotate(items, offset) {
  if (!items.length) return []
  const n = offset % items.length
  return [...items.slice(n), ...items.slice(0, n)]
}

function technicalLoad(level) {
  if (level === 'basico') return { opposition: 'Baja', pace: 'Controlado', uncertainty: 1 }
  if (level === 'avanzado') return { opposition: 'Media-alta', pace: 'Rápido controlado', uncertainty: 3 }
  if (level === 'competitivo') return { opposition: 'Alta', pace: 'Ritmo de combate', uncertainty: 4 }
  return { opposition: 'Media', pace: 'Moderado', uncertainty: 2 }
}

function buildSession({ index, role, skills, goal, level, duration, seed }) {
  const load = technicalLoad(level)
  const drillIds = DRILLS_BY_ROLE[role] || ['tecnico']
  const drillId = choose(drillIds, seed, index)
  const drill = DRILL_TYPES[drillId] || DRILL_TYPES.tecnico
  const rotated = rotate(skills, index)
  const main = rotated[0]
  const secondary = rotated.slice(1, 3)
  const chain = goal.chain.map(labelSkill).join(' → ')
  const workMinutes = Math.max(20, Math.round(Number(duration || 60) * 0.7))

  let instruction = 'Priorizar precisión, guardia, equilibrio y regreso a posición.'
  if (/Reacción/.test(role)) instruction = 'El compañero entrega el estímulo en momentos variables; responder sin anticiparse.'
  if (/Decisión/.test(role)) instruction = 'El compañero dispone de al menos dos respuestas posibles; el atleta debe leer y elegir.'
  if (/Situacional/.test(role)) instruction = 'Comenzar desde una situación táctica concreta y resolverla manteniendo el objetivo semanal.'
  if (/Aplicación|Evaluación|sparring/i.test(role)) instruction = goal.sparring

  return {
    number: index + 1,
    role,
    drill,
    main: labelSkill(main),
    secondary: secondary.map(labelSkill),
    chain,
    opposition: load.opposition,
    pace: load.pace,
    uncertainty: Math.min(4, load.uncertainty + Math.floor(index / 2)),
    workMinutes,
    instruction,
  }
}

export function generarSemanaTecnica({
  sport = 'boxeo',
  level = 'intermedio',
  goalId = 'control_distancia',
  sessionsCount = 5,
  duration = 60,
  athleteName = '',
  athleteId = '',
  recentPlans = [],
  stageId = null,
}) {
  const curriculum = accumulatedCurriculum(
    stageId || (COMBAT_STAGES[sport] || COMBAT_STAGES.boxeo)[0]?.value,
    sport,
  )
  const safeGoalId = curriculum.goals.includes(goalId)
    ? goalId
    : curriculum.goals[0] || 'control_distancia'
  const goal = GOAL_LIBRARY[safeGoalId] || GOAL_LIBRARY.control_distancia
  const roles = ROLES_BY_COUNT[Number(sessionsCount)] || ROLES_BY_COUNT[5]
  const goalSkills = goal[sportKey(sport)] || goal.boxing
  const skills = goalSkills.filter((skill) => curriculum.skills.includes(skill))
  const effectiveSkills = skills.length >= 2 ? skills : goalSkills
  const recentText = (recentPlans || []).slice(0, 6).map((plan) => String(plan?.contenido || '')).join(' ')
  const baseSeed = seedNumber(`${athleteId}|${sport}|${goalId}|${new Date().toISOString().slice(0, 10)}`)
  const repeatPenalty = recentText.includes(goal.sparring) ? 1 : 0
  const seed = baseSeed + repeatPenalty

  const sessions = roles.map((role, index) =>
    buildSession({ index, role, skills: rotate(effectiveSkills, repeatPenalty), goal, level, duration, seed }),
  )

  const goalLabel = WEEKLY_GOALS.find((item) => item.value === safeGoalId)?.label || safeGoalId
  const sportLabel = TECHNICAL_SPORTS.find((item) => item.value === sport)?.label || sport
  const levelLabel = WEEKLY_LEVELS.find((item) => item.value === level)?.label || level

  const lines = [
    'POWERFIT 360 — PLANIFICACIÓN TÉCNICA SEMANAL',
    '',
    `Alumno: ${athleteName || 'Alumno PowerFit'}`,
    `Deporte: ${sportLabel}`,
    `Nivel: ${levelLabel}`,
    `Objetivo semanal: ${goalLabel}`,
    `Eje dominante: ${goal.dominant}`,
    `Ejes secundarios: ${goal.secondary.join(' + ')}`,
    `Sesiones: ${sessions.length}`,
    `Duración por sesión: ${duration} min`,
    '',
    'REGLAS DE LA SEMANA',
    '- Máximo 2 elementos nuevos principales; el resto consolida contenido conocido.',
    '- La dificultad aumenta por oposición, incertidumbre y toma de decisión, no por acumular técnicas.',
    '- Repetir una técnica está permitido; repetir la misma tarea completa de forma reciente no.',
    '- Prioridad: calidad técnica, lectura, equilibrio y aplicación táctica.',
    '',
    'CADENA TÉCNICA DE REFERENCIA',
    goal.chain.map(labelSkill).join(' → '),
    '',
  ]

  sessions.forEach((session) => {
    lines.push(
      `SESIÓN ${session.number} — ${session.role.toUpperCase()}`,
      `Drill principal: ${session.drill}`,
      `Técnica principal: ${session.main}`,
      `Técnicas secundarias: ${session.secondary.join(' + ') || 'Sin técnica secundaria'}`,
      `Cadena: ${session.chain}`,
      `Oposición: ${session.opposition}`,
      `Ritmo de ejecución: ${session.pace}`,
      `Nivel de incertidumbre: ${session.uncertainty}/4`,
      `Tiempo técnico aproximado: ${session.workMinutes} min`,
      `Consigna: ${session.instruction}`,
      '',
    )
  })

  lines.push(
    'EVALUACIÓN SEMANAL — 1 A 5',
    '- Técnica',
    '- Distancia',
    '- Ataque',
    '- Defensa',
    '- Contraataque',
    '- Desplazamiento',
    '- Decisión',
    '- Integración',
    '',
    'RESULTADO DEL OBJETIVO',
    'No logrado / Parcial / Logrado / Superado',
    '',
    'REGLA DE CONTINUIDAD',
    '1-2: simplificar | 3: mantener con otro drill | 4: progresar | 5: integrar con otro eje.',
  )

  return {
    contenido: lines.join('\n'),
    meta: {
      sport,
      level,
      goalId: safeGoalId,
      stageId,
      goalLabel,
      dominantAxis: goal.dominant,
      secondaryAxes: goal.secondary,
      sessionsCount: sessions.length,
      duration,
      sessions,
    },
  }
}
