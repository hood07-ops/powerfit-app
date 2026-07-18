export const POWERFIT_FOUNDATION_METHODS = [
  {
    nombre: 'Evaluacion inicial PowerFit',
    uso: 'Decidir como comenzar antes de cargar, correr, saltar o exigir intensidad.',
    ejecucion:
      'Se revisan objetivos, experiencia, lesiones, medicamentos, dolor, sueno, estres, equipamiento y disponibilidad. Luego se eligen pruebas que cambien una decision real del programa.',
    medir:
      'Fecha de evaluacion, RPE, dolor 0-10, tecnica, FC cuando corresponda, RM estimado, salto, tiempo, distancia o vueltas segun objetivo.',
    ejemplo:
      'Alumno nuevo: ficha de salud + sentarse/pararse + plancha inclinada + caminata 6 min + RM submaximo solo si domina tecnica.',
  },
  {
    nombre: 'FITT-VP PowerFit',
    uso: 'Ordenar frecuencia, intensidad, tiempo, tipo, volumen y progresion sin improvisar.',
    ejecucion:
      'Primero se define el objetivo y el nivel. Luego se controla cuantas sesiones, que intensidad, cuanto dura, que tipo de trabajo, volumen semanal y como sube la dosis.',
    medir:
      'Sesiones por semana, minutos, series, repeticiones, carga, RPE, recuperacion y cumplimiento.',
    ejemplo:
      'Principiante casa: 3 dias, RPE 3-5, 20-30 min, peso corporal, subir 5-10 min por semana si no hay dolor.',
  },
  {
    nombre: 'Sobrecarga progresiva controlada',
    uso: 'Hacer que el alumno mejore sin romper tecnica ni recuperacion.',
    ejecucion:
      'Se sube una variable a la vez: rango, repeticiones, series, carga, velocidad, densidad o complejidad. Si baja la calidad, se mantiene o descarga.',
    medir:
      'Carga externa, RPE, repeticiones en reserva, dolor a 24-48 horas y rendimiento del mismo ejercicio.',
    ejemplo:
      'Semana 1: 3x8 goblet squat. Semana 2: 3x10. Semana 3: subir carga pequena y volver a 3x8.',
  },
  {
    nombre: 'Autorregulacion RPE/RIR',
    uso: 'Ajustar la sesion segun como llega el alumno ese dia.',
    ejecucion:
      'RPE mide esfuerzo global. RIR estima cuantas repeticiones quedan en reserva. Si el alumno llega fatigado, se baja volumen o intensidad sin perder el objetivo.',
    medir:
      'RPE de bloque, RPE de sesion, RIR en fuerza, sueno, fatiga, dolor y motivacion.',
    ejemplo:
      'Si el plan dice 5x5 al 75% pero el RPE sube a 9 muy rapido, bajar a 70% o hacer 4 series tecnicas.',
  },
  {
    nombre: 'Tecnica antes de intensidad',
    uso: 'Evitar que el cansancio destruya el patron y convierta la rutina en riesgo.',
    ejecucion:
      'Cada ejercicio tiene estandar: postura, rango, respiracion, velocidad y dolor. La serie termina cuando se cumple el objetivo o cuando la tecnica cae.',
    medir:
      'Repeticiones validas, compensaciones, velocidad estable, control de aterrizaje y dolor.',
    ejemplo:
      'En pliometria, cortar la serie si baja la altura, aumenta el ruido de aterrizaje o se pierde alineacion de rodilla.',
  },
  {
    nombre: 'Recuperacion y supercompensacion',
    uso: 'Programar descanso para que el estimulo se transforme en mejora real.',
    ejecucion:
      'Grandes grupos musculares necesitan mas margen entre estimulos fuertes. Los dias cercanos pueden usarse para tecnica, movilidad, aerobia suave o descarga.',
    medir:
      'Rendimiento repetido, dolor, sueno, fatiga, pulso, motivacion y tolerancia articular.',
    ejemplo:
      'Piernas pesadas lunes: no repetir fuerza fuerte de piernas antes de 72 h; usar movilidad, tecnica o zona 2.',
  },
  {
    nombre: 'Bioenergetica aplicada',
    uso: 'Elegir el sistema energetico correcto para boxeo, tenis, fuerza, salud o perdida de grasa.',
    ejecucion:
      'ATP-PC para acciones maximas cortas con descanso amplio; glucolitico para esfuerzos intensos repetidos; oxidativo para base, salud y recuperacion entre acciones.',
    medir:
      'Duracion del esfuerzo, pausa, potencia mantenida, caida de rendimiento, FC, RPE y recuperacion.',
    ejemplo:
      'Boxeo: 8x10 sec maximo/50 sec pausa para potencia alactica; 6x2 min para potencia aerobica especifica.',
  },
  {
    nombre: 'Semaforo de dolor',
    uso: 'Tomar decisiones seguras durante ejercicios, pruebas y progresiones.',
    ejecucion:
      'Verde 0-2/10: continuar. Amarillo 3-5/10 o rigidez persistente: ajustar. Rojo: dolor agudo, inestabilidad, sintomas neurologicos o inflamacion: detener y derivar.',
    medir:
      'Dolor durante, despues y a 24-48 horas; funcion, inflamacion, seguridad y confianza.',
    ejemplo:
      'Rodilla 4/10 en zancada: reducir rango, cambiar a sentadilla a silla y reevaluar al dia siguiente.',
  },
]

