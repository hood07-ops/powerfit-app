import { useEffect, useState } from 'react'
import { supabase } from '../supabase'

export default function CheckInPage({ alumnoId }) {
  const [alumno, setAlumno] = useState(null)
  const [mensaje, setMensaje] = useState('')
  const [loading, setLoading] = useState(true)
  const [yaRegistrado, setYaRegistrado] = useState(false)

  function calcularRango(exp) {
    if (exp >= 2000) return 'Ariki Matatoa'
    if (exp >= 1000) return 'Matatoa Nui'
    if (exp >= 600) return 'Matatoa'
    if (exp >= 300) return 'Oro'
    if (exp >= 100) return 'Plata'
    return 'Bronce'
  }

  function esRpcNoDisponible(error) {
    return (
      error?.code === 'PGRST202' ||
      String(error?.message || '').toLowerCase().includes('could not find the function') ||
      String(error?.message || '').toLowerCase().includes('schema cache')
    )
  }

  async function cargarAlumnoDirecto() {
    const { data, error } = await supabase
      .from('alumnos')
      .select('*')
      .eq('id', alumnoId)
      .single()

    if (error || !data) {
      throw new Error(error?.message || 'No se encontro el alumno.')
    }

    const hoy = new Date().toISOString().slice(0, 10)
    let estadoReal = data.estado_pago || 'Pendiente'

    if (data.fecha_vencimiento && data.fecha_vencimiento < hoy) {
      estadoReal = 'Moroso'

      await supabase
        .from('alumnos')
        .update({ estado_pago: 'Moroso' })
        .eq('id', data.id)
    }

    const { data: asistenciaHoy } = await supabase
      .from('asistencias')
      .select('id')
      .eq('alumno_id', data.id)
      .gte('fecha', `${hoy}T00:00:00`)
      .lte('fecha', `${hoy}T23:59:59`)

    return {
      ...data,
      estado_pago: estadoReal,
      ya_registrado: (asistenciaHoy || []).length > 0,
    }
  }

  async function cargarAlumno() {
    if (!alumnoId) return

    const { data, error } = await supabase.rpc('get_powerfit_checkin_alumno', {
      p_alumno_id: String(alumnoId),
    })

    if (error && esRpcNoDisponible(error)) {
      try {
        const alumnoDirecto = await cargarAlumnoDirecto()
        setYaRegistrado(Boolean(alumnoDirecto.ya_registrado))
        setAlumno(alumnoDirecto)
        setLoading(false)
        return
      } catch (fallbackError) {
        setMensaje(`No se encontro el alumno. ${fallbackError.message}`)
        setLoading(false)
        return
      }
    }

    if (error || !data) {
      setMensaje(`No se encontro el alumno. ${error?.message || ''}`)
      setLoading(false)
      return
    }

    setYaRegistrado(Boolean(data.ya_registrado))
    setAlumno(data)
    setLoading(false)
  }

  useEffect(() => {
    Promise.resolve().then(() => cargarAlumno())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [alumnoId])

  async function registrarAsistencia() {
    if (!alumno) return

    if (yaRegistrado) {
      setMensaje('Este alumno ya tiene asistencia registrada hoy.')
      return
    }

    const { data, error } = await supabase.rpc('registrar_powerfit_checkin', {
      p_alumno_id: String(alumno.id),
    })

    if (error && esRpcNoDisponible(error)) {
      await registrarAsistenciaDirecta()
      return
    }

    if (error || !data) {
      setMensaje(`Error registrando asistencia: ${error?.message || 'sin respuesta'}`)
      return
    }

    if (!data.success) {
      setMensaje(data.message || 'No se pudo registrar la asistencia.')
      setYaRegistrado(true)
      return
    }

    setAlumno({
      ...alumno,
      experiencia: data.experiencia,
      rango: data.rango,
    })

    setYaRegistrado(true)
    setMensaje(data.message)
  }

  async function registrarAsistenciaDirecta() {
    const fechaActual = new Date().toISOString()

    const { error: asistenciaError } = await supabase.from('asistencias').insert([
      {
        alumno_id: alumno.id,
        user_id: alumno.user_id,
        nombre_alumno: alumno.nombre,
        estado_pago: alumno.estado_pago,
        fecha_vencimiento: alumno.fecha_vencimiento,
        registrado_por: 'qr',
        fecha: fechaActual,
        created_at: fechaActual,
      },
    ])

    if (asistenciaError) {
      setMensaje(`Error registrando asistencia: ${asistenciaError.message}`)
      return
    }

    const nuevaExperiencia = Number(alumno.experiencia || 0) + 10
    const nuevoRango = calcularRango(nuevaExperiencia)
    const { error: xpError } = await supabase
      .from('alumnos')
      .update({
        experiencia: nuevaExperiencia,
        rango: nuevoRango,
      })
      .eq('id', alumno.id)

    if (xpError) {
      setMensaje('Asistencia registrada, pero hubo error sumando experiencia.')
      return
    }

    setAlumno({
      ...alumno,
      experiencia: nuevaExperiencia,
      rango: nuevoRango,
    })
    setYaRegistrado(true)
    setMensaje(`Asistencia registrada correctamente. +10 XP. Rango: ${nuevoRango}`)
  }

  if (loading) {
    return <div className="min-h-screen bg-black text-white p-10">Cargando alumno...</div>
  }

  if (!alumno) {
    return <div className="min-h-screen bg-black text-white p-10">{mensaje}</div>
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
        <h1 className="text-4xl font-black mb-6">CHECK-IN POWERFIT</h1>

        <h2 className="text-3xl font-black text-yellow-400">{alumno.nombre}</h2>

        <div className="mt-6 space-y-3 text-xl">
          <p>Estado pago: <strong>{alumno.estado_pago || 'Pendiente'}</strong></p>
          <p>Vencimiento: {alumno.fecha_vencimiento || '-'}</p>
          <p>Generaciones disponibles: {alumno.generaciones_disponibles || 0}</p>
          <p>Mensualidad: ${alumno.monto || 0}</p>
          <p>XP / Experiencia: {alumno.experiencia || 0}</p>
          <p>Rango: {alumno.rango || 'Bronce'}</p>
        </div>

        {pagado && (
          <div className="bg-green-700 p-4 rounded-2xl mt-6 font-black">
            ALUMNO AL DIA
          </div>
        )}
        {pendiente && (
          <div className="bg-yellow-600 text-black p-4 rounded-2xl mt-6 font-black">
            ALUMNO PENDIENTE
          </div>
        )}
        {moroso && (
          <div className="bg-red-700 p-4 rounded-2xl mt-6 font-black">
            ALUMNO MOROSO
          </div>
        )}

        <button
          onClick={registrarAsistencia}
          disabled={yaRegistrado}
          className={`w-full p-5 rounded-2xl font-black text-xl mt-8 ${
            yaRegistrado ? 'bg-zinc-700 opacity-50' : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {yaRegistrado ? 'ASISTENCIA YA REGISTRADA' : 'REGISTRAR ASISTENCIA'}
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

