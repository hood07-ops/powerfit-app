import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../supabase'

function planMeta(plan) {
  const contenido = String(plan?.contenido || '')
  const semanas = Math.max(1, Number(contenido.match(/PLAN_SEMANAS:(\d+)/)?.[1] || 1))
  const sesionesSemana = Math.max(
    1,
    Number(contenido.match(/PLAN_SESIONES_SEMANA:(\d+)/)?.[1] || 1),
  )

  return {
    semanas,
    sesionesSemana,
    totalSesiones: Math.max(1, semanas * sesionesSemana),
  }
}

function planTitle(plan) {
  const contenido = String(plan?.contenido || '')
  const fromContent = contenido.match(/^Título:\s*(.+)$/m)?.[1]?.trim()
  if (fromContent) return fromContent

  return String(plan?.objetivo || 'Entrenamiento personalizado')
    .replace(/^coach_(personalizado_)?/, '')
    .replaceAll('_', ' ')
}

function parseCompletion(records = []) {
  const map = {}

  records.forEach((record) => {
    const texto = `${record?.metodo || ''} ${record?.observacion || ''}`
    const sessionMatch = texto.match(/SESION_COMPLETADA:([a-zA-Z0-9-]+):(\d+)/)
    const planMatch = texto.match(/PLAN_COMPLETADO:([a-zA-Z0-9-]+)/)

    if (sessionMatch?.[1]) {
      const planId = sessionMatch[1]
      const sessionNumber = Number(sessionMatch[2])
      map[planId] = {
        ...(map[planId] || {}),
        sessions: {
          ...(map[planId]?.sessions || {}),
          [sessionNumber]: record,
        },
      }
    } else if (planMatch?.[1]) {
      map[planMatch[1]] = {
        ...(map[planMatch[1]] || {}),
        legacyComplete: record,
      }
    }
  })

  return map
}

function progressFor(plan, completados) {
  const meta = planMeta(plan)
  const info = completados[plan.id] || {}
  const done = info.legacyComplete
    ? meta.totalSesiones
    : Object.keys(info.sessions || {}).length

  return {
    ...meta,
    done: Math.min(done, meta.totalSesiones),
    complete: done >= meta.totalSesiones,
    pct: Math.min(100, Math.round((done * 100) / meta.totalSesiones)),
  }
}

function extractRpe(record) {
  const match = String(record?.metodo || '').match(/RPE:(\d+(?:\.\d+)?)/)
  return match?.[1] || null
}

