function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

function uniquePick(arr, count) {
  const copy = [...arr]
  const result = []

  while (result.length < count && copy.length > 0) {
    const index = Math.floor(Math.random() * copy.length)
    result.push(copy.splice(index, 1)[0])
  }

  return result
}

export function calcularCarga(rms, ejercicio, porcentaje) {
  const rm = rms?.find(
    (r) =>
      String(r.ejercicio).toLowerCase() ===
      String(ejercicio).toLowerCase()
  )

  if (!rm) return 'RM no registrado'

  return `${Math.round(Number(rm.rm_kg) * porcentaje)} kg`
}

export function generarEntrenamiento({ objetivo, nivel, faseATR, rms }) {
  const fuerza = ['Back Squat', 'Front Squat', 'Deadlift', 'Bench Press', 'Push Press']
  const haltero = ['Power Clean', 'Clean Pull', 'Power Snatch', 'Push Jerk', 'Thruster']
  const fighter = ['Heavy Bag', 'Shadow Boxing', 'Burpees', 'Push Up', 'Jump Rope', 'Sprint']
  const cardio = ['Run', 'Bike', 'Row', 'Ski Erg']
  const core = ['Sit Up', 'Plank Hold', 'Hollow Hold', 'Russian Twist']
  const kb = ['Kettlebell Swing', 'Kettlebell Clean', 'Kettlebell Snatch', 'Goblet Squat']

  const porcentaje =
    faseATR === 'acumulacion'
      ? 0.65
      : faseATR === 'transformacion'
      ? 0.75
      : 0.85

  const fuerzaElegida = objetivo === 'fuerza' ? uniquePick(fuerza, 3) : uniquePick(haltero, 3)

  return {
    titulo: `PowerFit 360 — ${objetivo.toUpperCase()} / ATR ${faseATR.toUpperCase()}`,
    objetivo,
    nivel,
    faseATR,
    intensidad: nivel === 'avanzado' ? 'alta' : nivel === 'basico' ? 'controlada' : 'media',

    activacion: {
      metodo: 'EMOM 8 MIN',
      ejercicios: [
        `5 ${pick(fighter)}`,
        '10 Air Squat',
        `10 ${pick(core)}`,
        `30 sec ${pick(cardio)}`,
      ],
    },

    bloque1: {
      metodo: faseATR === 'acumulacion' ? 'AMRAP 10 MIN' : 'TABATA 40/20',
      duracion: '8-10 min',
      ejercicios: [
        `10 ${pick(fighter)}`,
        `12 ${pick(kb)}`,
        `10 ${pick(core)}`,
        `200m ${pick(cardio)}`,
      ],
    },

    bloque2: {
      metodo: 'FUERZA / %RM',
      duracion: '10-15 min',
      ejercicios: fuerzaElegida.map(
        (e) =>
          `${e} — 5x5 @${Math.round(porcentaje * 100)}% → cargar ${calcularCarga(
            rms,
            e,
            porcentaje
          )}`
      ),
    },

    bloque3: {
      metodo: faseATR === 'realizacion' ? 'FOR TIME' : 'AMRAP 12 MIN',
      duracion: '12-15 min',
      ejercicios: [
        `10 ${pick(fighter)}`,
        `15 ${pick(kb)}`,
        `20 ${pick(fighter)}`,
        `200m ${pick(cardio)}`,
      ],
    },
  }
}