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

function labelObjetivo(objetivo) {
  const labels = {
    fighter: 'Fighter',
    fuerza: 'Fuerza',
    perdida_grasa: 'Perdida grasa',
    cardio: 'Cardio',
  }

  return labels[objetivo] || objetivo
}

function configNivel(nivel) {
  const configs = {
    basico: {
      intensidad: 'controlada',
      reps: ['8', '8-10', '10'],
      series: ['3', '4'],
      descanso: ['75-90 sec', '90 sec'],
      cardio: ['120m', '150m', '2 min'],
    },
    intermedio: {
      intensidad: 'media',
      reps: ['10', '10-12', '12'],
      series: ['4', '5'],
      descanso: ['60-75 sec', '75 sec'],
      cardio: ['180m', '200m', '3 min'],
    },
    avanzado: {
      intensidad: 'alta',
      reps: ['12', '12-15', '15'],
      series: ['5', '6'],
      descanso: ['45-60 sec', '60 sec'],
      cardio: ['250m', '300m', '4 min'],
    },
  }

  return configs[nivel] || configs.intermedio
}

function configFase(faseATR) {
  const configs = {
    acumulacion: {
      porcentajes: [0.6, 0.65, 0.7],
      principales: ['AMRAP 12 MIN', 'E2MOM 12 MIN', 'CIRCUITO 4 RONDAS'],
      finales: ['EMOM 12 MIN', 'AMRAP 10 MIN', 'FOR QUALITY 12 MIN'],
      foco: 'volumen tecnico y base aerobica',
    },
    transformacion: {
      porcentajes: [0.72, 0.75, 0.78],
      principales: ['INTERVALOS 40/20', 'E3MOM 15 MIN', 'DENSIDAD 12 MIN'],
      finales: ['AMRAP 10 MIN', 'INTERVALOS 30/30', 'CHIPPER CORTO'],
      foco: 'potencia, ritmo y transferencia',
    },
    realizacion: {
      porcentajes: [0.82, 0.85, 0.88],
      principales: ['FOR QUALITY', 'E2MOM 10 MIN', 'COMPLEJO TECNICO'],
      finales: ['FOR TIME', 'SPRINT INTERVALS', 'AMRAP 8 MIN'],
      foco: 'intensidad, rendimiento y ejecucion precisa',
    },
  }

  return configs[faseATR] || configs.acumulacion
}

export function calcularCarga(rms, ejercicio, porcentaje) {
  const rm = rms?.find(
    (r) =>
      String(r.ejercicio || '').toLowerCase().trim() ===
      String(ejercicio || '').toLowerCase().trim()
  )

  if (!rm || !Number(rm.rm_kg)) return 'RM no registrado'

  return `${Math.round(Number(rm.rm_kg) * porcentaje)} kg`
}

function crearBloqueObjetivo(objetivo, nivelCfg, pools) {
  const reps = pick(nivelCfg.reps)
  const cardio = pick(nivelCfg.cardio)

  const bloques = {
    fighter: [
      `${reps} ${pick(pools.boxeo)}`,
      `${reps} ${pick(pools.pesoCorporal)}`,
      `${cardio} ${pick(pools.cardio)}`,
      `30 sec ${pick(pools.core)}`,
    ],
    fuerza: [
      `${reps} ${pick(pools.kb)}`,
      `${reps} ${pick(pools.pesoCorporal)}`,
      `30 sec ${pick(pools.core)}`,
      `${cardio} ${pick(pools.cardio)} suave`,
    ],
    perdida_grasa: [
      `${reps} ${pick(pools.pesoCorporal)}`,
      `${reps} ${pick(pools.kb)}`,
      `${cardio} ${pick(pools.cardio)}`,
      `30 sec ${pick(pools.core)}`,
    ],
    cardio: [
      `${cardio} ${pick(pools.cardio)}`,
      `40 sec ${pick(pools.cardio)}`,
      `${reps} ${pick(pools.pesoCorporal)}`,
      `30 sec ${pick(pools.core)}`,
    ],
  }

  return bloques[objetivo] || bloques.fighter
}

function crearBloqueFinal(objetivo, nivelCfg, pools) {
  const cardio = pick(nivelCfg.cardio)

  const finales = {
    fighter: [
      `12 ${pick(pools.boxeo)}`,
      `10 ${pick(pools.pesoCorporal)}`,
      `12 ${pick(pools.kb)}`,
      `${cardio} ${pick(pools.cardio)}`,
    ],
    fuerza: [
      `8 ${pick(pools.pesoCorporal)}`,
      `10 ${pick(pools.kb)}`,
      `20 sec ${pick(pools.core)}`,
      `${cardio} ${pick(pools.cardio)}`,
    ],
    perdida_grasa: [
      `15 ${pick(pools.pesoCorporal)}`,
      `15 ${pick(pools.kb)}`,
      `20 ${pick(pools.core)}`,
      `${cardio} ${pick(pools.cardio)}`,
    ],
    cardio: [
      `${cardio} ${pick(pools.cardio)}`,
      `20 ${pick(pools.pesoCorporal)}`,
      `${cardio} ${pick(pools.cardio)}`,
      `30 sec ${pick(pools.core)}`,
    ],
  }

  return finales[objetivo] || finales.fighter
}

