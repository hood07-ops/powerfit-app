import { useEffect, useState } from 'react'
import { supabase } from '../supabase'

export default function RutinasPage({ student, onUpdateStudent }) {

  const [user, setUser] = useState(null)
  const [mensaje, setMensaje] = useState('')
  const [formValues, setFormValues] = useState({})

  const bloques = [

    {
      nombre: 'FIGHTER CONDITIONING',
      metodo: 'AMRAP',
      duracion: '12 MIN',
      objetivo: 'Conditioning fighter',
      record: 'vueltas',
      tipo: 'gratis',
      ejercicios: [
        '10 Push Up',
        '10 Air Squat',
        '10 Sit Up',
        '200m Run',
        '10 Box Jump',
      ],
      xp: 40,
    },

    {
      nombre: 'TABATA POWER',
      metodo: 'TABATA 40/20',
      duracion: '16 MIN',
      objetivo: 'Potencia y resistencia',
      record: 'repeticiones',
      tipo: 'gratis',
      ejercicios: [
        'Kettlebell Swing - MAX REPS',
        'Burpees - MAX REPS',
        'Thruster - MAX REPS',
        'Battle Rope - MAX REPS',
      ],
      xp: 50,
    },

    {
      nombre: 'WEIGHTLIFTING TECHNIQUE',
      metodo: 'FUERZA / HALTEROFILIA',
      duracion: '15 MIN',
      objetivo: 'Técnica y fuerza explosiva',
      record: 'peso',
      tipo: 'gratis',
      ejercicios: [
        'Power Clean - 5x3',
        'Push Jerk - 5x3',
        'Front Squat - 4x5',
        'Deadlift - 4x5',
        'Strict Press - 4x6',
      ],
      xp: 60,
    },

    {
      nombre: 'RM STRENGTH SYSTEM',
      metodo: 'RM / % LOAD',
      duracion: '20 MIN',
      objetivo: 'Fuerza máxima',
      record: 'peso',
      tipo: 'premium',
      ejercicios: [
        'Back Squat - 5x5 @75%',
        'Deadlift - 5x3 @85%',
        'Bench Press - 5x5 @75%',
        'Push Press - 4x5 @70%',
        'Clean Pull - 4x4 @80%',
      ],
      xp: 80,
    },

    {
      nombre: 'FOR TIME FIGHTER',
      metodo: '21-15-9',
      duracion: 'FOR TIME',
      objetivo: 'Conditioning avanzado',
      record: 'tiempo',
      tipo: 'premium',
      ejercicios: [
        'Thruster',
        'Burpees',
        'Box Jump',
        'Double Under',
      ],
      xp: 70,
    },
    {
      nombre: 'TEST SALTO VERTICAL',
      metodo: 'Evaluación potencia',
      duracion: '3 intentos',
      objetivo: 'Medir potencia de tren inferior',
      record: 'repeticiones',
      label: 'Mejor salto CM',
      tipo: 'gratis',
      ejercicios: [
        'Entrada en calor general 6-8 min',
        '3 saltos verticales con descanso completo',
        'Registrar el mejor salto en centimetros',
      ],
      xp: 35,
    },
    {
      nombre: 'TEST COOPER / VO2',
      metodo: 'Evaluación aeróbica',
      duracion: '12 MIN',
      objetivo: 'Estimar resistencia y VO2 max por distancia',
      record: 'repeticiones',
      label: 'Distancia metros en 12 min',
      tipo: 'gratis',
      ejercicios: [
        'Correr, remar o pedalear 12 minutos',
        'Mantener ritmo estable y registrar distancia total',
        'VO2 estimado: (metros - 504.9) / 44.73',
      ],
      xp: 45,
    },
    {
      nombre: 'TEST VELOCIDAD 30M',
      metodo: 'Sprint test',
      duracion: '30 metros',
      objetivo: 'Medir aceleración y velocidad',
      record: 'tiempo',
      label: 'Tiempo segúndos',
      tipo: 'gratis',
      ejercicios: [
        'Calentamiento completo de carrera',
        '2-3 intentos de 30 metros',
        'Registrar el mejor tiempo',
      ],
      xp: 35,
    },
    {
      nombre: 'TEST DISTANCIA CONTROLADA',
      metodo: 'Trabajo distancia / velocidad',
      duracion: 'Libre',
      objetivo: 'Registrar distancia o volumen completado',
      record: 'repeticiones',
      label: 'Distancia metros',
      tipo: 'gratis',
      ejercicios: [
        'Elegir distancia o maquina de trabajo',
        'Registrar metros totales completados',
        'Comparar progreso semanal y mensual',
      ],
      xp: 35,
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
      vueltas: bloque.record === 'vueltas'
        ? Number(valores.vueltas || 0)
        : null,

      repeticiones: bloque.record === 'repeticiones'
        ? Number(valores.repeticiones || 0)
        : null,

      tiempo_segúndos: bloque.record === 'tiempo'
        ? Number(valores.tiempo_segúndos || 0)
        : null,

      peso_kg: bloque.record === 'peso'
        ? Number(valores.peso_kg || 0)
        : null,

      porcentaje_rm: bloque.record === 'peso'
        ? Number(valores.porcentaje_rm || 0)
        : null,
    }

    const { error } = await supabase
      .from('records_entrenamiento')
      .insert([payload])

    if (error) {
      setMensaje('Error guardando record')
      return
    }

    const nuevoXP = Number(student?.xp || 0) + Number(bloque.xp || 20)

    await supabase
      .from('alumnos')
      .update({ xp: nuevoXP })
      .eq('id', student.id)

    setMensaje(`+${bloque.xp} XP ganados`)
    setFormValues({})
    cargar()
    onUpdateStudent?.()

  }

  return (

    <div className="min-h-screen bg-black text-white p-6">

      <div className="bg-zinc-900 border border-red-600 rounded-3xl p-6 mb-8">

        <h1 className="text-5xl font-black text-red-500">
          POWERFIT IA SYSTEM
        </h1>

        <p className="text-zinc-400 mt-3 text-xl">
          Fighter Conditioning - Weightlifting - Cross Training
        </p>

      </div>

      {!pagoActivo && (

        <div className="bg-red-950 border border-red-600 rounded-3xl p-6 mb-8">

          <h2 className="text-3xl font-black text-red-400">
            PAGO PENDIENTE
          </h2>

          <p className="text-zinc-300 mt-3">
            Debes regularizar tu mensualidad para desbloquear contenido premium.
          </p>

        </div>

      )}

      {mensaje && (

        <div className="bg-yellow-500 text-black rounded-2xl p-4 font-black mb-8">
          {mensaje}
        </div>

      )}

      <div className="grid md:grid-cols-2 gap-6">

        {bloquesVisibles.map((bloque, index) => {

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
                  className={`px-4 py-2 rounded-full font-black ${
                    bloque.tipo === 'gratis'
                      ? 'bg-green-600'
                      : 'bg-purple-700'
                  }`}
                >
                  {bloque.tipo}
                </span>

              </div>

              <div className="space-y-2 mb-5">

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
                  Descanso entre bloques: 2 MIN
                </p>

              </div>

              <div className="mb-6">

                <h3 className="text-red-500 text-xl font-black mb-4">
                  WORKOUT
                </h3>

                <ul className="space-y-3">

                  {bloque.ejercicios.map((ejercicio, i) => (

                    <li
                      key={i}
                      className="bg-zinc-800 rounded-2xl p-4"
                    >
                      - {ejercicio}
                    </li>

                  ))}

                </ul>

              </div>

              {bloque.record === 'vueltas' && (

                <input
                  type="number"
                  placeholder="Vueltas completadas"
                  value={valores.vueltas || ''}
                  onChange={(e) =>
                    actualizarValor(
                      bloque.nombre,
                      'vueltas',
                      e.target.value
                    )
                  }
                  className="w-full p-4 rounded-xl bg-zinc-800 mb-4"
                />

              )}

              {bloque.record === 'repeticiones' && (

                <input
                  type="number"
                  placeholder={bloque.label || 'Repeticiones totales'}
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

              {bloque.record === 'tiempo' && (

                <input
                  type="number"
                  placeholder="Tiempo en segúndos"
                  value={valores.tiempo_segúndos || ''}
                  onChange={(e) =>
                    actualizarValor(
                      bloque.nombre,
                      'tiempo_segúndos',
                      e.target.value
                    )
                  }
                  className="w-full p-4 rounded-xl bg-zinc-800 mb-4"
                />

              )}

              {bloque.record === 'peso' && (

                <div className="space-y-3 mb-5">

                  <input
                    type="number"
                    placeholder="Peso levantado KG"
                    value={valores.peso_kg || ''}
                    onChange={(e) =>
                      actualizarValor(
                        bloque.nombre,
                        'peso_kg',
                        e.target.value
                      )
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

                  </select>

                </div>

              )}

              <button
                onClick={() => guardarRecord(bloque)}
                className="w-full bg-red-600 hover:bg-red-700 transition rounded-2xl py-4 font-black text-xl"
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


