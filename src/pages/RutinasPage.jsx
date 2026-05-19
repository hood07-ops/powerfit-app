import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const metodos = [
  {
    nombre: 'TABATA',
    descripcion: '20 segundos de trabajo intenso + 10 segundos de descanso, normalmente por 8 rondas.',
    sirve: 'Mejora resistencia, explosividad y tolerancia al cansancio.',
  },
  {
    nombre: 'AMRAP',
    descripcion: 'Hacer la mayor cantidad de rondas o repeticiones posibles en un tiempo definido.',
    sirve: 'Ideal para medir progreso, resistencia mental y capacidad física.',
  },
  {
    nombre: 'EMOM',
    descripcion: 'Every Minute On the Minute: cada minuto comienza una tarea nueva.',
    sirve: 'Ordena el ritmo, mejora técnica bajo fatiga y controla intensidad.',
  },
  {
    nombre: 'HIIT',
    descripcion: 'Intervalos de alta intensidad combinados con pausas cortas.',
    sirve: 'Quema grasa, mejora cardio y potencia.',
  },
  {
    nombre: 'Halterofilia',
    descripcion: 'Trabajo técnico de levantamientos olímpicos y derivados.',
    sirve: 'Potencia, coordinación, fuerza explosiva y control corporal.',
  },
  {
    nombre: 'Pesas rusas',
    descripcion: 'Trabajo con kettlebells: swings, cleans, press, snatch y carries.',
    sirve: 'Fuerza funcional, cadera, core y resistencia.',
  },
  {
    nombre: 'Calistenia',
    descripcion: 'Entrenamiento con peso corporal: flexiones, barras, fondos, sentadillas.',
    sirve: 'Control corporal, fuerza relativa y movilidad.',
  },
  {
    nombre: 'Correr / Nadar',
    descripcion: 'Trabajo aeróbico complementario para base cardiovascular.',
    sirve: 'Mejora recuperación, resistencia y salud general.',
  },
]

const bloques = [
  {
    id: 1,
    nombre: 'Bloque Gratis 1 — PowerFit Base',
    tipo: 'gratis',
    objetivo: 'Adaptación física general',
    ejercicios: ['10 sentadillas', '10 flexiones', '20 abdominales', '200 m trote', '3 rondas'],
    segundosBase: 900,
  },
  {
    id: 2,
    nombre: 'Bloque Gratis 2 — Boxeo Base',
    tipo: 'gratis',
    objetivo: 'Técnica básica de boxeo',
    ejercicios: ['3 rounds sombra', '3 rounds saco', 'Defensa básica', 'Core final'],
    segundosBase: 1200,
  },
  {
    id: 3,
    nombre: 'Bloque Gratis 3 — Core & Mobility',
    tipo: 'gratis',
    objetivo: 'Zona media y movilidad',
    ejercicios: ['Plancha 40s', 'Hollow hold', 'Movilidad cadera', 'Movilidad hombros'],
    segundosBase: 800,
  },
  {
    id: 4,
    nombre: 'Bloque Gratis 4 — HIIT Inicial',
    tipo: 'gratis',
    objetivo: 'Cardio y resistencia',
    ejercicios: ['Burpees', 'Mountain climbers', 'Jumping jacks', 'Skipping', 'Tabata 8 rondas'],
    segundosBase: 600,
  },
  {
    id: 5,
    nombre: 'Bloque Premium 5 — Kettlebell Power',
    tipo: 'premium',
    objetivo: 'Fuerza funcional con pesas rusas',
    ejercicios: ['Swings', 'Goblet squat', 'Clean & press', 'Farmer walk'],
    segundosBase: 1000,
  },
  {
    id: 6,
    nombre: 'Bloque Premium 6 — AMRAP Fighter',
    tipo: 'premium',
    objetivo: 'Resistencia de combate',
    ejercicios: ['AMRAP 15 min', 'Golpes al saco', 'Burpees', 'Abdominales', 'Sprint corto'],
    segundosBase: 1100,
  },
]