export default function AssignedTrainingPage({ student, onUpdateStudent }) {
  const [planes, setPlanes] = useState([])
  const [completados, setCompletados] = useState({})
  const [feedback, setFeedback] = useState({})
  const [loading, setLoading] = useState(true)
  const [savingKey, setSavingKey] = useState('')
  const [message, setMessage] = useState('')

  async function load() {
    if (!student?.id) {
      setPlanes([])
      setCompletados({})
      setLoading(false)
      return
    }

    setLoading(true)
    const { data, error } = await supabase.rpc('get_powerfit_training_history_secure', {
      p_alumno_id: student.id,
      p_limit: 100,
    })

    if (error) {
      setPlanes([])
      setCompletados({})
      setMessage(`No se pudo cargar tu entrenamiento: ${error.message}`)
      setLoading(false)
      return
    }

    const coachPlans = (data?.plans || [])
      .filter((plan) => {
        const objetivo = String(plan?.objetivo || '')
        const sourceRef = String(plan?.source_ref || '')
        return objetivo.startsWith('coach_') || sourceRef === 'coach_assignment'
      })
      .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))

    setPlanes(coachPlans)
    setCompletados(parseCompletion(data?.records || []))
    setLoading(false)
  }

  useEffect(() => {
    Promise.resolve().then(load)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [student?.id])

  useEffect(() => {
    const onFocus = () => load()
    const onVisibility = () => {
      if (document.visibilityState === 'visible') load()
    }

    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onVisibility)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [student?.id])

  const orderedPlans = useMemo(() => {
    return [...planes].sort((a, b) => {
      const aDone = progressFor(a, completados).complete ? 1 : 0
      const bDone = progressFor(b, completados).complete ? 1 : 0
      if (aDone !== bDone) return aDone - bDone
      return new Date(b.created_at || 0) - new Date(a.created_at || 0)
    })
  }, [planes, completados])

  const activePlans = orderedPlans.filter((plan) => !progressFor(plan, completados).complete)
  const completedPlans = orderedPlans.filter((plan) => progressFor(plan, completados).complete)

  function updateFeedback(planId, sessionNumber, field, value) {
    const key = `${planId}:${sessionNumber}`
    setFeedback((current) => ({
      ...current,
      [key]: {
        ...(current[key] || {}),
        [field]: value,
      },
    }))
  }

  async function completeSession(plan, sessionNumber) {
    if (!student?.id || !plan?.id) return

    const progress = progressFor(plan, completados)
    const existing = completados[plan.id]?.sessions?.[sessionNumber]
    if (existing || completados[plan.id]?.legacyComplete) return

    const key = `${plan.id}:${sessionNumber}`
    const values = feedback[key] || {}
    const rpe = Math.min(10, Math.max(1, Number(values.rpe || 6)))
    const comentario = String(values.comentario || '').trim()

    setSavingKey(key)
    setMessage('Guardando sesión...')

    const { error } = await supabase.rpc('save_powerfit_training_record_secure', {
      p_alumno_id: student.id,
      p_rutina_nombre: `Plan coach - sesión ${sessionNumber}/${progress.totalSesiones} - ${planTitle(plan)}`,
      p_metodo: `SESION_COMPLETADA:${plan.id}:${sessionNumber} | RPE:${rpe}`,
      p_tipo_record: 'repeticiones',
      p_vueltas: null,
      p_repeticiones: 1,
      p_tiempo_segundos: null,
      p_peso_kg: null,
      p_porcentaje_rm: null,
      p_observacion: comentario || `SESION_COMPLETADA:${plan.id}:${sessionNumber}`,
      p_reason: 'Sesión de plan asignado por coach completada por alumno',
    })

    if (error) {
      setMessage(`No se pudo completar la sesión: ${error.message}`)
      setSavingKey('')
      return
    }

    setMessage(`Sesión ${sessionNumber}/${progress.totalSesiones} completada. Tu coach ya puede verla.`)
    setFeedback((current) => {
      const next = { ...current }
      delete next[key]
      return next
    })
    await load()
    onUpdateStudent?.()
    setSavingKey('')
  }

  if (loading) {
    return (
      <div className="rounded-3xl border border-blue-700 bg-zinc-900 p-6 text-zinc-300">
        Cargando tu entrenamiento...
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-blue-500 bg-zinc-900 p-5 sm:p-7">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-blue-300">
          Plan personal
        </p>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-3xl sm:text-5xl font-black text-white">Mi entrenamiento</h2>
            <p className="mt-2 text-zinc-400">
              Aquí están únicamente los planes que tu coach te asignó.
            </p>
          </div>
          <div className="flex gap-2">
            <span className="rounded-full border border-blue-700 bg-blue-950 px-3 py-1 text-xs font-black text-blue-200">
              {activePlans.length} activo{activePlans.length === 1 ? '' : 's'}
            </span>
            <span className="rounded-full border border-green-800 bg-green-950 px-3 py-1 text-xs font-black text-green-300">
              {completedPlans.length} completado{completedPlans.length === 1 ? '' : 's'}
            </span>
          </div>
        </div>
      </section>

      {message && (
        <div className="rounded-2xl border border-yellow-700 bg-yellow-950/60 p-4 font-black text-yellow-200">
          {message}
        </div>
      )}

      {orderedPlans.length === 0 ? (
        <section className="rounded-3xl border border-zinc-700 bg-zinc-900 p-6">
          <h3 className="text-2xl font-black text-white">Todavía no tienes un plan asignado</h3>
          <p className="mt-2 text-zinc-400">
            Cuando tu coach te asigne un entrenamiento aparecerá automáticamente aquí.
          </p>
        </section>
      ) : (
        <div className="space-y-5">
          {orderedPlans.map((plan, planIndex) => {
            const progress = progressFor(plan, completados)
            const nextSession = Array.from(
              { length: progress.totalSesiones },
              (_, index) => index + 1,
            ).find((number) => !completados[plan.id]?.sessions?.[number])

            return (
              <article
                key={plan.id}
                className={`rounded-3xl border p-5 sm:p-6 ${
                  progress.complete
                    ? 'border-green-800 bg-green-950/20'
                    : planIndex === 0
                      ? 'border-blue-500 bg-zinc-900'
                      : 'border-zinc-700 bg-zinc-900'
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-black uppercase tracking-wide text-zinc-500">
                      {progress.complete ? 'Plan completado' : planIndex === 0 ? 'Plan actual' : 'Plan asignado'}
                    </p>
                    <h3 className="mt-1 text-2xl font-black capitalize text-yellow-400">
                      {planTitle(plan)}
                    </h3>
                    <p className="mt-1 text-sm text-zinc-400">
                      {plan.created_at
                        ? new Date(plan.created_at).toLocaleDateString('es-CL')
                        : 'Sin fecha'}
                      {' · '}
                      {progress.semanas} semana{progress.semanas === 1 ? '' : 's'}
                      {' · '}
                      {progress.sesionesSemana} sesión{progress.sesionesSemana === 1 ? '' : 'es'} por semana
                    </p>
                  </div>
                  <strong className={progress.complete ? 'text-green-400' : 'text-blue-300'}>
                    {progress.done}/{progress.totalSesiones}
                  </strong>
                </div>

                <div className="mt-4 h-3 overflow-hidden rounded-full border border-zinc-700 bg-black">
                  <span
                    className={`block h-full rounded-full ${
                      progress.complete ? 'bg-green-500' : 'bg-blue-500'
                    }`}
                    style={{ width: `${progress.pct}%` }}
                  />
                </div>
                <p className="mt-2 text-right text-xs font-black text-zinc-400">
                  {progress.pct}% completado
                </p>

                <details className="mt-5 rounded-2xl border border-zinc-700 bg-black/40 p-4">
                  <summary className="cursor-pointer font-black text-zinc-200">
                    Ver contenido del plan
                  </summary>
                  <pre className="mt-4 max-h-80 overflow-auto whitespace-pre-wrap font-sans text-sm text-zinc-300">
                    {plan.contenido || 'Sin contenido disponible.'}
                  </pre>
                </details>

                <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {Array.from({ length: progress.totalSesiones }, (_, index) => index + 1).map(
                    (sessionNumber) => {
                      const record = completados[plan.id]?.sessions?.[sessionNumber]
                      const key = `${plan.id}:${sessionNumber}`
                      const isNext = sessionNumber === nextSession
                      const rpe = extractRpe(record)

                      return (
                        <section
                          key={sessionNumber}
                          className={`rounded-2xl border p-4 ${
                            record
                              ? 'border-green-700 bg-green-950/30'
                              : isNext
                                ? 'border-blue-600 bg-blue-950/20'
                                : 'border-zinc-800 bg-black/30'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-black">Sesión {sessionNumber}</p>
                            {record && (
                              <span className="rounded-full bg-green-700 px-2 py-1 text-[11px] font-black">
                                HECHA
                              </span>
                            )}
                          </div>

                          {record ? (
                            <>
                              <p className="mt-2 text-xs text-zinc-400">
                                {record.created_at
                                  ? new Date(record.created_at).toLocaleString('es-CL')
                                  : 'Registrada'}
                              </p>
                              {rpe && (
                                <p className="mt-2 text-sm font-black text-yellow-300">RPE {rpe}/10</p>
                              )}
                              {record.observacion &&
                                !String(record.observacion).startsWith('SESION_COMPLETADA:') && (
                                  <p className="mt-2 text-sm text-zinc-300">{record.observacion}</p>
                                )}
                            </>
                          ) : isNext ? (
                            <>
                              <label className="mt-3 grid gap-1 text-xs font-black text-zinc-400">
                                Esfuerzo percibido (RPE 1–10)
                                <input
                                  type="number"
                                  min="1"
                                  max="10"
                                  value={feedback[key]?.rpe || '6'}
                                  onChange={(event) =>
                                    updateFeedback(plan.id, sessionNumber, 'rpe', event.target.value)
                                  }
                                  className="rounded-xl border border-zinc-700 bg-black p-3 text-white"
                                />
                              </label>
                              <label className="mt-2 grid gap-1 text-xs font-black text-zinc-400">
                                Comentario al coach
                                <textarea
                                  value={feedback[key]?.comentario || ''}
                                  onChange={(event) =>
                                    updateFeedback(
                                      plan.id,
                                      sessionNumber,
                                      'comentario',
                                      event.target.value,
                                    )
                                  }
                                  placeholder="Dolor, dificultad, sensaciones o comentario"
                                  className="min-h-20 rounded-xl border border-zinc-700 bg-black p-3 text-white"
                                />
                              </label>
                              <button
                                type="button"
                                disabled={savingKey === key}
                                onClick={() => completeSession(plan, sessionNumber)}
                                className="mt-3 w-full rounded-xl bg-green-600 p-3 font-black hover:bg-green-700 disabled:opacity-50"
                              >
                                {savingKey === key ? 'Guardando...' : `Completar sesión ${sessionNumber}`}
                              </button>
                            </>
                          ) : (
                            <p className="mt-2 text-sm text-zinc-500">
                              Se habilita al completar la sesión anterior.
                            </p>
                          )}
                        </section>
                      )
                    },
                  )}
                </div>
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}
