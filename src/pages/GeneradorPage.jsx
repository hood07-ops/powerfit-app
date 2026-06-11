import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import { generarEntrenamiento } from './workoutSystem'

const ADMIN_WHATSAPP = '56988497852'

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

function descargarWord(contenido, nombreAlumno) {
  const html = `
      <html>
        <head><meta charset="utf-8" /></head>
        <body>
          <pre style="font-family: Arial; font-size: 14px; white-space: pre-wrap;">
${escapeHtml(contenido)}
          </pre>
        </body>
      </html>
    `

  const blob = new Blob([html], { type: 'application/msword;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')

  a.href = url
  a.download = `PowerFit-${nombreAlumno || 'alumno'}-${Date.now()}.doc`
  a.click()

  URL.revokeObjectURL(url)
}

export default function GeneradorPage({ student, onUpdateStudent }) {
  const [objetivo, setObjetivo] = useState('fighter')
  const [nivel, setNivel] = useState('intermedio')
  const [faseATR, setFaseATR] = useState('acumulacion')
  const [rms, setRms] = useState([])
  const [planificaciones, setPlanificaciones] = useState([])
  const [planAbierto, setPlanAbierto] = useState(null)
  const [mensaje, setMensaje] = useState('')
  const [disponiblesLocal, setDisponiblesLocal] = useState(0)
  const [generando, setGenerando] = useState(false)

  async function cargarRM() {
    if (!student?.id) {
      setRms([])
      return
    }

    const { data, error } = await supabase
      .from('rm_alumnos')
      .select('*')
      .eq('alumno_id', student.id)

    if (error) {
      setMensaje(`Error cargando RM: ${error.message}`)
      setRms([])
      return
    }

    setRms(data || [])
  }

  async function cargarPlanificacionesMes() {
    if (!student?.id) {
      setPlanificaciones([])
      return
    }

    await eliminarPlanificacionesVencidas()

    const hoy = new Date()
    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString()
    const finMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 1).toISOString()

    const { data, error } = await supabase
      .from('planificaciones_generadas')
      .select('*')
      .eq('alumno_id', student.id)
      .gte('created_at', inicioMes)
      .lt('created_at', finMes)
      .order('created_at', { ascending: false })

    if (error) {
      setMensaje(`Error cargando planificaciones: ${error.message}`)
      setPlanificaciones([])
      return
    }

    setPlanificaciones(data || [])
  }

  async function eliminarPlanificacionesVencidas() {
    if (!student?.id) return

    const limite = new Date()
    limite.setMonth(limite.getMonth() - 1)

    await supabase
      .from('planificaciones_generadas')
      .delete()
      .eq('alumno_id', student.id)
      .lt('created_at', limite.toISOString())
  }

  async function refrescarGeneraciones() {
    if (!student?.id) return 0

    const { data, error } = await supabase
      .from('alumnos')
      .select('generaciones_disponibles')
      .eq('id', student.id)
      .single()

    if (error) {
      setMensaje(`Error actualizando generaciones: ${error.message}`)
      return Number(disponiblesLocal || 0)
    }

    const disponibles = Number(data?.generaciones_disponibles || 0)
    setDisponiblesLocal(disponibles)
    return disponibles
  }

  useEffect(() => {
    Promise.resolve().then(() => {
      cargarRM()
      cargarPlanificacionesMes()
      setDisponiblesLocal(Number(student?.generaciones_disponibles || 0))
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [student?.id, student?.generaciones_disponibles])

  useEffect(() => {
    const intervalo = setInterval(() => {
      refrescarGeneraciones()
    }, 30000)

    return () => clearInterval(intervalo)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [student?.id])

  function textoPlan(p, numero) {
    return `
POWERFIT 360
PLANIFICACION ${numero}

Fecha: ${new Date().toLocaleString()}
Alumno: ${student?.nombre || ''}
Objetivo: ${p.objetivo}
Nivel: ${p.nivel}
Fase ATR: ${p.faseATR}
Intensidad: ${p.intensidad}
Variante: ${p.variante}

ACTIVACION
Metodo: ${p.activacion.metodo}
${p.activacion.ejercicios.map((e) => `- ${e}`).join('\n')}

BLOQUE 1
Metodo: ${p.bloque1.metodo}
Duracion: ${p.bloque1.duracion}
${p.bloque1.ejercicios.map((e) => `- ${e}`).join('\n')}

DESCANSO: 2 MIN

BLOQUE 2 - FUERZA / RM INTELIGENTE
Metodo: ${p.bloque2.metodo}
Duracion: ${p.bloque2.duracion}
${p.bloque2.ejercicios.map((e) => `- ${e}`).join('\n')}

DESCANSO: 2 MIN

BLOQUE 3
Metodo: ${p.bloque3.metodo}
Duracion: ${p.bloque3.duracion}
${p.bloque3.ejercicios.map((e) => `- ${e}`).join('\n')}

Vuelta a la calma: dirigida en clase.
`
  }

  async function borrarPlanesInsertados(planes) {
    const ids = planes.map((plan) => plan.id).filter(Boolean)
    if (ids.length === 0) return

    await supabase.from('planificaciones_generadas').delete().in('id', ids)
  }

  async function generar() {
    if (!student || generando) return

    setGenerando(true)
    setMensaje('')

    try {
      const disponibles = await refrescarGeneraciones()
      const cantidadFinal = disponibles > 0 ? 1 : 0

      if (cantidadFinal <= 0) {
        setMensaje('No tienes generaciones disponibles. Debes comprar 1 planificacion o regularizar tu pago.')
        return
      }

      const plan = generarEntrenamiento({
        objetivo,
        nivel,
        faseATR,
        rms,
        historial: planificaciones.map((p) => p.contenido),
      })

      const { data: nuevosPlanes, error: insertError } = await supabase
        .from('planificaciones_generadas')
        .insert([
          {
            user_id: student.user_id,
            alumno_id: student.id,
            nombre_alumno: student.nombre,
            objetivo,
            nivel,
            contenido: textoPlan(plan, planificaciones.length + 1),
          },
        ])
        .select()

      if (insertError) {
        setMensaje(`Error guardando planificacion: ${insertError.message}`)
        return
      }

      const { data: alumnoActualizado, error: updateError } = await supabase
        .from('alumnos')
        .update({
          generaciones_disponibles: disponibles - cantidadFinal,
        })
        .eq('id', student.id)
        .eq('generaciones_disponibles', disponibles)
        .select('generaciones_disponibles')

      if (updateError || !alumnoActualizado?.length) {
        await borrarPlanesInsertados(nuevosPlanes || [])
        setMensaje(
          updateError
            ? `Error descontando generaciones: ${updateError.message}`
            : 'Tus generaciones cambiaron mientras se creaba el plan. Intenta nuevamente.'
        )
        await refrescarGeneraciones()
        return
      }

      const disponiblesRestantes = Number(
        alumnoActualizado[0]?.generaciones_disponibles || 0
      )

      setDisponiblesLocal(disponiblesRestantes)
      descargarWord((nuevosPlanes || []).map((p) => p.contenido).join('\n\n'), student.nombre)
      setMensaje('1 planificacion generada, guardada y descargada.')

      await cargarPlanificacionesMes()
      onUpdateStudent?.()
    } finally {
      setGenerando(false)
    }
  }

  async function solicitarCompra() {
    if (!student) return

    const { error } = await supabase
      .from('solicitudes_compra')
      .insert([
        {
          user_id: student.user_id,
          alumno_id: student.id,
          nombre_alumno: student.nombre,
          monto: 2500,
          generaciones: 1,
          estado: 'Pendiente',
        },
      ])

    if (error) {
      setMensaje(error.message)
      return
    }

    const texto = `Hola Robinson, soy ${student.nombre}. Quiero comprar 1 planificacion PowerFit por $2.500.`

    window.open(
      `https://wa.me/${ADMIN_WHATSAPP}?text=${encodeURIComponent(texto)}`,
      '_blank',
      'noopener,noreferrer'
    )

    setMensaje('Solicitud enviada correctamente.')
  }

  const sinDisponibles = Number(disponiblesLocal || 0) <= 0

  return (
    <div className="space-y-8">
      <div className="bg-zinc-900 border border-red-600 rounded-3xl p-6">
        <h1 className="text-4xl font-black text-red-500">
          GENERADOR POWERFIT IA
        </h1>

        <p className="text-yellow-400 mt-3 font-black text-xl">
          Generaciones disponibles: {disponiblesLocal}
        </p>

        <p className="text-zinc-400 mt-2">
          Planificaciones visibles este mes: {planificaciones.length}
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <select
          value={objetivo}
          onChange={(e) => setObjetivo(e.target.value)}
          className="bg-zinc-800 p-4 rounded-2xl"
        >
          <option value="fighter">Fighter</option>
          <option value="fuerza">Fuerza</option>
          <option value="perdida_grasa">Perdida grasa</option>
          <option value="cardio">Cardio</option>
        </select>

        <select
          value={nivel}
          onChange={(e) => setNivel(e.target.value)}
          className="bg-zinc-800 p-4 rounded-2xl"
        >
          <option value="basico">Basico</option>
          <option value="intermedio">Intermedio</option>
          <option value="avanzado">Avanzado</option>
        </select>

        <select
          value={faseATR}
          onChange={(e) => setFaseATR(e.target.value)}
          className="bg-zinc-800 p-4 rounded-2xl"
        >
          <option value="acumulacion">ATR Acumulacion</option>
          <option value="transformacion">ATR Transformacion</option>
          <option value="realizacion">ATR Realizacion</option>
        </select>
      </div>

      {sinDisponibles && (
        <div className="bg-red-950 border border-red-600 p-5 rounded-2xl font-black text-red-300">
          Ya usaste tus planificaciones disponibles. Compra 1 por $2.500 para seguir generando.
        </div>
      )}

      <button
        onClick={generar}
        disabled={sinDisponibles || generando}
        className={`w-full p-5 rounded-2xl font-black text-xl ${
          sinDisponibles || generando
            ? 'bg-zinc-700 opacity-40 cursor-not-allowed'
            : 'bg-red-600 hover:bg-red-700'
        }`}
      >
        {generando
          ? 'GENERANDO...'
          : sinDisponibles
            ? 'SIN PLANIFICACIONES DISPONIBLES'
            : 'GENERAR 1 PLANIFICACION'}
      </button>

      <button
        onClick={solicitarCompra}
        className="w-full bg-green-600 hover:bg-green-700 p-5 rounded-2xl font-black text-xl"
      >
        COMPRAR 1 PLANIFICACION - $2.500
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
                Ver planificacion
              </button>

              <button
                onClick={() => descargarWord(plan.contenido, student?.nombre)}
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
                Planificacion
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
