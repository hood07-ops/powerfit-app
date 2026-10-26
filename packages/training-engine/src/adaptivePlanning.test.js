import test from 'node:test'
import assert from 'node:assert/strict'
import { normalizeConsultantProfile, assessConsultantReadiness, generateAdaptiveSession, buildAdaptiveMicrocycle, analyzeCompletedTraining, CONSULTANT_EQUIPMENT } from './adaptivePlanning.js'
import { createConsultationMemory } from './consultationMemory.js'
import { respondToPhysicalConsultation } from './physicalConsultant.js'

const profile = { goal: 'fuerza', level: 'basico', daysPerWeek: 3, durationMinutes: 45, equipment: 'none', adultConfirmed: true, technicalSessions: 0 }

test('incomplete, nonadult and review profiles do not produce exercise drafts', () => {
  for (const input of [{}, null, { ...profile, adultConfirmed: false }, { ...profile, needsReview: true }, { ...profile, equipment: 'unknown' }, { ...profile, daysPerWeek: 8 }, { ...profile, durationMinutes: 999 }]) {
    assert.equal(generateAdaptiveSession(input).ok, false)
    assert.equal(buildAdaptiveMicrocycle(input).days.length, 0)
  }
  assert.equal(assessConsultantReadiness({ ...profile, needsReview: true }).state, 'HUMAN_REQUIRED')
})

test('720 combinations respect equipment and exact practice/rest time budgets', () => {
  let count = 0
  for (const goal of ['fighter', 'tenis', 'fuerza', 'perdida_grasa', 'cardio', 'casa_principiante']) {
    for (const level of ['inicial', 'basico', 'intermedio', 'avanzado', 'competidor']) {
      for (const equipment of Object.keys(CONSULTANT_EQUIPMENT)) {
        for (const durationMinutes of [20, 30, 45, 60, 75, 90]) {
          const result = generateAdaptiveSession({ ...profile, goal, level, equipment, durationMinutes })
          assert.equal(result.ok, true)
          const session = result.session
          assert.equal(session.warmup.minutes + session.cooldown.minutes + session.exercises.reduce((sum, item) => sum + item.timeBudgetMinutes, 0), durationMinutes)
          const available = equipment === 'gym' ? ['bands', 'dumbbells'] : [equipment]
          assert.ok(session.exercises.every((exercise) => exercise.requires.every((required) => available.includes(required))))
          assert.ok(session.exercises.every((exercise) => exercise.timeBudgetMinutes > 0))
          count++
        }
      }
    }
  }
  assert.equal(count, 720)
})

test('days available never mean seven hard days; no additional days invented', () => {
  for (let daysPerWeek = 1; daysPerWeek <= 7; daysPerWeek++) {
    const cycle = buildAdaptiveMicrocycle({ ...profile, daysPerWeek })
    assert.equal(cycle.days.filter((day) => day.type !== 'recovery').length, daysPerWeek)
    assert.ok(cycle.days.filter((day) => day.type === 'physical').length <= 3)
    assert.equal(cycle.weeks.length, 4)
    assert.ok(cycle.weeks.every((week) => !/aumentar automaticamente\./i.test(week.condition)))
  }
})

test('event date validates calendar, warns about nearby and past events', () => {
  assert.equal(normalizeConsultantProfile({ eventDate: '2026-02-31' }).eventDate, null)
  const now = new Date('2026-10-25T12:00:00Z')
  assert.ok(buildAdaptiveMicrocycle({ ...profile, eventDate: '2026-10-30' }, { now }).warnings.some((text) => text.includes('Evento próximo')))
  assert.ok(buildAdaptiveMicrocycle({ ...profile, eventDate: '2026-10-20' }, { now }).warnings.some((text) => text.includes('ya pasó')))
})

test('load analysis excludes planned, missing and invalid records', () => {
  const result = analyzeCompletedTraining([
    { status: 'planned', durationMinutes: 60, srpe: 9 },
    { status: 'completed', durationMinutes: 30, srpe: 5 },
    { status: 'completed', durationMinutes: 40, srpe: 6 },
    { status: 'completed', durationMinutes: 60, srpe: 11 },
    { status: 'completed', durationMinutes: '45', srpe: '7' },
  ])
  assert.equal(result.sampleSize, 2)
  assert.equal(result.totalMinutes, 70)
  assert.equal(result.totalLoad, 390)
  assert.equal(result.rejected, 3)
  assert.equal(result.recommendation, 'collect_more_data')
  assert.equal(analyzeCompletedTraining(null).sampleSize, 0)
})

