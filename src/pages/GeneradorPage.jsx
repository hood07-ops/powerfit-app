import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import { generarEntrenamiento, generarPlanMensual } from './workoutSystem'

const ADMIN_WHATSAPP = '56988497852'
const TRAMOS_GENERACION = [
  { desde: 0, hasta: 3, precio: 2500, nombre: 'Inicio PowerFit', cupos: 4 },
  { desde: 4, hasta: 13, precio: 5000, nombre: 'Progreso PowerFit', cupos: 10 },
  { desde: 14, hasta: Infinity, precio: 7500, nombre: 'Continuo PowerFit', cupos: null },
]
const PRECIO_PLAN_MENSUAL = 60000
const GENERADOR_TEXT = {
  es: {
    title: 'GENERADOR POWERFIT IA',
    available: 'Generaciones disponibles',
    visibleThisMonth: 'Planificaciones visibles este mes',
    pricesTitle: 'PRECIOS Y TIPO DE GENERACION',
    session: 'Sesion IA - usa 1 generacion',
    monthly: 'Plan mensual ATR - $60.000',
    generateMonthly: 'GENERAR PLAN MENSUAL',
    generateOne: 'GENERAR 1 PLANIFICACION',
    generating: 'GENERANDO...',
    noAvailable: 'SIN PLANIFICACIONES DISPONIBLES',
    buyOne: 'COMPRAR 1 GENERACION',
    requestMonthly: 'SOLICITAR PLAN MENSUAL',
  },
  en: {
    title: 'POWERFIT AI GENERATOR',
    available: 'Available generations',
    visibleThisMonth: 'Plans visible this month',
    pricesTitle: 'PRICES AND GENERATION TYPE',
    session: 'AI session - uses 1 generation',
    monthly: 'Monthly ATR plan - $60,000',
    generateMonthly: 'GENERATE MONTHLY PLAN',
    generateOne: 'GENERATE 1 PLAN',
    generating: 'GENERATING...',
    noAvailable: 'NO PLANS AVAILABLE',
    buyOne: 'BUY 1 GENERATION',
    requestMonthly: 'REQUEST MONTHLY PLAN',
  },
}

const RM_EJERCICIOS = [
  'Back Squat',
  'Front Squat',
  'Deadlift',
  'Bench Press',
  'Push Press',
  'Strict Press',
  'Barbell Row',
  'Power Clean',
  'Clean Pull',
  'Power Snatch',
  'Push Jerk',
  'Thruster',
  'Hang Power Clean',
  'High Pull',
]

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

