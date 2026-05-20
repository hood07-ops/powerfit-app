import React from 'react'

export default function RutinasPage() {

  const bloques = [
    {
      nombre: 'ATR Acumulación Fighter',
      metodo: 'AMRAP 12 MIN',
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
      metodo: '40" x 20" x 4',
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
      metodo: 'EMOM 10',
      tipo: 'gratis',
      ejercicios: [
        '5 Deadlift',
        '5 Push Press',
        '5 Pull Up'
      ]
    },

    {
      nombre: 'Fighter Premium',
      metodo: '21-15-9',
      tipo: 'premium',
      ejercicios: [
        'Thruster',
        'Burpees',
        'Box Jump'
      ]
    }
  ]

  return (
    <div className="min-h-screen bg-black text-white p-6">

      <h1 className="text-5xl font-black text-red-600 mb-8">
        POWERFIT IA SYSTEM
      </h1>

      <div className="grid md:grid-cols-2 gap-6">

        {bloques.map((bloque, index) => (

          <div
            key={index}
            className="bg-zinc-900 border border-zinc-700 rounded-3xl p-6"
          >

            <div className="flex justify-between items-center mb-4">

              <h2 className="text-3xl font-black text-yellow-400">
                {bloque.nombre}
              </h2>

              <span
                className={`px-4 py-2 rounded-full text-sm font-bold ${
                  bloque.tipo === 'gratis'
                    ? 'bg-green-600'
                    : 'bg-purple-700'
                }`}
              >
                {bloque.tipo}
              </span>

            </div>

            <p className="text-cyan-400 font-bold mb-4">
              Método: {bloque.metodo}
            </p>

            <ul className="space-y-2 mb-6">

              {bloque.ejercicios.map((ejercicio, i) => (
                <li key={i} className="text-zinc-200">
                  • {ejercicio}
                </li>
              ))}

            </ul>

            <input
              type="number"
              placeholder="Ingresa tiempo en segundos"
              className="w-full p-4 rounded-xl bg-zinc-800 mb-4"
            />

            <button className="bg-red-600 hover:bg-red-700 px-6 py-3 rounded-2xl font-black">
              FINALIZAR BLOQUE
            </button>

          </div>

        ))}

      </div>

    </div>
  )
}