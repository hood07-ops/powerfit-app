import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../supabase'

function valorRecord(record) {
  if (Number(record?.peso_kg)) return Number(record.peso_kg)
  if (Number(record?.repeticiones)) return Number(record.repeticiones)
  if (Number(record?.vueltas)) return Number(record.vueltas)
  if (Number(record?.tiempo_segundos)) return Number(record.tiempo_segundos)
  return 0
}

function unidadRecord(record) {
  const nombre = String(record?.rutina_nombre || '').toLowerCase()

  if (Number(record?.peso_kg)) return 'kg'
  if (Number(record?.tiempo_segundos)) return 'seg'
  if (nombre.includes('salto')) return 'cm'
  if (nombre.includes('cooper') || nombre.includes('distancia')) return 'm'
  if (Number(record?.vueltas)) return 'vueltas'
  return 'reps'
}

function formatDate(value) {
  if (!value) return '-'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return String(value)
  return parsed.toLocaleDateString('es-CL')
}

function isThisMonth(value) {
  const date = new Date(value)
  const now = new Date()

  return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()
}

function bestRecord(records, filter, lowerIsBetter = false) {
  const filtered = records.filter(filter).filter((record) => valorRecord(record) > 0)
  if (filtered.length === 0) return null

  return filtered.reduce((best, current) => {
    const currentValue = valorRecord(current)
    const bestValue = valorRecord(best)
    return lowerIsBetter
      ? currentValue < bestValue ? current : best
      : currentValue > bestValue ? current : best
  })
}

export default function EstadisticasPage() {
  const [alumnos, setAlumnos] = useState([])
  const [asistencias, setAsistencias] = useState([])
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function cargarDatos() {
      setLoading(true)

      const [alumnosResult, asistenciasResult, recordsResult] = await Promise.all([
        supabase.from('alumnos').select('*'),
        supabase.from('asistencias').select('*').order('created_at', { ascending: false }),
        supabase.from('records_entrenamiento').select('*').order('created_at', { ascending: false }),
      ])

      setAlumnos(alumnosResult.data || [])
      setAsistencias(asistenciasResult.data || [])
      setRecords(recordsResult.data || [])
      setLoading(false)
    }

    cargarDatos()
  }, [])

  const resumen = useMemo(() => {
    const asistenciasMes = asistencias.filter((item) => isThisMonth(item.fecha || item.created_at))
    const recordsMes = records.filter((item) => isThisMonth(item.created_at))
    const pendientes = alumnos.filter((alumno) => alumno.estado_pago === 'Pendiente').length
    const morosos = alumnos.filter((alumno) => alumno.estado_pago === 'Moroso').length
    const pagados = alumnos.filter((alumno) => alumno.estado_pago === 'Pagado').length
    const asistenciaPorAlumno = alumnos
      .map((alumno) => ({
        alumno,
        asistencias: asistencias.filter((item) => String(item.alumno_id) === String(alumno.id)).length,
        evaluaciones: records.filter((item) => String(item.alumno_id) === String(alumno.id)).length,
      }))
      .sort((a, b) => b.asistencias - a.asistencias)

    return {
      asistenciasMes,
      recordsMes,
      pendientes,
      morosos,
      pagados,
      asistenciaPorAlumno,
      mejorRm: bestRecord(records, (record) => Number(record.peso_kg)),
      mejorTiempo: bestRecord(records, (record) => Number(record.tiempo_segundos), true),
      mejorSalto: bestRecord(records, (record) =>
        String(record.rutina_nombre || '').toLowerCase().includes('salto')
      ),
      mejorVueltas: bestRecord(records, (record) => Number(record.vueltas)),
    }
  }, [alumnos, asistencias, records])

  return (
    <div className="min-h-screen bg-black text-white p-4 sm:p-6">
      <div className="mb-8">
        <h1 className="text-4xl font-black text-green-400">Estadisticas PowerFit 360</h1>
        <p className="text-gray-400 mt-2">
          Datos reales de alumnos, asistencia, pagos y evaluaciones PowerFit.
        </p>
      </div>

      {loading && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 mb-6 font-black">
          Cargando estadisticas...
        </div>
      )}

      <div className="grid md:grid-cols-4 gap-5 mb-8">
        <Metric label="Alumnos" value={alumnos.length} color="text-red-500" />
        <Metric label="Asistencias del mes" value={resumen.asistenciasMes.length} color="text-green-500" />
        <Metric label="Evaluaciones del mes" value={resumen.recordsMes.length} color="text-yellow-500" />
        <Metric label="Morosos" value={resumen.morosos} color="text-orange-500" />
      </div>

      <div className="grid md:grid-cols-3 gap-5 mb-8">
        <Metric label="Pagados" value={resumen.pagados} color="text-green-400" />
        <Metric label="Pendientes" value={resumen.pendientes} color="text-yellow-400" />
        <Metric label="Total evaluaciones" value={records.length} color="text-cyan-400" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Panel title="Ranking de asistencia">
          {resumen.asistenciaPorAlumno.slice(0, 12).map(({ alumno, asistencias: total, evaluaciones }) => (
            <div key={alumno.id} className="bg-gray-900 rounded-xl p-4 grid sm:grid-cols-3 gap-3">
              <span className="font-black">{alumno.nombre || '-'}</span>
              <span className="text-green-500 font-bold">{total} asistencias</span>
              <span className="text-yellow-400 font-bold">{evaluaciones} evaluaciones</span>
            </div>
          ))}
        </Panel>

        <Panel title="Mejores marcas">
          {[resumen.mejorRm, resumen.mejorTiempo, resumen.mejorSalto, resumen.mejorVueltas]
            .filter(Boolean)
            .map((record) => (
              <div key={record.id} className="bg-gray-900 rounded-xl p-4 flex justify-between gap-3">
                <div>
                  <p className="font-black">{record.rutina_nombre || 'Record PowerFit'}</p>
                  <p className="text-gray-400">{formatDate(record.created_at)}</p>
                </div>
                <span className="text-red-500 font-black">
                  {valorRecord(record)} {unidadRecord(record)}
                </span>
              </div>
            ))}

          {!resumen.mejorRm && !resumen.mejorTiempo && !resumen.mejorSalto && !resumen.mejorVueltas && (
            <p className="text-gray-400">Todavia no hay records registrados.</p>
          )}
        </Panel>
      </div>
    </div>
  )
}

function Metric({ label, value, color }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
      <p className="text-gray-400 text-sm">{label}</p>
      <h2 className={`text-4xl font-black ${color}`}>{value}</h2>
    </div>
  )
}

function Panel({ title, children }) {
  return (
    <div className="bg-gray-950 border border-gray-800 rounded-3xl p-6">
      <h2 className="text-2xl font-black mb-4">{title}</h2>
      <div className="space-y-3">{children}</div>
    </div>
  )
}