function descargarWord(contenido, nombreAlumno) {
  const contenidoCorregido = corregirNombresPowerFit(contenido)
  const html = `
      <html>
        <head><meta charset="utf-8" /></head>
        <body>
          <pre style="font-family: Arial; font-size: 14px; white-space: pre-wrap;">
${escapeHtml(contenidoCorregido)}
          </pre>
        </body>
      </html>
    `

  const blob = new Blob([html], { type: 'application/msword;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')

  a.href = url
  a.download = `PowerFit-${nombreAlumno || 'alumno'}-${Date.now()}.doc`
  a.click()

  URL.revokeObjectURL(url)
}

function celdaExcel(value) {
  return escapeHtml(value || '')
}

function extraerCarga(texto) {
  const match = String(texto).match(/carga sugerida:\s*([^-]+)/i)
  return match ? match[1].trim() : ''
}

function extraerDetallesTrabajo(texto) {
  const trabajo = String(texto || '')
  const partes = trabajo.split(' - ')
  const esFuerza = trabajo.toLowerCase().includes('carga sugerida:')
  const seriesMatch = trabajo.match(/-\s*([0-9]+x[0-9]+)/)
  const porcentajeMatch = trabajo.match(/@([0-9]+)%/)
  const descansoMatch = trabajo.match(/descanso\s*([^|]+)/i)
  const esContraste = trabajo.toLowerCase().startsWith('contraste entre series:')

  return {
    ejercicio: esFuerza ? partes[0].replace(' funcional', '').trim() : '',
    series: seriesMatch ? seriesMatch[1] : '',
    porcentaje: porcentajeMatch ? `${porcentajeMatch[1]}%` : '',
    descanso: descansoMatch ? descansoMatch[1].trim() : '',
    carga: extraerCarga(trabajo),
    contraste: esContraste ? trabajo.replace(/contraste entre series:\s*/i, '').trim() : '',
  }
}

function nombreArchivoSeguro(value) {
  return String(value || 'alumno')
    .trim()
    .replace(/[\\/:*?"<>|]+/g, '-')
    .replace(/\s+/g, '-')
}

function corregirNombresPowerFit(texto) {
  return String(texto || '')
    .replace(/\bARMP\b/gi, 'AMRAP')
    .replace(/\bARMAP\b/gi, 'AMRAP')
}

function parsearPlanMensualExcel(contenido, nombreAlumno) {
  const filas = []
  const estado = {
    semana: '',
    fase: '',
    dia: '',
    sesion: '',
    metodo: '',
    foco: '',
    bloque: '',
  }

  String(contenido)
    .split(/\r?\n/)
    .map((linea) => linea.trim())
    .filter(Boolean)
    .forEach((linea) => {
      const semanaMatch = linea.match(/^SEMANA\s+(\d+)\s+-\s+ATR\s+(.+)$/i)
      if (semanaMatch) {
        estado.semana = `Semana ${semanaMatch[1]}`
        estado.fase = semanaMatch[2]
        estado.dia = ''
        estado.sesion = ''
        estado.metodo = ''
        estado.foco = ''
        estado.bloque = ''
        return
      }

      const diaMatch = linea.match(/^D[ií]a\s+(\d+)\s+-\s+(.+)$/i)
      if (diaMatch) {
        estado.dia = `Día ${diaMatch[1]}`
        estado.sesion = diaMatch[2]
        estado.metodo = ''
        estado.foco = ''
        estado.bloque = ''
        return
      }

      const metodoMatch = linea.match(/^M[eé]todo PowerFit:\s*(.+)$/i)
      if (metodoMatch) {
        estado.metodo = metodoMatch[1].trim()
        return
      }

      if (linea.startsWith('Foco:')) {
        estado.foco = linea.replace('Foco:', '').trim()
        return
      }

      if (
        linea === 'ACTIVACION' ||
        linea === 'ACTIVACIÓN' ||
        linea.startsWith('BLOQUE 1') ||
        linea.startsWith('BLOQUE 2') ||
        linea.startsWith('BLOQUE 3')
      ) {
        estado.bloque = linea
        return
      }

      if (linea.startsWith('- ') && estado.bloque) {
        const trabajo = linea.slice(2)
        const detalles = extraerDetallesTrabajo(trabajo)
        filas.push({
          alumno: nombreAlumno || '',
          semana: estado.semana,
          fase: estado.fase,
          dia: estado.dia,
          sesion: estado.sesion,
          bloque: estado.bloque,
          metodo: estado.metodo,
          foco: estado.foco,
          trabajo,
          ejercicio: detalles.ejercicio,
          series: detalles.series,
          porcentaje: detalles.porcentaje,
          carga: detalles.carga,
          descanso: detalles.descanso,
          contraste: detalles.contraste,
          sistema: estado.bloque.startsWith('BLOQUE 3') ? trabajo : '',
          notas: '',
          rpe: '',
          resultado: '',
          observaciones: '',
        })
        return
      }

      if (linea.startsWith('Notas:')) {
        filas.push({
          alumno: nombreAlumno || '',
          semana: estado.semana,
          fase: estado.fase,
          dia: estado.dia,
          sesion: estado.sesion,
          bloque: 'NOTAS',
          metodo: estado.metodo,
          foco: estado.foco,
          trabajo: '',
          ejercicio: '',
          series: '',
          porcentaje: '',
          carga: '',
          descanso: '',
          contraste: '',
          sistema: '',
          notas: linea.replace('Notas:', '').trim(),
          rpe: '',
          resultado: '',
          observaciones: '',
        })
      }
    })

  return filas
}

function descargarExcelMensual(contenido, nombreAlumno) {
  const filas = parsearPlanMensualExcel(corregirNombresPowerFit(contenido), nombreAlumno)
  const columnas = [
    'Alumno',
    'Semana',
    'Fase ATR',
    'Día',
    'Sesión',
    'Bloque',
    'Método',
    'Foco',
    'Trabajo / Ejercicio',
    'Ejercicio base',
    'Series/Reps',
    '%RM',
    'Carga sugerida',
    'Descanso',
    'Contraste / transferencia',
    'Sistema metabólico',
    'Notas',
    'RPE',
    'Resultado',
    'Observaciones',
  ]

  const cuerpo = filas
    .map(
      (fila) => `
        <tr>
          <td>${celdaExcel(fila.alumno)}</td>
          <td>${celdaExcel(fila.semana)}</td>
          <td>${celdaExcel(fila.fase)}</td>
          <td>${celdaExcel(fila.dia)}</td>
          <td>${celdaExcel(fila.sesion)}</td>
          <td>${celdaExcel(fila.bloque)}</td>
          <td>${celdaExcel(fila.metodo)}</td>
          <td>${celdaExcel(fila.foco)}</td>
          <td>${celdaExcel(fila.trabajo)}</td>
          <td>${celdaExcel(fila.ejercicio)}</td>
          <td>${celdaExcel(fila.series)}</td>
          <td>${celdaExcel(fila.porcentaje)}</td>
          <td>${celdaExcel(fila.carga)}</td>
          <td>${celdaExcel(fila.descanso)}</td>
          <td>${celdaExcel(fila.contraste)}</td>
          <td>${celdaExcel(fila.sistema)}</td>
          <td>${celdaExcel(fila.notas)}</td>
          <td>${celdaExcel(fila.rpe)}</td>
          <td>${celdaExcel(fila.resultado)}</td>
          <td>${celdaExcel(fila.observaciones)}</td>
        </tr>`
    )
    .join('')

  const html = `
    <html>
      <head>
        <meta charset="utf-8" />
        <style>
          table { border-collapse: collapse; font-family: Arial; font-size: 12px; }
          th { background: #111827; color: #ffffff; font-weight: 700; }
          th, td { border: 1px solid #999999; padding: 8px; vertical-align: top; }
          tr:nth-child(even) { background: #f3f4f6; }
          td { mso-number-format: "\\@"; }
        </style>
      </head>
      <body>
        <table>
          <thead>
            <tr>${columnas.map((columna) => `<th>${celdaExcel(columna)}</th>`).join('')}</tr>
          </thead>
          <tbody>${cuerpo}</tbody>
        </table>
      </body>
    </html>
  `

  const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')

  a.href = url
  a.download = `PowerFit-Mensual-${nombreArchivoSeguro(nombreAlumno)}-${Date.now()}.xls`
  a.click()

  URL.revokeObjectURL(url)
}

function esPlanMensual(plan) {
  return (
    String(plan?.objetivo || '').toLowerCase().includes('mensual') ||
    String(plan?.contenido || '').toLowerCase().includes('plan mensual ia')
  )
}

function agruparPlanMensualVista(contenido, nombreAlumno) {
  const filas = parsearPlanMensualExcel(contenido, nombreAlumno)

  return filas.reduce((semanas, fila) => {
    const semanaKey = `${fila.semana || 'Semana'} - ${fila.fase || 'ATR'}`
    const diaKey = `${fila.dia || 'Día'} - ${fila.sesion || 'Sesión'}`
    const bloqueKey = fila.bloque || 'Bloque'

    if (!semanas[semanaKey]) {
      semanas[semanaKey] = {}
    }

    if (!semanas[semanaKey][diaKey]) {
      semanas[semanaKey][diaKey] = {}
    }

    if (!semanas[semanaKey][diaKey][bloqueKey]) {
      semanas[semanaKey][diaKey][bloqueKey] = []
    }

    semanas[semanaKey][diaKey][bloqueKey].push(fila)
    return semanas
  }, {})
}

function VistaPlanMensual({ plan, nombreAlumno }) {
  const semanas = agruparPlanMensualVista(plan.contenido, nombreAlumno)

  return (
    <div className="space-y-5">
      {Object.entries(semanas).map(([semana, dias]) => (
        <section
          key={semana}
          className="border border-yellow-600 rounded-2xl overflow-hidden bg-zinc-950"
        >
          <div className="bg-yellow-500 text-black px-4 py-3 font-black">
            {semana}
          </div>

          <div className="p-3 sm:p-4 space-y-4">
            {Object.entries(dias).map(([dia, bloques]) => (
              <div
                key={dia}
                className="border border-zinc-700 rounded-2xl p-3 sm:p-4 bg-zinc-900"
              >
                <h3 className="text-lg sm:text-xl font-black text-red-400">
                  {dia}
                </h3>

                <div className="grid lg:grid-cols-2 gap-3 mt-3">
                  {Object.entries(bloques).map(([bloque, trabajos]) => (
                    <div
                      key={bloque}
                      className="border border-zinc-700 rounded-xl p-3 bg-zinc-800"
                    >
                      <p className="font-black text-blue-300 mb-2">
                        {bloque}
                      </p>

                      <div className="space-y-2">
                        {trabajos.map((trabajo, index) => (
                          <div
                            key={`${bloque}-${index}`}
                            className="bg-zinc-900 rounded-xl p-3 text-sm"
                          >
                            {trabajo.trabajo && (
                              <p className="font-black text-white">
                                {trabajo.trabajo}
                              </p>
                            )}

                            {trabajo.notas && (
                              <p className="text-yellow-200">
                                {trabajo.notas}
                              </p>
                            )}

                            {(trabajo.ejercicio ||
                              trabajo.series ||
                              trabajo.porcentaje ||
                              trabajo.carga ||
                              trabajo.descanso) && (
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2 text-xs">
                                {trabajo.ejercicio && (
                                  <span className="bg-zinc-800 rounded-lg p-2">
                                    Ejercicio: {trabajo.ejercicio}
                                  </span>
                                )}
                                {trabajo.series && (
                                  <span className="bg-zinc-800 rounded-lg p-2">
                                    Series: {trabajo.series}
                                  </span>
                                )}
                                {trabajo.porcentaje && (
                                  <span className="bg-zinc-800 rounded-lg p-2">
                                    RM: {trabajo.porcentaje}
                                  </span>
                                )}
                                {trabajo.carga && (
                                  <span className="bg-zinc-800 rounded-lg p-2">
                                    Carga: {trabajo.carga}
                                  </span>
                                )}
                                {trabajo.descanso && (
                                  <span className="bg-zinc-800 rounded-lg p-2">
                                    Descanso: {trabajo.descanso}
                                  </span>
                                )}
                              </div>
                            )}

                            {trabajo.contraste && (
                              <p className="text-green-300 mt-2">
                                Transferencia: {trabajo.contraste}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}

export default function GeneradorPage({ student, onUpdateStudent, idioma = 'es' }) {
  const [tipoPlan, setTipoPlan] = useState('sesion')
  const [objetivo, setObjetivo] = useState('fighter')
  const [nivel, setNivel] = useState('intermedio')
  const [faseATR, setFaseATR] = useState('acumulacion')
  const [usarCicloMenstrual, setUsarCicloMenstrual] = useState(false)
  const [faseMenstrual, setFaseMenstrual] = useState('folicular')
  const [rms, setRms] = useState([])
  const [rmForm, setRmForm] = useState({
    ejercicio: RM_EJERCICIOS[0],
    rm_kg: '',
  })
  const [planificaciones, setPlanificaciones] = useState([])
  const [planAbierto, setPlanAbierto] = useState(null)
  const [mensaje, setMensaje] = useState('')
  const [disponiblesLocal, setDisponiblesLocal] = useState(0)
  const [generacionesCompradas, setGeneracionesCompradas] = useState(0)
  const [planesMensualesComprados, setPlanesMensualesComprados] = useState(0)
  const [generando, setGenerando] = useState(false)
  const [guardandoRM, setGuardandoRM] = useState(false)
  const t = GENERADOR_TEXT[idioma] || GENERADOR_TEXT.es

  const tramoActual =
    TRAMOS_GENERACION.find(
      (tramo) =>
        generacionesCompradas >= tramo.desde &&
        generacionesCompradas <= tramo.hasta
    ) || TRAMOS_GENERACION[TRAMOS_GENERACION.length - 1]
  const restantesTramoActual = Number.isFinite(tramoActual.hasta)
    ? Math.max(0, tramoActual.hasta - generacionesCompradas + 1)
    : null
  const planesMensualesUsados = planificaciones.filter((plan) =>
    esPlanMensual(plan)
  ).length
  const planesMensualesDisponibles = Math.max(
    0,
    planesMensualesComprados - planesMensualesUsados
  )
  const generacionesDisponibles = Number(
    disponiblesLocal || student?.generaciones_disponibles || 0
  )

  async function cargarRM() {
    if (!student?.id) {
      setRms([])
      return
    }

    const { data, error } = await supabase
      .from('rm_alumnos')
      .select('*')
      .eq('alumno_id', student.id)

    if (error) {
      setMensaje(`Error cargando RM: ${error.message}`)
      setRms([])
      return
    }

    setRms(data || [])
  }

  async function cargarPlanificacionesMes() {
    if (!student?.id) {
      setPlanificaciones([])
      return
    }

    await eliminarPlanificacionesVencidas()

    const hoy = new Date()
    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString()
    const finMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 1).toISOString()

    const { data, error } = await supabase
      .from('planificaciones_generadas')
      .select('*')
      .eq('alumno_id', student.id)
      .gte('created_at', inicioMes)
      .lt('created_at', finMes)
      .order('created_at', { ascending: false })

    if (error) {
      setMensaje(`Error cargando planificaciones: ${error.message}`)
      setPlanificaciones([])
      return
    }

    setPlanificaciones(data || [])
  }

  async function cargarComprasAprobadas() {
    if (!student?.id) {
      setGeneracionesCompradas(0)
      setPlanesMensualesComprados(0)
      return
    }

    const { data, error } = await supabase
      .from('solicitudes_compra')
      .select('generaciones,monto')
      .eq('alumno_id', student.id)
      .eq('estado', 'Aprobado')

    if (error) {
      setGeneracionesCompradas(0)
      setPlanesMensualesComprados(0)
      return
    }

    const totalGeneraciones = (data || [])
      .filter((compra) => Number(compra.monto || 0) !== PRECIO_PLAN_MENSUAL)
      .reduce((total, compra) => total + Number(compra.generaciones ?? 1), 0)
    const totalMensuales = (data || []).filter(
      (compra) => Number(compra.monto || 0) === PRECIO_PLAN_MENSUAL
    ).length

    setGeneracionesCompradas(totalGeneraciones)
    setPlanesMensualesComprados(totalMensuales)
  }

  async function eliminarPlanificacionesVencidas() {
    if (!student?.id) return

    const limite = new Date()
    limite.setMonth(limite.getMonth() - 1)

    await supabase
      .from('planificaciones_generadas')
      .delete()
      .eq('alumno_id', student.id)
      .lt('created_at', limite.toISOString())
  }

  async function refrescarGeneraciones() {
    const fallback = Number(student?.generaciones_disponibles || disponiblesLocal || 0)
    if (!student?.id) return fallback

    const { data, error } = await supabase
      .from('alumnos')
      .select('generaciones_disponibles')
      .eq('id', student.id)
      .single()

    if (error) {
      setMensaje(`Error actualizando generaciones: ${error.message}`)
      setDisponiblesLocal(fallback)
      return fallback
    }

    const disponibles = Number(data?.generaciones_disponibles ?? fallback)
    setDisponiblesLocal(disponibles)
    return disponibles
  }

  useEffect(() => {
    Promise.resolve().then(() => {
      cargarRM()
      cargarPlanificacionesMes()
      cargarComprasAprobadas()
      setDisponiblesLocal(Number(student?.generaciones_disponibles || 0))
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [student?.id, student?.generaciones_disponibles])

  useEffect(() => {
    const intervalo = setInterval(() => {
      refrescarGeneraciones()
    }, 30000)

    return () => clearInterval(intervalo)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [student?.id])

  function textoPlan(p, numero) {
    if (p.tipo === 'mensual') {
      return `
POWERFIT 360
PLANIFICACIÓN MENSUAL ${numero}

Fecha: ${new Date().toLocaleString()}
Alumno: ${student?.nombre || ''}

${p.contenido}
`
    }

    const activacion = p.activacion || p['activación'] || {
      metodo: 'MOVILIDAD + PULSO SUAVE',
      ejercicios: ['movilidad general 5 min', 'respiracion controlada', 'marcha suave'],
    }
    const bloque1 = p.bloque1 || {
      metodo: 'CIRCUITO TECNICO',
      duracion: '10 min',
      ejercicios: ['trabajo tecnico controlado'],
    }
    const bloque2 = p.bloque2 || {
      metodo: 'FUERZA FUNCIONAL',
      duracion: '10 min',
      ejercicios: ['fuerza funcional adaptada'],
    }
    const bloque3 = p.bloque3 || {
      metodo: 'SISTEMA METABOLICO SUAVE',
      duracion: '8 min',
      ejercicios: ['acondicionamiento de baja intensidad'],
    }
    const explicarMetodo = (metodo) => {
      const texto = String(metodo || '')

      if (/^RAMP\b/i.test(texto) && !/subir temperatura/i.test(texto)) {
        return `${texto} - subir temperatura, activar musculos clave, movilizar articulaciones y potenciar el gesto del entrenamiento`
      }

      return texto
    }

    return `
POWERFIT 360
PLANIFICACIÓN ${numero}

Fecha: ${new Date().toLocaleString()}
Alumno: ${student?.nombre || ''}
Objetivo: ${p.objetivo}
Nivel: ${p.nivel}
Fase ATR: ${p.faseATR}
Intensidad: ${p.intensidad}
Sistema metabólico: ${p.sistemaMetabolico || 'No especificado'}
Variante: ${p.variante}
${p.motorTransversal ? `
MOTOR TRANSVERSAL
${p.motorTransversal.map((e) => `- ${e}`).join('\n')}
` : ''}
${p.cicloMenstrual ? `
CICLO MENSTRUAL - AJUSTE ORIENTATIVO
Fase: ${p.cicloMenstrual.label}
Ajuste carga: ${p.cicloMenstrual.ajusteCarga}
Porcentaje ATR base: ${p.cicloMenstrual.porcentajeBase}
Porcentaje aplicado: ${p.cicloMenstrual.porcentajeAplicado}
Foco: ${p.cicloMenstrual.foco}
Recomendación: ${p.cicloMenstrual.recomendacion}
Nota: si hay dolor, mareos o malestar importante, reducir intensidad y consultar a un profesional.
` : ''}

ACTIVACIÓN
Método: ${explicarMetodo(activacion.metodo)}
${activacion.ejercicios.map((e) => `- ${e}`).join('\n')}

BLOQUE 1
Método: ${explicarMetodo(bloque1.metodo)}
Duración: ${bloque1.duracion}
${bloque1.ejercicios.map((e) => `- ${e}`).join('\n')}

DESCANSO: 2 MIN

BLOQUE 2 - FUERZA / RM INTELIGENTE
Método: ${explicarMetodo(bloque2.metodo)}
Duración: ${bloque2.duracion}
${bloque2.ejercicios.map((e) => `- ${e}`).join('\n')}

DESCANSO: 2 MIN

BLOQUE 3
Método: ${explicarMetodo(bloque3.metodo)}
Duración: ${bloque3.duracion}
${bloque3.ejercicios.map((e) => `- ${e}`).join('\n')}

Vuelta a la calma: dirigida en clase.
`
  }

  async function borrarPlanesInsertados(planes) {
    const ids = planes.map((plan) => plan.id).filter(Boolean)
    if (ids.length === 0) return

    await supabase.from('planificaciones_generadas').delete().in('id', ids)
  }

  async function guardarRM() {
    if (!student?.id || guardandoRM) return

    const rmKg = Number(rmForm.rm_kg)
    if (!rmForm.ejercicio || !rmKg || rmKg <= 0) {
      setMensaje('Ingresa un ejercicio y un RM valido en kg.')
      return
    }

    setGuardandoRM(true)
    setMensaje('')

    try {
      const { data: existente, error: buscarError } = await supabase
        .from('rm_alumnos')
        .select('id')
        .eq('alumno_id', student.id)
        .eq('ejercicio', rmForm.ejercicio)
        .maybeSingle()

      if (buscarError) {
        setMensaje(`Error buscando RM: ${buscarError.message}`)
        return
      }

      const payload = {
        user_id: student.user_id,
        alumno_id: student.id,
        ejercicio: rmForm.ejercicio,
        rm_kg: rmKg,
      }

      const { error } = existente?.id
        ? await supabase.from('rm_alumnos').update(payload).eq('id', existente.id)
        : await supabase.from('rm_alumnos').insert([payload])

      if (error) {
        setMensaje(`Error guardando RM: ${error.message}`)
        return
      }

      setRmForm((prev) => ({ ...prev, rm_kg: '' }))
      setMensaje(`RM guardado: ${rmForm.ejercicio} ${rmKg} kg.`)
      await cargarRM()
    } finally {
      setGuardandoRM(false)
    }
  }

  async function generar() {
    if (!student || generando) return

    setGenerando(true)
    setMensaje('')

    try {
      const disponiblesRefrescados = await refrescarGeneraciones()
      const disponibles = Math.max(
        Number(disponiblesRefrescados || 0),
        Number(disponiblesLocal || 0),
        Number(student?.generaciones_disponibles || 0)
      )
      const cantidadFinal =
        tipoPlan === 'mensual'
          ? planesMensualesDisponibles > 0
            ? 0
            : -1
          : disponibles >= 1
            ? 1
            : 0

      if (cantidadFinal < 0 || (tipoPlan !== 'mensual' && cantidadFinal <= 0)) {
        setMensaje(
          tipoPlan === 'mensual'
            ? `El plan mensual completo cuesta $${PRECIO_PLAN_MENSUAL.toLocaleString('es-CL')}. Solicita la planificación mensual para continuar.`
            : `No tienes generaciones disponibles. La siguiente generación cuesta $${tramoActual.precio.toLocaleString('es-CL')}.`
        )
        return
      }

      const plan =
        tipoPlan === 'mensual'
          ? generarPlanMensual({
              objetivo,
              nivel,
              rms,
              faseMenstrual: usarCicloMenstrual ? faseMenstrual : null,
            })
          : generarEntrenamiento({
              objetivo,
              nivel,
              faseATR,
              rms,
              faseMenstrual: usarCicloMenstrual ? faseMenstrual : null,
              historial: planificaciones.map((p) => p.contenido),
            })

      const contenidoGenerado = corregirNombresPowerFit(textoPlan(plan, planificaciones.length + 1))
      const planPayload = {
        user_id: student.user_id,
        alumno_id: student.id,
        nombre_alumno: student.nombre,
        objetivo: tipoPlan === 'mensual' ? `Plan mensual ${objetivo}` : objetivo,
        nivel,
        contenido: contenidoGenerado,
      }

      const planLocal = {
        ...planPayload,
        id: `local-${student.id}-${planificaciones.length + 1}`,
        created_at: new Date().toISOString(),
      }

      if (tipoPlan === 'mensual') {
        descargarExcelMensual(contenidoGenerado, student.nombre)
      } else {
        descargarWord(contenidoGenerado, student.nombre)
      }

      setPlanificaciones((actuales) => [planLocal, ...actuales])
      setMensaje(
        tipoPlan === 'mensual'
          ? 'Plan mensual generado y descargado. Guardando historial...'
          : '1 planificacion generada y descargada. Guardando historial...'
      )

      const { data: nuevosPlanes, error: insertError } = await supabase
        .from('planificaciones_generadas')
        .insert([planPayload])
        .select()

      if (nuevosPlanes?.[0]) {
        setPlanificaciones((actuales) => [
          nuevosPlanes[0],
          ...actuales.filter((planItem) => planItem.id !== planLocal.id),
        ])
      }

      if (insertError && !contenidoGenerado) {
        setMensaje(`Error guardando planificación: ${insertError.message}`)
        return
      }

      let disponiblesRestantes = disponibles

      if (cantidadFinal > 0) {
        const { data: alumnoActualizado, error: updateError } = await supabase
          .from('alumnos')
          .update({
            generaciones_disponibles: Math.max(0, disponibles - cantidadFinal),
          })
          .eq('id', student.id)
          .select('generaciones_disponibles')

        if (updateError || !alumnoActualizado?.length) {
          await borrarPlanesInsertados(nuevosPlanes || [])
          setMensaje(
            updateError
              ? `Rutina generada. No se pudo descontar la generacion: ${updateError.message}`
              : 'Rutina generada. No se pudo descontar la generacion disponible.'
          )
          onUpdateStudent?.()
          return
        }

        disponiblesRestantes = Number(
          alumnoActualizado[0]?.generaciones_disponibles || 0
        )
      }

      setDisponiblesLocal(disponiblesRestantes)
      setMensaje(
        tipoPlan === 'mensual'
          ? 'Plan mensual generado, guardado y descargado en Excel. Se usó 1 crédito mensual aprobado.'
          : '1 planificación generada, guardada y descargada.'
      )

      if (insertError) {
        setMensaje(`Rutina generada y descargada. No se pudo guardar en historial: ${insertError.message}`)
      }

      if (!insertError) await cargarPlanificacionesMes()
      onUpdateStudent?.()
    } catch (error) {
      setMensaje(`Error inesperado generando rutina: ${error.message}`)
    } finally {
      setGenerando(false)
    }
  }

  async function solicitarCompra() {
    if (!student) return

    const compraMensual = tipoPlan === 'mensual'
    const monto = compraMensual ? PRECIO_PLAN_MENSUAL : tramoActual.precio
    const generaciones = compraMensual ? 0 : 1

    const { error } = await supabase
      .from('solicitudes_compra')
      .insert([
        {
          user_id: student.user_id,
          alumno_id: student.id,
          nombre_alumno: student.nombre,
          monto,
          generaciones,
          estado: 'Pendiente',
        },
      ])

    if (error) {
      setMensaje(error.message)
      return
    }

    const texto = compraMensual
      ? `Hola Robinson, soy ${student.nombre}. Quiero solicitar una planificación mensual PowerFit completa por $${PRECIO_PLAN_MENSUAL.toLocaleString('es-CL')}.`
      : `Hola Robinson, soy ${student.nombre}. Quiero comprar 1 generación PowerFit (${tramoActual.nombre}) por $${tramoActual.precio.toLocaleString('es-CL')}.`

    window.open(
      `https://wa.me/${ADMIN_WHATSAPP}?text=${encodeURIComponent(texto)}`,
      '_blank',
      'noopener,noreferrer'
    )

    setMensaje('Solicitud enviada correctamente.')
  }

  const sinDisponibles = generacionesDisponibles < 1
  const generacionBloqueada =
    tipoPlan === 'mensual'
      ? planesMensualesDisponibles <= 0
      : sinDisponibles

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="bg-zinc-900 border border-red-600 rounded-2xl sm:rounded-3xl p-4 sm:p-6">
        <h1 className="text-3xl sm:text-4xl font-black text-red-500">
          {t.title}
        </h1>

        <p className="text-yellow-400 mt-3 font-black text-xl">
          {t.available}: {generacionesDisponibles}
        </p>

        <p className="text-zinc-400 mt-2">
          {t.visibleThisMonth}: {planificaciones.length}
        </p>
      </div>

      <div className="bg-zinc-900 border border-green-600 rounded-2xl sm:rounded-3xl p-4 sm:p-6 space-y-4">
        <div>
          <h2 className="text-2xl font-black text-green-400">
            {t.pricesTitle}
          </h2>
          <p className="text-zinc-400 mt-2">
            Precio por generación: las primeras 4 cuestan $2.500 cada una, las siguientes 10 cuestan $5.000 cada una y después cuestan $7.500 cada una. Plan mensual completo: $60.000.
          </p>
          <p className="text-sm text-green-300 mt-2 font-black">
            Generaciones compradas aprobadas: {generacionesCompradas}. Precio actual: ${tramoActual.precio.toLocaleString('es-CL')} por 1 generación
            {restantesTramoActual === null
              ? '.'
              : ` (${restantesTramoActual} disponibles en este tramo).`}
          </p>
          <p className="text-sm text-blue-300 mt-1 font-black">
            Planes mensuales aprobados disponibles: {planesMensualesDisponibles}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-3">
          {TRAMOS_GENERACION.map((tramo) => (
            <div
              key={tramo.nombre}
              className={`rounded-2xl border p-4 ${
                tramoActual.nombre === tramo.nombre
                  ? 'border-green-500 bg-green-950/40'
                  : 'border-zinc-700 bg-zinc-800'
              }`}
            >
              <p className="font-black text-white">{tramo.nombre}</p>
              <p className="text-yellow-400 font-black text-xl">
                ${tramo.precio.toLocaleString('es-CL')} cada una
              </p>
              <p className="text-sm text-zinc-400">
                {tramo.cupos
                  ? `${tramo.cupos} oportunidades`
                  : 'Precio continuo'}
              </p>
              {tramoActual.nombre === tramo.nombre && (
                <p className="text-sm text-green-300 font-black mt-2">
                  Precio actual
                </p>
              )}
            </div>
          ))}
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <button
            onClick={() => setTipoPlan('sesion')}
            className={`p-4 rounded-2xl font-black ${
              tipoPlan === 'sesion' ? 'bg-red-600' : 'bg-zinc-800'
            }`}
          >
            {t.session}
          </button>

          <button
            onClick={() => setTipoPlan('mensual')}
            className={`p-4 rounded-2xl font-black ${
              tipoPlan === 'mensual' ? 'bg-blue-600' : 'bg-zinc-800'
            }`}
          >
            {t.monthly}
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-zinc-900 border border-blue-600 rounded-2xl sm:rounded-3xl p-4 sm:p-6 space-y-4">
          <div>
            <h2 className="text-2xl font-black text-blue-400">
              RM / CARGAS DE PESAS
            </h2>
            <p className="text-zinc-400 mt-2">
              Ingresa la repetición máxima para que la IA calcule los kg sugeridos en fuerza.
            </p>
          </div>

          <div className="grid sm:grid-cols-[1fr_140px_auto] gap-3">
            <select
              value={rmForm.ejercicio}
              onChange={(e) =>
                setRmForm((prev) => ({ ...prev, ejercicio: e.target.value }))
              }
              className="bg-zinc-800 p-4 rounded-2xl"
            >
              {RM_EJERCICIOS.map((ejercicio) => (
                <option key={ejercicio} value={ejercicio}>
                  {ejercicio}
                </option>
              ))}
            </select>

            <input
              type="number"
              min="1"
              value={rmForm.rm_kg}
              onChange={(e) =>
                setRmForm((prev) => ({ ...prev, rm_kg: e.target.value }))
              }
              placeholder="RM kg"
              className="bg-zinc-800 p-4 rounded-2xl"
            />

            <button
              onClick={guardarRM}
              disabled={guardandoRM}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 px-5 py-4 rounded-2xl font-black"
            >
              {guardandoRM ? 'Guardando...' : 'Guardar RM'}
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {rms.length > 0 ? (
              rms.map((rm) => (
                <span
                  key={`${rm.ejercicio}-${rm.id}`}
                  className="bg-zinc-800 border border-zinc-700 rounded-2xl px-4 py-2 text-sm font-black"
                >
                  {rm.ejercicio}: {rm.rm_kg} kg
                </span>
              ))
            ) : (
              <p className="text-zinc-500">
                Aún no hay RM guardados. Si no existe RM, el plan dirá "RM no registrado".
              </p>
            )}
          </div>
        </div>

        <div className="bg-zinc-900 border border-pink-600 rounded-2xl sm:rounded-3xl p-4 sm:p-6 space-y-4">
          <div>
            <h2 className="text-2xl font-black text-pink-400">
              CICLO MENSTRUAL
            </h2>
            <p className="text-zinc-400 mt-2">
              Ajuste opcional para modificar cargas y foco según la fase del mes.
            </p>
          </div>

          <label className="flex items-center gap-3 bg-zinc-800 rounded-2xl p-4 font-black">
            <input
              type="checkbox"
              checked={usarCicloMenstrual}
              onChange={(e) => setUsarCicloMenstrual(e.target.checked)}
              className="h-5 w-5 accent-pink-600"
            />
            Aplicar ajuste por ciclo menstrual
          </label>

          {usarCicloMenstrual && (
            <select
              value={faseMenstrual}
              onChange={(e) => setFaseMenstrual(e.target.value)}
              className="w-full bg-zinc-800 p-4 rounded-2xl"
            >
              <option value="menstrual">Fase menstrual - bajar carga y priorizar técnica</option>
              <option value="folicular">Fase folicular - mejor fase para progresar fuerza</option>
              <option value="ovulatoria">Fase ovulatoria - potencia controlada</option>
              <option value="lutea">Fase lútea - moderar volumen e intensidad</option>
            </select>
          )}

          <p className="text-sm text-zinc-500">
            Es una guía orientativa: cada alumna puede responder distinto. Si hay dolor, fatiga alta o malestar, se baja intensidad.
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <select
          value={objetivo}
          onChange={(e) => setObjetivo(e.target.value)}
          className="bg-zinc-800 p-4 rounded-2xl"
        >
          <option value="fighter">Fighter</option>
          <option value="tenis">Tenis</option>
          <option value="fuerza">Fuerza</option>
          <option value="perdida_grasa">Pérdida grasa</option>
          <option value="cardio">Cardio</option>
          <option value="casa_principiante">Casa principiante / sin materiales</option>
        </select>

        <select
          value={nivel}
          onChange={(e) => setNivel(e.target.value)}
          className="bg-zinc-800 p-4 rounded-2xl"
        >
          <option value="basico">Básico</option>
          <option value="intermedio">Intermedio</option>
          <option value="avanzado">Avanzado</option>
        </select>

        <select
          value={faseATR}
          onChange={(e) => setFaseATR(e.target.value)}
          className="bg-zinc-800 p-4 rounded-2xl"
        >
          <option value="acumulacion">ATR Acumulación</option>
          <option value="transformacion">ATR Transformación</option>
          <option value="realizacion">ATR Realización</option>
        </select>
      </div>

      {generacionBloqueada && (
        <div className="bg-red-950 border border-red-600 p-5 rounded-2xl font-black text-red-300">
          {tipoPlan === 'mensual'
            ? `El plan mensual completo cuesta $${PRECIO_PLAN_MENSUAL.toLocaleString('es-CL')}.`
            : `Te faltan generaciones. La siguiente cuesta $${tramoActual.precio.toLocaleString('es-CL')}.`}
        </div>
      )}

      <button
        onClick={generar}
        disabled={generacionBloqueada || generando}
        className={`w-full p-5 rounded-2xl font-black text-lg sm:text-xl ${
          generacionBloqueada || generando
            ? 'bg-zinc-700 opacity-40 cursor-not-allowed'
            : 'bg-red-600 hover:bg-red-700'
        }`}
      >
        {generando
          ? t.generating
          : generacionBloqueada
            ? t.noAvailable
            : tipoPlan === 'mensual'
              ? t.generateMonthly
              : t.generateOne}
      </button>

      <button
        onClick={solicitarCompra}
        className="w-full bg-green-600 hover:bg-green-700 p-5 rounded-2xl font-black text-lg sm:text-xl"
      >
        {tipoPlan === 'mensual'
          ? `${t.requestMonthly} - $${PRECIO_PLAN_MENSUAL.toLocaleString('es-CL')}`
          : `${t.buyOne} - $${tramoActual.precio.toLocaleString('es-CL')}`}
      </button>

      {mensaje && (
        <div className="bg-yellow-500 text-black p-4 rounded-2xl font-black">
          {mensaje}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {planificaciones.map((plan) => (
          <div
            key={plan.id}
            className="bg-zinc-900 border border-yellow-500 rounded-2xl sm:rounded-3xl p-4 sm:p-6"
          >
            <h2 className="text-2xl font-black text-yellow-400">
              {plan.objetivo?.toUpperCase()}
            </h2>

            <p className="text-zinc-400 mt-2">
              Fecha: {new Date(plan.created_at).toLocaleString()}
            </p>

            <div className="grid sm:flex sm:flex-wrap gap-3 mt-5">
              <button
                onClick={() => setPlanAbierto(plan)}
                className="bg-red-600 px-5 py-3 rounded-2xl font-black"
              >
                Ver planificación
              </button>

              <button
                onClick={() =>
                  esPlanMensual(plan)
                    ? descargarExcelMensual(plan.contenido, student?.nombre)
                    : descargarWord(plan.contenido, student?.nombre)
                }
                className="bg-blue-600 px-5 py-3 rounded-2xl font-black"
              >
                {esPlanMensual(plan) ? 'Descargar Excel' : 'Descargar Word'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {planAbierto && (
        <div className="fixed inset-0 bg-black/80 flex items-start sm:items-center justify-center p-2 sm:p-6 z-50">
          <div className="bg-zinc-900 border border-yellow-500 rounded-2xl sm:rounded-3xl p-4 sm:p-6 max-w-4xl w-full max-h-[96vh] sm:max-h-[85vh] overflow-auto">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-5">
              <h2 className="text-2xl sm:text-3xl font-black text-yellow-400">
                Planificación
              </h2>

              <div className="grid sm:flex gap-2">
                <button
                  onClick={() =>
                    esPlanMensual(planAbierto)
                      ? descargarExcelMensual(planAbierto.contenido, student?.nombre)
                      : descargarWord(planAbierto.contenido, student?.nombre)
                  }
                  className="bg-blue-600 px-4 py-3 rounded-xl font-black"
                >
                  {esPlanMensual(planAbierto) ? 'Descargar Excel' : 'Descargar Word'}
                </button>

                <button
                  onClick={() => setPlanAbierto(null)}
                  className="bg-red-600 px-4 py-3 rounded-xl font-black"
                >
                  Cerrar
                </button>
              </div>
            </div>

            <p className="text-zinc-400 mb-4">
              Fecha: {new Date(planAbierto.created_at).toLocaleString()}
            </p>

            {esPlanMensual(planAbierto) ? (
              <VistaPlanMensual plan={planAbierto} nombreAlumno={student?.nombre} />
            ) : (
              <pre className="whitespace-pre-wrap text-sm">
                {corregirNombresPowerFit(planAbierto.contenido)}
              </pre>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