test('reported concern takes precedence over adequate sample size', () => {
  const result = analyzeCompletedTraining(Array.from({ length: 5 }, () => ({ status: 'completed', durationMinutes: 30, srpe: 5, reportedConcern: true })))
  assert.equal(result.recommendation, 'human_review')
})

test('consultation memory isolates students, preserves review lock and supports shared subscription', () => {
  const memory = createConsultationMemory()
  const keyA = 'tenant-a:user-a:athlete-a'
  const keyB = 'tenant-b:user-b:athlete-b'
  let updates = 0
  const unsubscribe = memory.subscribe(keyA, () => { updates++ })
  memory.update(keyA, profile)
  memory.update(keyA, { needsReview: true })
  memory.update(keyA, { goal: 'cardio', needsReview: false })
  assert.equal(memory.read(keyA).profile.needsReview, true)
  assert.equal(memory.read(keyB).profile.goal, null)
  assert.equal(updates, 3)
  unsubscribe()
  memory.reset(keyA)
  assert.equal(memory.read(keyA).profile.adultConfirmed, false)
  assert.equal(memory.read(keyA).profile.goal, null)
  assert.equal(updates, 3)
})

test('manual feedback is validated, bounded and never implies a persisted plan', () => {
  const memory = createConsultationMemory()
  assert.throws(() => memory.addRecord('a', { status: 'planned', durationMinutes: 10, srpe: 5 }))
  assert.throws(() => memory.addRecord('a', { status: 'completed', durationMinutes: 0, srpe: 5 }))
  for (let i = 0; i < 35; i++) memory.addRecord('a', { status: 'completed', durationMinutes: 20, srpe: 4, ignored: 'secret' })
  assert.equal(memory.read('a').records.length, 30)
  assert.equal(memory.read('a').records[0].ignored, undefined)
  memory.addRecord('a', { status: 'completed', durationMinutes: 20, srpe: 4, reportedConcern: true })
  assert.equal(memory.read('a').profile.needsReview, true)
})

test('chat generates local session and weekly drafts from complete shared profile', () => {
  const session = respondToPhysicalConsultation({ message: 'Dame una sesión', previousGoal: 'fuerza', profile })
  assert.match(session.reply, /SESIÓN ADAPTADA/)
  assert.match(session.reply, /no se guardó una planificación/)
  const weekly = respondToPhysicalConsultation({ message: 'Haz una semana', previousGoal: 'fuerza', profile })
  assert.match(weekly.reply, /PROPUESTA SEMANAL/)
  assert.match(weekly.reply, /Día 7/)
  const incomplete = respondToPhysicalConsultation({ message: 'Dame una rutina de fuerza' })
  assert.match(incomplete.reply, /Antes de generar/)
})

test('chat handles initial concern, negative symptoms and sports-specific priority', () => {
  assert.equal(respondToPhysicalConsultation({ message: 'Tengo dolor' }).needsReview, true)
  assert.notEqual(respondToPhysicalConsultation({ message: 'Quiero fuerza y no tengo dolor' }).needsReview, true)
  const sport = respondToPhysicalConsultation({ message: 'Quiero mejorar resistencia para boxeo' })
  assert.equal(sport.goal, 'fighter')
  assert.equal(sport.profile.priority, 'resistencia')
  const neutral = generateAdaptiveSession({ ...profile, goal: 'fighter' }).session.exercises
  const endurance = generateAdaptiveSession({ ...profile, goal: 'fighter', priority: 'resistencia' }).session.exercises
  assert.notDeepEqual(neutral.map((exercise) => exercise.pattern), endurance.map((exercise) => exercise.pattern))
})

test('adult declaration cannot be inferred from its negation or a minor age', () => {
  const minor = respondToPhysicalConsultation({ message: 'Quiero una rutina de fuerza, tengo 17 años' })
  assert.equal(minor.profile.adultConfirmed, false)
  assert.doesNotMatch(minor.reply, /SESIÓN ADAPTADA/)
  const negation = respondToPhysicalConsultation({ message: 'Quiero una rutina de fuerza, no soy adulto' })
  assert.notEqual(negation.profile.adultConfirmed, true)
})
