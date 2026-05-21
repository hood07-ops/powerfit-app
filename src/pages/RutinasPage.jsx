import React, { useEffect, useState } from 'react'
import { supabase } from '../supabase'

export default function RutinasPage({ student }) {
  const [user, setUser] = useState(null)
  const [records, setRecords] = useState([])
  const [mensaje, setMensaje] = useState('')
  const [formValues, setFormValues] = useState({})

  const bloques = [
    {
      nombre: 'ATR Acumulación Fighter',
      metodo: 'AMRAP',
      duracion: '12 min',
      record: 'vueltas',
      tipo: 'gratis',
      ejercicios: ['10 Push Up', '10 Air Squat', '10 Sit Up', '200m Run'],
      xp: 40,
    },
    {
      nombre: 'TABATA Potencia',
      metodo: 'TABATA',
      duracion: '40x20 x4',
      record: 'repeticiones',
      tipo: 'gratis',
      ejercicios: ['Thruster', 'Burpees', 'Kettlebell Swing', 'Battle Rope'],
      xp: 45,
    },
    {
      nombre: 'RM Fuerza Base',
      metodo: 'RM',
      duracion: '5x5',
      record: 'peso',
      tipo: 'premium',
      ejercicios: ['Back Squat', 'Deadlift', 'Bench Press'],
      xp: 70,
    },
    {
      nombre: '21-15-9 Fighter',
      metodo: '21-15-9',
      duracion: 'FOR TIME',
      record: 'tiempo',
      tipo: 'premium',
      ejercicios: ['Thruster', 'Burpees', 'Box Jump'],
      xp: 60,
    },
  ]

  useEffect(() => {
    cargar()
  }, [])

  async function cargar() {
    const { data } = await supabase.auth.getUser()
    const currentUser = data?.user
    if (!currentUser) return

    setUser(currentUser)

    const { data: recordsData } = await supabase
      .from('records_entrenamiento')
      .select('*')
      .eq('user_id', currentUser.id)
      .order('created_at', { ascending: false })

    setRecords(recordsData || [])
  }

  const pagoActivo = student?.estado_pago === 'Pagado'
  const premiumActivo = Number(student?.bloques_premium || 0) > 0

  const bloquesVisibles = bloques.filter((b) => {
    if (b.tipo === 'gratis') return true
    return pagoActivo && premiumActivo
  })

  function actualizarValor(nombre, campo, valor) {
    setFormValues((prev) => ({
      ...prev,
      [nombre]: {
        ...(prev[nombre] || {}),
        [campo]: valor,
      },
    }))
  }

  async function guardarRecord(bloque) {
    if (!user || !student) return

    const valores = formValues[bloque.nombre] || {}

    const payload = {
      user_id: user.id,
      alumno_id: student.id,
      rutina_nombre: bloque.nombre,
      metodo: bloque.metodo,
      tipo_record: bloque.record,
      vueltas: bloque.record === 'vueltas' ? Number(valores.vueltas || 0) : null,
      repeticiones: bloque.record === 'repeticiones' ? Number(valores.repeticiones || 0) : null,
      tiempo_segundos: bloque.record === 'tiempo' ? Number(valores.tiempo_segundos || 0) : null,
      peso_kg: bloque.record === 'peso' ? Number(valores.peso_kg || 0) : null,
      porcentaje_rm: bloque.record === 'peso' ? Number(valores.porcentaje_rm || 0) : null,
    }

    const { error } = await supabase.from('records_entrenamiento').insert([payload])

    if (error) {
      setMensaje('Error guardando record: ' + error.message)
      return
    }

    await supabase
      .from('alumnos')
      .update({ xp: Number(student.xp || 0) + Number(bloque.xp || 20) })
      .eq('id', student.id)

    setMensaje(`Record guardado: ${bloque.nombre}`)
    setFormValues({})
    cargar()
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="bg-zinc-900 border border-red-600 rounded-3xl p-6 mb-8">
        <h1 className="text-5xl font-black text-red-500">
          POWERFIT IA SYSTEM
        </h1>

        <p className="text-zinc-400 mt-3">
          Estado pago: {student?.estado_pago || 'Pendiente'} · Premium: {student?.bloques_premium || 0}
        </p>
      </div>

      {!pagoActivo && (
        <div className="bg-red-950 border border-red-600 rounded-3xl p-6 mb-8">
          <h2 className="text-3xl font-black text-red-400">
            Acceso limitado por pago pendiente
          </h2>
          <p className="text-zinc-300 mt-2">
            Regulariza tu pago para desbloquear rutinas premium.
          </p>
        </div>
      )}

      {pagoActivo && !premiumActivo && (
        <div className="bg-purple-950 border border-purple-600 rounded-3xl p-6 mb-8">
          <h2 className="text-3xl font-black text-purple-300">
            Premium bloqueado
          </h2>
          <p className="text-zinc-300 mt-2">
            Paga $5.000 para desbloquear 2 bloques premium.
          </p>
        </div>
      )}

      {mensaje && (
        <div className="bg-yellow-500 text-black p-4 rounded-2xl font-black mb-6">
          {mensaje}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {bloquesVisibles.map((bloque, index) => {
          const valores = formValues[bloque.nombre] || {}

          return (
            <div key={index} className="bg-zinc-900 border border-zinc-700 rounded-3xl p-6">
              <div className="flex justify-between mb-5">
                <h2 className="text-3xl font-black text-yellow-400">
                  {bloque.nombre}
                </h2>

                <span className={`px-4 py-2 rounded-full font-black ${
                  bloque.tipo === 'gratis' ? 'bg-green-600' : 'bg-purple-700'
                }`}>
                  {bloque.tipo}
                </span>
              </div>

              <p className="text-cyan-400 font-bold">Método: {bloque.metodo}</p>
              <p className="text-orange-400 font-bold">Duración: {bloque.duracion}</p>
              <p className="text-zinc-400 mb-4">Descanso entre bloques: 2 min</p>

              <ul className="space-y-3 mb-5">
                {bloque.ejercicios.map((e, i) => (
                  <li key={i} className="bg-zinc-800 rounded-2xl p-4">
                    • {e}
                  </li>
                ))}
              </ul>

              {bloque.record === 'vueltas' && (
                <input
                  type="number"
                  placeholder="Vueltas completadas"
                  value={valores.vueltas || ''}
                  onChange={(e) => actualizarValor(bloque.nombre, 'vueltas', e.target.value)}
                  className="w-full p-4 rounded-xl bg-zinc-800 mb-4"
                />
              )}

              {bloque.record === 'repeticiones' && (
                <input
                  type="number"
                  placeholder="Repeticiones totales"
                  value={valores.repeticiones || ''}
                  onChange={(e) => actualizarValor(bloque.nombre, 'repeticiones', e.target.value)}
                  className="w-full p-4 rounded-xl bg-zinc-800 mb-4"
                />
              )}

              {bloque.record === 'tiempo' && (
                <input
                  type="number"
                  placeholder="Tiempo en segundos"
                  value={valores.tiempo_segundos || ''}
                  onChange={(e) => actualizarValor(bloque.nombre, 'tiempo_segundos', e.target.value)}
                  className="w-full p-4 rounded-xl bg-zinc-800 mb-4"
                />
              )}

              {bloque.record === 'peso' && (
                <div className="space-y-3 mb-4">
                  <input
                    type="number"
                    placeholder="Peso levantado KG"
                    value={valores.peso_kg || ''}
                    onChange={(e) => actualizarValor(bloque.nombre, 'peso_kg', e.target.value)}
                    className="w-full p-4 rounded-xl bg-zinc-800"
                  />

                  <select
                    value={valores.porcentaje_rm || ''}
                    onChange={(e) => actualizarValor(bloque.nombre, 'porcentaje_rm', e.target.value)}
                    className="w-full p-4 rounded-xl bg-zinc-800"
                  >
                    <option value="">% RM usado</option>
                    <option value="50">50%</option>
                    <option value="60">60%</option>
                    <option value="70">70%</option>
                    <option value="80">80%</option>
                    <option value="90">90%</option>
                  </select>
                </div>
              )}

              <button
                onClick={() => guardarRecord(bloque)}
                className="w-full bg-red-600 hover:bg-red-700 p-4 rounded-2xl font-black"
              >
                GUARDAR RECORD
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}