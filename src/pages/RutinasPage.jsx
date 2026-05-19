import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const metodos = [
  ['TABATA', '20 segundos de trabajo + 10 segundos descanso.'],
  ['AMRAP', 'Máximas rondas o repeticiones en un tiempo definido.'],
  ['EMOM', 'Cada minuto comienza una tarea nueva.'],
  ['HIIT', 'Intervalos de alta intensidad.'],
  ['ATR', 'Acumulación, Transformación y Realización.'],
  ['RM', 'Trabajo basado en repeticiones máximas.'],
  ['Kettlebell', 'Trabajo con pesas rusas.'],
  ['Calistenia', 'Entrenamiento con peso corporal.'],
]

export default function RutinasPage() {
  const [student, setStudent] = useState(null)
  const [rutinas, setRutinas] = useState([])
  const [ranking, setRanking] = useState([])
  const [tiempos, setTiempos] = useState([])
  const [message, setMessage] = useState('')
  const [activeBlock, setActiveBlock] = useState(null)
  const [customTime, setCustomTime] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    const { data: userData } = await supabase.auth.getUser()
    const user = userData?.user
    if (!user) return

    const { data: alumno } = await supabase
      .from('alumnos')
      .select('*')
      .eq('user_id', user.id)
      .single()

    setStudent(alumno)

    const { data: rutinasData } = await supabase
      .from('rutinas')
      .select('*')
      .eq('activo', true)
      .order('id', { ascending: true })

    setRutinas(rutinasData || [])

    const { data: rankData } = await supabase
      .from('alumnos')
      .select('id,nombre,xp,role')
      .order('xp', { ascending: false })

    setRanking((rankData || []).filter((a) => a.role !== 'admin'))

    const { data: tiemposData } = await supabase
      .from('tiempos_bloques')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    setTiempos(tiemposData || [])
  }

  async function guardarTiempo(rutina) {
    if (!student) return

    const segundos = Number(customTime)

    if (!segundos || segundos <= 0) {
      setMessage('Ingresa un tiempo válido en segundos')
      return
    }

    const tiemposMismoBloque = tiempos.filter(
      (t) => t.bloque === rutina.nombre
    )

    const mejorTiempoAnterior = tiemposMismoBloque.length
      ? Math.min(...tiemposMismoBloque.map((t) => Number(t.tiempo_segundos)))
      : null

    const nuevoRecord = mejorTiempoAnterior
      ? segundos < mejorTiempoAnterior
      : true

    const xpGanado = nuevoRecord ? Number(rutina.xp || 100) : 20

    await supabase.from('tiempos_bloques').insert([
      {
        user_id: student.user_id,
        bloque: rutina.nombre,
        tiempo_segundos: segundos,
      },
    ])

    await supabase
      .from('alumnos')
      .update({ xp: Number(student.xp || 0) + xpGanado })
      .eq('id', student.id)

    setMessage(
      nuevoRecord
        ? `🔥 Nuevo récord en ${rutina.nombre}. +${xpGanado} XP`
        : `Bloque completado. +20 XP`
    )

    setCustomTime('')
    loadData()
  }

  if (!student) {
    return <div className="text-white">Cargando rutinas...</div>
  }

  const bloquesPremium = Number(student.bloques_premium || 0)

  const rutinasVisibles = rutinas.filter((r) => {
    if (r.tipo === 'gratis') return true
    return bloquesPremium > 0
  })

  return (
    <div className="space-y-8">
      <div className="bg-zinc-900 rounded-3xl p-6 border border-yellow-500">
        <h2 className="text-4xl font-black text-yellow-400">
          PowerFit 360
        </h2>
        <p className="text-zinc-300 mt-2">
          4 bloques gratuitos. Los bloques premium se desbloquean pagando $5.000 por 2 bloques extra.
        </p>
      </div>

      <div className="grid md:grid-cols-4 gap-4">
        <Card title="XP" value={student.xp || 0} />
        <Card title="Plan" value={student.plan || 'Básico'} />
        <Card title="Estado pago" value={student.estado_pago || 'Pendiente'} />
        <Card title="Premium" value={bloquesPremium} />
      </div>

      {message && (
        <div className="bg-yellow-600 text-black p-4 rounded-2xl font-bold">
          {message}
        </div>
      )}

      <section className="bg-zinc-900 rounded-3xl p-6 border border-zinc-700">
        <h3 className="text-3xl font-black text-blue-400 mb-4">
          Métodos de entrenamiento
        </h3>

        <div className="grid md:grid-cols-2 gap-4">
          {metodos.map(([nombre, descripcion]) => (
            <div key={nombre} className="bg-zinc-800 rounded-2xl p-5">
              <h4 className="text-2xl font-black text-red-400">{nombre}</h4>
              <p className="text-zinc-300 mt-2">{descripcion}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h3 className="text-4xl font-black text-red-500 mb-4">
          Bloques de entrenamiento
        </h3>

        <div className="grid md:grid-cols-2 gap-6">
          {rutinasVisibles.map((rutina) => {
            const tiemposRutina = tiempos.filter(
              (t) => t.bloque === rutina.nombre
            )

            const mejorTiempo = tiemposRutina.length
              ? Math.min(...tiemposRutina.map((t) => Number(t.tiempo_segundos)))
              : null

            return (
              <div
                key={rutina.id}
                className="bg-zinc-900 rounded-3xl p-6 border border-zinc-700"
              >
                <div className="flex justify-between gap-4">
                  <h4 className="text-2xl font-black text-yellow-400">
                    {rutina.nombre}
                  </h4>

                  <span
                    className={`px-3 py-1 rounded-full text-sm font-bold ${
                      rutina.tipo === 'gratis'
                        ? 'bg-green-700'
                        : 'bg-purple-700'
                    }`}
                  >
                    {rutina.tipo}
                  </span>
                </div>

                <p className="text-zinc-400 mt-2">
                  {rutina.metodo} · {rutina.nivel}
                </p>

                <p className="text-zinc-300 mt-3">{rutina.objetivo}</p>

                <ul className="mt-4 space-y-2 text-zinc-300">
                  {(rutina.ejercicios || []).map((e) => (
                    <li key={e}>• {e}</li>
                  ))}
                </ul>

                <p className="text-zinc-400 mt-4">
                  Mejor tiempo: {mejorTiempo ? `${mejorTiempo}s` : 'sin registro'}
                </p>

                <input
                  type="number"
                  placeholder="Ingresa tu tiempo en segundos"
                  value={activeBlock === rutina.id ? customTime : ''}
                  onFocus={() => setActiveBlock(rutina.id)}
                  onChange={(e) => {
                    setActiveBlock(rutina.id)
                    setCustomTime(e.target.value)
                  }}
                  className="w-full bg-zinc-800 p-3 rounded-2xl mt-4"
                />

                <button
                  onClick={() => guardarTiempo(rutina)}
                  className="mt-4 bg-red-600 px-5 py-3 rounded-2xl font-bold"
                >
                  Finalizar bloque / guardar tiempo
                </button>
              </div>
            )
          })}
        </div>

        {bloquesPremium === 0 && (
          <div className="mt-6 bg-purple-950 border border-purple-600 rounded-3xl p-6">
            <h3 className="text-2xl font-black text-purple-300">
              Bloques premium ocultos
            </h3>
            <p className="text-zinc-300 mt-2">
              Paga $5.000 para desbloquear 2 bloques premium adicionales.
            </p>
          </div>
        )}
      </section>

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