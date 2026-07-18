import { useState } from 'react'

const metodos = [
  {
    nombre: 'ATR',
    uso: 'Ordena el entrenamiento en fases: Acumulación, Transformación y Realización.',
    ejecucion:
      'Acumulación crea base y volumen técnico. Transformación convierte esa base en potencia y ritmo. Realización baja el volumen y sube la precisión/intensidad.',
    medir: 'Se controla por fase, carga, volumen semanal, calidad técnica y respuesta del alumno.',
    ejemplo:
      'Semana 1-2 acumulacion: 65% RM y volumen. Semana 3 transformacion: 75% RM y potencia. Semana 4 realizacion: 85% RM y test controlado.',
  },
  {
    nombre: 'AMRAP',
    uso: 'Aumentar densidad de trabajo en un tiempo fijo.',
    ejecucion:
      'El alumno repite una secuencia durante el tiempo indicado sin perder técnica. Se permite bajar ritmo, no desordenar el movimiento.',
    medir: 'Rondas completas + repeticiones extra.',
    ejemplo: 'AMRAP 12 MIN: 10 push up, 12 kettlebell swing, 150m run.',
  },
  {
    nombre: 'EMOM',
    uso: 'Controlar ritmo, descanso y consistencia bajo fatiga.',
    ejecucion:
      'Cada minuto inicia una tarea. Lo que sobra del minuto es descanso. Si no termina, se reduce carga o repeticiones.',
    medir: 'Minutos completados, carga usada y calidad técnica.',
    ejemplo: 'EMOM 10 MIN: minuto impar 8 deadlift, minuto par 10 burpees.',
  },
  {
    nombre: 'E2MOM / E3MOM',
    uso: 'Trabajo técnico o fuerza con mas recuperación que un EMOM.',
    ejecucion:
      'Se inicia la tarea cada 2 o 3 minutos. Ideal para levantamientos pesados o complejos técnicos.',
    medir: 'Carga, series completadas y estabilidad técnica.',
    ejemplo: 'E2MOM 12 MIN: 5 series de 3 power clean al 75%.',
  },
  {
    nombre: 'TABATA / INTERVALOS',
    uso: 'Mejorar tolerancia al esfuerzo y capacidad anaeróbica.',
    ejecucion:
      'Alterna trabajo y pausa. El objetivo es sostener intensidad sin transformar el ejercicio en movimiento desordenado.',
    medir: 'Repeticiones totales o menor ronda realizada.',
    ejemplo: '8 rondas 20/10: air squat. Intervalos 40/20: row + push up.',
  },
  {
    nombre: 'FOR TIME',
    uso: 'Resolver una tarea lo mas rápido posible con estandar técnico.',
    ejecucion:
      'Se completa el volumen indicado. El cronómetro manda, pero la técnica define si la repetición cuenta.',
    medir: 'Tiempo final.',
    ejemplo: 'For time: 21-15-9 kettlebell swing y burpees.',
  },
  {
    nombre: 'FOR QUALITY',
    uso: 'Priorizar calidad técnica, control y aprendizaje.',
    ejecucion:
      'No se compite contra el reloj. Se avanza con pausas, posiciones sólidas y ejecución limpia.',
    medir: 'Carga técnica, control, rango de movimiento y consistencia.',
    ejemplo: '4 rondas for quality: 8 goblet squat, 8 strict press, 30 sec plank.',
  },
  {
    nombre: 'PIRAMIDAL',
    uso: 'Subir y bajar repeticiones para combinar técnica, volumen y fatiga controlada.',
    ejecucion:
      'Empieza con pocas repeticiones, sube hasta un pico y vuelve a bajar. La carga debe permitir que la última bajada siga limpia.',
    medir: 'Carga usada, calidad en el pico y capacidad de mantener técnica al volver a bajar.',
    ejemplo: 'Deadlift 1-3-5-7-5-3-1 @60-75%. Descanso 60-90 sec entre escalones.',
  },
  {
    nombre: 'RM / % LOAD',
    uso: 'Asignar cargas según el máximo o estimación del alumno.',
    ejecucion:
      'Se usa un porcentaje del RM registrado. Si no existe RM, se trabaja por percepción de esfuerzo y se registra después.',
    medir: 'Kilos, porcentaje, reps logradas y RPE.',
    ejemplo: 'Back squat 5x5 @75%. Si el RM es 100 kg, carga sugerida 75 kg.',
  },
  {
    nombre: 'Fighter Conditioning',
    uso: 'Transferir resistencia, coordinación y potencia a deportes de combate.',
    ejecucion:
      'Combina golpes, desplazamientos, fuerza y cardio corto. Debe parecerse al ritmo real de round.',
    medir: 'Rondas, calidad de guardia, potencia mantenida y recuperación.',
    ejemplo: '3 rounds: 45 sec heavy bag, 10 burpees, 150m row, 30 sec plank.',
  },
  {
    nombre: 'Motor transversal',
    uso: 'Transferir fuerza entre cadera, tronco, hombro y brazo para deportes rotaciónales como boxeo y tenis.',
    ejecucion:
      'Se trabaja diagonal, cadenas cruzadas, oblicuo, serrato y separacion cadera-hombro. La fase concéntrica debe ser explosiva, pero solo si la postura se mantiene limpia.',
    medir:
      'Calidad de rotación, velocidad, control de frenado, simetría por lado y capacidad de repetir sin perder eje.',
    ejemplo:
      'Push Jerk 5 reps + 8 lanzamientos rotaciónales con balón por lado + 10 desplazamientos laterales con frenado.',
  },
  {
    nombre: 'Contraste fuerza-potencia',
    uso: 'Aplicar un gesto explosivo después de una serie de fuerza para transferir carga a aceleración y potencia.',
    ejecucion:
      'Se hace una serie de fuerza, se descansa breve y se ejecuta un gesto rápido: bandas, balón medicinal, salto lateral o patrón especifico.',
    medir: 'Carga usada, velocidad del gesto, calidad técnica y fatiga acumulada.',
    ejemplo:
      '10 push jerk + 10 flexoextensiones de brazos con salto lateral y desplazamiento.',
  },
  {
    nombre: 'HIIT',
    uso: 'Trabajar alta intensidad por intervalos para mejorar potencia, tolerancia al esfuerzo y recuperación.',
    ejecucion:
      'Alterna ventanas cortas de trabajo y pausa. La relación trabajo/descanso cambia según objetivo: 10/50 para potencia aláctica, 30/30 para aeróbico intenso, 45/15 para láctico.',
    medir: 'Watts, metros, repeticiones, tiempo sostenido, recuperación y caída de rendimiento entre rondas.',
    ejemplo: 'HIIT 10/50: sprint 10 sec + 50 sec pausa x 8. HIIT 30/30: row fuerte 30 sec + 30 sec suave x 10.',
  },
  {
    nombre: 'Sistema metabólico',
    uso: 'Elegir que energía se quiere entrenar: oxidativo, glucolítico o ATP-PC.',
    ejecucion:
      'Oxidativo usa trabajos mas largos y sostenibles. Glucolitico tolera esfuerzos medios con fatiga. ATP-PC busca acciones explosivas muy cortas con descanso amplio.',
    medir: 'Duración del esfuerzo, descanso, potencia mantenida, frecuencia cardiaca y calidad técnica.',
    ejemplo: 'Acumulación: oxidativo. Transformación: glucolítico. Realización: ATP-PC aláctico.',
  },
  {
    nombre: 'Pliometría deportiva',
    uso: 'Mejorar reactividad, aceleración, frenado y transferencia elastica por deporte.',
    ejecucion:
      'Se usan saltos, rebotes y aterrizajes con poco volumen y máxima calidad. El aterrizaje debe ser silencioso, estable y alineado.',
    medir: 'Altura/distancia, tiempo de contacto, control de aterrizaje, simetría y respuesta al siguiente gesto.',
    ejemplo: 'Tenis: split step rebound + salida lateral. Boxeo: pogo guard stance + slip reaction.',
  },
]

