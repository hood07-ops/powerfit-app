import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function AsistenciaPage() {
  const [students, setStudents] = useState([])
  const [attendance, setAttendance] = useState([])
  const [selectedStudent, setSelectedStudent] = useState('')
  const [classType, setClassType] = useState('PowerFit 360')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])

  useEffect(() => {
    getStudents()
    getAttendance()
  }, [])

  async function getStudents() {
    const { data } = await supabase
      .from('alumnos')
      .select('*')
      .order('nombre', { ascending: true })

    setStudents(data || [])
  }

  async function getAttendance() {
    const { data } = await supabase
      .from('asistencia')
      .select('*, alumnos(nombre, categoria)')
      .order('fecha', { ascending: false })

    setAttendance(data || [])
  }

  async function markAttendance() {
    if (!selectedStudent) return

    await supabase.from('asistencia').insert([
      {
        alumno_id: Number(selectedStudent),
        fecha: date,
        clase: classType,
        presente: true,
      },
    ])

    setSelectedStudent('')
    getAttendance()
  }

  const totalAttendance = attendance.length

  return (
    <div className="space-y-8">
      <section className="bg-zinc-900 rounded-3xl p-6 border border-zinc-800">
        <h2 className="text-4xl font-black text-red-600">
          Control de Asistencia
        </h2>
        <p className="text-zinc-400 mt-2">
          Registro de constancia para calcular progreso, desbloqueos y crecimiento deportivo.
        </p>
      </section>

      <section className="grid md:grid-cols-3 gap-5">
        <div className="bg-zinc-900 rounded-3xl p-6 border border-zinc-800">
          <p className="text-zinc-400">Asistencias registradas</p>
          <h3 className="text-5xl font-black mt-3">{totalAttendance}</h3>
        </div>

        <div className="bg-zinc-900 rounded-3xl p-6 border border-zinc-800">
          <p className="text-zinc-400">Clase actual</p>
          <h3 className="text-3xl font-black mt-3">{classType}</h3>
        </div>

        <div className="bg-zinc-900 rounded-3xl p-6 border border-zinc-800">
          <p className="text-zinc-400">Fecha</p>
          <h3 className="text-3xl font-black mt-3">{date}</h3>
        </div>
      </section>

      <section className="bg-zinc-900 rounded-3xl p-6 border border-zinc-800">
        <h3 className="text-3xl font-bold mb-6">
          Marcar asistencia
        </h3>

        <div className="grid md:grid-cols-4 gap-4">
          <select
            value={selectedStudent}
            onChange={(e) => setSelectedStudent(e.target.value)}
            className="bg-zinc-800 rounded-xl px-4 py-3"
          >
            <option value="">Seleccionar Matato'a</option>
            {students.map((student) => (
              <option key={student.id} value={student.id}>
                {student.nombre}
              </option>
            ))}
          </select>

          <select
            value={classType}
            onChange={(e) => setClassType(e.target.value)}
            className="bg-zinc-800 rounded-xl px-4 py-3"
          >
            <option>PowerFit 360</option>
            <option>Boxeo</option>
            <option>Kickboxing</option>
            <option>BJJ</option>
            <option>Nado</option>
          </select>

          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="bg-zinc-800 rounded-xl px-4 py-3"
          />

          <button
            onClick={markAttendance}
            className="bg-red-600 hover:bg-red-700 rounded-xl font-bold"
          >
            Marcar Presente
          </button>
        </div>
      </section>

      <section className="bg-zinc-900 rounded-3xl p-6 border border-zinc-800">
        <h3 className="text-3xl font-bold mb-6">
          Historial de asistencia
        </h3>

        <div className="space-y-3">
          {attendance.map((item) => (
            <div
              key={item.id}
              className="bg-zinc-950 rounded-2xl p-4 border border-zinc-800 flex justify-between"
            >
              <div>
                <p className="font-bold">{item.alumnos?.nombre}</p>
                <p className="text-zinc-400">{item.clase}</p>
              </div>

              <div className="text-right">
                <p className="text-green-400 font-bold">
                  Presente
                </p>
                <p className="text-zinc-500">{item.fecha}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}