const OBJETIVO_NOTAS = {
  fighter: [
    'Transferencia a combate: fuerza util, golpeo, cambios de nivel, footwork y recuperacion entre acciones explosivas.',
    'Prioridad tecnica: secuencia suelo-cadera-tronco-hombro-puno, guardia estable y rotacion sin perder eje.',
  ],
  tenis: [
    'Transferencia a tenis: split step, primer paso, frenado lateral y potencia rotacional cadera-hombro.',
    'Prioridad tecnica: efecto serape, cadena cruzada, oblicuo-serrato y golpeo con control de desaceleracion.',
  ],
  casa_principiante: [
    'Inicio seguro: bajo impacto, ejercicios sin material, pausas completas y adherencia antes que intensidad.',
    'Prioridad tecnica: respirar, controlar rango, moverse sin dolor y construir confianza semanal.',
  ],
  fuerza: [
    'Fuerza funcional: patrones grandes, rango controlado, carga progresiva y transferencia a movimiento real.',
    'Prioridad tecnica: levantar con postura estable, velocidad intencional y control de fatiga.',
  ],
  perdida_grasa: [
    'Perdida de grasa responsable: fuerza para preservar masa muscular, volumen sostenible y acondicionamiento medible.',
    'Prioridad tecnica: densidad sin desorden, RPE controlado y adherencia semanal.',
  ],
  cardio: [
    'Cardio inteligente: base oxidativa, intervalos segun nivel y recuperacion entre esfuerzos.',
    'Prioridad tecnica: intensidad guiada por RPE, prueba del habla, ritmo y recuperacion.',
  ],
}

const FASE_NOTAS = {
  acumulacion: [
    'ATR acumulacion: base tecnica, volumen tolerable, movilidad, fuerza submaxima y sistema oxidativo.',
    'No buscar fatiga extrema. La progresion se gana por consistencia y calidad repetible.',
  ],
  transformacion: [
    'ATR transformacion: convertir la base en potencia, densidad, ritmo y transferencia deportiva.',
    'Desde esta fase entran pliometricos de baja dosis y alta calidad si el alumno controla aterrizaje y frenado.',
  ],
  realizacion: [
    'ATR realizacion: intensidad precisa, velocidad, potencia alactica y reduccion de volumen innecesario.',
    'Se corta antes de perder velocidad o tecnica. El objetivo es rendimiento, no cansancio por cansancio.',
  ],
}

const NIVEL_NOTAS = {
  basico: [
    'Nivel basico: usar RPE 3-6, progresar una variable por vez y priorizar aprendizaje tecnico.',
  ],
  principiante: [
    'Nivel principiante: usar RPE 3-6, progresar una variable por vez y priorizar aprendizaje tecnico.',
  ],
  intermedio: [
    'Nivel intermedio: usar RPE 5-8, alternar dias fuertes/suaves y registrar carga interna y externa.',
  ],
  avanzado: [
    'Nivel avanzado: usar RPE 6-9 en bloques clave, descansos completos para potencia y descargas planificadas.',
  ],
}

export function buildFundamentosPowerFit({ objetivo, faseATR, nivel }) {
  return [
    'Fundamentos integrados del Manual PowerFit 2026:',
    ...(OBJETIVO_NOTAS[objetivo] || OBJETIVO_NOTAS.fuerza),
    ...(FASE_NOTAS[faseATR] || FASE_NOTAS.acumulacion),
    ...(NIVEL_NOTAS[nivel] || NIVEL_NOTAS.intermedio),
    'Regla de seguridad: tecnica antes de intensidad; dolor rojo o sintomas de alarma detienen la sesion.',
    'Registro minimo: fecha, trabajo realizado, carga externa, RPE, dolor, resultado y proxima decision.',
  ]
}

export function buildConstructorFundamentos({ objective, macro, phase, level }) {
  const objetivoMap = {
    boxeo: 'fighter',
    tenis: 'tenis',
    fuerza_funcional: 'fuerza',
    acondicionamiento: 'cardio',
    casa_principiante: 'casa_principiante',
  }

  const macroNotes = {
    base_transversal:
      'Macro base transversal: diagonales, estabilidad, movilidad y patrones completos antes de potencia.',
    potencia_rotacional:
      'Macro potencia rotacional: fase concentrica explosiva, efecto serape y transferencia cadera-hombro.',
    resistencia_metabolica:
      'Macro resistencia metabolica: elegir sistema ATP-PC, glucolitico u oxidativo segun duracion y pausa.',
    retorno_progresivo:
      'Macro retorno progresivo: semaforo de dolor, baja dosis y control de respuesta a 24-48 h.',
    evaluacion_inicial:
      'Macro evaluacion inicial: medir solo pruebas que cambien la programacion y dejar linea base fechada.',
    sobrecarga_controlada:
      'Macro sobrecarga controlada: subir una variable por vez y descargar si cae tecnica o recuperacion.',
    salud_adherencia:
      'Macro salud/adherencia: version minima cumplible, bajo impacto y progreso por consistencia.',
  }

  return [
    ...buildFundamentosPowerFit({
      objetivo: objetivoMap[objective] || objective,
      faseATR: phase,
      nivel: level,
    }),
    macroNotes[macro] || macroNotes.base_transversal,
  ]
}
