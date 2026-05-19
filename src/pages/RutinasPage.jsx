import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function RutinasPage() {
  const [student, setStudent] = useState(null)
  const [ranking, setRanking] = useState([])
  const [tiempos, setTiempos] = useState([])
  const [asistencias, setAsistencias] = useState([])
  const [message, setMessage] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return

    const { data: alumno } = await supabase
      .from('alumnos')
      .select('*')
      .eq('user_id', user.id)
      .single()

    setStudent(alumno)

    const { data: rankData } = await supabase
      .from('alumnos')
      .select('id,nombre,xp,estado_pago')
      .order('xp', { ascending: false })

    setRanking(rankData || [])

    const { data: tiemposData } = await supabase
      .from('tiempos_bloques')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    setTiempos(tiemposData || [])

    const { data: asistenciasData } = await supabase
      .from('asistencia')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    setAsistencias(asistenciasData || [])
  }

  async function marcarAsistencia() {
    if (!student) return

    const { error } = await supabase.from('asistencia').insert([
      {
        alumno_id: student.id,
        user_id: student.user_id,
      },
    ])

    if (error) {
      setMessage('Error al marcar asistencia')
      return
    }

    await supabase
      .from('alumnos')
      .update({ xp: Number(student.xp || 0) + 10 })
      .eq('id', student.id)

    setMessage('Asistencia registrada +10 XP')
    loadData()
  }

  async function guardarTiempo(bloque, segundos) {
    if (!student) return

    const { error } = await supabase.from('tiempos_bloques').insert([
      {
        user_id: student.user_id,
        bloque,
        tiempo_segundos: segundos,
      },
    ])

    if (error) {
      setMessage('Error al guardar tiempo')
      return
    }

    await supabase
      .from('alumnos')
      .update({ xp: Number(student.xp || 0) + 20 })
      .eq('id', student.id)

    setMessage(`${bloque} guardado +20 XP`)
    loadData()
  }

  if (!student) {
    return <div className="text-white">Cargando rutinas...</div>
  }

  const acceso = student.estado_pago === 'Pagado'
  const checkinUrl = `${window.location.origin}/?checkin=1`

  return (
    <div className="space-y-8">
      <div
        className={`p-6 rounded-3xl border ${
          acceso
            ? 'bg-green-950 border-green-500'
            : 'bg-red-950 border-red-500'
        }`}
      >
        <h2 className="text-3xl font-black">Estado de acceso</h2>
        <p className="text-xl mt-2">
          {acceso ? 'Rutinas desbloqueadas' : 'Pago pendiente o vencido'}
        </p>
        <p className="mt-2 text-zinc-300">
          Estado pago: {student.estado_pago || 'Pendiente'}
        </p>
      </div>

      <div className="grid md:grid-cols-4 gap-4">
        <Card title="XP" value={student.xp || 0} />
        <Card title="Asistencias" value={asistencias.length} />
        <Card title="Tiempos" value={tiempos.length} />
        <Card title="Plan" value={student.plan || 'Basico'} />
      </div>

      {message && (
        <div className="bg-yellow-600 text-black font-bold p-4 rounded-2xl">
          {message}
        </div>
      )}

      <div className="bg-zinc-900 rounded-3xl p-6 border border-zinc-700">
        <h3 className="text-3xl font-black text-yellow-400 mb-4">
          Check-in / Asistencia
        </h3>

        <button
          onClick={marcarAsistencia}
          className="bg-green-600 px-6 py-4 rounded-2xl font-bold"
        >
          Marcar asistencia
        </button>

        <div className="mt-6">
          <p className="text-zinc-400 mb-3">QR de check-in</p>
          <img
            src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
              checkinUrl
            )}`}
            alt="QR Check-in"
            className="bg-white p-3 rounded-2xl"
          />
        </div>
      </div>

      {acceso ? (
        <div className="grid md:grid-cols-2 gap-6">
          <RoutineCard
            title="PowerFit 360"
            color="text-yellow-400"
            items={[
              'Calentamiento funcional',
              'Circuito fuerza',
              'Pliometría',
              'Cardio HIIT',
              'Core & movilidad',
            ]}
            onSave={() => guardarTiempo('PowerFit 360', 1200)}
          />

          <RoutineCard
            title="Boxeo Competitivo"
            color="text-red-400"
            items={[
              'Técnica ofensiva',
              'Sparring técnico',
              'Defensa activa',
              'Trabajo de saco',
              'Condicionamiento',
            ]}
            onSave={() => guardarTiempo('Boxeo Competitivo', 1500)}
          />
        </div>
      ) : (
        <div className="bg-zinc-900 rounded-3xl p-8 border border-red-700">
          <h3 className="text-3xl font-black text-red-500">
            Acceso bloqueado
          </h3>
          <p className="text-zinc-300 mt-4 text-lg">
            Regulariza tu mensualidad para desbloquear las rutinas.
          </p>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-zinc-900 rounded-3xl p-6 border border-zinc-700">
          <h3 className="text-3xl font-black text-blue-400 mb-4">
            Ranking XP
          </h3>

          <div className="space-y-3">
            {ranking.slice(0, 10).map((alumno, index) => (
              <div
                key={alumno.id}
                className="flex justify-between bg-zinc-800 p-3 rounded-xl"
              >
                <span>
                  #{index + 1} {alumno.nombre}
                </span>
                <span className="font-bold text-yellow-400">
                  {alumno.xp || 0} XP
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-zinc-900 rounded-3xl p-6 border border-zinc-700">
          <h3 className="text-3xl font-black text-purple-400 mb-4">
            Gráfico de progreso
          </h3>

          <div className="space-y-4">
            {tiempos.slice(0, 6).map((t) => (
              <div key={t.id}>
                <div className="flex justify-between text-sm mb-1">
                  <span>{t.bloque}</span>
                  <span>{t.tiempo_segundos}s</span>
                </div>

                <div className="bg-zinc-800 rounded-full h-4">
                  <div
                    className="bg-purple-500 h-4 rounded-full"
                    style={{
                      width: `${Math.min(
                        100,
                        Number(t.tiempo_segundos || 0) / 20
                      )}%`,
                    }}
                  />
                </div>
              </div>
            ))}

            {tiempos.length === 0 && (
              <p className="text-zinc-400">
                Aún no hay tiempos registrados.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function Card({ title, value }) {
  return (
    <div className="bg-zinc-900 border border-zinc-700 rounded-3xl p-6">
      <p className="text-zinc-400">{title}</p>
      <p className="text-3xl font-black mt-2">{value}</p>
    </div>
  )
}

function RoutineCard({ title, color, items, onSave }) {
  return (
    <div className="bg-zinc-900 rounded-3xl p-6 border border-zinc-700">
      <h3 className={`text-2xl font-black ${color}`}>{title}</h3>

      <ul className="mt-4 space-y-2 text-zinc-300">
        {items.map((item) => (
          <li key={item}>• {item}</li>
        ))}
      </ul>

      <button
        onClick={onSave}
        className="mt-6 bg-red-600 px-5 py-3 rounded-2xl font-bold"
      >
        Finalizar bloque
      </button>
    </div>
  )
}