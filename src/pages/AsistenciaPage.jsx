import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../supabase'

export default function AsistenciaPage() {
  const [students, setStudents] = useState([])
  const [asistencias, setAsistencias] = useState([])
  const [selectedStudent, setSelectedStudent] = useState('')
  const [desde, setDesde] = useState('')
  const [hasta, setHasta] = useState('')

  function obtenerFecha(item) {
  return item.fecha || item.created_at
  }

  useEffect(() => {
    cargarAlumnos()
    cargarAsistencias()
  }, [])

  async function cargarAlumnos() {
    const { data } = await supabase
      .from('alumnos')
      .select('*')
      .order('nombre', { ascending: true })

    setStudents(data || [])
  }

  async function cargarAsistencias() {
    const { data } = await supabase
      .from('asistencias')
      .select('*')
      .order('id', { ascending: false })

    setAsistencias(data || [])
  }

  function descargarCSV() {
    const filas = asistenciasFiltradas.map((a) => {
      const fecha = new Date(a.fecha)

      return [
        a.nombre_alumno,
        a.estado_pago,
        a.fecha_vencimiento || '',
        fecha.toLocaleDateString(),
        fecha.toLocaleTimeString(),
      ].join(',')
    })

    const contenido =
      'Alumno,Estado pago,Vencimiento,Fecha,Hora\n' +
      filas.join('\n') +
      '\n\nTotal asistencias,' +
      asistenciasFiltradas.length

    const blob = new Blob([contenido], {
      type: 'text/csv;charset=utf-8;',
    })

    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')

    link.href = url
    link.download = 'asistencias_powerfit.csv'
    link.click()

    URL.revokeObjectURL(url)
  }

  const asistenciasFiltradas = asistencias.filter((a) => {
   const fecha = String(obtenerFecha(a) || '').slice(0, 10)

    if (selectedStudent && String(a.alumno_id) !== String(selectedStudent)) {
      return false
    }

    if (desde && fecha < desde) return false
    if (hasta && fecha > hasta) return false

    return true
  })

  const selectedStudentData = students.find(
    (student) => String(student.id) === String(selectedStudent)
  )

  const totalClasses = asistenciasFiltradas.length

  const monthlyAttendance = useMemo(() => {
    const currentMonth = new Date().getMonth()

    return asistenciasFiltradas.filter((item) => {
      const itemMonth = new Date(obtenerFecha(item))
      return itemMonth === currentMonth
    }).length
  }, [asistenciasFiltradas])

  const attendancePercentage = Math.min(100, totalClasses * 5)

  const consistencyLevel =
    attendancePercentage >= 80
      ? 'Alta'
      : attendancePercentage >= 50
      ? 'Media'
      : 'Baja'

  return (
    <div className="space-y-8">
      <section className="bg-zinc-900 rounded-3xl p-6 border border-cyan-600">
        <h2 className="text-4xl font-black text-cyan-400">
          Registro de Asistencias QR
        </h2>

        <p className="text-zinc-400 mt-2">
          Historial de asistencias registradas mediante QR.
        </p>
      </section>

      <section className="bg-zinc-900 rounded-3xl p-6 border border-zinc-800">
        <h3 className="text-3xl font-bold mb-6">
          Filtros
        </h3>

        <div className="grid md:grid-cols-5 gap-4">
          <select
            value={selectedStudent}
            onChange={(e) => setSelectedStudent(e.target.value)}
            className="bg-zinc-800 rounded-xl px-4 py-3"
          >
            <option value="">Todos los alumnos</option>

            {students.map((student) => (
              <option key={student.id} value={student.id}>
                {student.nombre}
              </option>
            ))}
          </select>

          <input
            type="date"
            value={desde}
            onChange={(e) => setDesde(e.target.value)}
            className="bg-zinc-800 rounded-xl px-4 py-3"
          />

          <input
            type="date"
            value={hasta}
            onChange={(e) => setHasta(e.target.value)}
            className="bg-zinc-800 rounded-xl px-4 py-3"
          />

          <button
            onClick={descargarCSV}
            className="bg-blue-600 hover:bg-blue-700 rounded-xl font-bold"
          >
            Descargar CSV
          </button>

          <button
            onClick={cargarAsistencias}
            className="bg-green-600 hover:bg-green-700 rounded-xl font-bold"
          >
            Actualizar
          </button>
        </div>
      </section>

      <section className="grid md:grid-cols-4 gap-5">
        <div className="bg-zinc-900 rounded-3xl p-6 border border-zinc-800">
          <p className="text-zinc-400">Asistencias filtradas</p>
          <h3 className="text-5xl font-black mt-3">
            {totalClasses}
          </h3>
        </div>

        <div className="bg-zinc-900 rounded-3xl p-6 border border-zinc-800">
          <p className="text-zinc-400">Asistencias este mes</p>
          <h3 className="text-5xl font-black mt-3 text-green-400">
            {monthlyAttendance}
          </h3>
        </div>

        <div className="bg-zinc-900 rounded-3xl p-6 border border-zinc-800">
          <p className="text-zinc-400">Constancia</p>
          <h3 className="text-5xl font-black mt-3 text-yellow-400">
            {attendancePercentage}%
          </h3>
        </div>

        <div className="bg-zinc-900 rounded-3xl p-6 border border-zinc-800">
          <p className="text-zinc-400">Nivel</p>
          <h3 className="text-4xl font-black mt-3 text-cyan-400">
            {consistencyLevel}
          </h3>
        </div>
      </section>

      {selectedStudentData && (
        <section className="bg-zinc-900 rounded-3xl p-6 border border-yellow-600">
          <h3 className="text-3xl font-bold mb-3 text-yellow-400">
            Alumno seleccionado
          </h3>

          <p className="text-xl font-black">
            {selectedStudentData.nombre}
          </p>

          <p className="text-zinc-400">
            Estado pago: {selectedStudentData.estado_pago || 'Pendiente'}
          </p>

          <p className="text-zinc-400">
            Vencimiento: {selectedStudentData.fecha_vencimiento || '-'}
          </p>
        </section>
      )}

      <section className="bg-zinc-900 rounded-3xl p-6 border border-zinc-800">
        <h3 className="text-3xl font-bold mb-6">
          Historial de asistencia
        </h3>

        <div className="space-y-3">
          {asistenciasFiltradas.map((item) => (
            <div
              key={item.id}
              className="bg-zinc-950 rounded-2xl p-4 border border-zinc-800 grid md:grid-cols-5 gap-3"
            >
              <div>
                <p className="font-bold">
                  {item.nombre_alumno}
                </p>

                <p className="text-zinc-400">
                  Alumno ID: {item.alumno_id}
                </p>
              </div>

              <div
                className={
                  item.estado_pago === 'Pagado'
                    ? 'text-green-400 font-bold'
                    : 'text-red-400 font-bold'
                }
              >
                {item.estado_pago || 'Pendiente'}
              </div>

              <div>
                Vence: {item.fecha_vencimiento || '-'}
              </div>

              <div>
                {new Date(obtenerFecha(item)).toLocaleDateString()}
              </div>

              <div>
                {new Date(obtenerFecha(item)).toLocaleTimeString()}
              </div>
            </div>
          ))}

          {asistenciasFiltradas.length === 0 && (
            <p className="text-zinc-400">
              No hay asistencias registradas.
            </p>
          )}
        </div>
      </section>
    </div>
  )
}