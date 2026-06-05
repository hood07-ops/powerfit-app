import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../supabase'

export default function AsistenciaResumenPage() {
  const [alumnos, setAlumnos] = useState([])
  const [asistencias, setAsistencias] = useState([])

  useEffect(() => {
    cargarDatos()
  }, [])

  async function cargarDatos() {
    const { data: alumnosData } = await supabase
      .from('alumnos')
      .select('*')
      .order('nombre', { ascending: true })

    const { data: asistenciasData } = await supabase
      .from('asistencias')
      .select('*')
      .order('created_at', { ascending: false })

    setAlumnos(alumnosData || [])
    setAsistencias(asistenciasData || [])
  }

  function diasSinAsistir(ultimaFecha) {
    if (!ultimaFecha) return 'Sin registros'

    const hoy = new Date()
    const ultima = new Date(ultimaFecha)

    const diferencia = hoy - ultima
    const dias = Math.floor(diferencia / (1000 * 60 * 60 * 24))

    return `${dias} días`
  }

  const resumen = useMemo(() => {
    return alumnos.map((alumno) => {
      const registros = asistencias.filter(
        (a) => Number(a.alumno_id) === Number(alumno.id)
      )

      const ultima = registros[0]?.created_at || null

      const esteMes = registros.filter((a) => {
        const fecha = new Date(a.created_at)
        const hoy = new Date()

        return (
          fecha.getMonth() === hoy.getMonth() &&
          fecha.getFullYear() === hoy.getFullYear()
        )
      }).length

      return {
        ...alumno,
        totalAsistencias: registros.length,
        asistenciaMes: esteMes,
        ultimaAsistencia: ultima,
        diasSinAsistir: diasSinAsistir(ultima),
      }
    })
  }, [alumnos, asistencias])

  return (
    <div className="bg-zinc-900 border border-purple-600 rounded-3xl p-6">
      <h2 className="text-4xl font-black text-purple-400 mb-6">
        Resumen de asistencia por alumno
      </h2>

      <button
        onClick={cargarDatos}
        className="bg-purple-600 hover:bg-purple-700 px-5 py-3 rounded-2xl font-black mb-6"
      >
        Actualizar resumen
      </button>

      <div className="space-y-3">
        {resumen.map((a) => (
          <div
            key={a.id}
            className="grid md:grid-cols-6 gap-3 bg-zinc-800 rounded-2xl p-4 items-center"
          >
            <div>
              <p className="font-black text-yellow-400">
                {a.nombre}
              </p>

              <p className="text-zinc-400 text-sm">
                {a.estado_pago || 'Pendiente'}
              </p>
            </div>

            <p>
              Total: {a.totalAsistencias}
            </p>

            <p>
              Mes: {a.asistenciaMes}
            </p>

            <p>
              Última:{' '}
              {a.ultimaAsistencia
                ? new Date(a.ultimaAsistencia).toLocaleDateString()
                : '-'}
            </p>

            <p
              className={
                a.totalAsistencias === 0
                  ? 'text-red-400 font-black'
                  : 'text-green-400 font-black'
              }
            >
              {a.diasSinAsistir}
            </p>

            <p
              className={
                a.estado_pago === 'Pagado'
                  ? 'text-green-400 font-black'
                  : 'text-red-400 font-black'
              }
            >
              {a.estado_pago || 'Pendiente'}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}