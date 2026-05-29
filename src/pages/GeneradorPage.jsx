import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import { generarEntrenamiento } from './workoutSystem'

export default function GeneradorPage({ student, onUpdateStudent }) {
  const [objetivo, setObjetivo] = useState('fighter')
  const [nivel, setNivel] = useState('intermedio')
  const [faseATR, setFaseATR] = useState('acumulacion')
  const [cantidad, setCantidad] = useState(1)
  const [rms, setRms] = useState([])
  const [planificaciones, setPlanificaciones] = useState([])
  const [planAbierto, setPlanAbierto] = useState(null)
  const [mensaje, setMensaje] = useState('')

  useEffect(() => {
    cargarRM()
    cargarPlanificacionesMes()
  }, [student])

  async function cargarRM() {
    if (!student?.id) return

    const { data } = await supabase
      .from('rm_alumnos')
      .select('*')
      .eq('alumno_id', student.id)

    setRms(data || [])
  }

  async function cargarPlanificacionesMes() {
    if (!student?.id) return

    const hoy = new Date()
    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString()
    const finMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 1).toISOString()

    const { data } = await supabase
      .from('planificaciones_generadas')
      .select('*')
      .eq('alumno_id', student.id)
      .gte('created_at', inicioMes)
      .lt('created_at', finMes)
      .order('created_at', { ascending: false })

    setPlanificaciones(data || [])
  }

  function textoPlan(p, numero) {
    return `
POWERFIT 360
PLANIFICACIÓN ${numero}

Fecha: ${new Date().toLocaleString()}
Alumno: ${student?.nombre || ''}
Objetivo: ${p.objetivo}
Nivel: ${p.nivel}
Fase ATR: ${p.faseATR}
Intensidad: ${p.intensidad}

ACTIVACIÓN
Método: ${p.activacion.metodo}
${p.activacion.ejercicios.map((e) => `• ${e}`).join('\n')}

BLOQUE 1
Método: ${p.bloque1.metodo}
Duración: ${p.bloque1.duracion}
${p.bloque1.ejercicios.map((e) => `• ${e}`).join('\n')}

DESCANSO: 2 MIN

BLOQUE 2 — FUERZA / RM INTELIGENTE
Método: ${p.bloque2.metodo}
Duración: ${p.bloque2.duracion}
${p.bloque2.ejercicios.map((e) => `• ${e}`).join('\n')}

DESCANSO: 2 MIN

BLOQUE 3
Método: ${p.bloque3.metodo}
Duración: ${p.bloque3.duracion}
${p.bloque3.ejercicios.map((e) => `• ${e}`).join('\n')}

Vuelta a la calma: dirigida en clase.
`
  }

  function descargarWord(contenido) {
    const html = `
      <html>
        <head><meta charset="utf-8" /></head>
        <body>
          <pre style="font-family: Arial; font-size: 14px; white-space: pre-wrap;">
${contenido}
          </pre>
        </body>
      </html>
    `

    const blob = new Blob([html], { type: 'application/msword' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')

    a.href = url
    a.download = `PowerFit-${student?.nombre || 'alumno'}-${Date.now()}.doc`
    a.click()

    URL.revokeObjectURL(url)
  }

  async function generar() {
    if (!student) return

    const disponibles = Number(student?.generaciones_disponibles || 0)
    const cantidadFinal = Math.min(Number(cantidad || 1), disponibles, 2)

    if (cantidadFinal <= 0) {
      setMensaje('No tienes generaciones disponibles. Debes comprar +2 planificaciones o regularizar tu pago.')
      return
    }

    const nuevosPlanes = []

    for (let i = 1; i <= cantidadFinal; i++) {
      const plan = generarEntrenamiento({
        objetivo,
        nivel,
        faseATR,
        rms,
      })

      const contenido = textoPlan(plan, planificaciones.length + i)

      const { data, error } = await supabase
        .from('planificaciones_generadas')
        .insert([
          {
            user_id: student.user_id,
            alumno_id: student.id,
            nombre_alumno: student.nombre,
            objetivo,
            nivel,
            contenido,
          },
        ])
        .select()
        .single()

      if (error) {
        setMensaje('Error guardando planificación: ' + error.message)
        return
      }

      nuevosPlanes.push(data)
    }

    await supabase
      .from('alumnos')
      .update({
        generaciones_disponibles: disponibles - cantidadFinal,
      })
      .eq('id', student.id)

    descargarWord(nuevosPlanes.map((p) => p.contenido).join('\n\n'))

    setMensaje(`${cantidadFinal} planificación(es) generada(s), guardada(s) y descargada(s).`)
    await cargarPlanificacionesMes()
    onUpdateStudent?.()
  }

  return (
    <div className="space-y-8">
      <div className="bg-zinc-900 border border-red-600 rounded-3xl p-6">
        <h1 className="text-4xl font-black text-red-500">
          GENERADOR POWERFIT IA
        </h1>

        <p className="text-yellow-400 mt-3 font-black text-xl">
          Generaciones disponibles: {student?.generaciones_disponibles || 0}
        </p>

        <p className="text-zinc-400 mt-2">
          Planificaciones visibles este mes: {planificaciones.length}
        </p>
      </div>

      <div className="grid md:grid-cols-4 gap-4">
        <select
          value={objetivo}
          onChange={(e) => setObjetivo(e.target.value)}
          className="bg-zinc-800 p-4 rounded-2xl"
        >
          <option value="fighter">Fighter</option>
          <option value="fuerza">Fuerza</option>
          <option value="perdida_grasa">Pérdida grasa</option>
          <option value="cardio">Cardio</option>
        </select>

        <select
          value={nivel}
          onChange={(e) => setNivel(e.target.value)}
          className="bg-zinc-800 p-4 rounded-2xl"
        >
          <option value="basico">Básico</option>
          <option value="intermedio">Intermedio</option>
          <option value="avanzado">Avanzado</option>
        </select>

        <select
          value={faseATR}
          onChange={(e) => setFaseATR(e.target.value)}
          className="bg-zinc-800 p-4 rounded-2xl"
        >
          <option value="acumulacion">ATR Acumulación</option>
          <option value="transformacion">ATR Transformación</option>
          <option value="realizacion">ATR Realización</option>
        </select>

        <select
          value={cantidad}
          onChange={(e) => setCantidad(Number(e.target.value))}
          className="bg-zinc-800 p-4 rounded-2xl"
        >
          <option value={1}>1 planificación</option>
          <option value={2}>2 planificaciones</option>
        </select>
      </div>

      <button
        onClick={generar}
        className="w-full bg-red-600 hover:bg-red-700 p-5 rounded-2xl font-black text-xl"
      >
        GENERAR PLANIFICACIÓN
      </button>

      {mensaje && (
        <div className="bg-yellow-500 text-black p-4 rounded-2xl font-black">
          {mensaje}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {planificaciones.map((plan) => (
          <div
            key={plan.id}
            className="bg-zinc-900 border border-yellow-500 rounded-3xl p-6"
          >
            <h2 className="text-2xl font-black text-yellow-400">
              {plan.objetivo?.toUpperCase()}
            </h2>

            <p className="text-zinc-400 mt-2">
              Fecha: {new Date(plan.created_at).toLocaleString()}
            </p>

            <div className="flex flex-wrap gap-3 mt-5">
              <button
                onClick={() => setPlanAbierto(plan)}
                className="bg-red-600 px-5 py-3 rounded-2xl font-black"
              >
                Ver planificación
              </button>

              <button
                onClick={() => descargarWord(plan.contenido)}
                className="bg-blue-600 px-5 py-3 rounded-2xl font-black"
              >
                Descargar Word
              </button>
            </div>
          </div>
        ))}
      </div>

      {planAbierto && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-6 z-50">
          <div className="bg-zinc-900 border border-yellow-500 rounded-3xl p-6 max-w-4xl max-h-[85vh] overflow-auto">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-3xl font-black text-yellow-400">
                Planificación
              </h2>

              <button
                onClick={() => setPlanAbierto(null)}
                className="bg-red-600 px-4 py-2 rounded-xl font-black"
              >
                Cerrar
              </button>
            </div>

            <p className="text-zinc-400 mb-4">
              Fecha: {new Date(planAbierto.created_at).toLocaleString()}
            </p>

            <pre className="whitespace-pre-wrap text-sm">
              {planAbierto.contenido}
            </pre>
          </div>
        </div>
      )}
    </div>
  )
}