import { useEffect, useState } from 'react'
import { supabase } from '../supabase'

export default function CheckInPage({ alumnoId }) {
  const [alumno, setAlumno] = useState(null)
  const [mensaje, setMensaje] = useState('')
  const [loading, setLoading] = useState(true)

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

    if (error) {
      setMensaje('No se encontró el alumno.')
      setLoading(false)
      return
    }

    setAlumno(data)
    setLoading(false)
  }

  async function registrarAsistencia() {
    if (!alumno) return

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

    if (error) {
      setMensaje('Error registrando asistencia: ' + error.message)
      return
    }

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

  return (
    <div className="min-h-screen bg-black text-white p-5">
      <div
        className={`rounded-3xl p-6 border ${
          pagado
            ? 'bg-green-950 border-green-500'
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
            <span className={pagado ? 'text-green-400 font-black' : 'text-red-400 font-black'}>
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

        {!pagado && (
          <div className="bg-red-700 p-4 rounded-2xl mt-6 font-black">
            ALERTA: Alumno no está al día con el pago.
          </div>
        )}

        <button
          onClick={registrarAsistencia}
          className="w-full bg-blue-600 hover:bg-blue-700 p-5 rounded-2xl font-black text-xl mt-8"
        >
          REGISTRAR ASISTENCIA
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