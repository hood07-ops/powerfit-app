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
    tenis: 'Tenis',
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
      principales: ['AMRAP 12 MIN', 'E2MOM 12 MIN', 'CIRCUITO 4 RONDAS', 'PIRAMIDAL TECNICO'],
      finales: ['EMOM 12 MIN', 'AMRAP 10 MIN', 'FOR QUALITY 12 MIN'],
      foco: 'volumen tecnico y base aerobica',
    },
    transformacion: {
      porcentajes: [0.72, 0.75, 0.78],
      principales: ['INTERVALOS 40/20', 'E3MOM 15 MIN', 'DENSIDAD 12 MIN', 'PIRAMIDAL DE FUERZA'],
      finales: ['AMRAP 10 MIN', 'INTERVALOS 30/30', 'CHIPPER CORTO'],
      foco: 'potencia, ritmo y transferencia',
    },
    realizacion: {
      porcentajes: [0.82, 0.85, 0.88],
      principales: ['FOR QUALITY', 'E2MOM 10 MIN', 'COMPLEJO TECNICO', 'PIRAMIDAL PESADO'],
      finales: ['FOR TIME', 'SPRINT INTERVALS', 'AMRAP 8 MIN'],
      foco: 'intensidad, rendimiento y ejecucion precisa',
    },
  }

  return configs[faseATR] || configs.acumulacion
}

function configCicloMenstrual(faseMenstrual) {
  const configs = {
    menstrual: {
      label: 'Menstrual',
      factorCarga: 0.85,
      intensidad: 'baja a moderada',
      foco: 'tecnica, movilidad, control respiratorio y baja percepcion de esfuerzo',
      recomendacion:
        'Reducir cargas si hay dolor o fatiga. Priorizar tecnica, movilidad y trabajo aerobico suave.',
    },
    folicular: {
      label: 'Folicular',
      factorCarga: 1.05,
      intensidad: 'media a alta',
      foco: 'progresion de fuerza, potencia tecnica y aprendizaje motor',
      recomendacion:
        'Buena fase para progresar cargas si la alumna se siente bien y mantiene tecnica estable.',
    },
    ovulatoria: {
      label: 'Ovulatoria',
      factorCarga: 1,
      intensidad: 'alta controlada',
      foco: 'potencia, velocidad y fuerza con buena entrada en calor',
      recomendacion:
        'Mantener intensidad, cuidando aterrizajes, rodillas y hombros con calentamiento completo.',
    },
    lutea: {
      label: 'Lutea',
      factorCarga: 0.9,
      intensidad: 'moderada',
      foco: 'volumen controlado, fuerza submaxima y recuperacion',
      recomendacion:
        'Bajar volumen o carga si aumenta la fatiga. Usar descansos completos y controlar RPE.',
    },
  }

  return configs[faseMenstrual] || null
}

