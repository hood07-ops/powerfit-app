import { useState } from 'react'
import { PHYSICAL_GOALS, CONSULTANT_EQUIPMENT, buildAdaptiveMicrocycle, generateAdaptiveSession, formatAdaptiveSession, analyzeCompletedTraining } from '@powerfit/training-engine'
import { useConsultantProfile } from '../useConsultantProfile'

const fieldClass = 'w-full bg-zinc-800 border border-zinc-600 rounded-xl p-2 text-white'
export default function TrainingConsultantPanel({ student, goal, level, viewerId = null }) {
  const { profile, records, updateProfile, addRecord, resetConsultation } = useConsultantProfile(student, viewerId)
  const [feedbackMinutes, setFeedbackMinutes] = useState('')
  const [feedbackRpe, setFeedbackRpe] = useState('')
  const [feedbackConcern, setFeedbackConcern] = useState(false)
  const [feedbackMessage, setFeedbackMessage] = useState('')
  const effective = { ...profile, ...(goal ? { goal } : {}), ...(level ? { level } : {}) }
  const cycle = buildAdaptiveMicrocycle(effective)
  const session = generateAdaptiveSession(effective)
  const feedback = analyzeCompletedTraining(records)
  const choose = (field, value) => updateProfile({ [field]: value })

  function recordFeedback() {
    try {
      addRecord({ status: 'completed', durationMinutes: Number(feedbackMinutes), srpe: Number(feedbackRpe), reportedConcern: feedbackConcern })
      setFeedbackMinutes('')
      setFeedbackRpe('')
      setFeedbackConcern(false)
      setFeedbackMessage('Registro añadido a esta consulta. No se guardó en la ficha del alumno.')
    } catch (error) { setFeedbackMessage(error.message) }
  }

  return <section aria-label="Perfil y propuesta de preparación física" className="space-y-4 text-sm">
    <p className="text-zinc-300">Perfil compartido entre chat y generador durante esta sesión. Al recargar se borra; no modifica tu ficha.</p>
    <div className="grid sm:grid-cols-2 gap-3">
      {!goal && <label>Objetivo principal<select className={fieldClass} value={profile.goal || ''} onChange={(event) => choose('goal', event.target.value)}><option value="">Seleccionar</option>{Object.entries(PHYSICAL_GOALS).map(([value, item]) => <option key={value} value={value}>{item.label}</option>)}</select></label>}
      {!level && <label>Nivel<select className={fieldClass} value={profile.level || ''} onChange={(event) => choose('level', event.target.value)}><option value="">Por confirmar</option>{['inicial', 'basico', 'intermedio', 'avanzado', 'competidor'].map((value) => <option key={value} value={value}>{value}</option>)}</select></label>}
      {['fighter', 'tenis'].includes(effective.goal) && <label>Prioridad deportiva<select className={fieldClass} value={profile.priority} onChange={(event) => choose('priority', event.target.value)}>{['general', 'tecnica', 'fuerza', 'resistencia'].map((priority) => <option key={priority} value={priority}>{priority}</option>)}</select></label>}
      <label>Días disponibles por semana<select className={fieldClass} value={profile.daysPerWeek || ''} onChange={(event) => choose('daysPerWeek', event.target.value)}><option value="">Por confirmar</option>{[1, 2, 3, 4, 5, 6, 7].map((day) => <option key={day} value={day}>{day}</option>)}</select></label>
      <label>Minutos por sesión<select className={fieldClass} value={profile.durationMinutes || ''} onChange={(event) => choose('durationMinutes', event.target.value)}><option value="">Por confirmar</option>{[20, 30, 45, 60, 75, 90].map((minutes) => <option key={minutes} value={minutes}>{minutes}</option>)}</select></label>
      <label>Equipamiento<select className={fieldClass} value={profile.equipment || ''} onChange={(event) => choose('equipment', event.target.value)}><option value="">Por confirmar</option>{Object.entries(CONSULTANT_EQUIPMENT).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      <label>Otras sesiones deportivas por semana<input className={fieldClass} type="number" min="0" max="14" value={profile.technicalSessions ?? ''} onChange={(event) => choose('technicalSessions', event.target.value)} /></label>
      <label className="sm:col-span-2">Meta concreta<input className={fieldClass} maxLength={240} value={profile.target} placeholder="Ej.: sostener la técnica durante mis rounds" onChange={(event) => choose('target', event.target.value)} /></label>
      <label>Fecha de evento, si corresponde<input className={fieldClass} type="date" value={profile.eventDate || ''} onChange={(event) => choose('eventDate', event.target.value)} /></label>
    </div>
    <label className="flex gap-2"><input type="checkbox" checked={profile.adultConfirmed} onChange={(event) => choose('adultConfirmed', event.target.checked)} />Confirmo que esta propuesta es para una persona adulta.</label>
    <label className="flex gap-2"><input type="checkbox" checked={profile.needsReview} disabled={profile.needsReview} onChange={(event) => choose('needsReview', event.target.checked)} />Hay una molestia o limitación pendiente de revisión profesional.</label>
    <p role="status" className={cycle.canGenerate ? 'text-green-300' : 'text-yellow-200'}>{cycle.explanation}</p>
    {cycle.ok && <>
      <details className="rounded-xl bg-black/30 p-3"><summary className="cursor-pointer font-bold text-blue-300">Propuesta de sesión según tu material y tiempo</summary><pre className="mt-3 whitespace-pre-wrap break-words font-sans">{formatAdaptiveSession(session.session)}</pre></details>
      <details className="rounded-xl bg-black/30 p-3"><summary className="cursor-pointer font-bold text-blue-300">Distribución semanal y revisión de cuatro semanas</summary>
        <ul className="mt-3 space-y-2">{cycle.days.map((day) => <li key={day.day}>Día {day.day}: {day.focus} {day.durationMinutes > 0 ? `Hasta ${day.durationMinutes} min.` : ''}</li>)}</ul>
        <ul className="mt-3 space-y-2">{cycle.weeks.map((week) => <li key={week.week}>Semana {week.week} · {week.focus}: {week.condition}</li>)}</ul>
        {cycle.warnings.map((warning) => <p className="mt-2 text-yellow-200" key={warning}>{warning}</p>)}
      </details>
    </>}
    <details className="rounded-xl bg-black/30 p-3"><summary className="cursor-pointer font-bold text-blue-300">Registrar respuesta de una sesión que ya completaste</summary>
      <div className="grid grid-cols-2 gap-3 mt-3">
        <label>Minutos realizados<input className={fieldClass} type="number" min="1" max="300" value={feedbackMinutes} onChange={(event) => setFeedbackMinutes(event.target.value)} /></label>
        <label>Esfuerzo sRPE (1–10)<input className={fieldClass} type="number" min="1" max="10" step="0.5" value={feedbackRpe} onChange={(event) => setFeedbackRpe(event.target.value)} /></label>
      </div>
      <label className="flex gap-2 my-3"><input type="checkbox" checked={feedbackConcern} onChange={(event) => { setFeedbackConcern(event.target.checked); if (event.target.checked) updateProfile({ needsReview: true }) }} />Reporto una molestia que necesita revisión.</label>
      <button type="button" className="bg-blue-700 px-3 py-2 rounded-xl" onClick={recordFeedback}>Añadir registro de esta consulta</button>
      <p role="status" className="mt-2">{feedbackMessage}</p>
      <p>{feedback.sampleSize} sesiones declaradas · {feedback.totalMinutes} min · carga sRPE acumulada: {feedback.totalLoad} unidades arbitrarias.</p>
      <p>{feedback.explanation}</p>
    </details>
    <button type="button" className="underline text-zinc-400" onClick={() => { resetConsultation(); setFeedbackMessage('Consulta borrada. No implica aprobación profesional.') }}>Borrar esta consulta y comenzar otra</button>
  </section>
}
