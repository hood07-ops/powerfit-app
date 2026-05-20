import React, { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import { generarEntrenamiento } from '../data/workoutSystem'

console.log('RUTINAS NUEVAS ACTIVAS')

export default function RutinasPage({ student }) {
  const [ranking, setRanking] = useState([])

  const entrenamiento = generarEntrenamiento()

  const rutinas = [
    {
      nombre: 'Activación Fighter',
      metodo: entrenamiento.activacion.metodo,
      ejercicios: entrenamiento.activacion.ejercicios,
      tipo: 'gratis',
    },

    {
      nombre: 'Bloque Principal',
      metodo: entrenamiento.bloque1.metodo,
      ejercicios: entrenamiento.bloque1.ejercicios,
      tipo: 'gratis',
    },

    {
      nombre: 'Bloque Fuerza ATR',
      metodo: entrenamiento.bloque2.metodo,
      ejercicios: entrenamiento.bloque2.ejercicios,
      tipo: 'premium',
    },

    {
      nombre: 'Bloque Final Combat',
      metodo: entrenamiento.bloque3.metodo,
      ejercicios: entrenamiento.bloque3.ejercicios,
      tipo: 'premium',
    },
  ]

  const bloquesPremium = Number(student?.bloques_premium || 0)

  const rutinasVisibles = rutinas.filter((r) => {
    if (r.tipo === 'gratis') return true
    return bloquesPremium > 0
  })

  async function finalizarBloque(nombreRutina) {
    const nuevoXP = Number(student?.xp || 0) + 40

    await supabase
      .from('alumnos')
      .update({
        xp: nuevoXP,
      })
      .eq('id', student.id)

    alert(`+40 XP ganados en ${nombreRutina}`)

    window.location.reload()
  }

  async function cargarRanking() {
    const { data } = await supabase
      .from('alumnos')
      .select('*')
      .order('xp', { ascending: false })

    if (data) {
      setRanking(data)
    }
  }

  useEffect(() => {
    cargarRanking()
  }, [])

  return (
    <div className="space-y-10">

      <div className="bg-zinc-900 rounded-3xl p-6 border border-yellow-500">
        <h1 className="text-5xl font-black text-yellow-400">
          POWERFIT 360
        </h1>

        <p className="text-zinc-400 mt-3 text-lg">
          Sistema ATR • Fighter Conditioning • Fuerza Funcional
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {rutinasVisibles.map((rutina, index) => (
          <div
            key={index}
            className="bg-zinc-900 border border-zinc-700 rounded-3xl p-6"
          >
            <div className="flex justify-between items-center">
              <h2 className="text-3xl font-black text-yellow-400">
                {rutina.nombre}
              </h2>

              <span
                className={`px-4 py-2 rounded-full text-sm font-black ${
                  rutina.tipo === 'gratis'
                    ? 'bg-green-500'
                    : 'bg-purple-600'
                }`}
              >
                {rutina.tipo.toUpperCase()}
              </span>
            </div>

            <div className="mt-4">
              <p className="text-pink-400 text-xl font-black">
                Método:
              </p>

              <p className="text-white text-lg mt-1">
                {rutina.metodo}
              </p>
            </div>

            <div className="mt-6">
              <h3 className="text-red-500 text-xl font-black mb-4">
                Ejercicios
              </h3>

              <ul className="space-y-3">
                {rutina.ejercicios.map((ejercicio, i) => (
                  <li
                    key={i}
                    className="bg-zinc-800 rounded-2xl p-4 text-zinc-200"
                  >
                    • {ejercicio}
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-6">
              <input
                type="number"
                placeholder="Ingresa tu tiempo en segundos"
                className="w-full bg-zinc-800 rounded-2xl p-4 text-white outline-none"
              />

              <button
                onClick={() => finalizarBloque(rutina.nombre)}
                className="w-full mt-4 bg-red-600 hover:bg-red-700 transition rounded-2xl py-4 font-black text-xl"
              >
                Finalizar bloque
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        <div className="bg-zinc-900 rounded-3xl p-6 border border-blue-500">
          <h2 className="text-4xl font-black text-blue-400 mb-6">
            Clasificación XP
          </h2>

          <div className="space-y-4">
            {ranking.map((alumno, index) => (
              <div
                key={alumno.id}
                className="bg-zinc-800 rounded-2xl p-4 flex justify-between"
              >
                <span className="font-black text-white">
                  #{index + 1} {alumno.nombre}
                </span>

                <span className="text-yellow-400 font-black">
                  {alumno.xp || 0} XP
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-zinc-900 rounded-3xl p-6 border border-purple-500">
          <h2 className="text-4xl font-black text-purple-400 mb-6">
            Progreso ATR
          </h2>

          <div className="space-y-5">

            <div>
              <div className="flex justify-between mb-2">
                <span className="text-white font-black">
                  Resistencia
                </span>

                <span className="text-white">
                  70%
                </span>
              </div>

              <div className="w-full bg-zinc-800 h-5 rounded-full">
                <div className="bg-purple-500 h-5 rounded-full w-[70%]" />
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <span className="text-white font-black">
                  Fuerza
                </span>

                <span className="text-white">
                  55%
                </span>
              </div>

              <div className="w-full bg-zinc-800 h-5 rounded-full">
                <div className="bg-red-500 h-5 rounded-full w-[55%]" />
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <span className="text-white font-black">
                  Potencia
                </span>

                <span className="text-white">
                  80%
                </span>
              </div>

              <div className="w-full bg-zinc-800 h-5 rounded-full">
                <div className="bg-yellow-400 h-5 rounded-full w-[80%]" />
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  )
}