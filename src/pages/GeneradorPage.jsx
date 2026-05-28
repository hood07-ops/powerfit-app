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
  const [mensaje, setMensaje] = useState('')

  useEffect(() => {
    cargarRM()
    cargarPlanificaciones()
  }, [student])

  async function cargarRM() {
    if (!student?.id) return
    const { data } = await supabase.from('rm_alumnos').select('*').eq('alumno_id', student.id)
    setRms(data || [])
  }

  async function cargarPlanificaciones() {
    if (!student?.id) return
    const { data } = await supabase
      .from('planificaciones_generadas')
      .select('*')
      .eq('alumno_id', student.id)
      .order('created_at', { ascending: false })
    setPlanificaciones(data || [])
  }

  function textoPlan(p, numero) {
    return `
POWERFIT 360 - PLANIFICACIÓN ${numero}

Fecha: ${new Date().toLocaleString()}
Alumno: ${student?.nombre || ''}
Objetivo: ${p.objetivo}
Nivel: ${p.nivel}
Fase ATR: ${p.faseATR}

ACTIVACIÓN
Método: ${p.activacion.metodo}
${p.activacion.ejercicios.map((e) => `• ${e}`).join('\n')}

BLOQUE 1
Método: ${p.bloque1.metodo}
${p.bloque1.ejercicios.map((e) => `• ${e}`).join('\n')}

DESCANSO: 2 MIN

BLOQUE 2
Método: ${p.bloque2.metodo}
${p.bloque2.ejercicios.map((e) => `• ${e}`).join('\n')}

DESCANSO: 2 MIN

BLOQUE 3
Método: ${p.bloque3.metodo}
${p.bloque3.ejercicios.map((e) => `• ${e}`).join('\n')}
`
  }

  function descargarWord(contenido) {
    const blob = new Blob([`<html><body><pre>${contenido}</pre></body></html>`], {
      type: 'application/msword',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `PowerFit-${student?.nombre || 'alumno'}-${Date.now()}.doc`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function generar() {
    const disponibles = Number(student?.generaciones_disponibles || 0)
    const cantidadFinal = Math.min(Number(cantidad || 1), disponibles, 2)

    if (cantidadFinal <= 0) {
      setMensaje('No tienes generaciones disponibles.')
      return
    }

    const nuevos = []

    for (let i = 1; i <= cantidadFinal; i++) {
      const plan = generarEntrenamiento({ objetivo, nivel, faseATR, rms })
      const contenido = textoPlan(plan, i)

      const { data, error } = await supabase
        .from('planificaciones_generadas')
        .insert([{
          user_id: student.user_id,
          alumno_id: student.id,
          nombre_alumno: student.nombre,
          objetivo,
          nivel,
          contenido,
        }])
        .select()
        .single()

      if (error) {
        setMensaje(error.message)
        return
      }

      nuevos.push(data)
    }

    await supabase
      .from('alumnos')
      .update({ generaciones_disponibles: disponibles - cantidadFinal })
      .eq('id', student.id)

    descargarWord(nuevos.map((p) => p.contenido).join('\n\n'))
    setMensaje(`${cantidadFinal} planificación(es) generada(s).`)
    cargarPlanificaciones()
    onUpdateStudent?.()
  }

  return (
    <div className="space-y-8">
      <div className="bg-zinc-900 border border-red-600 rounded-3xl p-6">
        <h1 className="text-4xl font-black text-red-500">GENERADOR POWERFIT IA</h1>
        <p className="text-yellow-400 mt-3 font-black">
          Disponibles: {student?.generaciones_disponibles || 0}
        </p>
      </div>

      <div className="grid md:grid-cols-4 gap-4">
        <select value={objetivo} onChange={(e) => setObjetivo(e.target.value)} className="bg-zinc-800 p-4 rounded-2xl">
          <option value="fighter">Fighter</option>
          <option value="fuerza">Fuerza</option>
          <option value="perdida_grasa">Pérdida grasa</option>
          <option value="cardio">Cardio</option>
        </select>

        <select value={nivel} onChange={(e) => setNivel(e.target.value)} className="bg-zinc-800 p-4 rounded-2xl">
          <option value="basico">Básico</option>
          <option value="intermedio">Intermedio</option>
          <option value="avanzado">Avanzado</option>
        </select>

        <select value={faseATR} onChange={(e) => setFaseATR(e.target.value)} className="bg-zinc-800 p-4 rounded-2xl">
          <option value="acumulacion">ATR Acumulación</option>
          <option value="transformacion">ATR Transformación</option>
          <option value="realizacion">ATR Realización</option>
        </select>

        <select value={cantidad} onChange={(e) => setCantidad(Number(e.target.value))} className="bg-zinc-800 p-4 rounded-2xl">
          <option value={1}>1 planificación</option>
          <option value={2}>2 planificaciones</option>
        </select>
      </div>

      <button onClick={generar} className="w-full bg-red-600 hover:bg-red-700 p-5 rounded-2xl font-black text-xl">
        GENERAR PLANIFICACIÓN
      </button>

      {mensaje && <div className="bg-yellow-500 text-black p-4 rounded-2xl font-black">{mensaje}</div>}

      <div className="space-y-6">
        {planificaciones.map((plan) => (
          <div key={plan.id} className="bg-zinc-900 border border-yellow-500 rounded-3xl p-6">
            <h2 className="text-2xl font-black text-yellow-400">{plan.objetivo?.toUpperCase()}</h2>
            <p className="text-zinc-400">Fecha: {new Date(plan.created_at).toLocaleString()}</p>
            <pre className="whitespace-pre-wrap text-sm mt-4">{plan.contenido}</pre>
            <button onClick={() => descargarWord(plan.contenido)} className="bg-blue-600 px-5 py-3 rounded-2xl font-black mt-4">
              Descargar Word
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}