export default function RutinasPage() {
  const [student, setStudent] = useState(null)
  const [ranking, setRanking] = useState([])
  const [tiempos, setTiempos] = useState([])
  const [asistencias, setAsistencias] = useState([])
  const [message, setMessage] = useState('')
  const [activeBlock, setActiveBlock] = useState(null)
  const [customTime, setCustomTime] = useState('')

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

    await supabase.from('asistencia').insert([
      {
        alumno_id: student.id,
        user_id: student.user_id,
      },
    ])

    await supabase
      .from('alumnos')
      .update({ xp: Number(student.xp || 0) + 10 })
      .eq('id', student.id)

    setMessage('Asistencia registrada +10 XP')
    loadData()
  }

  async function guardarTiempo(bloque) {
    if (!student) return

    const segundos = Number(customTime)

    if (!segundos || segundos <= 0) {
      setMessage('Ingresa un tiempo válido en segundos')
      return
    }

    const tiemposMismoBloque = tiempos.filter((t) => t.bloque === bloque.nombre)
    const mejorTiempoAnterior = tiemposMismoBloque.length
      ? Math.min(...tiemposMismoBloque.map((t) => Number(t.tiempo_segundos)))
      : null

    const rompioRecord = mejorTiempoAnterior ? segundos < mejorTiempoAnterior : true
    const xpGanado = rompioRecord ? 100 : 20

    await supabase.from('tiempos_bloques').insert([
      {
        user_id: student.user_id,
        bloque: bloque.nombre,
        tiempo_segundos: segundos,
      },
    ])

    await supabase
      .from('alumnos')
      .update({ xp: Number(student.xp || 0) + xpGanado })
      .eq('id', student.id)

    setMessage(
      rompioRecord
        ? `🔥 Nuevo récord en ${bloque.nombre}. +100 XP`
        : `Bloque completado. +20 XP`
    )

    setCustomTime('')
    loadData()
  }

  if (!student) {
    return <div className="text-white">Cargando rutinas...</div>
  }

  const accesoPago = student.estado_pago === 'Pagado'
  const bloquesPremiumComprados = Number(student.bloques_premium || 0)
  const checkinUrl = `${window.location.origin}/?checkin=1`

  function bloqueDisponible(bloque) {
    if (!accesoPago) return false
    if (bloque.tipo === 'gratis') return true
    return bloquesPremiumComprados >= 2
  }

  return (
    <div className="space-y-8">
      <div
        className={`p-6 rounded-3xl border ${
          accesoPago
            ? 'bg-green-950 border-green-500'
            : 'bg-red-950 border-red-500'
        }`}
      >
        <h2 className="text-3xl font-black">Estado de acceso</h2>
        <p className="text-xl mt-2">
          {accesoPago ? 'Rutinas desbloqueadas' : 'Pago pendiente o vencido'}
        </p>
        <p className="text-zinc-300 mt-2">
          Plan: {student.plan || 'Básico'} · Estado pago: {student.estado_pago || 'Pendiente'}
        </p>
      </div>

      <div className="grid md:grid-cols-4 gap-4">
        <Card title="XP" value={student.xp || 0} />
        <Card title="Asistencias" value={asistencias.length} />
        <Card title="Tiempos guardados" value={tiempos.length} />
        <Card title="Bloques premium" value={bloquesPremiumComprados} />
      </div>

      {message && (
        <div className="bg-yellow-600 text-black font-bold p-4 rounded-2xl">
          {message}
        </div>
      )}

      <section className="bg-zinc-900 rounded-3xl p-6 border border-zinc-700">
        <h3 className="text-3xl font-black text-yellow-400 mb-4">
          Métodos de entrenamiento
        </h3>

        <div className="grid md:grid-cols-2 gap-4">
          {metodos.map((m) => (
            <div key={m.nombre} className="bg-zinc-800 rounded-2xl p-5">
              <h4 className="text-2xl font-black text-red-400">{m.nombre}</h4>
              <p className="text-zinc-300 mt-2">{m.descripcion}</p>
              <p className="text-zinc-400 mt-2">
                <strong>Sirve para:</strong> {m.sirve}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-zinc-900 rounded-3xl p-6 border border-zinc-700">
        <h3 className="text-3xl font-black text-green-400 mb-4">
          Check-in / Asistencia
        </h3>

        <button
          onClick={marcarAsistencia}
          className="bg-green-600 px-6 py-4 rounded-2xl font-bold"
        >
          Marcar asistencia +10 XP
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
      </section>

      <section>
        <h3 className="text-4xl font-black text-red-500 mb-4">
          Bloques de entrenamiento
        </h3>

        <div className="grid md:grid-cols-2 gap-6">
          {bloques.map((bloque) => {
            const disponible = bloqueDisponible(bloque)
            const tiemposBloque = tiempos.filter((t) => t.bloque === bloque.nombre)
            const mejorTiempo = tiemposBloque.length
              ? Math.min(...tiemposBloque.map((t) => Number(t.tiempo_segundos)))
              : null

            return (
              <div
                key={bloque.id}
                className={`rounded-3xl p-6 border ${
                  disponible
                    ? 'bg-zinc-900 border-zinc-700'
                    : 'bg-zinc-950 border-red-800 opacity-75'
                }`}
              >
                <div className="flex justify-between gap-4">
                  <h4 className="text-2xl font-black text-yellow-400">
                    {bloque.nombre}
                  </h4>

                  <span
                    className={`px-3 py-1 rounded-full text-sm font-bold ${
                      bloque.tipo === 'gratis'
                        ? 'bg-green-700'
                        : 'bg-purple-700'
                    }`}
                  >
                    {bloque.tipo === 'gratis' ? 'GRATIS' : '$5.000 / 2 bloques'}
                  </span>
                </div>

                <p className="text-zinc-400 mt-2">{bloque.objetivo}</p>

                <ul className="mt-4 space-y-2 text-zinc-300">
                  {bloque.ejercicios.map((e) => (
                    <li key={e}>• {e}</li>
                  ))}
                </ul>

                <div className="mt-4 text-sm text-zinc-400">
                  Mejor tiempo: {mejorTiempo ? `${mejorTiempo}s` : 'sin registro'}
                </div>

                {disponible ? (
                  <div className="mt-5 space-y-3">
                    <input
                      type="number"
                      placeholder="Ingresa tu tiempo en segundos"
                      value={activeBlock === bloque.id ? customTime : ''}
                      onFocus={() => setActiveBlock(bloque.id)}
                      onChange={(e) => {
                        setActiveBlock(bloque.id)
                        setCustomTime(e.target.value)
                      }}
                      className="w-full bg-zinc-800 p-3 rounded-2xl"
                    />

                    <button
                      onClick={() => guardarTiempo(bloque)}
                      className="bg-red-600 px-5 py-3 rounded-2xl font-bold"
                    >
                      Finalizar bloque / guardar tiempo
                    </button>
                  </div>
                ) : (
                  <div className="mt-5 bg-red-950 border border-red-700 rounded-2xl p-4">
                    <p className="font-bold text-red-300">
                      Bloqueado
                    </p>
                    <p className="text-zinc-400 mt-1">
                      Debes estar al día en pagos. Los bloques premium se liberan pagando $5.000 por 2 bloques extra.
                    </p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </section>

      <div className="grid md:grid-cols-2 gap-6">
        <section className="bg-zinc-900 rounded-3xl p-6 border border-zinc-700">
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
        </section>

        <section className="bg-zinc-900 rounded-3xl p-6 border border-zinc-700">
          <h3 className="text-3xl font-black text-purple-400 mb-4">
            Progreso por tiempos
          </h3>

          <div className="space-y-4">
            {tiempos.slice(0, 8).map((t) => (
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
        </section>
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