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
      principales: ['AMRAP 12 MIN', 'E2MOM 12 MIN', 'CIRCUITO 4 RONDAS', 'PIRAMIDAL TECNICO', 'HIIT AEROBICO 30/30'],
      finales: ['EMOM 12 MIN', 'AMRAP 10 MIN', 'FOR QUALITY 12 MIN', 'ZONA 2 + TECNICA'],
      foco: 'volumen tecnico y base aerobica',
      sistema: 'oxidativo / base aerobica',
    },
    transformacion: {
      porcentajes: [0.72, 0.75, 0.78],
      principales: ['INTERVALOS 40/20', 'E3MOM 15 MIN', 'DENSIDAD 12 MIN', 'PIRAMIDAL DE FUERZA', 'HIIT LACTICO 45/15'],
      finales: ['AMRAP 10 MIN', 'INTERVALOS 30/30', 'CHIPPER CORTO', 'REPEATED SPRINT ABILITY'],
      foco: 'potencia, ritmo y transferencia',
      sistema: 'glucolitico / lactico tolerable',
    },
    realizacion: {
      porcentajes: [0.82, 0.85, 0.88],
      principales: ['FOR QUALITY', 'E2MOM 10 MIN', 'COMPLEJO TECNICO', 'PIRAMIDAL PESADO', 'HIIT ALTACTICO 10/50'],
      finales: ['FOR TIME', 'SPRINT INTERVALS', 'AMRAP 8 MIN', 'POTENCIA ALTACTICA'],
      foco: 'intensidad, rendimiento y ejecucion precisa',
      sistema: 'ATP-PC / potencia alactica',
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

function permitePliometria(faseATR) {
  return faseATR === 'transformacion' || faseATR === 'realizacion'
}

function ejercicioReactivoSinPliometria(objetivo) {
  const prePliometria = {
    fighter: [
      'footwork tecnico en guardia + frenado estable',
      'slip + counter lento con control de eje',
      'paso lateral + retorno a guardia sin salto',
      'band jab cross tecnico con fase concentrica rapida',
    ],
    tenis: [
      'split step tecnico sin rebote + primer paso',
      'lateral shuffle + frenado estable',
      'crossover step + rotacion de cadera controlada',
      'band forehand pattern tecnico sin salto',
    ],
    fuerza: [
      'depth landing tecnico sin rebote',
      'bisagra de cadera rapida con freno',
      'sentadilla tempo 3-1-1',
    ],
    general: [
      'mecanica de aterrizaje sin salto',
      'desaceleracion lateral controlada',
      'cambio de direccion tecnico',
    ],
  }

  return pick(prePliometria[objetivo] || prePliometria.general)
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

function crearBloqueObjetivo(objetivo, nivelCfg, pools, faseATR) {
  const reps = pick(nivelCfg.reps)
  const cardio = pick(nivelCfg.cardio)
  const reactivo = permitePliometria(faseATR)
    ? pick(pools.pliometria[objetivo] || pools.pliometria.general)
    : ejercicioReactivoSinPliometria(objetivo)

  const bloques = {
    fighter: [
      `${reps} ${pick(pools.boxeo)}`,
      `${reps} ${pick(pools.transversal)}`,
      `${reps} ${reactivo}`,
      `${reps} ${pick(pools.pesoCorporal)}`,
    ],
    tenis: [
      `${reps} ${pick(pools.tenis)}`,
      `${reps} ${pick(pools.transversal)}`,
      `${reps} ${reactivo}`,
      `${reps} ${pick(pools.banda)}`,
    ],
    fuerza: [
      `${reps} ${pick(pools.kb)}`,
      `${reps} ${reactivo}`,
      `${reps} ${pick(pools.pesoCorporal)}`,
      `30 sec ${pick(pools.core)}`,
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

function crearBloqueFinal(objetivo, nivelCfg, pools, faseATR) {
  const cardio = pick(nivelCfg.cardio)
  const reactivo = permitePliometria(faseATR)
    ? pick(pools.pliometria[objetivo] || pools.pliometria.general)
    : ejercicioReactivoSinPliometria(objetivo)

  const finales = {
    fighter: [
      `12 ${pick(pools.boxeo)}`,
      `10 ${pick(pools.balon)}`,
      `8 ${reactivo}`,
      `10 ${pick(pools.pesoCorporal)}`,
    ],
    tenis: [
      `10 ${pick(pools.tenis)}`,
      `8 por lado ${pick(pools.transversal)}`,
      `8 ${reactivo}`,
      `10 ${pick(pools.balon)}`,
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
    `Contraste entre series: 6 ${pick(pools.pliometria.general)} + 8 por lado ${pick(pools.transversal)}`,
    `Contraste entre series: 10 flexoextension de brazos con salto lateral + 8 por lado ${pick(pools.banda)}`,
    `Contraste entre series: 10 saltos abre/cierra brazos arriba-abajo + 8 por lado ${pick(pools.transversal)}`,
  ])
}

function descansoMuscularTexto() {
  return [
    'Musculos grandes (espalda, piernas y pecho): 72 horas entre estimulos fuertes.',
    'Musculos pequenos (brazos, hombros, gemelos y abdomen): 48 horas entre estimulos fuertes.',
    'Si se repite un patron antes del descanso completo, debe ser tecnico, liviano o de movilidad.',
  ]
}

function focoDeportivo(objetivo) {
  if (objetivo === 'tenis') {
    return [
      'Motor transversal: split step, aceleracion, desaceleracion y potencia rotacional.',
      'Transferencia: efecto serape, cadena cruzada, oblicuo-serrato y cadera-hombro.',
      'Ejemplos: med ball forehand/backhand throw, band forehand, lateral bound, crossover step.',
    ]
  }

  if (objetivo === 'fighter') {
    return [
      'Motor transversal: golpeo, cambio de nivel, desplazamiento y potencia rotacional.',
      'Transferencia: efecto serape, cadena cruzada, oblicuo-serrato y fase concentrica explosiva.',
      'Ejemplos: band jab cross, band hook, med ball rotational throw, slip + counter, footwork.',
    ]
  }

  return [
    'Base fisica: fuerza util, control tecnico, capacidad metabolica y recuperacion.',
    'Transferencia: estabilidad, movilidad, control de eje y progresion de cargas.',
  ]
}

function diaMensual({ dia, nombre, foco, fuerza, reactivo, sistema, notas }) {
  return [
    `${dia} - ${nombre}`,
    `Foco: ${foco}`,
    `Fuerza: ${fuerza}`,
    `Reactivo/transferencia: ${reactivo}`,
    `Sistema metabolico: ${sistema}`,
    `Notas: ${notas}`,
  ].join('\n')
}

export function generarPlanMensual({
  objetivo,
  nivel,
  faseMenstrual = null,
}) {
  const nivelCfg = configNivel(nivel)
  const cicloCfg = configCicloMenstrual(faseMenstrual)
  const ajusteCiclo = cicloCfg
    ? `Ajuste ciclo menstrual: ${cicloCfg.label} - ${cicloCfg.recomendacion}`
    : 'Ajuste ciclo menstrual: no aplicado.'

  const semanas = [
    {
      numero: 1,
      fase: 'acumulacion',
      foco: 'base tecnica, volumen controlado y capacidad aerobica',
      notaPliometria: 'Sin pliometria. Usar mecanica de aterrizaje, frenadas y patrones reactivos sin salto.',
    },
    {
      numero: 2,
      fase: 'acumulacion',
      foco: 'progresion de volumen, fuerza submaxima y calidad de movimiento',
      notaPliometria: 'Sin pliometria. Mantener saltos fuera del plan y mejorar desaceleracion.',
    },
    {
      numero: 3,
      fase: 'transformacion',
      foco: 'potencia, transferencia deportiva y HIIT lactico controlado',
      notaPliometria: 'Iniciar pliometria: pocas repeticiones, descansos completos y maxima calidad.',
    },
    {
      numero: 4,
      fase: 'realizacion',
      foco: 'velocidad, potencia alactica y rendimiento tecnico',
      notaPliometria: 'Pliometria corta y explosiva. Cortar la serie si baja la velocidad.',
    },
  ]

  const contenidoSemanas = semanas.map((semana) => {
    const usarPliometria = permitePliometria(semana.fase)
    const reactivoBase = usarPliometria
      ? 'pliometria especifica del deporte 3-5 series x 3-6 reps'
      : 'pre-pliometria: frenadas, aterrizajes y patron tecnico sin salto'

    const dias = [
      diaMensual({
        dia: 'Dia 1',
        nombre: 'Piernas + cadera + motor transversal',
        foco: 'piernas como musculo grande, bisagra, sentadilla y cadena posterior',
        fuerza: `3-5 series a intensidad ${nivelCfg.intensidad}; dejar 72h antes de repetir piernas fuerte`,
        reactivo: `${reactivoBase}; diagonal oblicuo-serrato y aceleracion corta`,
        sistema: semana.fase === 'acumulacion' ? 'oxidativo / zona 2 tecnica' : 'ATP-PC con descansos completos',
        notas: 'No cargar pecho/espalda pesado este dia. Priorizar tecnica y rango.',
      }),
      diaMensual({
        dia: 'Dia 2',
        nombre: 'Pecho + espalda + brazos/hombros',
        foco: 'empuje y traccion como musculos grandes; accesorios pequenos controlados',
        fuerza: `3-5 series; pecho/espalda descansan 72h, brazos/hombros descansan 48h`,
        reactivo: objetivo === 'fighter'
          ? 'band jab cross + med ball rotational throw entre series'
          : objetivo === 'tenis'
            ? 'band forehand/backhand + med ball scoop toss entre series'
            : 'core anti-rotacion + traslado de fuerza',
        sistema: 'glucolitico moderado sin romper tecnica',
        notas: 'Los contrastes deben ser rapidos, limpios y con baja fatiga.',
      }),
      diaMensual({
        dia: 'Dia 3',
        nombre: 'Potencia rotacional + velocidad deportiva',
        foco: semana.foco,
        fuerza: 'cargas bajas/medias o tecnica olimpica; evitar repetir pecho/espalda pesado antes de 72h',
        reactivo: usarPliometria
          ? 'lanzamientos de balon, bounds laterales, split step rebound o footwork explosivo'
          : 'bandas, desplazamientos tecnicos y frenadas sin salto',
        sistema: semana.fase === 'realizacion' ? 'HIIT alactico 10/50' : 'HIIT aerobico tecnico 30/30',
        notas: semana.notaPliometria,
      }),
      diaMensual({
        dia: 'Dia 4',
        nombre: 'Sistema metabolico + movilidad + tecnica',
        foco: 'condicionamiento sin bloquear la recuperacion muscular',
        fuerza: 'sin fuerza maxima; solo accesorios livianos o autocarga',
        reactivo: 'tecnica deportiva, core, movilidad toracica/cadera y respiracion',
        sistema: semana.fase === 'acumulacion' ? 'zona 2 + tempo controlado' : 'intervalos cortos de calidad',
        notas: 'Dia ideal para evaluar sensaciones, tiempos, saltos o RPE sin fatigar en exceso.',
      }),
    ]

    return [
      `SEMANA ${semana.numero} - ATR ${semana.fase.toUpperCase()}`,
      `Foco: ${semana.foco}`,
      `Pliometria: ${semana.notaPliometria}`,
      dias.join('\n\n'),
    ].join('\n\n')
  })

  return {
    tipo: 'mensual',
    objetivo: labelObjetivo(objetivo),
    nivel,
    faseATR: 'mesociclo ATR mensual',
    contenido: [
      'POWERFIT 360',
      'PLAN MENSUAL IA',
      '',
      `Objetivo: ${labelObjetivo(objetivo)}`,
      `Nivel: ${nivel}`,
      `Intensidad base: ${nivelCfg.intensidad}`,
      ajusteCiclo,
      '',
      'REGLAS DE RECUPERACION',
      ...descansoMuscularTexto().map((linea) => `- ${linea}`),
      '',
      'FOCO DEPORTIVO',
      ...focoDeportivo(objetivo).map((linea) => `- ${linea}`),
      '',
      contenidoSemanas.join('\n\n'),
      '',
      'Control semanal: registrar tiempo, distancia, velocidad, saltos, VO2 estimado, RM usado y RPE.',
      'Ajuste: si la tecnica baja o hay dolor, reducir volumen antes de subir intensidad.',
    ].join('\n'),
  }
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
    pliometria: {
      fighter: [
        'Pogo jump guard stance',
        'Lateral bound + fighting stance stick',
        'Split stance switch jump',
        'Skater jump + slip reaction',
        'Drop step jump + counter punch',
        'Medicine Ball plyo push pass',
      ],
      tenis: [
        'Split step rebound',
        'Lateral bound + deceleration',
        'Crossover bound + brake',
        'Single leg hop + open stance',
        'Drop jump + first step',
        'Multi-direction hop to forehand stance',
      ],
      fuerza: [
        'Box jump',
        'Broad jump',
        'Jump squat',
        'Depth landing',
        'Pogo jump',
      ],
      cardio: [
        'Line hop',
        'Skater jump',
        'Jump rope fast feet',
        'Low amplitude pogo',
      ],
      perdida_grasa: [
        'Low impact skater step',
        'Squat jump tecnico',
        'Jumping jack rapido',
        'Lateral line hop',
      ],
      general: [
        'Pogo jump',
        'Lateral bound',
        'Broad jump',
        'Skater jump',
        'Split stance jump',
      ],
    },
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
      sistemaMetabolico: faseCfg.sistema,
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
        metodo: `${pick(faseCfg.principales)} - sistema ${faseCfg.sistema}`,
        duracion: pick(['10 min', '10-12 min', '12 min', '12-15 min']),
        ejercicios: crearBloqueObjetivo(objetivo, nivelCfg, pools, faseATR),
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
        metodo: `${pick(faseCfg.finales)} - sistema ${faseCfg.sistema}`,
        duracion: pick(['8-10 min', '10 min', '10-12 min', '12 min']),
        ejercicios: crearBloqueFinal(objetivo, nivelCfg, pools, faseATR),
      },
    }

    mejorPlan = plan

    if (!esMuyParecidoAlHistorial(plan, historial)) {
      return plan
    }
  }

  return mejorPlan
}
