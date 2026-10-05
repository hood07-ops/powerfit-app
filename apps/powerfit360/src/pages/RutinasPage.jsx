import { useEffect, useState } from 'react'
import { supabase } from '../supabase'

export default function RutinasPage({ student, onUpdateStudent }) {
  const [mensaje, setMensaje] = useState('')
  const [formValues, setFormValues] = useState({})
  const [entrenosAsignados, setEntrenosAsignados] = useState([])
  const [completados, setCompletados] = useState({})
  const [feedbackPlan, setFeedbackPlan] = useState({})

  const bloques = [

    {
      nombre: 'FIGHTER CONDITIONING',
      metodo: 'AMRAP',
      duracion: '12 MIN',
      objetivo: 'Conditioning fighter',
      record: 'vueltas',
      tipo: 'gratis',
      ejercicios: [
        '10 Push Up',
        '10 Air Squat',
        '10 Sit Up',
        '200m Run',
        '10 Box Jump',
      ],
      xp: 40,
    },

    {
      nombre: 'TABATA POWER',
      metodo: 'TABATA 40/20',
      duracion: '16 MIN',
      objetivo: 'Potencia y resistencia',
      record: 'repeticiones',
      tipo: 'gratis',
      ejercicios: [
        'Kettlebell Swing - MAX REPS',
        'Burpees - MAX REPS',
        'Thruster - MAX REPS',
        'Battle Rope - MAX REPS',
      ],
      xp: 50,
    },

    {
      nombre: 'WEIGHTLIFTING TECHNIQUE',
      metodo: 'FUERZA / HALTEROFILIA',
      duracion: '15 MIN',
      objetivo: 'Técnica y fuerza explosiva',
      record: 'peso',
      tipo: 'gratis',
      ejercicios: [
        'Power Clean - 5x3',
        'Push Jerk - 5x3',
        'Front Squat - 4x5',
        'Deadlift - 4x5',
        'Strict Press - 4x6',
      ],
      xp: 60,
    },

    {
      nombre: 'RM STRENGTH SYSTEM',
      metodo: 'RM / % LOAD',
      duracion: '20 MIN',
      objetivo: 'Fuerza máxima',
      record: 'peso',
      tipo: 'premium',
      ejercicios: [
        'Back Squat - 5x5 @75%',
        'Deadlift - 5x3 @85%',
        'Bench Press - 5x5 @75%',
        'Push Press - 4x5 @70%',
        'Clean Pull - 4x4 @80%',
      ],
      xp: 80,
    },

    {
      nombre: 'FOR TIME FIGHTER',
      metodo: '21-15-9',
      duracion: 'FOR TIME',
      objetivo: 'Conditioning avanzado',
      record: 'tiempo',
      tipo: 'premium',
      ejercicios: [
        'Thruster',
        'Burpees',
        'Box Jump',
        'Double Under',
      ],
      xp: 70,
    },
    {
      nombre: 'TEST SALTO VERTICAL',
      metodo: 'Evaluación potencia',
      duracion: '3 intentos',
      objetivo: 'Medir potencia de tren inferior',
      record: 'repeticiones',
      label: 'Mejor salto CM',
      tipo: 'gratis',
      ejercicios: [
        'Entrada en calor general 6-8 min',
        '3 saltos verticales con descanso completo',
        'Registrar el mejor salto en centimetros',
      ],
      xp: 35,
    },
    {
      nombre: 'TEST COOPER / VO2',
      metodo: 'Evaluación aeróbica',
      duracion: '12 MIN',
      objetivo: 'Estimar resistencia y VO2 max por distancia',
      record: 'repeticiones',
      label: 'Distancia metros en 12 min',
      tipo: 'gratis',
      ejercicios: [
        'Correr, remar o pedalear 12 minutos',
        'Mantener ritmo estable y registrar distancia total',
        'VO2 estimado: (metros - 504.9) / 44.73',
      ],
      xp: 45,
    },
    {
      nombre: 'TEST VELOCIDAD 30M',
      metodo: 'Sprint test',
      duracion: '30 metros',
      objetivo: 'Medir aceleración y velocidad',
      record: 'tiempo',
      label: 'Tiempo segúndos',
      tipo: 'gratis',
      ejercicios: [
        'Calentamiento completo de carrera',
        '2-3 intentos de 30 metros',
        'Registrar el mejor tiempo',
      ],
      xp: 35,
    },
    {
      nombre: 'TEST DISTANCIA CONTROLADA',
      metodo: 'Trabajo distancia / velocidad',
      duracion: 'Libre',
      objetivo: 'Registrar distancia o volumen completado',
      record: 'repeticiones',
      label: 'Distancia metros',
      tipo: 'gratis',
      ejercicios: [
        'Elegir distancia o maquina de trabajo',
        'Registrar metros totales completados',
        'Comparar progreso semanal y mensual',
      ],
      xp: 35,
    },

  ]

  async function cargarEntrenosAsignados() {
    if (!student?.id) return

    const { data, error } = await supabase.rpc(
      'get_powerfit_training_history_secure',
      {
        p_alumno_id: student.id,
        p_limit: 100,
      },
    )

    if (error) {
      setEntrenosAsignados([])
      return
    }

    const asignados = (data?.plans || []).filter((plan) => {
      const objetivo = String(plan?.objetivo || '')
      const sourceRef = String(plan?.source_ref || '')
      return objetivo.startsWith('coach_') || sourceRef === 'coach_assignment'
    })

    setEntrenosAsignados(asignados)

    const completionMap = {}
    ;(data?.records || []).forEach((record) => {
      const texto = `${record?.metodo || ''} ${record?.observacion || ''}`
      const sessionMatch = texto.match(/SESION_COMPLETADA:([a-zA-Z0-9-]+):(\d+)/)
      const planMatch = texto.match(/PLAN_COMPLETADO:([a-zA-Z0-9-]+)/)

      if (sessionMatch?.[1]) {
        const planId = sessionMatch[1]
        const sessionNumber = Number(sessionMatch[2])
        completionMap[planId] = {
          ...(completionMap[planId] || {}),
          sessions: {
            ...(completionMap[planId]?.sessions || {}),
            [sessionNumber]: record,
          },
        }
      } else if (planMatch?.[1]) {
        completionMap[planMatch[1]] = {
          ...(completionMap[planMatch[1]] || {}),
          legacyComplete: record,
        }
      }
    })
    setCompletados(completionMap)
  }

  useEffect(() => {
    Promise.resolve().then(() => cargarEntrenosAsignados())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [student?.id])

  const pagoActivo = student?.estado_pago === 'Pagado'
  const premiumActivo = Number(student?.bloques_premium || 0) > 0

  const bloquesVisibles = bloques.filter((b) => {
    if (b.tipo === 'gratis') return true
    return premiumActivo
  })

  function actualizarValor(nombre, campo, valor) {

    setFormValues((prev) => ({
      ...prev,
      [nombre]: {
        ...(prev[nombre] || {}),
        [campo]: valor,
      },
    }))

  }

  async function guardarRecord(bloque) {
    if (!student) return

    const valores = formValues[bloque.nombre] || {}

    const { error } = await supabase.rpc(
      'save_powerfit_routine_record_with_xp_secure',
      {
        p_alumno_id: student.id,
        p_rutina_nombre: bloque.nombre,
        p_metodo: bloque.metodo,
        p_tipo_record: bloque.record,
        p_vueltas: bloque.record === 'vueltas' ? Number(valores.vueltas || 0) : null,
        p_repeticiones: bloque.record === 'repeticiones' ? Number(valores.repeticiones || 0) : null,
        p_tiempo_segundos: bloque.record === 'tiempo' ? Number(valores.tiempo_segundos || 0) : null,
        p_peso_kg: bloque.record === 'peso' ? Number(valores.peso_kg || 0) : null,
        p_porcentaje_rm: bloque.record === 'peso' ? Number(valores.porcentaje_rm || 0) : null,
        p_xp: Number(bloque.xp || 20),
        p_reason: 'Rutina completada desde RutinasPage',
      },
    )

    if (error) {
      setMensaje(`Error guardando record: ${error.message}`)
      return
    }

    setMensaje(`+${bloque.xp} XP ganados`)
    setFormValues({})
    onUpdateStudent?.()
  }

  function planMeta(plan) {
    const contenido = String(plan?.contenido || '')
    const semanas = Number(contenido.match(/PLAN_SEMANAS:(\d+)/)?.[1] || 1)
    const sesionesSemana = Number(contenido.match(/PLAN_SESIONES_SEMANA:(\d+)/)?.[1] || 1)
    return {
      semanas: Math.max(1, semanas),
      sesionesSemana: Math.max(1, sesionesSemana),
      totalSesiones: Math.max(1, semanas * sesionesSemana),
    }
  }

  function progresoPlan(plan) {
    const meta = planMeta(plan)
    const info = completados[plan.id] || {}
    const done = info.legacyComplete
      ? meta.totalSesiones
      : Object.keys(info.sessions || {}).length

    return {
      ...meta,
      done: Math.min(done, meta.totalSesiones),
      complete: done >= meta.totalSesiones,
    }
  }

  function actualizarFeedbackPlan(planId, sessionNumber, field, value) {
    const key = `${planId}:${sessionNumber}`
    setFeedbackPlan((current) => ({
      ...current,
      [key]: {
        ...(current[key] || {}),
        [field]: value,
      },
    }))
  }

  async function marcarSesionCompletada(plan, sessionNumber) {
    if (!student?.id || !plan?.id) return

    const progress = progresoPlan(plan)
    const existing = completados[plan.id]?.sessions?.[sessionNumber]
    if (existing || completados[plan.id]?.legacyComplete) return

    const key = `${plan.id}:${sessionNumber}`
    const valores = feedbackPlan[key] || {}
    const rpe = Math.min(10, Math.max(1, Number(valores.rpe || 6)))
    const comentario = String(valores.comentario || '').trim()

    const { error } = await supabase.rpc('save_powerfit_training_record_secure', {
      p_alumno_id: student.id,
      p_rutina_nombre: `Plan coach - sesión ${sessionNumber}/${progress.totalSesiones} - ${String(plan.objetivo || '').replace(/^coach_/, '').replaceAll('_', ' ')}`,
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
      setMensaje(`No se pudo marcar la sesión como completada: ${error.message}`)
      return
    }

    setMensaje(`Sesión ${sessionNumber}/${progress.totalSesiones} completada. Tu coach ya puede verla.`)
    await cargarEntrenosAsignados()
    onUpdateStudent?.()
  }

  return (

    <div className="mobile-ui-page mobile-routines-page min-h-screen bg-black text-white p-3 sm:p-6">

      <div className="bg-zinc-900 border border-red-600 rounded-3xl p-6 mb-8">

        <h1 className="text-5xl font-black text-red-500">
          POWERFIT IA SYSTEM
        </h1>

        <p className="text-zinc-400 mt-3 text-xl">
          Fighter Conditioning - Weightlifting - Cross Training
        </p>

      </div>

      {!pagoActivo && (

        <div className="bg-red-950 border border-red-600 rounded-3xl p-6 mb-8">

          <h2 className="text-3xl font-black text-red-400">
            ESTADO DE PAGO PENDIENTE
          </h2>

          <p className="text-zinc-300 mt-3">
            Tu estado financiero es informativo y no bloquea rutinas, entrenamiento ni acceso deportivo.
          </p>

        </div>

      )}

      {mensaje && (

        <div className="bg-yellow-500 text-black rounded-2xl p-4 font-black mb-8">
          {mensaje}
        </div>

      )}

      {entrenosAsignados.length > 0 && (
        <section className="bg-zinc-900 border border-blue-500 rounded-3xl p-6 mb-8">
          <h2 className="text-3xl font-black text-blue-300 mb-3">
            Entrenamientos asignados por tu coach
          </h2>
          <p className="text-zinc-400 mb-5">
            Estos planes fueron cargados directamente para ti desde la plataforma Coach.
          </p>

          <div className="space-y-4">
            {entrenosAsignados.map((plan) => (
              <details key={plan.id} className="bg-zinc-950 border border-zinc-700 rounded-2xl p-4">
                <summary className="cursor-pointer font-black text-yellow-400">
                  {String(plan.objetivo || 'Entrenamiento personalizado')
                    .replace(/^coach_(personalizado_)?/, '')
                    .replaceAll('_', ' ')} - {new Date(plan.created_at).toLocaleDateString('es-CL')}
                </summary>
                <pre className="mt-4 whitespace-pre-wrap text-sm text-zinc-200 font-sans">
                  {plan.contenido}
                </pre>

                {(() => {
                  const progress = progresoPlan(plan)
                  const nextSession = Array.from(
                    { length: progress.totalSesiones },
                    (_, index) => index + 1,
                  ).find((number) => !completados[plan.id]?.sessions?.[number])

                  return (
                    <div className="mt-4 rounded-2xl border border-zinc-700 bg-zinc-900 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="font-black text-blue-300">Progreso del plan</p>
                          <p className="text-sm text-zinc-400 mt-1">
                            {progress.done}/{progress.totalSesiones} sesiones completadas
                            {' · '}
                            {progress.semanas} semana{progress.semanas === 1 ? '' : 's'}
                            {' · '}
                            {progress.sesionesSemana} sesión{progress.sesionesSemana === 1 ? '' : 'es'} por semana
                          </p>
                        </div>
                        <span className={`rounded-full px-3 py-1 text-xs font-black border ${
                          progress.complete
                            ? 'bg-green-950 border-green-700 text-green-300'
                            : 'bg-yellow-950 border-yellow-700 text-yellow-300'
                        }`}>
                          {progress.complete ? 'PLAN COMPLETADO' : 'EN PROGRESO'}
                        </span>
                      </div>

                      <div className="mt-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {Array.from({ length: progress.totalSesiones }, (_, index) => index + 1).map((sessionNumber) => {
                          const record = completados[plan.id]?.sessions?.[sessionNumber]
                          const key = `${plan.id}:${sessionNumber}`

                          return (
                            <div
                              key={sessionNumber}
                              className={`rounded-2xl border p-4 ${
                                record
                                  ? 'border-green-700 bg-green-950/30'
                                  : sessionNumber === nextSession
                                    ? 'border-blue-600 bg-blue-950/20'
                                    : 'border-zinc-800 bg-black/30'
                              }`}
                            >
                              <p className="font-black">
                                Sesión {sessionNumber} de {progress.totalSesiones}
                              </p>

                              {record ? (
                                <>
                                  <p className="mt-2 text-sm font-black text-green-400">COMPLETADA</p>
                                  <p className="mt-1 text-xs text-zinc-400">
                                    {record.created_at ? new Date(record.created_at).toLocaleString('es-CL') : 'Registrada'}
                                  </p>
                                  <p className="mt-2 text-sm text-yellow-300">
                                    {String(record.metodo || '').split('|').slice(1).join('|').trim()}
                                  </p>
                                  {record.observacion && !String(record.observacion).startsWith('SESION_COMPLETADA:') && (
                                    <p className="mt-2 text-sm text-zinc-300">{record.observacion}</p>
                                  )}
                                </>
                              ) : sessionNumber === nextSession ? (
                                <>
                                  <div className="mt-3 grid gap-2">
                                    <input
                                      type="number"
                                      min="1"
                                      max="10"
                                      value={feedbackPlan[key]?.rpe || '6'}
                                      onChange={(e) => actualizarFeedbackPlan(plan.id, sessionNumber, 'rpe', e.target.value)}
                                      placeholder="RPE 1-10"
                                      className="rounded-xl border border-zinc-700 bg-black p-3 text-white"
                                    />
                                    <input
                                      value={feedbackPlan[key]?.comentario || ''}
                                      onChange={(e) => actualizarFeedbackPlan(plan.id, sessionNumber, 'comentario', e.target.value)}
                                      placeholder="Comentario para tu coach"
                                      className="rounded-xl border border-zinc-700 bg-black p-3 text-white"
                                    />
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => marcarSesionCompletada(plan, sessionNumber)}
                                    className="mt-3 w-full rounded-xl bg-green-600 hover:bg-green-700 p-3 font-black"
                                  >
                                    Completar sesión {sessionNumber}
                                  </button>
                                </>
                              ) : (
                                <p className="mt-2 text-sm text-zinc-500">
                                  Se habilita al completar la sesión anterior.
                                </p>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })()}
              </details>
            ))}
          </div>
        </section>
      )}

      <div className="grid md:grid-cols-2 gap-6">

        {bloquesVisibles.map((bloque, index) => {

          const valores = formValues[bloque.nombre] || {}

          return (

            <div
              key={index}
              className="bg-zinc-900 border border-zinc-700 rounded-3xl p-6"
            >

              <div className="flex justify-between items-center mb-5">

                <h2 className="text-3xl font-black text-yellow-400">
                  {bloque.nombre}
                </h2>

                <span
                  className={`px-4 py-2 rounded-full font-black ${
                    bloque.tipo === 'gratis'
                      ? 'bg-green-600'
                      : 'bg-purple-700'
                  }`}
                >
                  {bloque.tipo}
                </span>

              </div>

              <div className="space-y-2 mb-5">

                <p className="text-cyan-400 font-bold">
                  Método: {bloque.metodo}
                </p>

                <p className="text-orange-400 font-bold">
                  Duración: {bloque.duracion}
                </p>

                <p className="text-pink-400 font-bold">
                  Objetivo: {bloque.objetivo}
                </p>

                <p className="text-zinc-400">
                  Descanso entre bloques: 2 MIN
                </p>

              </div>

              <div className="mb-6">

                <h3 className="text-red-500 text-xl font-black mb-4">
                  WORKOUT
                </h3>

                <ul className="space-y-3">

                  {bloque.ejercicios.map((ejercicio, i) => (

                    <li
                      key={i}
                      className="bg-zinc-800 rounded-2xl p-4"
                    >
                      - {ejercicio}
                    </li>

                  ))}

                </ul>

              </div>

              {bloque.record === 'vueltas' && (

                <input
                  type="number"
                  placeholder="Vueltas completadas"
                  value={valores.vueltas || ''}
                  onChange={(e) =>
                    actualizarValor(
                      bloque.nombre,
                      'vueltas',
                      e.target.value
                    )
                  }
                  className="w-full p-4 rounded-xl bg-zinc-800 mb-4"
                />

              )}

              {bloque.record === 'repeticiones' && (

                <input
                  type="number"
                  placeholder={bloque.label || 'Repeticiones totales'}
                  value={valores.repeticiones || ''}
                  onChange={(e) =>
                    actualizarValor(
                      bloque.nombre,
                      'repeticiones',
                      e.target.value
                    )
                  }
                  className="w-full p-4 rounded-xl bg-zinc-800 mb-4"
                />

              )}

              {bloque.record === 'tiempo' && (

                <input
                  type="number"
                  placeholder="Tiempo en segundos"
                  value={valores.tiempo_segundos || ''}
                  onChange={(e) =>
                    actualizarValor(
                      bloque.nombre,
                      'tiempo_segundos',
                      e.target.value
                    )
                  }
                  className="w-full p-4 rounded-xl bg-zinc-800 mb-4"
                />

              )}

              {bloque.record === 'peso' && (

                <div className="space-y-3 mb-5">

                  <input
                    type="number"
                    placeholder="Peso levantado KG"
                    value={valores.peso_kg || ''}
                    onChange={(e) =>
                      actualizarValor(
                        bloque.nombre,
                        'peso_kg',
                        e.target.value
                      )
                    }
                    className="w-full p-4 rounded-xl bg-zinc-800"
                  />

                  <select
                    value={valores.porcentaje_rm || ''}
                    onChange={(e) =>
                      actualizarValor(
                        bloque.nombre,
                        'porcentaje_rm',
                        e.target.value
                      )
                    }
                    className="w-full p-4 rounded-xl bg-zinc-800"
                  >

                    <option value="">Seleccionar % RM</option>

                    <option value="50">50%</option>
                    <option value="60">60%</option>
                    <option value="70">70%</option>
                    <option value="80">80%</option>
                    <option value="85">85%</option>
                    <option value="90">90%</option>

                  </select>

                </div>

              )}

              <button
                onClick={() => guardarRecord(bloque)}
                className="w-full bg-red-600 hover:bg-red-700 transition rounded-2xl py-4 font-black text-xl"
              >
                GUARDAR RECORD
              </button>

            </div>

          )

        })}

      </div>

    </div>

  )

}


