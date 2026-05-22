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

export const ejercicios = {
  fighter: [
    'Heavy Bag',
    'Shadow Boxing',
    'Footwork Drill',
    'Burpees',
    'Sprint',
    'Jump Rope',
    'Push Up',
    'Sit Up',
    'Mountain Climbers',
  ],

  fuerza: [
    'Back Squat',
    'Front Squat',
    'Deadlift',
    'Bench Press',
    'Push Press',
    'Push Jerk',
    'Strict Press',
    'Thruster',
    'Hip Thrust',
  ],

  halterofilia: [
    'Power Clean',
    'Hang Power Clean',
    'Clean Pull',
    'Power Snatch',
    'Hang Power Snatch',
    'Snatch Pull',
    'Front Squat',
    'Push Jerk',
    'Split Jerk',
  ],

  kettlebell: [
    'Kettlebell Swing',
    'Kettlebell Clean',
    'Kettlebell Snatch',
    'Goblet Squat',
    'Kettlebell Press',
    'Farmer Walk',
  ],

  cardio: [
    'Bike',
    'Row',
    'Run',
    'Ski Erg',
    'Jump Rope',
    'High Knees',
  ],

  core: [
    'Plank Hold',
    'Hollow Hold',
    'Russian Twist',
    'Dead Bug',
    'Bird Dog',
    'Side Plank',
  ],
}

export function calcularCarga(rms, ejercicio, porcentaje) {
  const rm = rms?.find((r) => r.ejercicio === ejercicio)

  if (!rm) return 'RM no registrado'

  return `${Math.round(Number(rm.rm_kg) * porcentaje)} kg`
}

export function generarEntrenamiento({ objetivo, nivel, faseATR, rms }) {
  let intensidad = 'media'

  if (nivel === 'basico') intensidad = 'controlada'
  if (nivel === 'avanzado') intensidad = 'alta'

  const fuerzaBase = uniquePick(ejercicios.fuerza, 3)
  const halteroBase = uniquePick(ejercicios.halterofilia, 3)
  const fighterBase = uniquePick(ejercicios.fighter, 4)
  const cardioBase = uniquePick(ejercicios.cardio, 2)
  const coreBase = uniquePick(ejercicios.core, 2)

  let bloqueFuerza = []

  if (objetivo === 'fuerza') {
    bloqueFuerza = fuerzaBase.map((e) => {
      const porcentaje = faseATR === 'acumulacion' ? 0.65 : faseATR === 'transformacion' ? 0.75 : 0.85
      return `${e} — 5x5 @${Math.round(porcentaje * 100)}% → ${calcularCarga(rms, e, porcentaje)}`
    })
  } else {
    bloqueFuerza = halteroBase.map((e) => {
      const porcentaje = faseATR === 'acumulacion' ? 0.6 : faseATR === 'transformacion' ? 0.7 : 0.8
      return `${e} — 4x4 @${Math.round(porcentaje * 100)}% → ${calcularCarga(rms, e, porcentaje)}`
    })
  }

  return {
    titulo: `PowerFit 360 — ${objetivo.toUpperCase()} / ATR ${faseATR.toUpperCase()}`,
    objetivo,
    nivel,
    faseATR,
    intensidad,

    activacion: {
      metodo: 'EMOM 8 MIN',
      descripcion: 'Activación técnica y metabólica.',
      ejercicios: [
        `5 ${pick(ejercicios.fighter)}`,
        `10 Air Squat`,
        `10 Sit Up`,
        `30 sec ${pick(ejercicios.cardio)}`,
      ],
    },

    bloque1: {
      titulo: 'Bloque 1 — Técnica / Base',
      metodo: faseATR === 'acumulacion' ? 'EMOM 10 MIN' : 'TABATA 30/15',
      duracion: '8-10 min',
      ejercicios: [
        ...fighterBase.slice(0, 2).map((e) => `${e} — técnica controlada`),
        ...coreBase.map((e) => `${e} — 30 sec`),
      ],
    },

    bloque2: {
      titulo: 'Bloque 2 — Fuerza / Halterofilia',
      metodo: 'FUERZA / %RM',
      duracion: '10-15 min',
      ejercicios: bloqueFuerza,
    },

    bloque3: {
      titulo: 'Bloque 3 — Finalizador Fighter',
      metodo: faseATR === 'realizacion' ? 'FOR TIME' : 'AMRAP 12 MIN',
      duracion: '12-15 min',
      ejercicios: [
        `10 ${fighterBase[0]}`,
        `12 ${pick(ejercicios.kettlebell)}`,
        `15 ${fighterBase[1]}`,
        `200m ${cardioBase[0]}`,
      ],
    },
  }
}