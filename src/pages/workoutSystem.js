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
    perdida_grasa: 'Pérdida grasa',
    cardio: 'Cardio',
    casa_principiante: 'Casa principiante sin materiales',
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
      principales: ['AMRAP 12 MIN', 'E2MOM 12 MIN', 'CIRCUITO 4 RONDAS', 'PIRAMIDAL TÉCNICO', 'HIIT AERÓBICO 30/30'],
      finales: ['EMOM 12 MIN', 'AMRAP 10 MIN', 'FOR QUALITY 12 MIN', 'ZONA 2 + TÉCNICA'],
      foco: 'volumen técnico y base aeróbica',
      sistema: 'oxidativo / base aeróbica',
    },
    transformacion: {
      porcentajes: [0.72, 0.75, 0.78],
      principales: ['INTERVALOS 40/20', 'E3MOM 15 MIN', 'DENSIDAD 12 MIN', 'PIRAMIDAL DE FUERZA', 'HIIT LACTICO 45/15'],
      finales: ['AMRAP 10 MIN', 'INTERVALOS 30/30', 'CHIPPER CORTO', 'REPEATED SPRINT ABILITY'],
      foco: 'potencia, ritmo y transferencia',
      sistema: 'glucolítico / láctico tolerable',
    },
    realizacion: {
      porcentajes: [0.82, 0.85, 0.88],
      principales: ['FOR QUALITY', 'E2MOM 10 MIN', 'COMPLEJO TÉCNICO', 'PIRAMIDAL PESADO', 'HIIT ALÁCTICO 10/50'],
      finales: ['FOR TIME', 'SPRINT INTERVALS', 'AMRAP 8 MIN', 'POTENCIA ALÁCTICA'],
      foco: 'intensidad, rendimiento y ejecución precisa',
      sistema: 'ATP-PC / potencia aláctica',
    },
  }

  return configs[faseATR] || configs.acumulacion
}

function configFaseObjetivo(faseATR, objetivo) {
  if (objetivo !== 'casa_principiante') return configFase(faseATR)

  return {
    porcentajes: [0.5, 0.55, 0.6],
    principales: ['CIRCUITO SUAVE 2-3 RONDAS', 'FOR QUALITY 10 MIN', 'INTERVALOS BAJO IMPACTO 30/30'],
    finales: ['ZONA 2 EN CASA', 'MOVILIDAD + CAMINATA SUAVE', 'AMRAP TECNICO 6-8 MIN'],
    foco: 'adherencia, movilidad, fuerza basica y bajo impacto',
    sistema: 'oxidativo suave / base de salud',
  }
}

