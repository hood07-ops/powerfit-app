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

  function calcularDiasSinAsistir(ultimaFecha) {
    if (!ultimaFecha) return null

    const hoy = new Date()
    const ultima = new Date(ultimaFecha)
    const diferencia = hoy - ultima

    return Math.floor(diferencia / (1000 * 60 * 60 * 24))
  }

  const resumen = useMemo(() => {
    return alumnos.map((alumno) => {
      const registros = asistencias.filter(
        (a) => Number(a.alumno_id) === Number(alumno.id)
      )

      const ultima = registros[0]?.created_at || null
      const dias = calcularDiasSinAsistir(ultima)

      const esteMes = registros.filter((a) => {
        const fecha = new Date(a.created_at)
        const hoy = new Date()

        return (
          fecha.getMonth() === hoy.getMonth() &&
          fecha.getFullYear() === hoy.getFullYear()
        )
      }).length

      let alerta = 'Sin registros'

      if (dias === null) {
        alerta = 'Sin registros'
      } else if (dias >= 14) {
        alerta = 'ALERTA ROJA'
      } else if (dias >= 7) {
        alerta = 'ALERTA AMARILLA'
      } else {
        alerta = 'Activo'
      }

      return {
        ...alumno,
        totalAsistencias: registros.length,
        asistenciaMes: esteMes,
        ultimaAsistencia: ultima,
        diasSinAsistir: dias,
        alerta,
      }
    })
  }, [alumnos, asistencias])

  function descargarResumenCSV() {
    const encabezado =
      'Nombre,Estado pago,Total asistencias,Asistencias mes,Ultima asistencia,Dias sin asistir,Alerta\n'

    const filas = resumen.map((a) => {
      const ultima = a.ultimaAsistencia
        ? new Date(a.ultimaAsistencia).toLocaleDateString()
        : '-'

      return [
        a.nombre,
        a.estado_pago || 'Pendiente',
        a.totalAsistencias,
        a.asistenciaMes,
        ultima,
        a.diasSinAsistir === null ? 'Sin registros' : a.diasSinAsistir,
        a.alerta,
      ].join(',')
    })

    const contenido = encabezado + filas.join('\n')

    const blob = new Blob([contenido], {
      type: 'text/csv;charset=utf-8;',
    })

    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')

    link.href = url
    link.download = 'resumen_asistencia_powerfit.csv'
    link.click()

    URL.revokeObjectURL(url)
  }

  return (
    <div className="bg-zinc-900 border border-purple-600 rounded-3xl p-6">
      <h2 className="text-4xl font-black text-purple-400 mb-6">
        Resumen de asistencia por alumno
      </h2>

      <div className="flex flex-wrap gap-3 mb-6">
        <button
          onClick={cargarDatos}
          className="bg-purple-600 hover:bg-purple-700 px-5 py-3 rounded-2xl font-black"
        >
          Actualizar resumen
        </button>

        <button
          onClick={descargarResumenCSV}
          className="bg-blue-600 hover:bg-blue-700 px-5 py-3 rounded-2xl font-black"
        >
          Descargar CSV resumen
        </button>
      </div>

      <div className="space-y-3">
        {resumen.map((a) => (
          <div
            key={a.id}
            className="grid md:grid-cols-7 gap-3 bg-zinc-800 rounded-2xl p-4 items-center"
          >
            <div>
              <p className="font-black text-yellow-400">
                {a.nombre}
              </p>

              <p className="text-zinc-400 text-sm">
                {a.estado_pago || 'Pendiente'}
              </p>
            </div>

            <p>Total: {a.totalAsistencias}</p>

            <p>Mes: {a.asistenciaMes}</p>

            <p>
              Última:{' '}
              {a.ultimaAsistencia
                ? new Date(a.ultimaAsistencia).toLocaleDateString()
                : '-'}
            </p>

            <p>
              {a.diasSinAsistir === null
                ? 'Sin registros'
                : `${a.diasSinAsistir} días`}
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

            <p
              className={
                a.alerta === 'ALERTA ROJA'
                  ? 'text-red-400 font-black'
                  : a.alerta === 'ALERTA AMARILLA'
                  ? 'text-yellow-400 font-black'
                  : a.alerta === 'Activo'
                  ? 'text-green-400 font-black'
                  : 'text-zinc-400 font-black'
              }
            >
              {a.alerta}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}