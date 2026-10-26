import test from 'node:test'
import assert from 'node:assert/strict'
import { buildPhysicalConsultation, formatPhysicalConsultation, respondToPhysicalConsultation, PHYSICAL_GOALS } from './physicalConsultant.js'

test('each supported goal has different priorities and progress criteria', () => {
  const reports = Object.keys(PHYSICAL_GOALS).map((goal) => buildPhysicalConsultation({ goal, level: 'basico' }))
  assert.equal(new Set(reports.map((item) => item.focus)).size, 6)
  assert.ok(reports.every((item) => item.priorities.length && item.metrics.length))
  assert.equal(buildPhysicalConsultation({ goal: 'unknown' }), null)
})

test('unknown level and absent RM never become invented prescriptions', () => {
  const report = buildPhysicalConsultation({ goal: 'fuerza', level: 'elite' })
  assert.equal(report.level, null)
  assert.match(formatPhysicalConsultation(report), /Sin RM verificados/)
  assert.match(formatPhysicalConsultation(report), /por confirmar/)
})

test('history is not treated as compliance and limitation needs human review', () => {
  const report = buildPhysicalConsultation({ goal: 'fighter', historyCount: 12, needsReview: true })
  assert.match(formatPhysicalConsultation(report), /no equivalen a sesiones realizadas/)
  assert.equal(report.needsReview, true)
  assert.match(report.review, /no contacta/)
})

test('chat accumulates intake without changing combat goal to home equipment', () => {
  const first = respondToPhysicalConsultation({ message: 'Quiero mejorar para boxeo' })
  const next = respondToPhysicalConsultation({ message: 'Soy básico, 3 días, 45 minutos, sin materiales', previousGoal: first.goal })
  assert.equal(next.goal, 'fighter')
  assert.deepEqual(next.profile, { daysPerWeek: 3, durationMinutes: 45, equipment: 'sin materiales', level: 'basico' })
  assert.match(next.reply, /3 días por semana, 45 minutos/)
  assert.doesNotMatch(next.reply, /¿Cuántos días/)
  const continuation = respondToPhysicalConsultation({ message: '¿Cómo progreso?', previousGoal: next.goal, profile: next.profile })
  assert.match(continuation.reply, /sin materiales/)
})

test('multiple or negated goals ask for a primary goal', () => {
  assert.equal(respondToPhysicalConsultation({ message: 'Quiero fuerza y resistencia' }).goal, null)
  assert.equal(respondToPhysicalConsultation({ message: 'No quiero fuerza' }).goal, null)
})

test('pain routes to review without claiming a message was sent', () => {
  const result = respondToPhysicalConsultation({ message: 'Quiero mejorar fuerza pero tengo dolor' })
  assert.equal(result.needsReview, true)
  assert.match(result.reply, /No se ha enviado/)
  const followup = respondToPhysicalConsultation({ message: 'Tengo una lesión', previousGoal: 'fuerza' })
  assert.equal(followup.needsReview, true)
  assert.notEqual(respondToPhysicalConsultation({ message: 'Quiero fuerza sin dolor' }).needsReview, true)
})

test('payment and unrelated questions remain in the existing chat', () => {
  assert.equal(respondToPhysicalConsultation({ message: '¿Cuántas generaciones tengo?' }), null)
  assert.equal(respondToPhysicalConsultation({ message: '¿Cómo pago mi mensualidad?' }), null)
  assert.equal(respondToPhysicalConsultation({ message: 'Hola' }), null)
})

test('out of bounds availability is not presented as validated', () => {
  const result = respondToPhysicalConsultation({ message: 'Quiero mejorar fuerza, 999 minutos' })
  assert.doesNotMatch(result.reply, /999 minutos por sesión/)
  assert.match(result.reply, /¿Cuántos minutos/)
})