function configCicloMenstrual(faseMenstrual) {
  const configs = {
    menstrual: {
      label: 'Menstrual',
      factorCarga: 0.85,
      intensidad: 'baja a moderada',
      foco: 'técnica, movilidad, control respiratorio y baja percepción de esfuerzo',
      recomendacion:
        'Reducir cargas si hay dolor o fatiga. Priorizar técnica, movilidad y trabajo aeróbico suave.',
    },
    folicular: {
      label: 'Folicular',
      factorCarga: 1.05,
      intensidad: 'media a alta',
      foco: 'progresión de fuerza, potencia técnica y aprendizaje motor',
      recomendacion:
        'Buena fase para progresar cargas si la alumna se siente bien y mantiene técnica estable.',
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
      foco: 'volumen controlado, fuerza submaxima y recuperación',
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

function permitePliometría(faseATR) {
  return faseATR === 'transformacion' || faseATR === 'realizacion'
}

function ejercicioReactivoSinPliometría(objetivo) {
  const prePliometría = {
    fighter: [
      'footwork técnico en guardia + frenado estable',
      'slip + counter lento con control de eje',
      'paso lateral + retorno a guardia sin salto',
      'band jab cross técnico con fase concéntrica rapida',
    ],
    tenis: [
      'split step técnico sin rebote + primer paso',
      'lateral shuffle + frenado estable',
      'crossover step + rotación de cadera controlada',
      'band forehand pattern técnico sin salto',
    ],
    fuerza: [
      'depth landing técnico sin rebote',
      'bisagra de cadera rapida con freno',
      'sentadilla tempo 3-1-1',
    ],
    general: [
      'mecanica de aterrizaje sin salto',
      'desaceleración lateral controlada',
      'cambio de dirección técnico',
    ],
  }

  return pick(prePliometría[objetivo] || prePliometría.general)
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
  const reactivo = permitePliometría(faseATR)
    ? pick(pools.pliometría[objetivo] || pools.pliometría.general)
    : ejercicioReactivoSinPliometría(objetivo)

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
    casa_principiante: [
      `6-8 ${pick(pools.casaPrincipiante)} con pausa`,
      `30 sec ${pick(pools.casaCardio)} suave`,
      `6 por lado ${pick(pools.casaPrincipiante)} controlado`,
      `30 sec ${pick(pools.casaMovilidad)}`,
    ],
  }

  return bloques[objetivo] || bloques.fighter
}

function crearBloqueFinal(objetivo, nivelCfg, pools, faseATR) {
  const cardio = pick(nivelCfg.cardio)
  const reactivo = permitePliometría(faseATR)
    ? pick(pools.pliometría[objetivo] || pools.pliometría.general)
    : ejercicioReactivoSinPliometría(objetivo)

  const finales = {
    fighter: [
      `12 ${pick(pools.boxeo)}`,
      `10 ${pick(pools.balón)}`,
      `8 ${reactivo}`,
      `10 ${pick(pools.pesoCorporal)}`,
    ],
    tenis: [
      `10 ${pick(pools.tenis)}`,
      `8 por lado ${pick(pools.transversal)}`,
      `8 ${reactivo}`,
      `10 ${pick(pools.balón)}`,
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
    casa_principiante: [
      `40 sec ${pick(pools.casaCardio)} suave`,
      `8 ${pick(pools.casaPrincipiante)} sin dolor`,
      `20 sec ${pick(pools.casaMovilidad)}`,
      `6 respiraciones profundas + caminar suave`,
    ],
  }

  return finales[objetivo] || finales.fighter
}

function crearContrasteTransversal(pools) {
  return pick([
    `Contraste entre series: 10 ${pick(pools.banda)} + 10 ${pick(pools.desplazamiento)}`,
    `Contraste entre series: 8 por lado ${pick(pools.balón)} + 10 ${pick(pools.transversal)}`,
    `Contraste entre series: 6 ${pick(pools.pliometría.general)} + 8 por lado ${pick(pools.transversal)}`,
    `Contraste entre series: 10 flexoextension de brazos con salto lateral + 8 por lado ${pick(pools.banda)}`,
    `Contraste entre series: 10 saltos abre/cierra brazos arriba-abajo + 8 por lado ${pick(pools.transversal)}`,
  ])
}

function descansoMuscularTexto() {
  return [
    'Músculos grandes (espalda, piernas y pecho): 72 horas entre estímulos fuertes.',
    'Músculos pequeños (brazos, hombros, gemelos y abdomen): 48 horas entre estímulos fuertes.',
    'Si se repite un patrón antes del descanso completo, debe ser técnico, liviano o de movilidad.',
  ]
}

function focoDeportivo(objetivo) {
  if (objetivo === 'tenis') {
    return [
      'Motor transversal: split step, aceleración, desaceleración y potencia rotaciónal.',
      'Transferencia: efecto serape, cadena cruzada, oblicuo-serrato y cadera-hombro.',
      'Ejemplos: med ball forehand/backhand throw, band forehand, lateral bound, crossover step.',
    ]
  }

  if (objetivo === 'fighter') {
    return [
      'Motor transversal: golpeo, cambio de nivel, desplazamiento y potencia rotaciónal.',
      'Transferencia: efecto serape, cadena cruzada, oblicuo-serrato y fase concéntrica explosiva.',
      'Ejemplos: band jab cross, band hook, med ball rotational throw, slip + counter, footwork.',
    ]
  }

  if (objetivo === 'casa_principiante') {
    return [
      'Inicio en casa: sin materiales, bajo impacto y progresion por confianza.',
      'Prioridad: respirar bien, moverse sin dolor, crear habito y mejorar movilidad.',
      'Ejemplos: silla, pared, suelo, caminata en casa, core basico y pausas completas.',
    ]
  }

  return [
    'Base física: fuerza util, control técnico, capacidad metabólica y recuperación.',
    'Transferencia: estabilidad, movilidad, control de eje y progresión de cargas.',
  ]
}

function seleccionDeportivaMensual(objetivo, usarPliometría) {
  if (objetivo === 'casa_principiante') {
    return {
      activación: 'respiracion nasal + movilidad suave de cuello, hombros, cadera y tobillos',
      motor: 'sentarse y pararse de silla + marcha en el lugar + respiracion controlada',
      transferencia: usarPliometría
        ? 'step touch lateral rapido sin salto + sentadilla parcial a silla'
        : 'paso lateral suave + equilibrio asistido + movilidad toracica',
      final: 'caminata en casa + movilidad suave + registro de RPE',
    }
  }

  if (objetivo === 'fighter') {
    return {
      activación: 'footwork drill + movilidad toracica + guardia activa',
      motor: 'band jab cross + cross-body chop oblicuo-serrato',
      transferencia: usarPliometría
        ? 'lateral bound + fighting stance stick + med ball rotational throw'
        : 'paso lateral + retorno a guardia sin salto + med ball rotational throw técnico',
      final: 'shuttle run corto + heavy bag técnico',
    }
  }

  if (objetivo === 'tenis') {
    return {
      activación: 'split step técnico + cadera/hombro + primer paso',
      motor: 'band forehand/backhand + hip shoulder separation drill',
      transferencia: usarPliometría
        ? 'split step rebound + lateral bound + med ball forehand throw'
        : 'split step sin rebote + frenada lateral + med ball forehand throw técnico',
      final: 'cambio de dirección 5m + shadow swing técnico',
    }
  }

  return {
    activación: 'movilidad de cadera/hombro + patrón bisagra + core activo',
    motor: 'kettlebell swing + pallof press + desplazamiento lateral',
    transferencia: usarPliometría
      ? 'pogo jump + medicine ball slam + aceleración corta'
      : 'mecanica de aterrizaje + desaceleración lateral + core anti-rotación',
    final: 'row/bike/run + peso corporal técnico',
  }
}

function fuerzaMensual({ objetivo, dia, porcentaje, rms, nivelCfg }) {
  if (objetivo === 'casa_principiante') {
    const ejerciciosCasa = {
      1: ['sentarse y pararse de silla', 'puente de gluteos'],
      2: ['push up contra pared', 'plancha inclinada en pared'],
      3: ['bisagra de cadera sin peso', 'bird dog lento'],
      4: ['sentadilla parcial a silla', 'dead bug basico'],
    }

    return (ejerciciosCasa[dia] || ejerciciosCasa[1]).map(
      (ejercicio) =>
        `${ejercicio} - 2-3 series de 6-10 reps - sin material - descanso ${pick(nivelCfg.descanso)} - RPE 4-6/10`
    )
  }

  const ejerciciosPorDia = {
    1: objetivo === 'cardio' ? ['Front Squat', 'Kettlebell Swing'] : ['Deadlift', 'Front Squat'],
    2: objetivo === 'fighter' || objetivo === 'tenis'
      ? ['Push Jerk', 'Barbell Row']
      : ['Push Press', 'Barbell Row'],
    3: objetivo === 'fighter' || objetivo === 'tenis'
      ? ['Power Clean', 'Clean Pull']
      : ['Thruster', 'High Pull'],
    4: ['Goblet Squat', 'Push Up'],
  }

  return (ejerciciosPorDia[dia] || ejerciciosPorDia[1]).map((ejercicio) => {
    const carga = calcularCarga(rms, ejercicio, porcentaje)
    return `${ejercicio} funcional - ${pick(nivelCfg.series)}x${pick(['3', '4', '5'])} @${Math.round(
      porcentaje * 100
    )}% - carga sugerida: ${carga} - descanso ${pick(nivelCfg.descanso)}`
  })
}

function diaMensual({
  dia,
  nombre,
  metodo,
  foco,
  activación,
  motor,
  fuerza,
  transferencia,
  sistema,
  final,
  notas,
}) {
  return [
    `${dia} - ${nombre}`,
    `Método PowerFit: ${metodo}`,
    `Foco: ${foco}`,
    '',
    'ACTIVACIÓN',
    `- ${activación}`,
    '- respiración + movilidad dinámica + técnica antes de velocidad',
    '',
    'BLOQUE 1 - FUNCIONAL / MOTOR TRANSVERSAL',
    `- ${motor}`,
    '- calidad de eje, diagonal activa, oblicuo-serrato y transferencia cadera-hombro',
    '',
    'BLOQUE 2 - FUERZA / RM + CONTRASTE FUNCIONAL',
    ...fuerza.map((linea) => `- ${linea}`),
    `- Contraste entre series: ${transferencia}`,
    '',
    'BLOQUE 3 - SISTEMA METABÓLICO',
    `- ${sistema}`,
    `- Final: ${final}`,
    '',
    `Notas: ${notas}`,
  ].join('\n')
}

export function generarPlanMensual({
  objetivo,
  nivel,
  rms = [],
  faseMenstrual = null,
}) {
  const nivelCfg =
    objetivo === 'casa_principiante'
      ? {
          intensidad: 'baja / inicio seguro en casa',
          reps: ['5-6', '6-8', '8'],
          series: ['2', '3'],
          descanso: ['60 sec', '75 sec', '90 sec'],
          cardio: ['60 sec', '90 sec', '2 min'],
        }
      : configNivel(nivel)
  const cicloCfg = configCicloMenstrual(faseMenstrual)
  const ajusteCiclo = cicloCfg
    ? `Ajuste ciclo menstrual: ${cicloCfg.label} - ${cicloCfg.recomendacion}`
    : 'Ajuste ciclo menstrual: no aplicado.'

  const semanas = [
    {
      numero: 1,
      fase: 'acumulacion',
      foco: 'base técnica, volumen controlado y capacidad aeróbica',
      notaPliometria: 'Sin pliometría. Usar mecanica de aterrizaje, frenadas y patrónes reactivos sin salto.',
    },
    {
      numero: 2,
      fase: 'acumulacion',
      foco: 'progresión de volumen, fuerza submaxima y calidad de movimiento',
      notaPliometria: 'Sin pliometría. Mantener saltos fuera del plan y mejorar desaceleración.',
    },
    {
      numero: 3,
      fase: 'transformacion',
      foco: 'potencia, transferencia deportiva y HIIT láctico controlado',
      notaPliometria: 'Iniciar pliometría: pocas repeticiones, descansos completos y máxima calidad.',
    },
    {
      numero: 4,
      fase: 'realizacion',
      foco: 'velocidad, potencia aláctica y rendimiento técnico',
      notaPliometria: 'Pliometría corta y explosiva. Cortar la serie si baja la velocidad.',
    },
  ]

  const contenidoSemanas = semanas.map((semana) => {
    const usarPliometría = permitePliometría(semana.fase)
    const faseCfg = configFaseObjetivo(semana.fase, objetivo)
    const porcentajeBase = pick(faseCfg.porcentajes)
    const porcentaje = ajustarPorcentajeCiclo(porcentajeBase, cicloCfg)
    const deportivo = seleccionDeportivaMensual(objetivo, usarPliometría)
    const reglaPliometría = usarPliometría
      ? 'pliometría específica del deporte con pocas repeticiones, mucha pausa y máxima calidad'
      : 'pre-pliometría sin salto: aterrizajes, frenadas, cambio de dirección técnico y control del eje'

    const dias = [
      diaMensual({
        dia: 'Día 1',
        nombre: 'Base funcional + cadena posterior + motor transversal',
        metodo: `${pick(faseCfg.principales)} - ${faseCfg.sistema}`,
        foco: 'fuerza util, bisagra, sentadilla, core cruzado y aceleración corta',
        activación: deportivo.activación,
        motor: deportivo.motor,
        fuerza: fuerzaMensual({ objetivo, dia: 1, porcentaje, rms, nivelCfg }),
        transferencia: deportivo.transferencia,
        sistema: semana.fase === 'acumulacion' ? 'AMRAP 10-12 min técnico oxidativo' : 'E2MOM 10 min potencia controlada',
        final: deportivo.final,
        notas: 'Descanso muscular: piernas 72h antes de otro estimulo fuerte. Esto no es hipertrofia; es fuerza funcional transferible.',
      }),
      diaMensual({
        dia: 'Día 2',
        nombre: 'Empuje/traccion funcional + potencia rotaciónal',
        metodo: `${pick(faseCfg.principales)} - contraste fuerza/transferencia`,
        foco: 'empuje, traccion, serrato, escapula y cadena cruzada sin trabajo de volumen estetico',
        activación: 'scap push up + movilidad toracica + patrón de golpeo/raqueta sin carga',
        motor: objetivo === 'fighter'
          ? 'elastic band hook rotation + slip counter técnico'
          : objetivo === 'tenis'
            ? 'elastic band backhand pattern + crossover step'
            : 'pallof press + diagonal chop + bear crawl técnico',
        fuerza: fuerzaMensual({ objetivo, dia: 2, porcentaje, rms, nivelCfg }),
        transferencia: objetivo === 'fighter'
          ? '10 band jab cross + 8 med ball rotational throw por lado'
          : objetivo === 'tenis'
            ? '10 band forehand/backhand + 8 med ball scoop toss por lado'
            : '10 pallof press + 8 medicine ball slam',
        sistema: 'INTERVALOS 40/20 con ejecución limpia, no buscar fallo muscular',
        final: 'core anti-rotación + desplazamiento lateral',
        notas: 'Pecho/espalda descansan 72h. Brazos/hombros/gemelos/abdomen descansan 48h.',
      }),
      diaMensual({
        dia: 'Día 3',
        nombre: 'Potencia funcional + transferencia deportiva',
        metodo: `${pick(faseCfg.principales)} - ${semana.foco}`,
        foco: 'fase concéntrica explosiva, calidad, potencia rotaciónal y velocidad usable',
        activación: deportivo.activación,
        motor: objetivo === 'fighter'
          ? 'crossover step to rotational punch + band anti-rotation punch'
          : objetivo === 'tenis'
            ? 'open stance rotational drive + split step primer paso'
            : 'kettlebell clean + desplazamiento lateral controlado',
        fuerza: fuerzaMensual({ objetivo, dia: 3, porcentaje, rms, nivelCfg }),
        transferencia: reglaPliometría,
        sistema: semana.fase === 'realizacion' ? 'HIIT aláctico 10/50, 6-8 rondas' : 'HIIT aeróbico/láctico técnico 30/30, 8-10 rondas',
        final: objetivo === 'fighter'
          ? 'round técnico de golpes con banda + footwork'
          : objetivo === 'tenis'
            ? 'split step + aceleración lateral + sombra de golpe'
            : 'shuttle run + medicine ball slam',
        notas: semana.notaPliometria,
      }),
      diaMensual({
        dia: 'Día 4',
        nombre: 'Metabolico funcional + control técnico',
        metodo: `${pick(faseCfg.finales)} - capacidad sin perder técnica`,
        foco: 'resistencia específica, movilidad, core y evaluación de calidad',
        activación: 'RAMP 8 min + movilidad cadera/hombro + respiración',
        motor: 'cadenas cruzadas + core anti-rotación + desplazamiento técnico',
        fuerza: fuerzaMensual({ objetivo, dia: 4, porcentaje, rms, nivelCfg }),
        transferencia: usarPliometría
          ? '3-5 series cortas de reactivo especifico + descanso completo'
          : 'frenadas, aterrizajes y cambios de dirección sin impacto alto',
        sistema: semana.fase === 'acumulacion' ? 'ZONA 2 + TÉCNICA 18-25 min' : 'AMRAP 8-10 min de calidad o repeated sprint ability',
        final: 'movilidad, respiración y registro de tiempos/saltos/RPE',
        notas: 'Día para medir progreso sin destruir recuperación. Si baja la técnica, termina la serie.',
      }),
    ]

    return [
      `SEMANA ${semana.numero} - ATR ${semana.fase.toUpperCase()}`,
      `Foco: ${semana.foco}`,
      `Pliometría: ${semana.notaPliometria}`,
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
      'REGLAS DE RECUPERACIÓN',
      ...descansoMuscularTexto().map((linea) => `- ${linea}`),
      '',
      'FOCO DEPORTIVO',
      ...focoDeportivo(objetivo).map((linea) => `- ${linea}`),
      '',
      'REGLA DEL MÉTODO POWERFIT',
      '- Entrenamiento funcional antes que hipertrofia: fuerza útil, patrónes completos y transferencia deportiva.',
      '- Cada sesión mezcla activación, motor transversal, fuerza/RM, contraste funcional y sistema metabólico.',
      '- La carga se sube solo si la técnica se mantiene limpia y explosiva.',
      '',
      contenidoSemanas.join('\n\n'),
      '',
      'Control semanal: registrar tiempo, distancia, velocidad, saltos, VO2 estimado, RM usado y RPE.',
      'Ajuste: si la técnica baja o hay dolor, reducir volumen antes de subir intensidad.',
    ].join('\n'),
  }
}

function crearTrabajoFuerza(ejercicio, nivelCfg, porcentaje, rms, pools, objetivo) {
  if (objetivo === 'casa_principiante') {
    return `${ejercicio} - 2-3 rondas de 6-10 repeticiones - ritmo lento - descanso 60-90 sec - escala: usar silla, pared o apoyo firme`
  }

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
    balón: [
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
    pliometría: {
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
        'Squat jump técnico',
        'Jumping jack rápido',
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
    casaPrincipiante: [
      'sentarse y pararse de una silla',
      'push up contra pared',
      'puente de gluteos en el suelo',
      'bird dog lento',
      'dead bug basico',
      'marcha en el lugar',
      'step touch lateral sin salto',
      'elevacion de talones apoyado',
      'bisagra de cadera sin peso',
      'sentadilla parcial a silla',
      'plancha inclinada en pared o mesa firme',
      'movilidad de hombros en pared',
    ],
    casaMovilidad: [
      'respiracion nasal + movilidad cervical suave',
      'circulos de hombros + apertura de pecho',
      'movilidad de tobillo apoyado en pared',
      'gato camello lento',
      'rotacion toracica en cuadrupedia',
      'balanceo de cadera suave',
    ],
    casaCardio: [
      'marcha en el lugar',
      'paso lateral suave',
      'talones al gluteo sin impacto',
      'subir rodillas bajo impacto',
      'caminar por la casa',
    ],
    movilidad: [
      'movilidad de cadera + hombros',
      'world greatest stretch',
      'scap push up + squat hold',
      't-spine rotation + ankle rocks',
    ],
  }

  const nivelCfg =
    objetivo === 'casa_principiante'
      ? {
          intensidad: 'baja / inicio seguro en casa',
          reps: ['5-6', '6-8', '8'],
          series: ['2', '3'],
          descanso: ['60 sec', '75 sec', '90 sec'],
          cardio: ['60 sec', '90 sec', '2 min'],
        }
      : configNivel(nivel)
  const faseCfg = configFaseObjetivo(faseATR, objetivo)
  const cicloCfg = configCicloMenstrual(faseMenstrual)
  const variantes = ['A', 'B', 'C', 'D', 'E', 'F']

  let mejorPlan = null

  for (let intento = 0; intento < 8; intento++) {
    const porcentajeBase = pick(faseCfg.porcentajes)
    const porcentaje = ajustarPorcentajeCiclo(porcentajeBase, cicloCfg)
    const variante = pick(variantes)
    const fuerzaElegida =
      objetivo === 'casa_principiante'
        ? uniquePick(pools.casaPrincipiante, 3)
        : objetivo === 'fuerza'
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
              'Base: aceleración, potencia rotaciónal, cadenas cruzadas y fase concéntrica explosiva.',
              'Foco técnico: efecto serape, diagonal oblicuo-serrato y transferencia cadera-hombro.',
              'Criterio: calidad primero, velocidad después; cortar la serie si se pierde eje o timing.',
            ]
          : null,

      activación: {
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
        metodo: objetivo === 'casa_principiante'
          ? `FUERZA FUNCIONAL SIN MATERIAL - foco: control, confianza y adherencia`
          : cicloCfg
            ? `FUERZA / %RM - foco ATR: ${faseCfg.foco} - ajuste ciclo: ${cicloCfg.foco}`
            : `FUERZA / %RM - foco: ${faseCfg.foco}`,
        duracion: objetivo === 'casa_principiante'
          ? pick(['8-10 min', '10 min', '10-12 min'])
          : pick(['12 min', '12-15 min', '15 min', '15-18 min']),
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