function firmaPlan(plan) {
  return [...plan.bloque2.ejercicios, ...plan.bloque3.ejercicios]
}

function esMuyParecidoAlHistorial(plan, historial) {
  const firma = firmaPlan(plan)

  return historial.some((contenido) => {
    const coincidencias = firma.filter((linea) => contenido?.includes(linea))
    return coincidencias.length >= Math.max(3, Math.floor(firma.length * 0.6))
  })
}

export function generarEntrenamiento({ objetivo, nivel, faseATR, rms, historial = [] }) {
  const pools = {
    fuerza: [
      'Back Squat',
      'Front Squat',
      'Deadlift',
      'Bench Press',
      'Push Press',
      'Strict Press',
      'Barbell Row',
    ],
    haltero: [
      'Power Clean',
      'Clean Pull',
      'Power Snatch',
      'Push Jerk',
      'Thruster',
      'Hang Power Clean',
      'High Pull',
    ],
    boxeo: [
      'Heavy Bag',
      'Shadow Boxing',
      'Footwork Drill',
      'Jab Cross',
      'Slip + Counter',
      'Defense + Counter',
      'Uppercut Hook Combo',
    ],
    cardio: ['Run', 'Bike', 'Row', 'Ski Erg', 'Jump Rope', 'Shuttle Run'],
    core: ['Sit Up', 'Plank Hold', 'Hollow Hold', 'Russian Twist', 'Dead Bug', 'V-Up'],
    kb: [
      'Kettlebell Swing',
      'Kettlebell Clean',
      'Kettlebell Snatch',
      'Goblet Squat',
      'Kettlebell Press',
    ],
    pesoCorporal: [
      'Burpees',
      'Push Up',
      'Air Squat',
      'Lunge',
      'Mountain Climber',
      'Jumping Jack',
      'Bear Crawl',
    ],
    movilidad: [
      'movilidad de cadera + hombros',
      'world greatest stretch',
      'scap push up + squat hold',
      't-spine rotation + ankle rocks',
    ],
  }

  const nivelCfg = configNivel(nivel)
  const faseCfg = configFase(faseATR)
  const variantes = ['A', 'B', 'C', 'D', 'E', 'F']

  let mejorPlan = null

  for (let intento = 0; intento < 8; intento++) {
    const porcentaje = pick(faseCfg.porcentajes)
    const series = pick(nivelCfg.series)
    const variante = pick(variantes)
    const fuerzaElegida =
      objetivo === 'fuerza'
        ? uniquePick(pools.fuerza, 3)
        : objetivo === 'fighter'
          ? uniquePick([...pools.haltero, ...pools.fuerza], 3)
          : uniquePick(['Back Squat', 'Deadlift', 'Push Press', 'Barbell Row'], 2)

    const plan = {
      titulo: `PowerFit 360 - ${labelObjetivo(objetivo)} / ATR ${faseATR}`,
      objetivo: labelObjetivo(objetivo),
      nivel,
      faseATR,
      variante,
      intensidad: nivelCfg.intensidad,

      activacion: {
        metodo: pick(['RAMP 8 MIN', 'RAMP 10 MIN', 'MOVILIDAD + PULSO 8 MIN']),
        ejercicios: [
          `2 min ${pick(pools.cardio)} suave`,
          `10 ${pick(pools.movilidad)}`,
          `10 ${pick(pools.pesoCorporal)} controlados`,
          `30 sec ${pick(pools.core)}`,
        ],
      },

      bloque1: {
        metodo: pick(faseCfg.principales),
        duracion: pick(['10 min', '10-12 min', '12 min', '12-15 min']),
        ejercicios: crearBloqueObjetivo(objetivo, nivelCfg, pools),
      },

      bloque2: {
        metodo: `FUERZA / %RM - foco: ${faseCfg.foco}`,
        duracion: pick(['12 min', '12-15 min', '15 min', '15-18 min']),
        ejercicios: fuerzaElegida.map(
          (e) =>
            `${e} - ${series}x${pick(['3', '4', '5'])} @${Math.round(
              porcentaje * 100
            )}% - carga sugerida: ${calcularCarga(rms, e, porcentaje)} - descanso ${pick(nivelCfg.descanso)}`
        ),
      },

      bloque3: {
        metodo: pick(faseCfg.finales),
        duracion: pick(['8-10 min', '10 min', '10-12 min', '12 min']),
        ejercicios: crearBloqueFinal(objetivo, nivelCfg, pools),
      },
    }

    mejorPlan = plan

    if (!esMuyParecidoAlHistorial(plan, historial)) {
      return plan
    }
  }

  return mejorPlan
}