function ajustarPorcentajeCiclo(porcentaje, cicloCfg) {
  if (!cicloCfg) return porcentaje

  return Math.min(0.9, Math.max(0.5, porcentaje * cicloCfg.factorCarga))
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
      `${reps} ${pick(pools.transversal)}`,
      `${reps} ${pick(pools.pesoCorporal)}`,
      `${cardio} ${pick(pools.cardio)}`,
    ],
    tenis: [
      `${reps} ${pick(pools.tenis)}`,
      `${reps} ${pick(pools.transversal)}`,
      `${reps} ${pick(pools.banda)}`,
      `${cardio} ${pick(pools.desplazamiento)}`,
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
      `10 ${pick(pools.balon)}`,
      `10 ${pick(pools.pesoCorporal)}`,
      `12 ${pick(pools.kb)}`,
    ],
    tenis: [
      `10 ${pick(pools.tenis)}`,
      `8 por lado ${pick(pools.transversal)}`,
      `10 ${pick(pools.balon)}`,
      `${cardio} ${pick(pools.desplazamiento)}`,
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

function crearContrasteTransversal(pools) {
  return pick([
    `Contraste entre series: 10 ${pick(pools.banda)} + 10 ${pick(pools.desplazamiento)}`,
    `Contraste entre series: 8 por lado ${pick(pools.balon)} + 10 ${pick(pools.transversal)}`,
    `Contraste entre series: 10 flexoextension de brazos con salto lateral + 8 por lado ${pick(pools.banda)}`,
    `Contraste entre series: 10 saltos abre/cierra brazos arriba-abajo + 8 por lado ${pick(pools.transversal)}`,
  ])
}

function crearTrabajoFuerza(ejercicio, nivelCfg, porcentaje, rms, pools, objetivo) {
  const usarPiramidal = Math.random() < 0.35
  const contraste =
    objetivo === 'fighter' || objetivo === 'tenis'
      ? ` | ${crearContrasteTransversal(pools)}`
      : ''

  if (usarPiramidal) {
    return `${ejercicio} - PIRAMIDAL 1-3-5-7-5-3-1 @${Math.round(
      porcentaje * 100
    )}% - carga sugerida: ${calcularCarga(rms, ejercicio, porcentaje)} - descanso ${pick(nivelCfg.descanso)}${contraste}`
  }

  return `${ejercicio} - ${pick(nivelCfg.series)}x${pick(['3', '4', '5'])} @${Math.round(
    porcentaje * 100
  )}% - carga sugerida: ${calcularCarga(rms, ejercicio, porcentaje)} - descanso ${pick(nivelCfg.descanso)}${contraste}`
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

export function generarEntrenamiento({
  objetivo,
  nivel,
  faseATR,
  rms,
  historial = [],
  faseMenstrual = null,
}) {
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
      'Elastic Band Jab Cross',
      'Elastic Band Hook Rotation',
      'Medicine Ball Rotational Throw',
      'Medicine Ball Slam + Sprawl',
    ],
    tenis: [
      'Split Step + lateral acceleration',
      'Open stance rotational drive',
      'Medicine Ball Forehand Throw',
      'Medicine Ball Backhand Throw',
      'Elastic Band Forehand Pattern',
      'Elastic Band Backhand Pattern',
      'Lateral Shuffle + deceleration',
      'Crossover Step + hip rotation',
    ],
    transversal: [
      'Serape effect diagonal stretch + explosive rotation',
      'Cross-body chop oblique-serratus',
      'Half-kneeling lift diagonal',
      'Pallof press + rotation control',
      'Contralateral dead bug with band',
      'Crossover step to rotational punch',
      'Hip shoulder separation drill',
    ],
    banda: [
      'Band resisted jab cross',
      'Band resisted hook',
      'Band anti-rotation punch',
      'Band forehand acceleration',
      'Band backhand acceleration',
      'Band diagonal chop',
      'Band serratus punch',
    ],
    balon: [
      'Medicine Ball rotational throw',
      'Medicine Ball scoop toss',
      'Medicine Ball shot put throw',
      'Medicine Ball slam',
      'Medicine Ball lateral bound throw',
      'Medicine Ball overhead throw',
    ],
    desplazamiento: [
      'lateral shuffle + stick landing',
      'crossover step + brake',
      'split step + sprint 5m',
      'lateral bound + rebound',
      'in-out footwork ladder',
      'side hop + arm open-close',
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
  const cicloCfg = configCicloMenstrual(faseMenstrual)
  const variantes = ['A', 'B', 'C', 'D', 'E', 'F']

  let mejorPlan = null

  for (let intento = 0; intento < 8; intento++) {
    const porcentajeBase = pick(faseCfg.porcentajes)
    const porcentaje = ajustarPorcentajeCiclo(porcentajeBase, cicloCfg)
    const variante = pick(variantes)
    const fuerzaElegida =
      objetivo === 'fuerza'
        ? uniquePick(pools.fuerza, 3)
        : objetivo === 'fighter' || objetivo === 'tenis'
          ? uniquePick([...pools.haltero, ...pools.fuerza], 3)
          : uniquePick(['Back Squat', 'Deadlift', 'Push Press', 'Barbell Row'], 2)

    const plan = {
      titulo: `PowerFit 360 - ${labelObjetivo(objetivo)} / ATR ${faseATR}`,
      objetivo: labelObjetivo(objetivo),
      nivel,
      faseATR,
      cicloMenstrual: cicloCfg
        ? {
            fase: faseMenstrual,
            label: cicloCfg.label,
            intensidad: cicloCfg.intensidad,
            foco: cicloCfg.foco,
            recomendacion: cicloCfg.recomendacion,
            ajusteCarga: `${Math.round(cicloCfg.factorCarga * 100)}% de la carga base ATR`,
            porcentajeBase: `${Math.round(porcentajeBase * 100)}%`,
            porcentajeAplicado: `${Math.round(porcentaje * 100)}%`,
          }
        : null,
      variante,
      intensidad: cicloCfg
        ? `${nivelCfg.intensidad} / ciclo ${cicloCfg.intensidad}`
        : nivelCfg.intensidad,
      motorTransversal:
        objetivo === 'fighter' || objetivo === 'tenis'
          ? [
              'Base: aceleracion, potencia rotacional, cadenas cruzadas y fase concentrica explosiva.',
              'Foco tecnico: efecto serape, diagonal oblicuo-serrato y transferencia cadera-hombro.',
              'Criterio: calidad primero, velocidad despues; cortar la serie si se pierde eje o timing.',
            ]
          : null,

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
        metodo: cicloCfg
          ? `FUERZA / %RM - foco ATR: ${faseCfg.foco} - ajuste ciclo: ${cicloCfg.foco}`
          : `FUERZA / %RM - foco: ${faseCfg.foco}`,
        duracion: pick(['12 min', '12-15 min', '15 min', '15-18 min']),
        ejercicios: fuerzaElegida.map((e) =>
          crearTrabajoFuerza(e, nivelCfg, porcentaje, rms, pools, objetivo)
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
