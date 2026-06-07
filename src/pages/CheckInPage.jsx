import { useEffect, useState } from 'react'
import { supabase } from '../supabase'

export default function CheckInPage({ alumnoId }) {
  const [alumno, setAlumno] = useState(null)
  const [mensaje, setMensaje] = useState('')
  const [loading, setLoading] = useState(true)
  const [yaRegistrado, setYaRegistrado] = useState(false)

  useEffect(() => {
    cargarAlumno()
  }, [alumnoId])

  async function cargarAlumno() {
    if (!alumnoId) return

    const { data, error } = await supabase
      .from('alumnos')
      .select('*')
      .eq('id', alumnoId)
      .single()

    if (error || !data) {
      setMensaje('No se encontró el alumno.')
      setLoading(false)
      return
    }

    const hoy = new Date().toISOString().slice(0, 10)
    const vencimiento = data.fecha_vencimiento || null
    let estadoReal = data.estado_pago || 'Pendiente'

    if (vencimiento && vencimiento < hoy) {
      estadoReal = 'Moroso'

      await supabase
        .from('alumnos')
        .update({ estado_pago: 'Moroso' })
        .eq('id', data.id)
    }

    const { data: asistenciaHoy } = await supabase
      .from('asistencias')
      .select('*')
      .eq('alumno_id', data.id)
      .gte('created_at', `${hoy}T00:00:00`)
      .lte('created_at', `${hoy}T23:59:59`)

    setYaRegistrado((asistenciaHoy || []).length > 0)
    setAlumno({ ...data, estado_pago: estadoReal })
    setLoading(false)
  }

  async function registrarAsistencia() {
    if (!alumno) return

    if (yaRegistrado) {
      setMensaje('Este alumno ya tiene asistencia registrada hoy.')
      return
    }

    const { error } = await supabase.from('asistencias').insert([
      {
        alumno_id: alumno.id,
        user_id: alumno.user_id,
        nombre_alumno: alumno.nombre,
        estado_pago: alumno.estado_pago,
        fecha_vencimiento: alumno.fecha_vencimiento,
        registrado_por: 'qr',
      },
    ])

    const nuevoXP = (alumno.xp || 0) + 10

let nuevoNivel = 'Iniciado'

if (nuevoXP >= 1000) {
  nuevoNivel = 'Ariki Matato’a'
} else if (nuevoXP >= 600) {
  nuevoNivel = 'Matato’a Nui'
} else if (nuevoXP >= 300) {
  nuevoNivel = 'Matato’a'
} else if (nuevoXP >= 100) {
  nuevoNivel = 'Aito'
}

await supabase
  .from('alumnos')
  .update({
    xp: nuevoXP,
    nivel_matatoa: nuevoNivel,
  })
  .eq('id', alumno.id)

    if (error) {
      setMensaje('Error registrando asistencia: ' + error.message)
      return
    }

    setYaRegistrado(true)
    setMensaje('Asistencia registrada correctamente.')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white p-10">
        Cargando alumno...
      </div>
    )
  }

  if (!alumno) {
    return (
      <div className="min-h-screen bg-black text-white p-10">
        {mensaje || 'Alumno no encontrado.'}
      </div>
    )
  }

  const pagado = alumno.estado_pago === 'Pagado'
  const pendiente = alumno.estado_pago === 'Pendiente'
  const moroso = alumno.estado_pago === 'Moroso'

  return (
    <div className="min-h-screen bg-black text-white p-5">
      <div
        className={`rounded-3xl p-6 border ${
          pagado
            ? 'bg-green-950 border-green-500'
            : pendiente
            ? 'bg-yellow-950 border-yellow-500'
            : 'bg-red-950 border-red-500'
        }`}
      >
        <h1 className="text-4xl font-black mb-6">
          CHECK-IN POWERFIT
        </h1>

        <h2 className="text-3xl font-black text-yellow-400">
          {alumno.nombre}
        </h2>

        <div className="mt-6 space-y-3 text-xl">
          <p>
            Estado pago:{' '}
            <span
              className={
                pagado
                  ? 'text-green-400 font-black'
                  : pendiente
                  ? 'text-yellow-400 font-black'
                  : 'text-red-400 font-black'
              }
            >
              {alumno.estado_pago || 'Pendiente'}
            </span>
          </p>

          <p>
            Vencimiento: {alumno.fecha_vencimiento || '-'}
          </p>

          <p>
            Generaciones disponibles: {alumno.generaciones_disponibles || 0}
          </p>

          <p>
            Mensualidad: ${alumno.monto || 0}
          </p>
        </div>

        {pagado && (
          <div className="bg-green-700 p-4 rounded-2xl mt-6 font-black">
            ALUMNO AL DÍA ✅
          </div>
        )}

        {pendiente && (
          <div className="bg-yellow-600 text-black p-4 rounded-2xl mt-6 font-black">
            ALUMNO PENDIENTE DE PAGO ⚠️
          </div>
        )}

        {moroso && (
          <div className="bg-red-700 p-4 rounded-2xl mt-6 font-black">
            ALERTA: ALUMNO MOROSO ❌
          </div>
        )}

        {yaRegistrado && (
          <div className="bg-blue-700 p-4 rounded-2xl mt-6 font-black">
            Este alumno ya registró asistencia hoy.
          </div>
        )}

        <button
          onClick={registrarAsistencia}
          disabled={yaRegistrado}
          className={`w-full p-5 rounded-2xl font-black text-xl mt-8 ${
            yaRegistrado
              ? 'bg-zinc-700 opacity-50 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {yaRegistrado
            ? 'ASISTENCIA YA REGISTRADA'
            : 'REGISTRAR ASISTENCIA'}
        </button>

        {mensaje && (
          <div className="bg-yellow-500 text-black p-4 rounded-2xl font-black mt-5">
            {mensaje}
          </div>
        )}
      </div>
    </div>
  )
}