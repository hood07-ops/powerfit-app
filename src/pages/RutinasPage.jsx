import React, { useEffect, useState } from 'react'
import { supabase } from '../supabase'

export default function RutinasPage() {
  const [user, setUser] = useState(null)
  const [student, setStudent] = useState(null)
  const [records, setRecords] = useState([])
  const [ranking, setRanking] = useState([])
  const [formValues, setFormValues] = useState({})
  const [mensaje, setMensaje] = useState('')

  const bloques = [
    {
      nombre: 'ATR Acumulación Fighter',
      metodo: 'AMRAP',
      duracion: '12 min',
      objetivo: 'Resistencia fighter',
      record: 'vueltas',
      tipo: 'gratis',
      ejercicios: ['10 Push Up', '10 Air Squat', '10 Sit Up', '200m Run'],
      xp: 40,
    },
    {
      nombre: 'TABATA Potencia',
      metodo: 'TABATA',
      duracion: '40x20 x4',
      objetivo: 'Potencia y explosividad',
      record: 'repeticiones',
      tipo: 'gratis',
      ejercicios: ['Thruster', 'Burpees', 'Kettlebell Swing', 'Battle Rope'],
      xp: 45,
    },
    {
      nombre: 'EMOM Fuerza',
      metodo: 'EMOM',
      duracion: '10 min',
      objetivo: 'Fuerza y control',
      record: 'completado',
      tipo: 'gratis',
      ejercicios: ['5 Deadlift', '5 Push Press', '5 Pull Up'],
      xp: 35,
    },
    {
      nombre: 'RM Fuerza Base',
      metodo: 'RM',
      duracion: '5x5',
      objetivo: 'Fuerza máxima',
      record: 'peso',
      tipo: 'premium',
      ejercicios: ['Back Squat', 'Deadlift', 'Bench Press'],
      xp: 70,
    },
    {
      nombre: '21-15-9 Fighter',
      metodo: '21-15-9',
      duracion: 'FOR TIME',
      objetivo: 'Conditioning fighter',
      record: 'tiempo',
      tipo: 'premium',
      ejercicios: ['Thruster', 'Burpees', 'Box Jump'],
      xp: 60,
    },
  ]

  useEffect(() => {
    cargarDatos()
  }, [])

  async function cargarDatos() {
    const { data: authData } = await supabase.auth.getUser()
    const currentUser = authData?.user

    if (!currentUser) return

    setUser(currentUser)

    const { data: alumno } = await supabase
      .from('alumnos')
      .select('*')
      .eq('user_id', currentUser.id)
      .single()

    setStudent(alumno)

    const { data: recordsData } = await supabase
      .from('records_entrenamiento')
      .select('*')
      .eq('user_id', currentUser.id)
      .order('created_at', { ascending: false })

    setRecords(recordsData || [])

    const { data: rankingData } = await supabase
      .from('alumnos')
      .select('id,nombre,xp,role')
      .order('xp', { ascending: false })

    setRanking((rankingData || []).filter((a) => a.role !== 'admin'))
  }

  function actualizarValor(nombreBloque, campo, valor) {
    setFormValues((prev) => ({
      ...prev,
      [nombreBloque]: {
        ...(prev[nombreBloque] || {}),
        [campo]: valor,
      },
    }))
  }

  function mejorRecord(bloque) {
    const propios = records.filter((r) => r.rutina_nombre === bloque.nombre)

    if (propios.length === 0) return 'Sin registro'

    if (bloque.record === 'tiempo') {
      const mejor = Math.min(...propios.map((r) => Number(r.tiempo_segundos || 999999)))
      return `${mejor} segundos`
    }

    if (bloque.record === 'vueltas') {
      const mejor = Math.max(...propios.map((r) => Number(r.vueltas || 0)))
      return `${mejor} vueltas`
    }

    if (bloque.record === 'repeticiones') {
      const mejor = Math.max(...propios.map((r) => Number(r.repeticiones || 0)))
      return `${mejor} reps`
    }

    if (bloque.record === 'peso') {
      const mejor = Math.max(...propios.map((r) => Number(r.peso_kg || 0)))
      return `${mejor} kg`
    }

    if (bloque.record === 'completado') {
      return `${propios.length} registros`
    }

    return 'Sin registro'
  }

  async function guardarRecord(bloque) {
    if (!user || !student) {
      setMensaje('No se encontró usuario o ficha de alumno')
      return
    }

    const valores = formValues[bloque.nombre] || {}

    const payload = {
      user_id: user.id,
      alumno_id: student.id,
      rutina_nombre: bloque.nombre,
      metodo: bloque.metodo,
      tipo_record: bloque.record,
      vueltas: bloque.record === 'vueltas' ? Number(valores.vueltas || 0) : null,
      repeticiones:
        bloque.record === 'repeticiones' ? Number(valores.repeticiones || 0) : null,
      tiempo_segundos:
        bloque.record === 'tiempo' ? Number(valores.tiempo_segundos || 0) : null,
      peso_kg: bloque.record === 'peso' ? Number(valores.peso_kg || 0) : null,
      porcentaje_rm:
        bloque.record === 'peso' ? Number(valores.porcentaje_rm || 0) : null,
      observacion: valores.observacion || null,
    }

    if (
      (bloque.record === 'vueltas' && !payload.vueltas) ||
      (bloque.record === 'repeticiones' && !payload.repeticiones) ||
      (bloque.record === 'tiempo' && !payload.tiempo_segundos) ||
      (bloque.record === 'peso' && !payload.peso_kg)
    ) {
      setMensaje('Completa el resultado antes de guardar')
      return
    }

    const { error } = await supabase.from('records_entrenamiento').insert([payload])

    if (error) {
      setMensaje('Error guardando record: ' + error.message)
      return
    }

    const nuevoXP = Number(student.xp || 0) + Number(bloque.xp || 20)

    await supabase.from('alumnos').update({ xp: nuevoXP }).eq('id', student.id)

    setMensaje(`Record guardado en ${bloque.nombre}. +${bloque.xp} XP`)
    setFormValues({})
    await cargarDatos()
  }

  function calcularPorcentaje(peso, porcentaje) {
    const n = Number(peso || 0)
    if (!n) return '-'
    return `${Math.round(n * porcentaje)} kg`
  }

  if (!student) {
    return (
      <div className="min-h-screen bg-black text-white p-6">
        Cargando ficha y rutinas...
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="bg-zinc-900 border border-red-600 rounded-3xl p-6 mb-10">
        <h1 className="text-5xl font-black text-red-500">
          POWERFIT IA SYSTEM
        </h1>

        <p className="text-zinc-400 mt-4 text-xl">
          Records por método · ATR · RM · PowerFit 360
        </p>

        <p className="text-yellow-400 mt-3 font-black">
          {student.nombre} · XP: {student.xp || 0}
        </p>
      </div>

      {mensaje && (
        <div className="bg-yellow-500 text-black p-4 rounded-2xl font-black mb-6">
          {mensaje}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {bloques.map((bloque, index) => {
          const valores = formValues[bloque.nombre] || {}

          return (
            <div
              key={index}
              className="bg-zinc-900 border border-zinc-700 rounded-3xl p-6"
            >
              <div className="flex justify-between items-center mb-5">
                <h2 className="text-3xl font-black text-yellow-400">
                  {bloque.nombre}
                </h2>

                <span
                  className={`px-4 py-2 rounded-full text-sm font-black ${
                    bloque.tipo === 'gratis'
                      ? 'bg-green-600'
                      : 'bg-purple-700'
                  }`}
                >
                  {bloque.tipo}
                </span>
              </div>

              <div className="space-y-3 mb-6">
                <p className="text-cyan-400 font-bold">
                  Método: {bloque.metodo}
                </p>

                <p className="text-orange-400 font-bold">
                  Duración: {bloque.duracion}
                </p>

                <p className="text-pink-400 font-bold">
                  Objetivo: {bloque.objetivo}
                </p>

                <p className="text-green-400 font-black">
                  Mejor record: {mejorRecord(bloque)}
                </p>

                <p className="text-zinc-400">
                  Descanso entre bloques: 2 min
                </p>
              </div>

              <div className="mb-6">
                <h3 className="text-xl font-black text-red-500 mb-4">
                  Ejercicios
                </h3>

                <ul className="space-y-3">
                  {bloque.ejercicios.map((ejercicio, i) => (
                    <li
                      key={i}
                      className="bg-zinc-800 rounded-2xl p-4 text-zinc-200"
                    >
                      • {ejercicio}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mb-5">
                <h3 className="text-lg font-black text-yellow-400 mb-3">
                  Registrar resultado
                </h3>

                {bloque.record === 'tiempo' && (
                  <input
                    type="number"
                    placeholder="Tiempo en segundos"
                    value={valores.tiempo_segundos || ''}
                    onChange={(e) =>
                      actualizarValor(
                        bloque.nombre,
                        'tiempo_segundos',
                        e.target.value
                      )
                    }
                    className="w-full p-4 rounded-xl bg-zinc-800 mb-4"
                  />
                )}

                {bloque.record === 'vueltas' && (
                  <input
                    type="number"
                    placeholder="Vueltas completadas"
                    value={valores.vueltas || ''}
                    onChange={(e) =>
                      actualizarValor(bloque.nombre, 'vueltas', e.target.value)
                    }
                    className="w-full p-4 rounded-xl bg-zinc-800 mb-4"
                  />
                )}

                {bloque.record === 'repeticiones' && (
                  <input
                    type="number"
                    placeholder="Repeticiones totales"
                    value={valores.repeticiones || ''}
                    onChange={(e) =>
                      actualizarValor(
                        bloque.nombre,
                        'repeticiones',
                        e.target.value
                      )
                    }
                    className="w-full p-4 rounded-xl bg-zinc-800 mb-4"
                  />
                )}

                {bloque.record === 'peso' && (
                  <div className="space-y-3">
                    <input
                      type="number"
                      placeholder="Peso levantado KG"
                      value={valores.peso_kg || ''}
                      onChange={(e) =>
                        actualizarValor(bloque.nombre, 'peso_kg', e.target.value)
                      }
                      className="w-full p-4 rounded-xl bg-zinc-800"
                    />

                    <select
                      value={valores.porcentaje_rm || ''}
                      onChange={(e) =>
                        actualizarValor(
                          bloque.nombre,
                          'porcentaje_rm',
                          e.target.value
                        )
                      }
                      className="w-full p-4 rounded-xl bg-zinc-800"
                    >
                      <option value="">Seleccionar % RM</option>
                      <option value="50">50%</option>
                      <option value="60">60%</option>
                      <option value="70">70%</option>
                      <option value="80">80%</option>
                      <option value="85">85%</option>
                      <option value="90">90%</option>
                      <option value="95">95%</option>
                    </select>

                    <div className="bg-zinc-800 rounded-2xl p-4">
                      <h4 className="text-red-400 font-black mb-3">
                        Tabla porcentual según peso ingresado
                      </h4>

                      <div className="grid grid-cols-2 gap-3 text-zinc-300">
                        <div>50%: {calcularPorcentaje(valores.peso_kg, 0.5)}</div>
                        <div>60%: {calcularPorcentaje(valores.peso_kg, 0.6)}</div>
                        <div>70%: {calcularPorcentaje(valores.peso_kg, 0.7)}</div>
                        <div>80%: {calcularPorcentaje(valores.peso_kg, 0.8)}</div>
                        <div>85%: {calcularPorcentaje(valores.peso_kg, 0.85)}</div>
                        <div>90%: {calcularPorcentaje(valores.peso_kg, 0.9)}</div>
                      </div>
                    </div>
                  </div>
                )}

                {bloque.record === 'completado' && (
                  <select
                    value={valores.observacion || 'Completado'}
                    onChange={(e) =>
                      actualizarValor(
                        bloque.nombre,
                        'observacion',
                        e.target.value
                      )
                    }
                    className="w-full p-4 rounded-xl bg-zinc-800 mb-4"
                  >
                    <option>Completado</option>
                    <option>No completado</option>
                  </select>
                )}
              </div>

              <button
                onClick={() => guardarRecord(bloque)}
                className="w-full bg-red-600 hover:bg-red-700 transition px-6 py-4 rounded-2xl font-black text-lg"
              >
                GUARDAR RECORD
              </button>
            </div>
          )
        })}
      </div>

      <div className="grid md:grid-cols-2 gap-6 mt-10">
        <div className="bg-zinc-900 border border-blue-600 rounded-3xl p-6">
          <h2 className="text-4xl font-black text-blue-400 mb-6">
            Ranking XP
          </h2>

          <div className="space-y-4">
            {ranking.map((alumno, index) => (
              <div
                key={alumno.id}
                className="bg-zinc-800 rounded-2xl p-4 flex justify-between"
              >
                <span className="font-black">
                  #{index + 1} {alumno.nombre}
                </span>

                <span className="text-yellow-400 font-black">
                  {alumno.xp || 0} XP
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-zinc-900 border border-purple-600 rounded-3xl p-6">
          <h2 className="text-4xl font-black text-purple-400 mb-6">
            Historial reciente
          </h2>

          <div className="space-y-3">
            {records.slice(0, 8).map((r) => (
              <div key={r.id} className="bg-zinc-800 rounded-2xl p-4">
                <p className="font-black text-yellow-400">
                  {r.rutina_nombre}
                </p>
                <p className="text-zinc-300">
                  Método: {r.metodo} · Tipo: {r.tipo_record}
                </p>
                <p className="text-zinc-400">
                  Vueltas: {r.vueltas || '-'} · Reps: {r.repeticiones || '-'} ·
                  Tiempo: {r.tiempo_segundos || '-'}s · Peso:{' '}
                  {r.peso_kg || '-'}kg
                </p>
              </div>
            ))}

            {records.length === 0 && (
              <p className="text-zinc-400">Aún no hay records guardados.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}