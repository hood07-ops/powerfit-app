import React, { useEffect, useState } from 'react'

export default function RutinasPage() {

  const [ranking, setRanking] = useState([])

  const bloques = [

    {
      nombre: 'ATR Acumulación Fighter',
      metodo: 'AMRAP',
      duracion: '12 min',
      objetivo: 'Resistencia fighter',
      record: 'vueltas',
      tipo: 'gratis',
      ejercicios: [
        '10 Push Up',
        '10 Air Squat',
        '10 Sit Up',
        '200m Run'
      ]
    },

    {
      nombre: 'TABATA Potencia',
      metodo: 'TABATA',
      duracion: '40x20 x4',
      objetivo: 'Potencia y explosividad',
      record: 'repeticiones',
      tipo: 'gratis',
      ejercicios: [
        'Thruster',
        'Burpees',
        'Kettlebell Swing',
        'Battle Rope'
      ]
    },

    {
      nombre: 'EMOM Fuerza',
      metodo: 'EMOM',
      duracion: '10 min',
      objetivo: 'Fuerza y control',
      record: 'completado',
      tipo: 'gratis',
      ejercicios: [
        '5 Deadlift',
        '5 Push Press',
        '5 Pull Up'
      ]
    },

    {
      nombre: 'RM Fuerza Base',
      metodo: 'RM',
      duracion: '5x5',
      objetivo: 'Fuerza máxima',
      record: 'peso',
      tipo: 'premium',
      ejercicios: [
        'Back Squat',
        'Deadlift',
        'Bench Press'
      ]
    },

    {
      nombre: '21-15-9 Fighter',
      metodo: '21-15-9',
      duracion: 'FOR TIME',
      objetivo: 'Conditioning fighter',
      record: 'tiempo',
      tipo: 'premium',
      ejercicios: [
        'Thruster',
        'Burpees',
        'Box Jump'
      ]
    }

  ]

  useEffect(() => {

    setRanking([
      {
        nombre: 'Robinson',
        xp: 1450
      },
      {
        nombre: 'Alumno 1',
        xp: 980
      },
      {
        nombre: 'Alumno 2',
        xp: 860
      }
    ])

  }, [])

  return (

    <div className="min-h-screen bg-black text-white p-6">

      <div className="bg-zinc-900 border border-red-600 rounded-3xl p-6 mb-10">

        <h1 className="text-5xl font-black text-red-500">
          POWERFIT IA SYSTEM
        </h1>

        <p className="text-zinc-400 mt-4 text-xl">
          Sistema ATR • Fighter Conditioning • RM • PowerFit 360
        </p>

      </div>

      <div className="grid md:grid-cols-2 gap-6">

        {bloques.map((bloque, index) => (

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
                  className="w-full p-4 rounded-xl bg-zinc-800 mb-4"
                />
              )}

              {bloque.record === 'vueltas' && (
                <input
                  type="number"
                  placeholder="Vueltas completadas"
                  className="w-full p-4 rounded-xl bg-zinc-800 mb-4"
                />
              )}

              {bloque.record === 'repeticiones' && (
                <input
                  type="number"
                  placeholder="Repeticiones totales"
                  className="w-full p-4 rounded-xl bg-zinc-800 mb-4"
                />
              )}

              {bloque.record === 'peso' && (
                <div className="space-y-3">

                  <input
                    type="number"
                    placeholder="Peso levantado KG"
                    className="w-full p-4 rounded-xl bg-zinc-800"
                  />

                  <div className="bg-zinc-800 rounded-2xl p-4">

                    <h4 className="text-red-400 font-black mb-3">
                      Tabla porcentual RM
                    </h4>

                    <div className="grid grid-cols-2 gap-3 text-zinc-300">

                      <div>50% RM</div>
                      <div>60% RM</div>

                      <div>70% RM</div>
                      <div>80% RM</div>

                      <div>85% RM</div>
                      <div>90% RM</div>

                    </div>

                  </div>

                </div>
              )}

              {bloque.record === 'completado' && (

                <select
                  className="w-full p-4 rounded-xl bg-zinc-800 mb-4"
                >
                  <option>Completado</option>
                  <option>No completado</option>
                </select>

              )}

            </div>

            <button className="w-full bg-red-600 hover:bg-red-700 transition px-6 py-4 rounded-2xl font-black text-lg">
              GUARDAR RECORD
            </button>

          </div>

        ))}

      </div>

      <div className="grid md:grid-cols-2 gap-6 mt-10">

        <div className="bg-zinc-900 border border-blue-600 rounded-3xl p-6">

          <h2 className="text-4xl font-black text-blue-400 mb-6">
            Ranking XP
          </h2>

          <div className="space-y-4">

            {ranking.map((alumno, index) => (

              <div
                key={index}
                className="bg-zinc-800 rounded-2xl p-4 flex justify-between"
              >

                <span className="font-black">
                  #{index + 1} {alumno.nombre}
                </span>

                <span className="text-yellow-400 font-black">
                  {alumno.xp} XP
                </span>

              </div>

            ))}

          </div>

        </div>

        <div className="bg-zinc-900 border border-purple-600 rounded-3xl p-6">

          <h2 className="text-4xl font-black text-purple-400 mb-6">
            Progreso ATR
          </h2>

          <div className="space-y-5">

            <Barra titulo="Resistencia" porcentaje="70%" />
            <Barra titulo="Fuerza" porcentaje="55%" />
            <Barra titulo="Potencia" porcentaje="80%" />
            <Barra titulo="Movilidad" porcentaje="60%" />

          </div>

        </div>

      </div>

    </div>

  )

}

function Barra({ titulo, porcentaje }) {

  return (

    <div>

      <div className="flex justify-between mb-2">

        <span className="font-black">
          {titulo}
        </span>

        <span>
          {porcentaje}
        </span>

      </div>

      <div className="w-full bg-zinc-800 h-5 rounded-full">

        <div
          className="bg-red-500 h-5 rounded-full"
          style={{ width: porcentaje }}
        />

      </div>

    </div>

  )

}