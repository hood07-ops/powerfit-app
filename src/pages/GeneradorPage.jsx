import { useEffect, useState } from 'react'
import { supabase } from '../supabase'

const ejerciciosPeso = ['Back Squat', 'Front Squat', 'Deadlift', 'Bench Press', 'Push Press', 'Push Jerk', 'Thruster', 'Clean', 'Snatch']

export default function GeneradorPage({ student, onUpdateStudent }) {
  const [objetivo, setObjetivo] = useState('fighter')
  const [nivel, setNivel] = useState('intermedio')
  const [rms, setRms] = useState([])
  const [plan, setPlan] = useState(null)
  const [mensaje, setMensaje] = useState('')

  useEffect(() => {
    cargarRM()
  }, [])

  async function cargarRM() {
    const { data } = await supabase
      .from('rm_alumnos')
      .select('*')
      .eq('alumno_id', student?.id)

    setRms(data || [])
  }

  function buscarRM(ejercicio) {
    return rms.find((r) => r.ejercicio === ejercicio)?.rm_kg || null
  }

  function carga(ejercicio, porcentaje) {
    const rm = buscarRM(ejercicio)
    if (!rm) return 'RM no registrado'
    return `${Math.round(rm * porcentaje)} kg`
  }

  function crearTextoPlan(nuevo) {
    return `
POWERFIT 360 - PLANIFICACIÓN

Alumno: ${student?.nombre}
Objetivo: ${objetivo}
Nivel: ${nivel}

ACTIVACIÓN
${nuevo.activacion.join('\n')}

BLOQUE 1
${nuevo.bloque1.join('\n')}

Descanso: 2 minutos

BLOQUE 2
${nuevo.bloque2.join('\n')}

Descanso: 2 minutos

BLOQUE 3
${nuevo.bloque3.join('\n')}

Vuelta a la calma: dirigida en clase.
`
  }

  function descargarWord(contenido) {
    const blob = new Blob(
      [`<html><body><pre>${contenido}</pre></body></html>`],
      { type: 'application/msword' }
    )

    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `planificacion-${student?.nombre || 'alumno'}.doc`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function generar() {
    if (Number(student?.generaciones_disponibles || 0) <= 0) {
      setMensaje('Ya usaste tus 6 generaciones de este pago/mes.')
      return
    }

    const nuevo = {
      activacion: ['EMOM 8 MIN', '5 Push Up', '10 Air Squat', '15 Sit Up'],
      bloque1: ['TABATA 40/20', 'Kettlebell Swing', 'Burpees', 'Box Jump'],
      bloque2: [
        'FUERZA / HALTEROFILIA',
        `Back Squat 5x5 @80% → ${carga('Back Squat', 0.8)}`,
        `Deadlift 5x3 @85% → ${carga('Deadlift', 0.85)}`,
        `Push Press 4x5 @75% → ${carga('Push Press', 0.75)}`,
      ],
      bloque3: ['AMRAP 15 MIN', '10 Heavy Bag', '10 Burpees', '200m Run'],
    }

    const contenido = crearTextoPlan(nuevo)

    await supabase.from('planificaciones_generadas').insert([
      {
        user_id: student.user_id,
        alumno_id: student.id,
        nombre_alumno: student.nombre,
        objetivo,
        nivel,
        contenido,
      },
    ])

    await supabase
      .from('alumnos')
      .update({
        generaciones_disponibles: Number(student.generaciones_disponibles || 0) - 1,
      })
      .eq('id', student.id)

    setPlan({ ...nuevo, contenido })
    descargarWord(contenido)
    setMensaje('Planificación generada y descargada en Word.')
    onUpdateStudent?.()
  }

  return (
    <div className="space-y-8">
      <div className="bg-zinc-900 border border-red-600 rounded-3xl p-6">
        <h1 className="text-4xl font-black text-red-500">Generador PowerFit 360</h1>
        <p className="text-yellow-400 mt-2 font-black">
          Generaciones disponibles: {student?.generaciones_disponibles || 0}
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <select value={objetivo} onChange={(e) => setObjetivo(e.target.value)} className="bg-zinc-800 p-4 rounded-2xl">
          <option value="fighter">Fighter</option>
          <option value="fuerza">Fuerza</option>
          <option value="perdida_grasa">Pérdida grasa</option>
        </select>

        <select value={nivel} onChange={(e) => setNivel(e.target.value)} className="bg-zinc-800 p-4 rounded-2xl">
          <option value="basico">Básico</option>
          <option value="intermedio">Intermedio</option>
          <option value="avanzado">Avanzado</option>
        </select>
      </div>

      <button onClick={generar} className="w-full bg-red-600 p-4 rounded-2xl font-black">
        Generar entrenamiento + descargar Word
      </button>

      {mensaje && <p className="bg-yellow-500 text-black p-4 rounded-2xl font-black">{mensaje}</p>}

      {plan && (
        <div className="bg-zinc-900 p-6 rounded-3xl border border-yellow-500 whitespace-pre-wrap">
          {plan.contenido}
        </div>
      )}
    </div>
  )
}