import { useState } from 'react'

const metodos = [
  {
    nombre: 'ATR',
    uso: 'Ordena el entrenamiento en fases: Acumulacion, Transformacion y Realizacion.',
    ejecucion:
      'Acumulacion crea base y volumen tecnico. Transformacion convierte esa base en potencia y ritmo. Realizacion baja el volumen y sube la precision/intensidad.',
    medir: 'Se controla por fase, carga, volumen semanal, calidad tecnica y respuesta del alumno.',
    ejemplo:
      'Semana 1-2 acumulacion: 65% RM y volumen. Semana 3 transformacion: 75% RM y potencia. Semana 4 realizacion: 85% RM y test controlado.',
  },
  {
    nombre: 'AMRAP',
    uso: 'Aumentar densidad de trabajo en un tiempo fijo.',
    ejecucion:
      'El alumno repite una secuencia durante el tiempo indicado sin perder tecnica. Se permite bajar ritmo, no desordenar el movimiento.',
    medir: 'Rondas completas + repeticiones extra.',
    ejemplo: 'AMRAP 12 MIN: 10 push up, 12 kettlebell swing, 150m run.',
  },
  {
    nombre: 'EMOM',
    uso: 'Controlar ritmo, descanso y consistencia bajo fatiga.',
    ejecucion:
      'Cada minuto inicia una tarea. Lo que sobra del minuto es descanso. Si no termina, se reduce carga o repeticiones.',
    medir: 'Minutos completados, carga usada y calidad tecnica.',
    ejemplo: 'EMOM 10 MIN: minuto impar 8 deadlift, minuto par 10 burpees.',
  },
  {
    nombre: 'E2MOM / E3MOM',
    uso: 'Trabajo tecnico o fuerza con mas recuperacion que un EMOM.',
    ejecucion:
      'Se inicia la tarea cada 2 o 3 minutos. Ideal para levantamientos pesados o complejos tecnicos.',
    medir: 'Carga, series completadas y estabilidad tecnica.',
    ejemplo: 'E2MOM 12 MIN: 5 series de 3 power clean al 75%.',
  },
  {
    nombre: 'TABATA / INTERVALOS',
    uso: 'Mejorar tolerancia al esfuerzo y capacidad anaerobica.',
    ejecucion:
      'Alterna trabajo y pausa. El objetivo es sostener intensidad sin transformar el ejercicio en movimiento desordenado.',
    medir: 'Repeticiones totales o menor ronda realizada.',
    ejemplo: '8 rondas 20/10: air squat. Intervalos 40/20: row + push up.',
  },
  {
    nombre: 'FOR TIME',
    uso: 'Resolver una tarea lo mas rapido posible con estandar tecnico.',
    ejecucion:
      'Se completa el volumen indicado. El cronometro manda, pero la tecnica define si la repeticion cuenta.',
    medir: 'Tiempo final.',
    ejemplo: 'For time: 21-15-9 kettlebell swing y burpees.',
  },
  {
    nombre: 'FOR QUALITY',
    uso: 'Priorizar calidad tecnica, control y aprendizaje.',
    ejecucion:
      'No se compite contra el reloj. Se avanza con pausas, posiciones solidas y ejecucion limpia.',
    medir: 'Carga tecnica, control, rango de movimiento y consistencia.',
    ejemplo: '4 rondas for quality: 8 goblet squat, 8 strict press, 30 sec plank.',
  },
  {
    nombre: 'PIRAMIDAL',
    uso: 'Subir y bajar repeticiones para combinar tecnica, volumen y fatiga controlada.',
    ejecucion:
      'Empieza con pocas repeticiones, sube hasta un pico y vuelve a bajar. La carga debe permitir que la ultima bajada siga limpia.',
    medir: 'Carga usada, calidad en el pico y capacidad de mantener tecnica al volver a bajar.',
    ejemplo: 'Deadlift 1-3-5-7-5-3-1 @60-75%. Descanso 60-90 sec entre escalones.',
  },
  {
    nombre: 'RM / % LOAD',
    uso: 'Asignar cargas segun el maximo o estimacion del alumno.',
    ejecucion:
      'Se usa un porcentaje del RM registrado. Si no existe RM, se trabaja por percepcion de esfuerzo y se registra despues.',
    medir: 'Kilos, porcentaje, reps logradas y RPE.',
    ejemplo: 'Back squat 5x5 @75%. Si el RM es 100 kg, carga sugerida 75 kg.',
  },
  {
    nombre: 'Fighter Conditioning',
    uso: 'Transferir resistencia, coordinacion y potencia a deportes de combate.',
    ejecucion:
      'Combina golpes, desplazamientos, fuerza y cardio corto. Debe parecerse al ritmo real de round.',
    medir: 'Rondas, calidad de guardia, potencia mantenida y recuperacion.',
    ejemplo: '3 rounds: 45 sec heavy bag, 10 burpees, 150m row, 30 sec plank.',
  },
]