function youtubeSearch(nombre) {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(
    `${nombre} technique tutorial`
  )}`
}

function crearEjercicio(nombre, categoría, objetivo, ejemplo) {
  return {
    nombre,
    categoría,
    objetivo,
    tecnica: [
      'Preparar posicion inicial estable antes de comenzar.',
      'Mantener abdomen activo y control del rango de movimiento.',
      'Ejecutar con ritmo constante sin sacrificar técnica.',
      'Detener o bajar intensidad si aparece dolor o perdida clara de postura.',
    ],
    errores: [
      'Apurarse y perder control.',
      'Compensar con espalda, hombros o rodillas según el movimiento.',
      'No respetar el estandar técnico indicado por el coach.',
    ],
    ejemplo,
    youtube: youtubeSearch(nombre),
  }
}

const ejercicios = [
  {
    nombre: 'Deadlift',
    categoría: 'Fuerza',
    objetivo: 'Desarrollar cadena posterior: gluteos, isquios, espalda y agarre.',
    tecnica: [
      'Pies bajo la barra, barra cerca de la tibia.',
      'Espalda neutra, pecho activo y abdomen firme.',
      'Empujar el suelo con las piernas antes de tirar con la espalda.',
      'Bloquear arriba con gluteos, sin hiperextender la zona lumbar.',
    ],
    errores: [
      'Separar la barra del cuerpo.',
      'Redondear espalda en el despegue.',
      'Levantar cadera antes que hombros.',
    ],
    ejemplo: 'Piramidal: 1-3-5-7-5-3-1 @60-75%.',
    youtube: 'https://www.youtube.com/results?search_query=deadlift+technique+tutorial',
  },
  crearEjercicio(
    'Front Squat',
    'Fuerza',
    'Fortalecer piernas, core y postura frontal bajo carga.',
    '4x5 @70% o E2MOM 10 MIN: 3 front squat técnicos.'
  ),
  crearEjercicio(
    'Bench Press',
    'Fuerza',
    'Desarrollar fuerza de empuje horizontal, pecho, hombro anterior y triceps.',
    '5x5 @75% con pausa controlada en el pecho.'
  ),
  crearEjercicio(
    'Strict Press',
    'Fuerza',
    'Construir fuerza estricta de hombros y estabilidad sobre cabeza.',
    '4x6 strict press con abdomen activo y gluteos firmes.'
  ),
  crearEjercicio(
    'Barbell Row',
    'Fuerza',
    'Fortalecer espalda, dorsales y control escapular.',
    '4x8 barbell row con torso firme y pausa arriba.'
  ),
  {
    nombre: 'Back Squat',
    categoría: 'Fuerza',
    objetivo: 'Construir fuerza de piernas, core y estabilidad bajo carga.',
    tecnica: [
      'Barra firme sobre trapecios o posicion low bar según objetivo.',
      'Rodillas siguen la linea de los pies.',
      'Bajar con control manteniendo torso estable.',
      'Subir empujando el suelo y manteniendo abdomen activo.',
    ],
    errores: ['Colapsar rodillas hacia adentro.', 'Perder profundidad sin razón técnica.', 'Relajar abdomen abajo.'],
    ejemplo: '5x5 @70-80% o tempo squat 3 segúndos bajada.',
    youtube: 'https://www.youtube.com/results?search_query=back+squat+technique+tutorial',
  },
  {
    nombre: 'Power Clean',
    categoría: 'Halterofilia',
    objetivo: 'Desarrollar potencia de cadera, coordinación y recepcion de barra.',
    tecnica: [
      'Primer tiron controlado desde el suelo.',
      'Extender cadera fuerte antes de tirar con brazos.',
      'Codos rápidos hacia adelante en la recepcion.',
      'Recibir con rodillas flexionadas y torso firme.',
    ],
    errores: ['Tirar con brazos demasiado pronto.', 'Recibir con codos bajos.', 'Saltar hacia adelante.'],
    ejemplo: 'E2MOM 10 MIN: 3 power clean técnicos @65-75%.',
    youtube: 'https://www.youtube.com/results?search_query=power+clean+technique+tutorial',
  },
  crearEjercicio(
    'Clean Pull',
    'Halterofilia',
    'Mejorar potencia del tiron y extension de cadera sin recepcion.',
    '5x3 clean pull @85-100% del clean técnico.'
  ),
  crearEjercicio(
    'Power Snatch',
    'Halterofilia',
    'Desarrollar velocidad, coordinación y recepcion sobre cabeza.',
    'E2MOM 10 MIN: 2-3 power snatch técnicos.'
  ),
  crearEjercicio(
    'Push Jerk',
    'Halterofilia',
    'Transferir potencia de piernas y recibir la barra con bloqueo estable.',
    '5x3 push jerk @70-80% cuidando recepcion.'
  ),
  crearEjercicio(
    'Thruster',
    'Halterofilia / Conditioning',
    'Combinar sentadilla frontal y empuje sobre cabeza en un movimiento continuo.',
    '21-15-9 thruster y burpees.'
  ),
  crearEjercicio(
    'Hang Power Clean',
    'Halterofilia',
    'Practicar potencia desde colgado y recepcion rapida.',
    'EMOM 8 MIN: 3 hang power clean.'
  ),
  crearEjercicio(
    'High Pull',
    'Halterofilia',
    'Entrenar extension explosiva y dirección vertical de la barra.',
    '4x5 high pull liviano-moderado.'
  ),
  {
    nombre: 'Push Press',
    categoría: 'Fuerza / Potencia',
    objetivo: 'Transferir fuerza de piernas hacia empuje sobre cabeza.',
    tecnica: [
      'Barra apoyada en hombros, codos levemente adelante.',
      'Dip corto y vertical.',
      'Empujar fuerte con piernas y terminar con brazos.',
      'Bloquear arriba con costillas abajo.',
    ],
    errores: ['Dip muy profundo.', 'Arquear lumbar al bloquear.', 'Empujar la barra hacia adelante.'],
    ejemplo: '4x5 @70% o EMOM 8 MIN: 6 push press.',
    youtube: 'https://www.youtube.com/results?search_query=push+press+technique+tutorial',
  },
  {
    nombre: 'Kettlebell Swing',
    categoría: 'Kettlebell',
    objetivo: 'Potencia de cadera y acondicionamiento posterior.',
    tecnica: [
      'Movimiento nace desde bisagra de cadera, no desde sentadilla.',
      'Espalda neutra y abdomen activo.',
      'La kettlebell flota por extension de cadera.',
      'Brazos relajados como conectores.',
    ],
    errores: ['Levantar con hombros.', 'Flexionar demasiado rodillas.', 'Perder espalda neutra abajo.'],
    ejemplo: 'AMRAP 10 MIN: 12 swings, 10 push up, 150m run.',
    youtube: 'https://www.youtube.com/results?search_query=kettlebell+swing+technique+tutorial',
  },
  crearEjercicio(
    'Kettlebell Clean',
    'Kettlebell',
    'Llevar la kettlebell a rack con potencia de cadera y control de antebrazo.',
    'EMOM 10 MIN: 6 kettlebell clean por lado.'
  ),
  crearEjercicio(
    'Kettlebell Snatch',
    'Kettlebell',
    'Desarrollar potencia, coordinación y estabilidad sobre cabeza.',
    'AMRAP 10 MIN: 8 kettlebell snatch alternados y 10 air squat.'
  ),
  crearEjercicio(
    'Goblet Squat',
    'Kettlebell',
    'Mejorar patrón de sentadilla, postura y fuerza de piernas.',
    '4 rondas: 12 goblet squat, 10 push up, 30 sec plank.'
  ),
  crearEjercicio(
    'Kettlebell Press',
    'Kettlebell',
    'Fortalecer hombro, core y control unilateral.',
    '4x6 kettlebell press por lado.'
  ),
  {
    nombre: 'Burpee',
    categoría: 'Peso corporal',
    objetivo: 'Acondicionamiento general, potencia y tolerancia a fatiga.',
    tecnica: [
      'Bajar al suelo con control suficiente.',
      'Pecho toca el piso si el estandar lo pide.',
      'Volver con pies cerca de manos.',
      'Saltar y extender cadera arriba.',
    ],
    errores: ['Caer sin control.', 'No extender cadera.', 'Perder ritmo respiratorio.'],
    ejemplo: 'For time: 50 burpees o intervalos 40/20.',
    youtube: 'https://www.youtube.com/results?search_query=burpee+proper+form+tutorial',
  },
  crearEjercicio(
    'Push Up',
    'Peso corporal',
    'Fortalecer empuje, core y control de tronco.',
    'AMRAP 8 MIN: 10 push up, 12 sit up, 150m run.'
  ),
  crearEjercicio(
    'Air Squat',
    'Peso corporal',
    'Construir base de sentadilla y resistencia de piernas.',
    'Tabata air squat 20/10 por 8 rondas.'
  ),
  crearEjercicio(
    'Lunge',
    'Peso corporal',
    'Trabajar fuerza unilateral, estabilidad y control de rodilla.',
    '3 rondas: 12 lunges por pierna y 30 sec plank.'
  ),
  crearEjercicio(
    'Mountain Climber',
    'Peso corporal',
    'Elevar pulso y trabajar core dinamico.',
    'Intervalos 40/20: mountain climber + jumping jack.'
  ),
  crearEjercicio(
    'Jumping Jack',
    'Peso corporal',
    'Activar ritmo cardiovascular y coordinación general.',
    '2 min jumping jack como entrada en calor.'
  ),
  crearEjercicio(
    'Bear Crawl',
    'Peso corporal',
    'Desarrollar core, hombros y coordinación cruzada.',
    '4 rondas: 10m bear crawl, 10 push up, 12 air squat.'
  ),
  {
    nombre: 'Heavy Bag',
    categoría: 'Boxeo',
    objetivo: 'Trabajar potencia, ritmo, distancia y acondicionamiento especifico.',
    tecnica: [
      'Mantener guardia después de cada golpe.',
      'Rotar cadera y pie en golpes de poder.',
      'Respirar corto en cada combinacion.',
      'Salir con desplazamiento, no quedarse parado frente al saco.',
    ],
    errores: ['Bajar manos al golpear.', 'Empujar el saco en vez de golpear.', 'Cruzar pies al desplazarse.'],
    ejemplo: '3 rounds: 45 sec combinaciones, 15 sec defensa activa.',
    youtube: 'https://www.youtube.com/results?search_query=heavy+bag+boxing+technique',
  },
  crearEjercicio(
    'Shadow Boxing',
    'Boxeo',
    'Practicar técnica, defensa, respiración y desplazamientos sin impacto.',
    '3 rounds de 2 min shadow boxing con foco técnico.'
  ),
  crearEjercicio(
    'Footwork Drill',
    'Boxeo',
    'Mejorar distancia, balance y cambios de angulo.',
    'EMOM 8 MIN: 40 sec footwork drill + 20 sec pausa.'
  ),
  crearEjercicio(
    'Jab Cross',
    'Boxeo',
    'Entrenar combinacion basica, rotación y retorno a guardia.',
    '5 rounds: 30 sec jab cross, 30 sec desplazamiento.'
  ),
  crearEjercicio(
    'Slip + Counter',
    'Boxeo',
    'Practicar defensa de cintura y contraataque inmediato.',
    '3 rounds: slip + counter cada 3 segúndos.'
  ),
  crearEjercicio(
    'Defense + Counter',
    'Boxeo',
    'Integrar bloqueo, esquiva o paso atras con respuesta ofensiva.',
    'Round técnico: defensa + counter + salida lateral.'
  ),
  crearEjercicio(
    'Uppercut Hook Combo',
    'Boxeo',
    'Trabajar golpes curvos, rotación y transferencia de peso.',
    'Heavy bag: uppercut-hook-cross por intervalos 30/30.'
  ),
  {
    nombre: 'Plank Hold',
    categoría: 'Core',
    objetivo: 'Mejorar rigidez del tronco y transferencia de fuerza.',
    tecnica: [
      'Codos bajo hombros.',
      'Gluteos activos y costillas abajo.',
      'Cuello neutro.',
      'Respirar sin perder posicion.',
    ],
    errores: ['Cadera hundida.', 'Cadera demasiado alta.', 'Aguantar la respiración.'],
    ejemplo: '4 rondas: 30-45 sec plank + 10 dead bug.',
    youtube: 'https://www.youtube.com/results?search_query=plank+proper+form+tutorial',
  },
  crearEjercicio(
    'Sit Up',
    'Core',
    'Trabajar flexion de tronco y resistencia abdominal.',
    'AMRAP 10 MIN: 15 sit up, 10 kettlebell swing, 150m run.'
  ),
  crearEjercicio(
    'Hollow Hold',
    'Core',
    'Mejorar tension corporal, control de costillas y abdomen profundo.',
    '4 rondas: 20-30 sec hollow hold.'
  ),
  crearEjercicio(
    'Russian Twist',
    'Core',
    'Entrenar rotación controlada y resistencia del tronco.',
    '3x20 russian twist controlados.'
  ),
  crearEjercicio(
    'Dead Bug',
    'Core',
    'Aprender control lumbo-pelvico y estabilidad respirando.',
    '3x10 dead bug por lado como activación.'
  ),
  crearEjercicio(
    'V-Up',
    'Core',
    'Desarrollar potencia abdominal y coordinación tronco-piernas.',
    '4 rondas: 12 v-up, 30 sec plank.'
  ),
  crearEjercicio(
    'Run',
    'Cardio',
    'Mejorar resistencia, velocidad y recuperación entre esfuerzos.',
    'Intervalos: 6x200m con descanso caminando.'
  ),
  crearEjercicio(
    'Bike',
    'Cardio',
    'Elevar trabajo aeróbico o intervalico con bajo impacto articular.',
    '10 rounds: 30 sec fuerte / 30 sec suave.'
  ),
  crearEjercicio(
    'Row',
    'Cardio',
    'Trabajar potencia de piernas, traccion y capacidad aeróbica.',
    'AMRAP 12 MIN: 200m row, 10 burpees, 12 swing.'
  ),
  crearEjercicio(
    'Ski Erg',
    'Cardio',
    'Entrenar traccion, core y resistencia con enfasis de tren superior.',
    'EMOM 10 MIN: 12-15 cal ski erg.'
  ),
  crearEjercicio(
    'Jump Rope',
    'Cardio / Coordinacion',
    'Mejorar ritmo, pies, coordinación y acondicionamiento.',
    '3 rounds: 1 min jump rope, 10 push up.'
  ),
  crearEjercicio(
    'Shuttle Run',
    'Cardio / Agilidad',
    'Entrenar aceleración, frenado, cambios de dirección y pulso.',
    '10 rounds: 10m ida/vuelta + 20 sec pausa.'
  ),
  crearEjercicio(
    'Movilidad de cadera + hombros',
    'Movilidad',
    'Preparar rangos utiles para sentadillas, bisagras, golpes y trabajo sobre cabeza.',
    'Activación: 10 repeticiones controladas antes del bloque principal.'
  ),
  crearEjercicio(
    'World Greatest Stretch',
    'Movilidad',
    'Abrir cadera, columna toracica e isquios antes de entrenar.',
    '2 rondas de 5 repeticiones por lado.'
  ),
  crearEjercicio(
    'Scap Push Up + Squat Hold',
    'Movilidad / Activacion',
    'Activar escapulas y posicion profunda de sentadilla.',
    '10 scap push up + 30 sec squat hold.'
  ),
  crearEjercicio(
    'T-Spine Rotation + Ankle Rocks',
    'Movilidad',
    'Mejorar rotación toracica y movilidad de tobillo.',
    '10 rotaciónes por lado + 10 ankle rocks por lado.'
  ),
  crearEjercicio(
    'Elastic Band Jab Cross',
    'Boxeo / Banda elastica',
    'Mejorar aceleración de golpe, retorno de guardia y transferencia cadera-hombro.',
    '3x10 por lado después de una serie de fuerza de empuje.'
  ),
  crearEjercicio(
    'Elastic Band Hook Rotation',
    'Boxeo / Banda elastica',
    'Entrenar rotación explosiva, oblicuos, serrato y control de eje.',
    '3x8 por lado con fase concéntrica explosiva y vuelta controlada.'
  ),
  crearEjercicio(
    'Medicine Ball Rotational Throw',
    'Potencia rotaciónal',
    'Transferir fuerza de piernas y cadera hacia tronco, hombro y brazo.',
    '4x6 por lado contra pared o con compañero.'
  ),
  crearEjercicio(
    'Medicine Ball Forehand Throw',
    'Tenis / Potencia rotaciónal',
    'Simular golpe de derecha usando cadenas cruzadas y efecto serape.',
    '4x6 por lado con separacion cadera-hombro.'
  ),
  crearEjercicio(
    'Medicine Ball Backhand Throw',
    'Tenis / Potencia rotaciónal',
    'Simular reves con transferencia diagonal y control de frenado.',
    '4x6 por lado, priorizando calidad antes que velocidad.'
  ),
  crearEjercicio(
    'Band Forehand Acceleration',
    'Tenis / Banda elastica',
    'Mejorar aceleración de golpe y activación oblicuo-serrato.',
    '3x10 por lado entre series de fuerza.'
  ),
  crearEjercicio(
    'Band Backhand Acceleration',
    'Tenis / Banda elastica',
    'Desarrollar aceleración y control en patrón de reves.',
    '3x10 por lado con retorno controlado.'
  ),
  crearEjercicio(
    'Serape Effect Diagonal Stretch + Explosive Rotation',
    'Motor transversal',
    'Cargar diagonalmente la cadena cruzada y liberar con rotación explosiva.',
    '3x6 por lado antes o después de fuerza principal.'
  ),
  crearEjercicio(
    'Cross-body Chop Oblique-Serratus',
    'Motor transversal',
    'Conectar oblicuo, serrato, cadera y hombro en diagonal.',
    '3x8 por lado con banda o polea.'
  ),
  crearEjercicio(
    'Lateral Shuffle + Deceleration',
    'Aceleracion / Frenado',
    'Mejorar desplazamiento lateral, frenado y cambio de dirección.',
    '4x15-20m cuidando rodilla y cadera al frenar.'
  ),
  crearEjercicio(
    'Split Step + Lateral Acceleration',
    'Tenis / Aceleracion',
    'Entrenar reaccion, primer paso y salida lateral.',
    '6-8 salidas cortas de 5m por lado.'
  ),
  crearEjercicio(
    'Flexoextension de brazos con salto lateral',
    'Contraste fuerza-potencia',
    'Combinar empuje, rigidez de tronco y desplazamiento lateral explosivo.',
    '10 reps entre series de push jerk, bench press o strict press.'
  ),
  crearEjercicio(
    'Pogo Jump Guard Stance',
    'Pliometría / Boxeo',
    'Mejorar reactividad de pies manteniendo guardia y eje de combate.',
    '3x15-20 sec, contacto rápido con el suelo y guardia estable.'
  ),
  crearEjercicio(
    'Lateral Bound + Fighting Stance Stick',
    'Pliometría / Boxeo',
    'Transferir potencia lateral a una posicion de golpe estable.',
    '4x5 por lado, saltar lateral y congelar en guardia.'
  ),
  crearEjercicio(
    'Skater Jump + Slip Reaction',
    'Pliometría / Boxeo',
    'Integrar salto lateral, frenado y defensa de tronco.',
    '3x6 por lado, aterrizar y ejecutar slip controlado.'
  ),
  crearEjercicio(
    'Split Step Rebound',
    'Pliometría / Tenis',
    'Entrenar rebote de preparacion y primera reaccion.',
    '4x6 salidas, caer en split step y salir hacia lado indicado.'
  ),
  crearEjercicio(
    'Crossover Bound + Brake',
    'Pliometría / Tenis',
    'Mejorar cadena cruzada, cambio de dirección y frenado.',
    '4x5 por lado, cruzar, saltar y frenar con control.'
  ),
  crearEjercicio(
    'Drop Jump + First Step',
    'Pliometría / Aceleracion',
    'Reducir tiempo de contacto y mejorar salida explosiva.',
    '3x5, caer bajo control y salir 3-5 metros.'
  ),
  crearEjercicio(
    'HIIT 10/50 Sprint',
    'HIIT / ATP-PC',
    'Desarrollar potencia aláctica con recuperación suficiente.',
    '8-10 rondas: 10 sec máximo + 50 sec pausa.'
  ),
  crearEjercicio(
    'HIIT 30/30 Row Bike Run',
    'HIIT / Oxidativo intenso',
    'Mejorar capacidad de sostener potencia repetida.',
    '10 rondas: 30 sec fuerte + 30 sec suave.'
  ),
  crearEjercicio(
    'HIIT 45/15 Lactico',
    'HIIT / Glucolitico',
    'Entrenar tolerancia a fatiga metabólica manteniendo técnica.',
    '8 rondas: 45 sec trabajo + 15 sec pausa.'
  ),
]

const bibliotecaText = {
  es: {
    title: 'Biblioteca',
    subtitle: 'Metodos PowerFit, ejercicios, ejemplos y material tecnico de apoyo.',
    methods: 'Metodos',
    exercises: 'Ejercicios',
    how: 'Como se ejecuta:',
    measure: 'Como se mide:',
    example: 'Ejemplo',
    search: 'Buscar ejercicio, categoria u objetivo...',
    showing: 'Mostrando',
    of: 'de',
    usedByAi: 'ejercicios usados por la IA.',
    technicalPoints: 'Puntos tecnicos',
    commonErrors: 'Errores comunes',
    classUse: 'Uso en clase',
    videos: 'Ver videos tecnicos',
    empty: 'No encontramos ejercicios con esa busqueda.',
  },
  en: {
    title: 'Library',
    subtitle: 'PowerFit methods, exercises, examples and technical support material.',
    methods: 'Methods',
    exercises: 'Exercises',
    how: 'How to perform:',
    measure: 'How to score:',
    example: 'Example',
    search: 'Search exercise, category or goal...',
    showing: 'Showing',
    of: 'of',
    usedByAi: 'exercises used by the AI.',
    technicalPoints: 'Technical points',
    commonErrors: 'Common errors',
    classUse: 'Class use',
    videos: 'Watch technical videos',
    empty: 'No exercises found for that search.',
  },
}

export default function MetodosPage({ idioma = 'es' }) {
  const [vista, setVista] = useState('metodos')
  const [búsqueda, setBusqueda] = useState('')
  const t = bibliotecaText[idioma] || bibliotecaText.es

  const textoBusqueda = búsqueda.toLowerCase().trim()
  const ejerciciosFiltrados = ejercicios.filter((ejercicio) =>
    [
      ejercicio.nombre,
      ejercicio.categoría,
      ejercicio.objetivo,
      ejercicio.ejemplo,
    ]
      .join(' ')
      .toLowerCase()
      .includes(textoBusqueda)
  )

  return (
    <div className="space-y-6">
      <div className="bg-zinc-900 border border-yellow-500 rounded-2xl sm:rounded-3xl p-4 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl sm:text-4xl font-black text-yellow-400">
              {t.title}
            </h2>
            <p className="text-zinc-400 mt-2">
              Métodos PowerFit, ejercicios, ejemplos y material técnico de apoyo.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:flex gap-3 w-full sm:w-auto">
            <button
              onClick={() => setVista('metodos')}
              className={`px-5 py-3 rounded-2xl font-black ${
                vista === 'metodos' ? 'bg-red-600' : 'bg-zinc-800'
              }`}
            >
              {t.methods}
            </button>
            <button
              onClick={() => setVista('ejercicios')}
              className={`px-5 py-3 rounded-2xl font-black ${
                vista === 'ejercicios' ? 'bg-red-600' : 'bg-zinc-800'
              }`}
            >
              {t.exercises}
            </button>
          </div>
        </div>
      </div>

      {vista === 'metodos' && (
        <div className="grid md:grid-cols-2 gap-4">
          {metodos.map((metodo) => (
            <div key={metodo.nombre} className="bg-zinc-900 border border-zinc-700 p-5 rounded-2xl">
              <h3 className="text-2xl font-black text-red-400">{metodo.nombre}</h3>
              <p className="text-zinc-300 mt-3">{metodo.uso}</p>
              <p className="text-zinc-400 mt-3">
                <strong className="text-yellow-400">Cómo se ejecuta:</strong>{' '}
                {metodo.ejecucion}
              </p>
              <p className="text-zinc-400 mt-3">
                <strong className="text-yellow-400">Cómo se mide:</strong>{' '}
                {metodo.medir}
              </p>
              <div className="bg-black/40 border border-zinc-700 rounded-2xl p-4 mt-4">
                <p className="text-sm text-zinc-500 font-black">{t.example}</p>
                <p className="text-zinc-200 mt-1">{metodo.ejemplo}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {vista === 'ejercicios' && (
        <>
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-4">
            <input
              value={búsqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar ejercicio, categoría o objetivo..."
              className="w-full bg-black p-4 rounded-xl"
            />
            <p className="text-zinc-400 mt-3">
              Mostrando {ejerciciosFiltrados.length} de {ejercicios.length} ejercicios usados por la IA.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
          {ejerciciosFiltrados.map((ejercicio) => (
            <div key={ejercicio.nombre} className="bg-zinc-900 border border-zinc-700 p-5 rounded-2xl">
              <p className="text-sm font-black text-yellow-400">{ejercicio.categoría}</p>
              <h3 className="text-2xl font-black text-red-400 mt-1">{ejercicio.nombre}</h3>
              <p className="text-zinc-300 mt-3">{ejercicio.objetivo}</p>

              <div className="mt-4">
                <p className="font-black text-white">Puntos técnicos</p>
                <ul className="list-disc pl-5 text-zinc-300 mt-2 space-y-1">
                  {ejercicio.tecnica.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>

              <div className="mt-4">
                <p className="font-black text-white">Errores comunes</p>
                <ul className="list-disc pl-5 text-zinc-400 mt-2 space-y-1">
                  {ejercicio.errores.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>

              <div className="bg-black/40 border border-zinc-700 rounded-2xl p-4 mt-4">
                <p className="text-sm text-zinc-500 font-black">Uso en clase</p>
                <p className="text-zinc-200 mt-1">{ejercicio.ejemplo}</p>
              </div>

              <a
                href={ejercicio.youtube}
                target="_blank"
                rel="noreferrer"
                className="inline-flex mt-4 bg-blue-600 hover:bg-blue-700 px-5 py-3 rounded-2xl font-black"
              >
                Ver videos técnicos
              </a>
            </div>
          ))}
          </div>

          {ejerciciosFiltrados.length === 0 && (
            <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 text-zinc-400">
              No encontramos ejercicios con esa búsqueda.
            </div>
          )}
        </>
      )}
    </div>
  )
}