function youtubeSearch(nombre) {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(
    `${nombre} technique tutorial`
  )}`
}

function crearEjercicio(nombre, categoria, objetivo, ejemplo) {
  return {
    nombre,
    categoria,
    objetivo,
    tecnica: [
      'Preparar posicion inicial estable antes de comenzar.',
      'Mantener abdomen activo y control del rango de movimiento.',
      'Ejecutar con ritmo constante sin sacrificar tecnica.',
      'Detener o bajar intensidad si aparece dolor o perdida clara de postura.',
    ],
    errores: [
      'Apurarse y perder control.',
      'Compensar con espalda, hombros o rodillas segun el movimiento.',
      'No respetar el estandar tecnico indicado por el coach.',
    ],
    ejemplo,
    youtube: youtubeSearch(nombre),
  }
}

const ejercicios = [
  {
    nombre: 'Deadlift',
    categoria: 'Fuerza',
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
    '4x5 @70% o E2MOM 10 MIN: 3 front squat tecnicos.'
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
    categoria: 'Fuerza',
    objetivo: 'Construir fuerza de piernas, core y estabilidad bajo carga.',
    tecnica: [
      'Barra firme sobre trapecios o posicion low bar segun objetivo.',
      'Rodillas siguen la linea de los pies.',
      'Bajar con control manteniendo torso estable.',
      'Subir empujando el suelo y manteniendo abdomen activo.',
    ],
    errores: ['Colapsar rodillas hacia adentro.', 'Perder profundidad sin razon tecnica.', 'Relajar abdomen abajo.'],
    ejemplo: '5x5 @70-80% o tempo squat 3 segundos bajada.',
    youtube: 'https://www.youtube.com/results?search_query=back+squat+technique+tutorial',
  },
  {
    nombre: 'Power Clean',
    categoria: 'Halterofilia',
    objetivo: 'Desarrollar potencia de cadera, coordinacion y recepcion de barra.',
    tecnica: [
      'Primer tiron controlado desde el suelo.',
      'Extender cadera fuerte antes de tirar con brazos.',
      'Codos rapidos hacia adelante en la recepcion.',
      'Recibir con rodillas flexionadas y torso firme.',
    ],
    errores: ['Tirar con brazos demasiado pronto.', 'Recibir con codos bajos.', 'Saltar hacia adelante.'],
    ejemplo: 'E2MOM 10 MIN: 3 power clean tecnicos @65-75%.',
    youtube: 'https://www.youtube.com/results?search_query=power+clean+technique+tutorial',
  },
  crearEjercicio(
    'Clean Pull',
    'Halterofilia',
    'Mejorar potencia del tiron y extension de cadera sin recepcion.',
    '5x3 clean pull @85-100% del clean tecnico.'
  ),
  crearEjercicio(
    'Power Snatch',
    'Halterofilia',
    'Desarrollar velocidad, coordinacion y recepcion sobre cabeza.',
    'E2MOM 10 MIN: 2-3 power snatch tecnicos.'
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
    'Entrenar extension explosiva y direccion vertical de la barra.',
    '4x5 high pull liviano-moderado.'
  ),
  {
    nombre: 'Push Press',
    categoria: 'Fuerza / Potencia',
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
    categoria: 'Kettlebell',
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
    'Desarrollar potencia, coordinacion y estabilidad sobre cabeza.',
    'AMRAP 10 MIN: 8 kettlebell snatch alternados y 10 air squat.'
  ),
  crearEjercicio(
    'Goblet Squat',
    'Kettlebell',
    'Mejorar patron de sentadilla, postura y fuerza de piernas.',
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
    categoria: 'Peso corporal',
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
    'Activar ritmo cardiovascular y coordinacion general.',
    '2 min jumping jack como entrada en calor.'
  ),
  crearEjercicio(
    'Bear Crawl',
    'Peso corporal',
    'Desarrollar core, hombros y coordinacion cruzada.',
    '4 rondas: 10m bear crawl, 10 push up, 12 air squat.'
  ),
  {
    nombre: 'Heavy Bag',
    categoria: 'Boxeo',
    objetivo: 'Trabajar potencia, ritmo, distancia y acondicionamiento especifico.',
    tecnica: [
      'Mantener guardia despues de cada golpe.',
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
    'Practicar tecnica, defensa, respiracion y desplazamientos sin impacto.',
    '3 rounds de 2 min shadow boxing con foco tecnico.'
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
    'Entrenar combinacion basica, rotacion y retorno a guardia.',
    '5 rounds: 30 sec jab cross, 30 sec desplazamiento.'
  ),
  crearEjercicio(
    'Slip + Counter',
    'Boxeo',
    'Practicar defensa de cintura y contraataque inmediato.',
    '3 rounds: slip + counter cada 3 segundos.'
  ),
  crearEjercicio(
    'Defense + Counter',
    'Boxeo',
    'Integrar bloqueo, esquiva o paso atras con respuesta ofensiva.',
    'Round tecnico: defensa + counter + salida lateral.'
  ),
  crearEjercicio(
    'Uppercut Hook Combo',
    'Boxeo',
    'Trabajar golpes curvos, rotacion y transferencia de peso.',
    'Heavy bag: uppercut-hook-cross por intervalos 30/30.'
  ),
  {
    nombre: 'Plank Hold',
    categoria: 'Core',
    objetivo: 'Mejorar rigidez del tronco y transferencia de fuerza.',
    tecnica: [
      'Codos bajo hombros.',
      'Gluteos activos y costillas abajo.',
      'Cuello neutro.',
      'Respirar sin perder posicion.',
    ],
    errores: ['Cadera hundida.', 'Cadera demasiado alta.', 'Aguantar la respiracion.'],
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
    'Entrenar rotacion controlada y resistencia del tronco.',
    '3x20 russian twist controlados.'
  ),
  crearEjercicio(
    'Dead Bug',
    'Core',
    'Aprender control lumbo-pelvico y estabilidad respirando.',
    '3x10 dead bug por lado como activacion.'
  ),
  crearEjercicio(
    'V-Up',
    'Core',
    'Desarrollar potencia abdominal y coordinacion tronco-piernas.',
    '4 rondas: 12 v-up, 30 sec plank.'
  ),
  crearEjercicio(
    'Run',
    'Cardio',
    'Mejorar resistencia, velocidad y recuperacion entre esfuerzos.',
    'Intervalos: 6x200m con descanso caminando.'
  ),
  crearEjercicio(
    'Bike',
    'Cardio',
    'Elevar trabajo aerobico o intervalico con bajo impacto articular.',
    '10 rounds: 30 sec fuerte / 30 sec suave.'
  ),
  crearEjercicio(
    'Row',
    'Cardio',
    'Trabajar potencia de piernas, traccion y capacidad aerobica.',
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
    'Mejorar ritmo, pies, coordinacion y acondicionamiento.',
    '3 rounds: 1 min jump rope, 10 push up.'
  ),
  crearEjercicio(
    'Shuttle Run',
    'Cardio / Agilidad',
    'Entrenar aceleracion, frenado, cambios de direccion y pulso.',
    '10 rounds: 10m ida/vuelta + 20 sec pausa.'
  ),
  crearEjercicio(
    'Movilidad de cadera + hombros',
    'Movilidad',
    'Preparar rangos utiles para sentadillas, bisagras, golpes y trabajo sobre cabeza.',
    'Activacion: 10 repeticiones controladas antes del bloque principal.'
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
    'Mejorar rotacion toracica y movilidad de tobillo.',
    '10 rotaciones por lado + 10 ankle rocks por lado.'
  ),
]

export default function MetodosPage() {
  const [vista, setVista] = useState('metodos')
  const [busqueda, setBusqueda] = useState('')

  const textoBusqueda = busqueda.toLowerCase().trim()
  const ejerciciosFiltrados = ejercicios.filter((ejercicio) =>
    [
      ejercicio.nombre,
      ejercicio.categoria,
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
              Biblioteca
            </h2>
            <p className="text-zinc-400 mt-2">
              Metodos PowerFit, ejercicios, ejemplos y material tecnico de apoyo.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:flex gap-3 w-full sm:w-auto">
            <button
              onClick={() => setVista('metodos')}
              className={`px-5 py-3 rounded-2xl font-black ${
                vista === 'metodos' ? 'bg-red-600' : 'bg-zinc-800'
              }`}
            >
              Metodos
            </button>
            <button
              onClick={() => setVista('ejercicios')}
              className={`px-5 py-3 rounded-2xl font-black ${
                vista === 'ejercicios' ? 'bg-red-600' : 'bg-zinc-800'
              }`}
            >
              Ejercicios
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
                <strong className="text-yellow-400">Como se ejecuta:</strong>{' '}
                {metodo.ejecucion}
              </p>
              <p className="text-zinc-400 mt-3">
                <strong className="text-yellow-400">Como se mide:</strong>{' '}
                {metodo.medir}
              </p>
              <div className="bg-black/40 border border-zinc-700 rounded-2xl p-4 mt-4">
                <p className="text-sm text-zinc-500 font-black">Ejemplo</p>
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
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar ejercicio, categoria o objetivo..."
              className="w-full bg-black p-4 rounded-xl"
            />
            <p className="text-zinc-400 mt-3">
              Mostrando {ejerciciosFiltrados.length} de {ejercicios.length} ejercicios usados por la IA.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
          {ejerciciosFiltrados.map((ejercicio) => (
            <div key={ejercicio.nombre} className="bg-zinc-900 border border-zinc-700 p-5 rounded-2xl">
              <p className="text-sm font-black text-yellow-400">{ejercicio.categoria}</p>
              <h3 className="text-2xl font-black text-red-400 mt-1">{ejercicio.nombre}</h3>
              <p className="text-zinc-300 mt-3">{ejercicio.objetivo}</p>

              <div className="mt-4">
                <p className="font-black text-white">Puntos tecnicos</p>
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
                Ver videos tecnicos
              </a>
            </div>
          ))}
          </div>

          {ejerciciosFiltrados.length === 0 && (
            <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 text-zinc-400">
              No encontramos ejercicios con esa busqueda.
            </div>
          )}
        </>
      )}
    </div>
  )
}
