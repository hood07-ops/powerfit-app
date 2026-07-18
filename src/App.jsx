import { useEffect, useState } from 'react'
import './App.css'
import { supabase } from './supabase'

import CheckInPage from './pages/CheckInPage'
import GeneradorPage from './pages/GeneradorPage'
import LoginPage from './pages/LoginPage'
import MetodosPage from './pages/MetodosPage'
import MiQRPage from './pages/MiQRPage'
import RegistroComprasPage from './pages/RegistroComprasPage'
import RutinasPage from './pages/RutinasPage'

function Btn({ text, set, disabled, active }) {
  return (
    <button
      onClick={set}
      disabled={disabled}
      className={`shrink-0 min-w-[132px] flex-1 sm:flex-none px-4 py-3 rounded-2xl font-black text-sm sm:text-base transition ${
        disabled
          ? 'bg-zinc-700 opacity-40'
          : active
            ? 'bg-red-600 text-white shadow-lg shadow-red-950/40'
            : 'bg-zinc-800 hover:bg-red-600'
      }`}
    >
      {text}
    </button>
  )
}

function Info({ label, value }) {
  return (
    <div className="bg-zinc-800 rounded-2xl p-3 sm:p-4 min-w-0">
      <p className="text-zinc-400 text-sm">{label}</p>
      <p className="text-lg sm:text-xl font-black break-words">{value || '-'}</p>
    </div>
  )
}

function StatusBadge({ estado }) {
  const styles = {
    Pagado: 'bg-green-600 text-white',
    Pendiente: 'bg-yellow-500 text-black',
    Moroso: 'bg-red-600 text-white',
  }

  return (
    <span
      className={`inline-flex rounded-xl px-3 py-2 text-sm font-black ${
        styles[estado] || styles.Pendiente
      }`}
    >
      {estado || 'Pendiente'}
    </span>
  )
}

const UI_TEXT = {
  es: {
    admin: 'ADMINISTRADOR',
    student: 'ALUMNO',
    paymentStatus: 'Estado pago',
    logout: 'Cerrar sesion',
    attendanceQr: 'Asistencia QR',
    xpRanks: 'XP y rangos',
    library: 'Biblioteca',
    aiGenerator: 'Generador IA',
    routines: 'Rutinas',
    premium: 'Premium',
    reports: 'Reportes',
    stats: 'Estadisticas',
    notifications: 'Notificaciones',
    profile: 'Ficha personal',
    payment: 'Pago / deuda',
    evaluations: 'Evaluaciones',
    adminStudents: 'ADMIN ALUMNOS',
    purchaseLog: 'Registro compras',
    language: 'Idioma',
    blockedTitle: 'SERVICIOS BLOQUEADOS',
    blockedCopy:
      'Tu cuenta esta pendiente o morosa. Regulariza el pago para desbloquear rutinas, generador IA y metodos.',
    payMonthly: 'Pagar mensualidad',
  },
  en: {
    admin: 'ADMIN',
    student: 'STUDENT',
    paymentStatus: 'Payment status',
    logout: 'Log out',
    attendanceQr: 'QR attendance',
    xpRanks: 'XP and ranks',
    library: 'Library',
    aiGenerator: 'AI generator',
    routines: 'Routines',
    premium: 'Premium',
    reports: 'Reports',
    stats: 'Statistics',
    notifications: 'Notifications',
    profile: 'Personal profile',
    payment: 'Payment / debt',
    evaluations: 'Evaluations',
    adminStudents: 'STUDENTS ADMIN',
    purchaseLog: 'Purchase log',
    language: 'Language',
    blockedTitle: 'SERVICES LOCKED',
    blockedCopy:
      'Your account is pending or overdue. Update payment to unlock routines, AI generator and methods.',
    payMonthly: 'Pay monthly fee',
  },
}

function descargarCSV(nombreArchivo, encabezado, filas, totalLabel, total) {
  const contenido =
    encabezado + '\n' + filas.join('\n') + '\n\n' + `${totalLabel},${total}`

  const blob = new Blob([contenido], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')

  a.href = url
  a.download = nombreArchivo
  a.click()

  URL.revokeObjectURL(url)
}

function fechaHoy() {
  return new Date().toISOString().slice(0, 10)
}

function formatearFecha(fecha) {
  if (!fecha) return '-'

  const valor = String(fecha).slice(0, 10)
  const partes = valor.split('-')

  if (partes.length === 3) {
    const [anio, mes, dia] = partes
    if (anio.length === 4 && mes.length === 2 && dia.length === 2) {
      return `${dia}-${mes}-${anio}`
    }
  }

  const date = new Date(fecha)
  if (Number.isNaN(date.getTime())) return fecha

  return date.toLocaleDateString('es-CL')
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
]

const EVALUACIONES = [
  {
    id: 'salto',
    nombre: 'Test salto vertical',
    metodo: 'Evaluación potencia',
    tipo: 'repeticiones',
    label: 'Mejor salto',
    unidad: 'cm',
    descripcion: '3 intentos, registrar el mejor salto en centímetros.',
  },
  {
    id: 'cooper',
    nombre: 'Test Cooper / VO2',
    metodo: 'Evaluación aeróbica 12 min',
    tipo: 'repeticiones',
    label: 'Distancia 12 min',
    unidad: 'metros',
    descripcion: 'Registrar metros recorridos en 12 minutos. La ficha estima VO2 max.',
  },
  {
    id: 'velocidad',
    nombre: 'Sprint 30m',
    metodo: 'Evaluación velocidad',
    tipo: 'tiempo',
    label: 'Mejor tiempo',
    unidad: 'segundos',
    descripcion: '2 o 3 intentos, registrar el menor tiempo en segundos.',
  },
  {
    id: 'distancia',
    nombre: 'Distancia controlada',
    metodo: 'Trabajo distancia / velocidad',
    tipo: 'repeticiones',
    label: 'Distancia total',
    unidad: 'metros',
    descripcion: 'Registrar metros completados en carrera, remo, bici o ski.',
  },
  {
    id: 'for_time',
    nombre: 'For Time / WOD',
    metodo: 'Evaluación tiempo bajo fatiga',
    tipo: 'tiempo',
    label: 'Tiempo final',
    unidad: 'segundos',
    descripcion: 'Registrar tiempo total del trabajo definido.',
  },
  {
    id: 'vueltas',
    nombre: 'AMRAP / vueltas',
    metodo: 'Evaluación densidad',
    tipo: 'vueltas',
    label: 'Vueltas completadas',
    unidad: 'vueltas',
    descripcion: 'Registrar vueltas completas del bloque.',
  },
  {
    id: 'reps',
    nombre: 'Repeticiones totales',
    metodo: 'Evaluación volumen',
    tipo: 'repeticiones',
    label: 'Repeticiones',
    unidad: 'reps',
    descripcion: 'Registrar repeticiones totales del test o bloque.',
  },
  {
    id: 'rm',
    nombre: 'RM / fuerza máxima',
    metodo: 'Evaluación RM',
    tipo: 'peso',
    label: 'Peso levantado',
    unidad: 'kg',
    descripcion: 'Registrar RM real o estimado por ejercicio.',
  },
]

function diferenciaDias(fecha) {
  if (!fecha) return null

  const hoy = new Date(fechaHoy())
  const destino = new Date(fecha)

  if (Number.isNaN(destino.getTime())) return null

  return Math.ceil((destino - hoy) / (1000 * 60 * 60 * 24))
}

function antiguedadTexto(fecha) {
  if (!fecha) return '-'

  const inicio = new Date(fecha)
  const hoy = new Date(fechaHoy())

  if (Number.isNaN(inicio.getTime()) || inicio > hoy) return '-'

  let meses =
    (hoy.getFullYear() - inicio.getFullYear()) * 12 +
    hoy.getMonth() -
    inicio.getMonth()

  if (hoy.getDate() < inicio.getDate()) meses -= 1
  if (meses < 1) return 'Menos de 1 mes'

  const anios = Math.floor(meses / 12)
  const restoMeses = meses % 12
  const partes = []

  if (anios) partes.push(`${anios} año${anios === 1 ? '' : 's'}`)
  if (restoMeses) partes.push(`${restoMeses} mes${restoMeses === 1 ? '' : 'es'}`)

  return partes.join(' y ')
}

function calcularEstadoPago(alumno) {
  const hoy = fechaHoy()

  if (alumno.fecha_vencimiento && alumno.fecha_vencimiento < hoy) {
    return 'Moroso'
  }

  if (alumno.fecha_pago && alumno.fecha_vencimiento >= hoy) {
    return 'Pagado'
  }

  return 'Pendiente'
}

function alumnoConEstadoAutomatico(alumno) {
  return {
    ...alumno,
    estado_pago: calcularEstadoPago(alumno),
  }
}

function fechaCompra(compra) {
  return compra.created_at || compra.fecha || compra.fecha_pago || ''
}

function ordenarCompras(compras) {
  return [...compras].sort(
    (a, b) => new Date(fechaCompra(b) || 0) - new Date(fechaCompra(a) || 0)
  )
}

function fechaAsistencia(item) {
  return item.fecha || item.created_at
}

function resumenAsistenciaAlumno(alumno, asistencias) {
  const registros = asistencias
    .filter((item) => String(item.alumno_id) === String(alumno?.id))
    .sort((a, b) => new Date(fechaAsistencia(b)) - new Date(fechaAsistencia(a)))

  const hoy = new Date()
  const asistenciasMes = registros.filter((item) => {
    const fecha = new Date(fechaAsistencia(item))

    return (
      fecha.getMonth() === hoy.getMonth() &&
      fecha.getFullYear() === hoy.getFullYear()
    )
  }).length

  const ultima = registros[0] ? fechaAsistencia(registros[0]) : null
  const diasSinAsistir = ultima
    ? Math.floor((hoy - new Date(ultima)) / (1000 * 60 * 60 * 24))
    : null

  return {
    registros,
    total: registros.length,
    mes: asistenciasMes,
    ultima,
    diasSinAsistir,
  }
}

function valorRecord(record) {
  if (Number(record.peso_kg)) return Number(record.peso_kg)
  if (Number(record.repeticiones)) return Number(record.repeticiones)
  if (Number(record.vueltas)) return Number(record.vueltas)
  if (Number(record.tiempo_segundos)) return Number(record.tiempo_segundos)
  return 0
}

function unidadRecord(record) {
  const nombre = String(record.rutina_nombre || '').toLowerCase()

  if (Number(record.peso_kg)) return 'kg'
  if (Number(record.tiempo_segundos)) return 'seg'
  if (nombre.includes('salto')) return 'cm'
  if (nombre.includes('cooper') || nombre.includes('distancia')) return 'm'
  if (Number(record.vueltas)) return 'vueltas'
  return 'reps'
}

function metadataRecord(record) {
  const metodo = String(record.metodo || '')
  const metodoNormalizado = metodo.normalize('NFD').replace(/[\u0300-\u036f]/g, '')

  function buscar(campo) {
    const match = metodoNormalizado.match(new RegExp(`${campo}:([^|]+)`))
    return match ? match[1].trim() : ''
  }

  return {
    fecha: buscar('Fecha'),
    atr: buscar('ATR'),
    rpe: Number(buscar('RPE') || 0),
    energia: Number(buscar('Energia') || 0),
    sueno: Number(buscar('Sueno') || 0),
    dolor: Number(buscar('Dolor') || 0),
    observacion: buscar('Obs'),
  }
}

function fechaRecord(record) {
  return metadataRecord(record).fecha || record.created_at
}

function faseAtrRecord(record) {
  const atr = metadataRecord(record).atr || faseAtrPorFecha(fechaRecord(record))

  return normalizarFaseAtr(atr)
}

function normalizarFaseAtr(fase) {
  const normalizada = String(fase || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')

  if (normalizada === 'Acumulacion') return 'Acumulación'
  if (normalizada === 'Transformacion') return 'Transformación'
  if (normalizada === 'Realizacion') return 'Realización'

  return fase || '-'
}

function mejorRecord(records, filtro, menorEsMejor = false) {
  const filtrados = records.filter(filtro).filter((record) => valorRecord(record) > 0)

  if (filtrados.length === 0) return null

  return filtrados.reduce((mejor, actual) => {
    const valorActual = valorRecord(actual)
    const valorMejor = valorRecord(mejor)
    return menorEsMejor
      ? valorActual < valorMejor ? actual : mejor
      : valorActual > valorMejor ? actual : mejor
  })
}

function faseAtrPorFecha(fecha) {
  const dia = new Date(fecha).getDate()

  if (dia <= 14) return 'Acumulación'
  if (dia <= 24) return 'Transformación'
  return 'Realización'
}

function scoreRecord(record) {
  if (Number(record.peso_kg)) return Number(record.peso_kg)
  if (Number(record.repeticiones)) return Number(record.repeticiones) / 10
  if (Number(record.vueltas)) return Number(record.vueltas) * 8
  if (Number(record.tiempo_segundos)) return Math.max(1, 600 / Number(record.tiempo_segundos))
  return 0
}

function datosAtrMensual(records) {
  const hoy = new Date()
  const delMes = records.filter((record) => {
    const fecha = new Date(fechaRecord(record))
    return fecha.getMonth() === hoy.getMonth() && fecha.getFullYear() === hoy.getFullYear()
  })

  return ['Acumulación', 'Transformación', 'Realización'].map((fase) => {
    const registros = delMes.filter((record) => faseAtrRecord(record) === fase)
    const total = registros.reduce((sum, record) => sum + scoreRecord(record), 0)
    const promedio = registros.length ? total / registros.length : 0

    return {
      label: fase,
      value: Math.round(promedio * 10) / 10,
    }
  })
}

function SparkChart({ data, color = '#ef4444', lowerIsBetter = false }) {
  const valores = data.map((item) => Number(item.value || 0))
  const max = Math.max(...valores, 1)
  const min = Math.min(...valores, 0)
  const rango = Math.max(max - min, 1)
  const puntos = data.map((item, index) => {
    const x = data.length === 1 ? 50 : (index / (data.length - 1)) * 100
    const normalizado = (Number(item.value || 0) - min) / rango
    const y = lowerIsBetter ? 10 + normalizado * 80 : 90 - normalizado * 80
    return `${x},${y}`
  })

  return (
    <div className="h-32 w-full">
      {data.length === 0 ? (
        <div className="h-full rounded-2xl bg-zinc-800 flex items-center justify-center text-zinc-500">
          Sin datos
        </div>
      ) : (
        <svg viewBox="0 0 100 100" className="h-full w-full overflow-visible">
          <polyline
            points={puntos.join(' ')}
            fill="none"
            stroke={color}
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {puntos.map((punto, index) => {
            const [x, y] = punto.split(',')
            return <circle key={`${punto}-${index}`} cx={x} cy={y} r="3.5" fill={color} />
          })}
        </svg>
      )}
    </div>
  )
}

function BarChart({ data }) {
  const max = Math.max(...data.map((item) => Number(item.value || 0)), 1)

  return (
    <div className="grid grid-cols-3 gap-3 h-36 items-end">
      {data.map((item) => (
        <div key={item.label} className="h-full flex flex-col justify-end gap-2">
          <div className="text-center text-sm font-black text-yellow-400">
            {item.value || 0}
          </div>
          <div
            className="rounded-t-xl bg-red-600 min-h-2"
            style={{ height: `${Math.max((Number(item.value || 0) / max) * 100, 6)}%` }}
          />
          <div className="text-center text-xs text-zinc-400">{item.label}</div>
        </div>
      ))}
    </div>
  )
}

function semaforoCarga(records, asistencias, student) {
  const recientes = records.slice(0, 5)
  const metas = recientes.map(metadataRecord)
  const promedio = (campo) => {
    const valores = metas.map((meta) => Number(meta[campo] || 0)).filter(Boolean)
    return valores.length
      ? valores.reduce((sum, value) => sum + value, 0) / valores.length
      : 0
  }
  const rpe = promedio('rpe')
  const energia = promedio('energia')
  const sueno = promedio('sueno')
  const dolor = promedio('dolor')
  const resumen = resumenAsistenciaAlumno(student, asistencias)

  if (dolor >= 7 || rpe >= 9 || energia <= 3 || sueno <= 3) {
    return {
      color: 'bg-red-600',
      label: 'Rojo',
      accion: 'Bajar carga, reducir volumen y priorizar recuperación técnica.',
    }
  }

  if (dolor >= 5 || rpe >= 8 || energia <= 5 || sueno <= 5 || resumen.mes < 4) {
    return {
      color: 'bg-yellow-500 text-black',
      label: 'Amarillo',
      accion: 'Mantener carga, controlar técnica y observar respuesta del alumno.',
    }
  }

  return {
    color: 'bg-green-600',
    label: 'Verde',
    accion: 'Puede progresar carga o intensidad de forma controlada.',
  }
}

function ProgressDashboard({ records, rms, asistencias, student }) {
  const ordenados = [...records].sort(
    (a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0)
  )
  const ultimos = [...records].slice(0, 5)
  const fuerza = mejorRecord(records, (record) => Number(record.peso_kg))
  const tiempo = mejorRecord(records, (record) => Number(record.tiempo_segundos), true)
  const salto = mejorRecord(records, (record) =>
    String(record.rutina_nombre || '').toLowerCase().includes('salto')
  )
  const cooper = mejorRecord(records, (record) =>
    String(record.rutina_nombre || '').toLowerCase().includes('cooper')
  )
  const mejorRm = [...rms]
    .filter((rm) => Number(rm.rm_kg))
    .sort((a, b) => Number(b.rm_kg) - Number(a.rm_kg))[0]
  const datosFuerza = ordenados
    .filter((record) => Number(record.peso_kg))
    .slice(-6)
    .map((record) => ({ label: record.rutina_nombre, value: Number(record.peso_kg) }))
  const datosTiempo = ordenados
    .filter((record) => Number(record.tiempo_segundos))
    .slice(-6)
    .map((record) => ({ label: record.rutina_nombre, value: Number(record.tiempo_segundos) }))
  const resumenAsistencia = resumenAsistenciaAlumno(student, asistencias)
  const atr = datosAtrMensual(records)
  const semaforo = semaforoCarga(records, asistencias, student)
  const vo2 = cooper?.repeticiones
    ? Math.max(0, (Number(cooper.repeticiones) - 504.9) / 44.73).toFixed(1)
    : null

  return (
    <div className="mt-8 space-y-6">
      <div>
        <h3 className="text-3xl font-black text-red-500">Progreso PowerFit</h3>
        <p className="text-zinc-400 mt-2">
          Gráficos de crecimiento por records, tests, asistencia, RM y mesociclo ATR.
        </p>
      </div>

      <div className="grid md:grid-cols-4 gap-4">
        <Info label="Records guardados" value={records.length} />
        <Info label="Asistencias este mes" value={resumenAsistencia.mes} />
        <Info label="Mejor RM" value={mejorRm ? `${mejorRm.ejercicio} ${mejorRm.rm_kg} kg` : '-'} />
        <Info label="VO2 estimado" value={vo2 ? `${vo2} ml/kg/min` : '-'} />
      </div>

      <div className="bg-zinc-800 rounded-2xl p-4">
        <div className="flex flex-wrap items-center gap-3">
          <span className={`rounded-2xl px-4 py-2 font-black ${semaforo.color}`}>
            Semáforo {semaforo.label}
          </span>
          <p className="text-zinc-300 font-bold">{semaforo.accion}</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="bg-zinc-800 rounded-2xl p-4">
          <p className="font-black text-yellow-400">Mesociclo ATR del mes</p>
          <BarChart data={atr} />
        </div>
        <div className="bg-zinc-800 rounded-2xl p-4">
          <p className="font-black text-yellow-400">Fuerza / kg</p>
          <SparkChart data={datosFuerza} color="#22c55e" />
        </div>
        <div className="bg-zinc-800 rounded-2xl p-4">
          <p className="font-black text-yellow-400">Tiempos / segundos</p>
          <SparkChart data={datosTiempo} color="#38bdf8" lowerIsBetter />
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Info label="Mejor fuerza registrada" value={fuerza ? `${fuerza.peso_kg} kg` : '-'} />
        <Info label="Mejor tiempo" value={tiempo ? `${tiempo.tiempo_segundos} seg` : '-'} />
        <Info label="Salto vertical" value={salto ? `${salto.repeticiones} cm` : '-'} />
        <Info label="Cooper distancia" value={cooper ? `${cooper.repeticiones} m` : '-'} />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="bg-zinc-800 rounded-2xl p-4">
          <p className="font-black text-yellow-400 mb-3">Últimos registros</p>
          <div className="space-y-2">
            {ultimos.map((record) => (
              <div key={record.id} className="bg-black/40 rounded-xl p-3">
                <p className="font-black">{record.rutina_nombre}</p>
                <p className="text-sm text-zinc-400">
                  {new Date(fechaRecord(record)).toLocaleDateString()} - {valorRecord(record)} {unidadRecord(record)} - ATR {faseAtrRecord(record)}
                </p>
              </div>
            ))}
            {ultimos.length === 0 && (
              <p className="text-zinc-500">Aún no hay records. Guarda tests desde Evaluaciones.</p>
            )}
          </div>
        </div>

        <div className="bg-zinc-800 rounded-2xl p-4">
          <p className="font-black text-yellow-400 mb-3">Evaluaciones recomendadas</p>
          <div className="grid sm:grid-cols-2 gap-2 text-sm text-zinc-300">
            <p className="bg-black/40 rounded-xl p-3">Salto vertical: potencia de piernas.</p>
            <p className="bg-black/40 rounded-xl p-3">Cooper 12 min: VO2 max estimado.</p>
            <p className="bg-black/40 rounded-xl p-3">Sprint 30m: velocidad/aceleración.</p>
            <p className="bg-black/40 rounded-xl p-3">RM: fuerza máxima por ejercicio.</p>
            <p className="bg-black/40 rounded-xl p-3">Tiempo For Time: capacidad bajo fatiga.</p>
            <p className="bg-black/40 rounded-xl p-3">Distancia controlada: volumen aeróbico.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function EvaluacionesPage({ student, user, onSaved }) {
  const [form, setForm] = useState({
    evaluacion: EVALUACIONES[0].id,
    fecha: fechaHoy(),
    faseATR: 'Acumulación',
    valor: '',
    ejercicio: RM_EJERCICIOS[0],
    rpe: '6',
    energia: '7',
    sueno: '7',
    dolor: '2',
    observacion: '',
  })
  const [mensaje, setMensaje] = useState('')
  const [guardando, setGuardando] = useState(false)

  const evaluacion = EVALUACIONES.find((item) => item.id === form.evaluacion) || EVALUACIONES[0]

  function update(campo, valor) {
    setForm((prev) => ({ ...prev, [campo]: valor }))
  }

  async function guardarRM(rmKg) {
    const { data: existente, error: buscarError } = await supabase
      .from('rm_alumnos')
      .select('id')
      .eq('alumno_id', student.id)
      .eq('ejercicio', form.ejercicio)
      .maybeSingle()

    if (buscarError) return buscarError

    const payload = {
      user_id: student.user_id || user.id,
      alumno_id: student.id,
      ejercicio: form.ejercicio,
      rm_kg: rmKg,
    }

    const { error } = existente?.id
      ? await supabase.from('rm_alumnos').update(payload).eq('id', existente.id)
      : await supabase.from('rm_alumnos').insert([payload])

    return error
  }

  async function guardarEvaluacion() {
    if (!student?.id || guardando) return

    const valor = Number(form.valor)

    if (!valor || valor <= 0) {
      setMensaje('Ingresa un valor válido para la evaluación.')
      return
    }

    setGuardando(true)
    setMensaje('')

    try {
      const detalleMetodo = [
        evaluacion.metodo,
        `Fecha:${form.fecha}`,
        `ATR:${form.faseATR}`,
        `RPE:${form.rpe}`,
        `Energía:${form.energia}`,
        `Sueño:${form.sueno}`,
        `Dolor:${form.dolor}`,
        `Obs:${String(form.observacion || '').replaceAll('|', '/')}`,
      ].join(' | ')

      const payload = {
        user_id: student.user_id || user.id,
        alumno_id: student.id,
        rutina_nombre:
          evaluacion.id === 'rm'
            ? `${evaluacion.nombre} - ${form.ejercicio}`
            : evaluacion.nombre,
        metodo: detalleMetodo,
        tipo_record: evaluacion.tipo,
        vueltas: evaluacion.tipo === 'vueltas' ? valor : null,
        repeticiones: evaluacion.tipo === 'repeticiones' ? valor : null,
        tiempo_segundos: evaluacion.tipo === 'tiempo' ? valor : null,
        peso_kg: evaluacion.tipo === 'peso' ? valor : null,
        porcentaje_rm: evaluacion.tipo === 'peso' ? 100 : null,
      }

      const { error } = await supabase.from('records_entrenamiento').insert([payload])

      if (error) {
        setMensaje(`Error guardando evaluación: ${error.message}`)
        return
      }

      if (evaluacion.id === 'rm') {
        const rmError = await guardarRM(valor)
        if (rmError) {
          setMensaje(`Evaluación guardada, pero no se pudo actualizar RM: ${rmError.message}`)
          return
        }
      }

      setForm((prev) => ({ ...prev, valor: '', observacion: '' }))
      setMensaje('Evaluación guardada. La ficha personal ya puede mostrar el progreso.')
      onSaved?.()
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="bg-zinc-900 border border-cyan-600 rounded-2xl sm:rounded-3xl p-4 sm:p-6 space-y-6">
      <div>
        <h2 className="text-3xl sm:text-4xl font-black text-cyan-400">
          Evaluaciones
        </h2>
        <p className="text-zinc-400 mt-2">
          Aquí se ingresan los records: tiempos, saltos, vueltas, distancia, VO2, RM y control de carga.
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 grid sm:grid-cols-2 gap-4">
          <select
            value={form.evaluacion}
            onChange={(e) => update('evaluacion', e.target.value)}
            className="bg-black p-4 rounded-2xl"
          >
            {EVALUACIONES.map((item) => (
              <option key={item.id} value={item.id}>
                {item.nombre}
              </option>
            ))}
          </select>

          <input
            type="date"
            value={form.fecha}
            onChange={(e) => update('fecha', e.target.value)}
            className="bg-black p-4 rounded-2xl"
          />

          <select
            value={form.faseATR}
            onChange={(e) => update('faseATR', e.target.value)}
            className="bg-black p-4 rounded-2xl"
          >
            <option value="Acumulación">ATR Acumulación</option>
            <option value="Transformación">ATR Transformación</option>
            <option value="Realización">ATR Realización</option>
          </select>

          {evaluacion.id === 'rm' && (
            <select
              value={form.ejercicio}
              onChange={(e) => update('ejercicio', e.target.value)}
              className="bg-black p-4 rounded-2xl"
            >
              {RM_EJERCICIOS.map((ejercicio) => (
                <option key={ejercicio} value={ejercicio}>
                  {ejercicio}
                </option>
              ))}
            </select>
          )}

          <input
            type="number"
            min="0"
            step="0.01"
            value={form.valor}
            onChange={(e) => update('valor', e.target.value)}
            placeholder={`${evaluacion.label} (${evaluacion.unidad})`}
            className="bg-black p-4 rounded-2xl"
          />

          <textarea
            value={form.observacion}
            onChange={(e) => update('observacion', e.target.value)}
            placeholder="Observación del coach o del alumno"
            className="bg-black p-4 rounded-2xl sm:col-span-2 min-h-24"
          />
        </div>

        <div className="bg-zinc-800 rounded-2xl p-4 space-y-4">
          <div>
            <p className="font-black text-yellow-400">Guía del test</p>
            <p className="text-zinc-300 mt-2">{evaluacion.descripcion}</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="space-y-1">
              <span className="text-sm text-zinc-400">RPE 1-10</span>
              <input
                type="number"
                min="1"
                max="10"
                value={form.rpe}
                onChange={(e) => update('rpe', e.target.value)}
                className="w-full bg-black p-3 rounded-xl"
              />
            </label>
            <label className="space-y-1">
              <span className="text-sm text-zinc-400">Energía 1-10</span>
              <input
                type="number"
                min="1"
                max="10"
                value={form.energia}
                onChange={(e) => update('energia', e.target.value)}
                className="w-full bg-black p-3 rounded-xl"
              />
            </label>
            <label className="space-y-1">
              <span className="text-sm text-zinc-400">Sueño 1-10</span>
              <input
                type="number"
                min="1"
                max="10"
                value={form.sueno}
                onChange={(e) => update('sueno', e.target.value)}
                className="w-full bg-black p-3 rounded-xl"
              />
            </label>
            <label className="space-y-1">
              <span className="text-sm text-zinc-400">Dolor 1-10</span>
              <input
                type="number"
                min="1"
                max="10"
                value={form.dolor}
                onChange={(e) => update('dolor', e.target.value)}
                className="w-full bg-black p-3 rounded-xl"
              />
            </label>
          </div>
        </div>
      </div>

      <button
        onClick={guardarEvaluacion}
        disabled={guardando}
        className="w-full bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 rounded-2xl p-5 font-black text-xl"
      >
        {guardando ? 'Guardando...' : 'Guardar evaluación'}
      </button>

      {mensaje && (
        <div className="bg-yellow-500 text-black rounded-2xl p-4 font-black">
          {mensaje}
        </div>
      )}
    </div>
  )
}

function AdminAlumnoModal({
  alumno,
  asistencias,
  onClose,
  onUpdate,
  onRegistrarPago,
  onEnviarPago,
  onEliminarGeneraciones,
  onEliminarAlumno,
}) {
  if (!alumno) return null

  const resumen = resumenAsistenciaAlumno(alumno, asistencias)
  const diasVence = diferenciaDias(alumno.fecha_vencimiento)
  const monto = Number(alumno.monto || 0)

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-start sm:items-center justify-center p-2 sm:p-4">
      <div className="bg-zinc-950 border border-yellow-500 rounded-2xl sm:rounded-3xl p-4 sm:p-6 max-w-6xl w-full max-h-[96vh] sm:max-h-[90vh] overflow-auto">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
          <div className="min-w-0">
            <h2 className="text-3xl sm:text-4xl font-black text-yellow-400 break-words">
              {alumno.nombre || 'Alumno'}
            </h2>
            <div className="mt-3 flex flex-wrap gap-3 items-center">
              <StatusBadge estado={alumno.estado_pago} />
              <span className="text-zinc-400">ID: {alumno.id}</span>
              <span className="text-zinc-400">Rol: {alumno.role || 'alumno'}</span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="bg-red-600 hover:bg-red-700 px-5 py-3 rounded-2xl font-black w-full sm:w-auto"
          >
            Cerrar
          </button>
        </div>

        {alumno.estado_pago === 'Pagado' && diasVence !== null && diasVence <= 5 && (
          <div className="bg-yellow-500 text-black rounded-2xl p-4 mb-6 font-black">
            Membresía por vencer:{' '}
            {diasVence <= 0 ? 'vence hoy' : `faltan ${diasVence} día(s)`}.
          </div>
        )}

        {alumno.estado_pago === 'Moroso' && (
          <div className="bg-red-900 border border-red-500 rounded-2xl p-4 mb-6 font-black">
            Membresía vencida. El alumno queda bloqueado hasta registrar pago o confirmar la pasarela de pago.
          </div>
        )}

        <div className="grid md:grid-cols-4 gap-4 mb-6">
          <Info label="Asistencias total" value={resumen.total} />
          <Info label="Asistencias este mes" value={resumen.mes} />
          <Info label="Tiempo en PowerFit" value={antiguedadTexto(alumno.fecha_ingreso)} />
          <Info
            label="Última asistencia"
            value={resumen.ultima ? new Date(resumen.ultima).toLocaleDateString() : '-'}
          />
          <Info
            label="Días sin asistir"
            value={resumen.diasSinAsistir === null ? 'Sin registros' : resumen.diasSinAsistir}
          />
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <section className="bg-zinc-900 border border-zinc-700 rounded-2xl p-5">
            <h3 className="text-2xl font-black text-green-400 mb-4">
              Datos y mensualidad
            </h3>

            <div className="grid md:grid-cols-2 gap-3">
              <input
                defaultValue={alumno.nombre || ''}
                onBlur={(e) => onUpdate(alumno.id, 'nombre', e.target.value)}
                className="bg-black p-3 rounded-xl"
                placeholder="Nombre"
              />
              <input
                defaultValue={alumno.telefono || ''}
                onBlur={(e) => onUpdate(alumno.id, 'telefono', e.target.value)}
                className="bg-black p-3 rounded-xl"
                placeholder="Teléfono"
              />
              <label className="space-y-2 text-sm font-black text-zinc-300">
                <span>Fecha de cumpleaños</span>
                <input
                  type="date"
                  defaultValue={alumno.fecha_nacimiento || ''}
                  onBlur={(e) => onUpdate(alumno.id, 'fecha_nacimiento', e.target.value)}
                  className="w-full bg-black p-3 rounded-xl text-white"
                  title="Fecha de cumpleaños"
                />
              </label>
              <input
                type="number"
                defaultValue={alumno.peso || ''}
                onBlur={(e) => onUpdate(alumno.id, 'peso', Number(e.target.value))}
                className="bg-black p-3 rounded-xl"
                placeholder="Peso"
              />
              <input
                type="number"
                defaultValue={monto}
                onBlur={(e) => onUpdate(alumno.id, 'monto', Number(e.target.value))}
                className="bg-black p-3 rounded-xl"
                placeholder="Mensualidad"
              />
              <label className="space-y-2 text-sm font-black text-zinc-300">
                <span>Fecha de inicio en PowerFit</span>
                <input
                  type="date"
                  defaultValue={alumno.fecha_ingreso || ''}
                  onBlur={(e) => onUpdate(alumno.id, 'fecha_ingreso', e.target.value)}
                  className="w-full bg-black p-3 rounded-xl text-white"
                />
              </label>
              <input
                type="number"
                defaultValue={alumno.generaciones_disponibles || 0}
                onBlur={(e) =>
                  onUpdate(alumno.id, 'generaciones_disponibles', Number(e.target.value))
                }
                className="bg-black p-3 rounded-xl"
                placeholder="Generaciones"
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-3 mt-5">
              <button
                onClick={() => onRegistrarPago(alumno)}
                className="bg-green-600 hover:bg-green-700 p-3 rounded-xl font-black"
              >
                Registrar pago
              </button>
              <button
                onClick={() => onEnviarPago(alumno)}
                className="bg-green-800 hover:bg-green-900 p-3 rounded-xl font-black"
              >
                Enviar link de pago
              </button>
              <button
                onClick={() => onEliminarGeneraciones(alumno)}
                className="bg-red-800 hover:bg-red-900 p-3 rounded-xl font-black"
              >
                Eliminar generaciones
              </button>
              <button
                onClick={() => onEliminarAlumno(alumno)}
                className="bg-red-600 hover:bg-red-700 p-3 rounded-xl font-black"
              >
                Eliminar alumno
              </button>
            </div>

            <div className="bg-black/40 border border-zinc-700 rounded-2xl p-4 mt-5">
              <p className="font-black text-yellow-400">Mercado Pago</p>
              <p className="text-zinc-400 mt-2">
                Cuando Mercado Pago confirme el pago, el webhook debe actualizar esta misma ficha:
                fecha de pago hoy, vencimiento +1 mes, estado Pagado y generaciones disponibles.
              </p>
              <div className="grid sm:grid-cols-2 gap-3 mt-4">
                <Info label="Fecha de pago" value={formatearFecha(alumno.fecha_pago)} />
                <Info
                  label="Fecha de salida / término"
                  value={formatearFecha(alumno.fecha_salida || alumno.fecha_vencimiento)}
                />
              </div>
            </div>
          </section>

          <section className="bg-zinc-900 border border-zinc-700 rounded-2xl p-5">
            <h3 className="text-2xl font-black text-cyan-400 mb-4">
              Asistencia y resumen
            </h3>

            <div className="space-y-3 max-h-[430px] overflow-auto pr-1">
              {resumen.registros.map((item) => {
                const fecha = new Date(fechaAsistencia(item))

                return (
                  <div
                    key={item.id}
                    className="bg-black/40 border border-zinc-800 rounded-2xl p-4 grid sm:grid-cols-3 gap-3"
                  >
                    <div>
                      <p className="font-black">{fecha.toLocaleDateString()}</p>
                      <p className="text-zinc-400 text-sm">{fecha.toLocaleTimeString()}</p>
                    </div>
                    <p>{item.estado_pago || alumno.estado_pago || 'Pendiente'}</p>
                    <p>Vence: {item.fecha_vencimiento || alumno.fecha_vencimiento || '-'}</p>
                  </div>
                )
              })}

              {resumen.registros.length === 0 && (
                <p className="text-zinc-400">Este alumno aun no tiene asistencias.</p>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

function AdminAlumnosPanel({
  students,
  asistencias,
  busqueda,
  setBusqueda,
  alumnosFiltrados,
  abrirDetalle,
  registrarPago,
}) {
  return (
    <div className="bg-zinc-900 border border-yellow-500 rounded-2xl sm:rounded-3xl p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h2 className="text-3xl sm:text-4xl font-black text-yellow-400">
            ADMINISTRADOR - ALUMNOS
          </h2>
          <p className="text-zinc-400 mt-2">
            Busca un alumno y abre su ficha para editar datos, revisar asistencia,
            mensualidad y resumen.
          </p>
        </div>

        <div className="bg-zinc-800 rounded-2xl p-4 font-black">
          {alumnosFiltrados.length} / {students.length} alumnos
        </div>
      </div>

      <input
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
        placeholder="Buscar por nombre, correo, teléfono, estado o rol..."
        className="w-full bg-black p-4 rounded-2xl mb-6"
      />

      <div className="space-y-3">
        {alumnosFiltrados.map((alumno) => {
          const resumen = resumenAsistenciaAlumno(alumno, asistencias)
          const diasVence = diferenciaDias(alumno.fecha_vencimiento)

          return (
            <div
              key={alumno.id}
              className="grid lg:grid-cols-6 gap-3 items-start lg:items-center bg-zinc-800 rounded-2xl p-4"
            >
              <div className="min-w-0">
                <p className="text-xl font-black text-yellow-400">
                  {alumno.nombre || '-'}
                </p>
                <p className="text-zinc-400 text-sm">
                  {alumno.email || alumno.telefono || '-'}
                </p>
              </div>

              <StatusBadge estado={alumno.estado_pago} />

              <div className="text-sm text-zinc-300">
                <p>Vence: {alumno.fecha_vencimiento || '-'}</p>
                <p>
                  {diasVence === null
                    ? 'Sin fecha'
                    : diasVence < 0
                      ? `Vencida hace ${Math.abs(diasVence)} día(s)`
                      : `Faltan ${diasVence} día(s)`}
                </p>
              </div>

              <div className="text-sm text-zinc-300">
                <p>Asistencias: {resumen.total}</p>
                <p>Mes: {resumen.mes}</p>
              </div>

              <div className="text-sm text-zinc-300">
                <p>Generaciones: {alumno.generaciones_disponibles || 0}</p>
                <p>Rol: {alumno.role || 'alumno'}</p>
              </div>

              <div className="flex flex-col sm:flex-row lg:flex-wrap gap-2">
                <button
                  onClick={() => abrirDetalle(alumno)}
                  className="bg-blue-600 hover:bg-blue-700 px-4 py-3 rounded-xl font-black"
                >
                  Ver ficha
                </button>
                <button
                  onClick={() => registrarPago(alumno)}
                  className="bg-green-600 hover:bg-green-700 px-4 py-3 rounded-xl font-black"
                >
                  Registrar pago
                </button>
              </div>
            </div>
          )
        })}

        {alumnosFiltrados.length === 0 && (
          <p className="text-zinc-400">No hay alumnos para esa búsqueda.</p>
        )}
      </div>
    </div>
  )
}

function experienciaAlumno(alumno) {
  return Number(alumno?.experiencia || alumno?.xp || 0)
}

function rangoPorXP(xp) {
  if (xp >= 5000) return 'Leyenda PowerFit'
  if (xp >= 2500) return 'Diamante'
  if (xp >= 1200) return 'Oro'
  if (xp >= 500) return 'Plata'
  return 'Bronce'
}

function AsistenciaQrPanel({ student, students, asistencias, isAdmin }) {
  const registros = isAdmin
    ? asistencias
    : asistencias.filter((item) => String(item.alumno_id) === String(student?.id))
  const ultimos = [...registros]
    .sort((a, b) => new Date(fechaAsistencia(b) || 0) - new Date(fechaAsistencia(a) || 0))
    .slice(0, 12)

  return (
    <div className="space-y-6">
      <div className="bg-zinc-900 border border-cyan-600 rounded-2xl sm:rounded-3xl p-4 sm:p-6">
        <h2 className="text-3xl sm:text-4xl font-black text-cyan-400">
          Asistencia QR
        </h2>
        <p className="text-zinc-400 mt-2">
          Control de ingreso por QR, estado de pago, XP y registro de asistencia.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Info label="Asistencias registradas" value={registros.length} />
        <Info label="Alumnos activos" value={isAdmin ? students.length : 1} />
        <Info label="Mi QR" value="Disponible" />
      </div>

      <MiQRPage student={student} />

      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl sm:rounded-3xl p-4 sm:p-6">
        <h3 className="text-2xl font-black text-cyan-300 mb-4">
          Últimas asistencias
        </h3>
        <div className="space-y-3">
          {ultimos.map((item) => (
            <div
              key={item.id}
              className="grid sm:grid-cols-4 gap-3 bg-zinc-800 rounded-2xl p-4"
            >
              <p className="font-black">{item.nombre_alumno || item.alumno_id}</p>
              <p>{new Date(fechaAsistencia(item)).toLocaleDateString()}</p>
              <p>{new Date(fechaAsistencia(item)).toLocaleTimeString()}</p>
              <StatusBadge estado={item.estado_pago || 'Pendiente'} />
            </div>
          ))}
          {ultimos.length === 0 && (
            <p className="text-zinc-400">Todavía no hay asistencias registradas.</p>
          )}
        </div>
      </div>
    </div>
  )
}

function XpRangosPanel({ student, students, isAdmin }) {
  const alumnos = isAdmin ? students : [student].filter(Boolean)
  const ranking = [...alumnos]
    .map((alumno) => ({ ...alumno, xpTotal: experienciaAlumno(alumno) }))
    .sort((a, b) => b.xpTotal - a.xpTotal)

  return (
    <div className="space-y-6">
      <div className="bg-zinc-900 border border-yellow-500 rounded-2xl sm:rounded-3xl p-4 sm:p-6">
        <h2 className="text-3xl sm:text-4xl font-black text-yellow-400">
          XP y rangos
        </h2>
        <p className="text-zinc-400 mt-2">
          Ranking de constancia: asistencia QR suma XP y actualiza rangos.
        </p>
      </div>

      <div className="grid md:grid-cols-5 gap-3">
        {['Bronce', 'Plata', 'Oro', 'Diamante', 'Leyenda PowerFit'].map((rango) => (
          <div key={rango} className="bg-zinc-900 border border-zinc-700 rounded-2xl p-4">
            <p className="font-black text-yellow-300">{rango}</p>
          </div>
        ))}
      </div>

      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl sm:rounded-3xl p-4 sm:p-6">
        <h3 className="text-2xl font-black text-yellow-300 mb-4">Ranking</h3>
        <div className="space-y-3">
          {ranking.map((alumno, index) => (
            <div
              key={alumno.id || index}
              className="grid sm:grid-cols-4 gap-3 bg-zinc-800 rounded-2xl p-4 items-center"
            >
              <p className="font-black">#{index + 1}</p>
              <p>{alumno.nombre || 'Alumno'}</p>
              <p>{alumno.xpTotal} XP</p>
              <p className="text-yellow-300 font-black">
                {alumno.rango || rangoPorXP(alumno.xpTotal)}
              </p>
            </div>
          ))}
          {ranking.length === 0 && (
            <p className="text-zinc-400">Todavía no hay alumnos con XP.</p>
          )}
        </div>
      </div>
    </div>
  )
}

function PremiumPanel({ student, abrirPagoMensualidad }) {
  const premiumActivo = Number(student?.premium || 0) === 1 || student?.plan === 'Premium'

  return (
    <div className="bg-zinc-900 border border-purple-500 rounded-2xl sm:rounded-3xl p-4 sm:p-6 space-y-5">
      <div>
        <h2 className="text-3xl sm:text-4xl font-black text-purple-300">
          Premium
        </h2>
        <p className="text-zinc-400 mt-2">
          Planes avanzados, IA mensual, biblioteca completa y seguimiento de progreso.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Info label="Estado premium" value={premiumActivo ? 'Activo' : 'No activo'} />
        <Info label="Plan mensual IA" value="$60.000" />
        <Info label="Generaciones IA" value={student?.generaciones_disponibles || 0} />
      </div>

      <button
        onClick={abrirPagoMensualidad}
        className="w-full bg-purple-600 hover:bg-purple-700 rounded-2xl p-5 font-black"
      >
        Solicitar o renovar Premium
      </button>
    </div>
  )
}

function ReportesPanel({ students, asistencias, registroCompras, descargarCSV }) {
  const comprasAprobadas = registroCompras.filter(
    (compra) => (compra.estado || compra.estado_pago) === 'Aprobado'
  )
  const totalCompras = comprasAprobadas.reduce(
    (sum, compra) => sum + Number(compra.monto || 0),
    0
  )
  const morosos = students.filter((alumno) => alumno.estado_pago === 'Moroso')

  function descargarReporte() {
    descargarCSV(
      'reporte_powerfit_360.csv',
      'Metrica,Valor',
      [
        `Alumnos,${students.length}`,
        `Asistencias,${asistencias.length}`,
        `Morosos,${morosos.length}`,
        `Compras aprobadas,${comprasAprobadas.length}`,
        `Total compras,${totalCompras}`,
      ],
      'Total financiero',
      totalCompras
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-zinc-900 border border-blue-600 rounded-2xl sm:rounded-3xl p-4 sm:p-6">
        <h2 className="text-3xl sm:text-4xl font-black text-blue-400">Reportes</h2>
        <p className="text-zinc-400 mt-2">
          Resumen operativo y financiero para administrar PowerFit 360.
        </p>
      </div>

      <div className="grid md:grid-cols-4 gap-4">
        <Info label="Alumnos" value={students.length} />
        <Info label="Asistencias" value={asistencias.length} />
        <Info label="Morosos" value={morosos.length} />
        <Info label="Ingresos compras" value={`$${totalCompras}`} />
      </div>

      <button
        onClick={descargarReporte}
        className="w-full bg-blue-600 hover:bg-blue-700 rounded-2xl p-5 font-black"
      >
        Descargar reporte CSV
      </button>
    </div>
  )
}

function EstadísticasPanel({ students, asistencias, recordsEntrenamiento }) {
  const pagados = students.filter((alumno) => alumno.estado_pago === 'Pagado').length
  const pendientes = students.filter((alumno) => alumno.estado_pago === 'Pendiente').length
  const morosos = students.filter((alumno) => alumno.estado_pago === 'Moroso').length

  return (
    <div className="space-y-6">
      <div className="bg-zinc-900 border border-green-600 rounded-2xl sm:rounded-3xl p-4 sm:p-6">
        <h2 className="text-3xl sm:text-4xl font-black text-green-400">
          Estadísticas
        </h2>
        <p className="text-zinc-400 mt-2">
          Lectura rápida de alumnos, pagos, asistencias y evaluaciones registradas.
        </p>
      </div>

      <div className="grid md:grid-cols-4 gap-4">
        <Info label="Pagados" value={pagados} />
        <Info label="Pendientes" value={pendientes} />
        <Info label="Morosos" value={morosos} />
        <Info label="Evaluaciones" value={recordsEntrenamiento.length} />
      </div>

      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl sm:rounded-3xl p-4 sm:p-6">
        <h3 className="text-2xl font-black text-green-300 mb-4">
          Asistencia por alumno
        </h3>
        <div className="space-y-3">
          {students.slice(0, 12).map((alumno) => {
            const total = asistencias.filter(
              (item) => String(item.alumno_id) === String(alumno.id)
            ).length

            return (
              <div key={alumno.id} className="grid sm:grid-cols-3 gap-3 bg-zinc-800 rounded-2xl p-4">
                <p className="font-black">{alumno.nombre}</p>
                <p>{total} asistencias</p>
                <StatusBadge estado={alumno.estado_pago} />
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function NotificacionesPanel({ students, registroCompras, student, isAdmin }) {
  const comprasPendientes = registroCompras.filter(
    (compra) => (compra.estado || compra.estado_pago || 'Pendiente') !== 'Aprobado'
  )
  const alumnosPorVencer = students.filter((alumno) => {
    const dias = diferenciaDias(alumno.fecha_vencimiento)
    return alumno.estado_pago === 'Pagado' && dias !== null && dias <= 5
  })
  const morosos = students.filter((alumno) => alumno.estado_pago === 'Moroso')
  const misDias = diferenciaDias(student?.fecha_vencimiento)

  return (
    <div className="space-y-6">
      <div className="bg-zinc-900 border border-orange-500 rounded-2xl sm:rounded-3xl p-4 sm:p-6">
        <h2 className="text-3xl sm:text-4xl font-black text-orange-400">
          Notificaciones
        </h2>
        <p className="text-zinc-400 mt-2">
          Alertas de pagos, vencimientos, bloqueos y solicitudes pendientes.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Info label="Compras pendientes" value={comprasPendientes.length} />
        <Info label="Membresías por vencer" value={alumnosPorVencer.length} />
        <Info label="Morosos" value={morosos.length} />
      </div>

      {!isAdmin && misDias !== null && misDias <= 5 && (
        <div className="bg-yellow-500 text-black rounded-2xl p-5 font-black">
          Tu membresía vence {misDias <= 0 ? 'hoy' : `en ${misDias} día(s)`}.
        </div>
      )}

      {isAdmin && (
        <div className="bg-zinc-900 border border-zinc-700 rounded-2xl sm:rounded-3xl p-4 sm:p-6 space-y-3">
          {[...comprasPendientes, ...alumnosPorVencer, ...morosos].slice(0, 16).map((item, index) => (
            <div key={item.id || index} className="bg-zinc-800 rounded-2xl p-4">
              <p className="font-black">{item.nombre_alumno || item.nombre || 'Alumno'}</p>
              <p className="text-zinc-400">
                {item.monto
                  ? `Solicitud pendiente por $${item.monto}`
                  : `Estado: ${item.estado_pago || 'Pendiente'} - vence ${item.fecha_vencimiento || '-'}`}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function App() {
  const [user, setUser] = useState(null)
  const [student, setStudent] = useState(null)
  const [students, setStudents] = useState([])
  const [asistencias, setAsistencias] = useState([])
  const [recordsEntrenamiento, setRecordsEntrenamiento] = useState([])
  const [rmsAlumno, setRmsAlumno] = useState([])
  const [registroCompras, setRegistroCompras] = useState([])
  const [section, setSection] = useState('AsistenciaQR')
  const [busquedaAdmin, setBusquedaAdmin] = useState('')
  const [alumnoDetalle, setAlumnoDetalle] = useState(null)
  const [loading, setLoading] = useState(true)
  const [passwordRecovery, setPasswordRecovery] = useState(false)
  const [idioma, setIdioma] = useState(() => localStorage.getItem('powerfit_idioma') || 'es')

  const params = new URLSearchParams(window.location.search)
  const alumnoCheckIn = params.get('checkin')
  const t = UI_TEXT[idioma] || UI_TEXT.es

  function cambiarIdioma(nuevoIdioma) {
    setIdioma(nuevoIdioma)
    localStorage.setItem('powerfit_idioma', nuevoIdioma)
  }

  function alumnoPayloadDesdeAuth(currentUser) {
    const email = currentUser?.email || ''
    const metadata = currentUser?.user_metadata || {}

    return {
      nombre: metadata.nombre || (email ? email.split('@')[0] : 'Alumno'),
      email,
      user_id: currentUser.id,
      telefono: metadata.telefono || '',
      fecha_nacimiento: metadata.fecha_nacimiento || null,
      fecha_ingreso: fechaHoy(),
      categoria: metadata.categoria || '',
      plan: 'Basico',
      estado_pago: 'Pendiente',
      monto: 0,
      xp: 0,
      bloques_premium: 0,
      generaciones_disponibles: 6,
    }
  }

  function esErrorSchemaCache(error) {
    return error?.message?.toLowerCase().includes('schema cache')
  }

  async function insertarFichaAlumno(payload) {
    const { data, error } = await supabase
      .from('alumnos')
      .insert([payload])
      .select('*')
      .maybeSingle()

    if (!esErrorSchemaCache(error)) return data || null

    const payloadCompatible = { ...payload }
    delete payloadCompatible.fecha_nacimiento
    delete payloadCompatible.fecha_ingreso

    const { data: retryData } = await supabase
      .from('alumnos')
      .insert([payloadCompatible])
      .select('*')
      .maybeSingle()

    return retryData || null
  }

  async function asegurarFichaAlumno(currentUser) {
    if (!currentUser?.id) return null

    const { data: existente, error: buscarError } = await supabase
      .from('alumnos')
      .select('*')
      .eq('user_id', currentUser.id)
      .maybeSingle()

    if (buscarError || existente) return existente

    return insertarFichaAlumno(alumnoPayloadDesdeAuth(currentUser))
  }

  async function cargarUsuario(currentUser = user) {
    if (!currentUser) return

    const alumno = await asegurarFichaAlumno(currentUser)

    const alumnoActual = alumno ? alumnoConEstadoAutomatico(alumno) : null
    setStudent(alumnoActual)

    if (alumnoActual?.id) {
      const { data: recordsData, error: recordsError } = await supabase
        .from('records_entrenamiento')
        .select('*')
        .eq('alumno_id', alumnoActual.id)
        .order('created_at', { ascending: false })

      setRecordsEntrenamiento(recordsError ? [] : recordsData || [])

      const { data: rmsData, error: rmsError } = await supabase
        .from('rm_alumnos')
        .select('*')
        .eq('alumno_id', alumnoActual.id)
        .order('rm_kg', { ascending: false })

      setRmsAlumno(rmsError ? [] : rmsData || [])
    } else {
      setRecordsEntrenamiento([])
      setRmsAlumno([])
    }

    const { data: comprasData, error: comprasError } = await supabase
      .from('solicitudes_compra')
      .select('*')

    if (comprasError) {
      console.error('Error cargando solicitudes de compra:', comprasError)
      setRegistroCompras([])
    } else {
      setRegistroCompras(ordenarCompras(comprasData || []))
    }

    const { data: alumnosData } = await supabase
      .from('alumnos')
      .select('*')
      .order('id', { ascending: false })

    const alumnosNormalizados = (alumnosData || []).map(alumnoConEstadoAutomatico)
    setStudents(alumnosNormalizados)
    setAlumnoDetalle((actual) => {
      if (!actual) return null

      return (
        alumnosNormalizados.find((item) => String(item.id) === String(actual.id)) ||
        null
      )
    })

    const alumnosDesactualizados = alumnosNormalizados.filter((a) => {
      const original = (alumnosData || []).find((item) => item.id === a.id)
      return original?.estado_pago !== a.estado_pago
    })

    await Promise.all(
      alumnosDesactualizados.map((a) =>
        supabase
          .from('alumnos')
          .update({ estado_pago: a.estado_pago })
          .eq('id', a.id)
      )
    )

    const { data: asistenciasData } = await supabase
      .from('asistencias')
      .select('*')

    setAsistencias(asistenciasData || [])
  }

  async function checkUser() {
    const { data } = await supabase.auth.getUser()
    const currentUser = data?.user

    if (!currentUser) {
      setLoading(false)
      return
    }

    setUser(currentUser)
    await cargarUsuario(currentUser)
    setLoading(false)
  }

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' && session?.user) {
        setUser(session.user)
        setPasswordRecovery(true)
        setLoading(false)
      }
    })

    Promise.resolve().then(() => checkUser())

    return () => {
      data.subscription.unsubscribe()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function actualizarAlumno(id, campo, valor) {
    await supabase.from('alumnos').update({ [campo]: valor }).eq('id', id)
    await cargarUsuario()
  }

  async function registrarPago(alumno) {
    await aplicarPagoConfirmado(alumno)
  }

  async function aplicarPagoConfirmado(alumno) {
    const hoy = new Date()
    const vencimiento = new Date()
    vencimiento.setMonth(vencimiento.getMonth() + 1)

    const updateData = {
      estado_pago: 'Pagado',
      fecha_pago: hoy.toISOString().slice(0, 10),
      fecha_vencimiento: vencimiento.toISOString().slice(0, 10),
      generaciones_disponibles: 6,
    }

    await supabase.from('alumnos').update(updateData).eq('id', alumno.id)
    await cargarUsuario()
  }

  async function aprobarSolicitud(solicitud) {
    let alumno = students.find(
      (a) => String(a.id) === String(solicitud.alumno_id)
    )

    if (!alumno) {
      const { data } = await supabase
        .from('alumnos')
        .select('*')
        .eq('id', solicitud.alumno_id)
        .single()

      alumno = data
    }

    if (!alumno) return

    const nuevasGeneraciones =
      Number(alumno.generaciones_disponibles || 0) +
      Number(solicitud.generaciones ?? 1)

    await supabase
      .from('alumnos')
      .update({ generaciones_disponibles: nuevasGeneraciones })
      .eq('id', alumno.id)

    await supabase
      .from('solicitudes_compra')
      .update({ estado: 'Aprobado' })
      .eq('id', solicitud.id)

    await cargarUsuario()
  }

  async function eliminarGeneraciones(alumno) {
    await supabase
      .from('alumnos')
      .update({ generaciones_disponibles: 0 })
      .eq('id', alumno.id)

    await cargarUsuario()
  }

  async function eliminarAlumno(alumno) {
    const confirmado = window.confirm(
      `Eliminar definitivamente a ${alumno.nombre || 'este alumno'}?`
    )

    if (!confirmado) return

    await Promise.all([
      supabase.from('asistencias').delete().eq('alumno_id', alumno.id),
      supabase.from('rm_alumnos').delete().eq('alumno_id', alumno.id),
      supabase.from('planificaciones_generadas').delete().eq('alumno_id', alumno.id),
      supabase.from('solicitudes_compra').delete().eq('alumno_id', alumno.id),
    ])

    const { error } = await supabase.from('alumnos').delete().eq('id', alumno.id)

    if (error) {
      window.alert(`No se pudo eliminar el alumno: ${error.message}`)
      return
    }

    setAlumnoDetalle(null)
    await cargarUsuario()
  }

  async function abrirPagoAlumno(alumno) {
    if (!alumno) return

    const popup = window.open('', '_blank', 'noopener,noreferrer')
    const paymentUrl = import.meta.env.VITE_PAYMENT_URL
    const paymentPayload = {
      alumno_id: alumno.id,
      user_id: alumno.user_id || user.id,
      nombre: alumno.nombre || user.email,
      monto: Number(alumno.monto || 0),
    }
    function cerrarPagoConAviso(mensaje) {
      popup?.close()
      if (mensaje) {
        window.alert(mensaje)
      }
    }

    if (!paymentPayload.monto || paymentPayload.monto <= 0) {
      cerrarPagoConAviso('La mensualidad no tiene monto configurado. Corrige el monto del alumno antes de pagar por Mercado Pago.')
      return
    }

    try {
      if (paymentUrl) {
        const response = await fetch(paymentUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(paymentPayload),
        })
        const data = await response.json()
        const checkoutUrl = data.init_point || data.sandbox_init_point

        if (!response.ok || !checkoutUrl) {
          cerrarPagoConAviso(data.error || 'No se pudo crear el pago en Mercado Pago. Revisa las credenciales y la función backend.')
          return
        }

        if (popup) {
          popup.location.href = checkoutUrl
        } else {
          window.location.href = checkoutUrl
        }
        return
      }

      const { data, error } = await supabase.functions.invoke('create-preference', {
        body: paymentPayload,
      })
      const checkoutUrl = data?.init_point || data?.sandbox_init_point

      if (!error && checkoutUrl) {
        if (popup) {
          popup.location.href = checkoutUrl
        } else {
          window.location.href = checkoutUrl
        }
        return
      }

      cerrarPagoConAviso(
        'Mercado Pago todavía no está configurado o la función create-preference no está desplegada. Configura MP_ACCESS_TOKEN y despliega la función para abrir Checkout Pro.'
      )
    } catch (error) {
      cerrarPagoConAviso(
        `No se pudo iniciar Mercado Pago (${error.message}). Revisa la configuración de Mercado Pago.`
      )
    }
  }

  function abrirPagoMensualidad() {
    abrirPagoAlumno(student)
  }

  async function cerrarSesion() {
    await supabase.auth.signOut()
    window.location.reload()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white p-10">Cargando...</div>
    )
  }

  if (alumnoCheckIn) {
    return <CheckInPage alumnoId={alumnoCheckIn} />
  }

  if (passwordRecovery) {
    return (
      <LoginPage
        onLogin={checkUser}
        initialMode="update_password"
        onPasswordUpdated={() => setPasswordRecovery(false)}
      />
    )
  }

  if (!user) return <LoginPage onLogin={checkUser} />

  const isAdmin = student?.role?.toLowerCase() === 'admin'
  const pagoAlDia = student?.estado_pago === 'Pagado'
  const bloqueado = !isAdmin && !pagoAlDia
  const diasParaVencer = diferenciaDias(student?.fecha_vencimiento)
  const mostrarAvisoVencimiento =
    !isAdmin && pagoAlDia && diasParaVencer !== null && diasParaVencer <= 5
  const alumnosFiltrados = students.filter((alumno) =>
    [
      alumno.nombre,
      alumno.email,
      alumno.telefono,
      alumno.estado_pago,
      alumno.role,
    ]
      .join(' ')
      .toLowerCase()
      .includes(busquedaAdmin.toLowerCase().trim())
  )

  return (
    <div className="min-h-screen bg-black text-white px-3 py-4 sm:p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
      <div className="max-w-7xl mx-auto">
      <div className="bg-zinc-900 border border-red-600 rounded-2xl sm:rounded-3xl p-4 sm:p-5 mb-3 sm:mb-6 flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
        <div className="min-w-0 flex items-center gap-4">
          <img
            src="/powerfit-logo.png"
            alt="PowerFit 360"
            className="h-20 w-20 sm:h-24 sm:w-24 rounded-full object-cover border border-red-600"
          />
          <div className="min-w-0">
            <h1 className="text-3xl sm:text-4xl font-black text-red-500">POWERFIT 360</h1>
            <p className="text-zinc-300 truncate">{student?.nombre || user.email}</p>
            <p className="text-yellow-400 font-black">
              {isAdmin ? t.admin : t.student}
            </p>
            <p className={pagoAlDia ? 'text-green-400 font-black' : 'text-red-400 font-black'}>
              {t.paymentStatus}: {student?.estado_pago || 'Pendiente'}
            </p>
          </div>
        </div>

        <div className="grid sm:flex gap-3 w-full sm:w-auto">
          <div className="bg-black/40 border border-zinc-700 rounded-2xl p-2 flex items-center justify-center gap-2">
            <span className="text-xs font-black text-zinc-400">{t.language}</span>
            <button
              onClick={() => cambiarIdioma('es')}
              className={`px-3 py-2 rounded-xl font-black ${idioma === 'es' ? 'bg-red-600' : 'bg-zinc-800'}`}
            >
              ES
            </button>
            <button
              onClick={() => cambiarIdioma('en')}
              className={`px-3 py-2 rounded-xl font-black ${idioma === 'en' ? 'bg-red-600' : 'bg-zinc-800'}`}
            >
              EN
            </button>
          </div>
        <button
          onClick={cerrarSesion}
          className="bg-red-600 px-5 py-3 rounded-2xl font-black w-full sm:w-auto"
        >
          {t.logout}
        </button>
        </div>
      </div>

      <div className="sticky top-0 z-40 -mx-3 sm:mx-0 px-3 sm:px-0 py-3 mb-5 sm:mb-8 bg-black/95 backdrop-blur border-y border-zinc-900 sm:border-0">
        <div className="flex flex-nowrap sm:flex-wrap gap-3 overflow-x-auto pb-1 sm:pb-0">
          <Btn text={t.attendanceQr} active={section === 'AsistenciaQR'} set={() => setSection('AsistenciaQR')} />
          <Btn text={t.xpRanks} active={section === 'XPRangos'} disabled={bloqueado} set={() => setSection('XPRangos')} />
          <Btn text={t.library} active={section === 'Metodos'} disabled={bloqueado} set={() => setSection('Metodos')} />
          <Btn text={t.aiGenerator} active={section === 'Generador'} disabled={bloqueado} set={() => setSection('Generador')} />
          <Btn text={t.routines} active={section === 'Rutinas'} disabled={bloqueado} set={() => setSection('Rutinas')} />
          <Btn text={t.premium} active={section === 'Premium'} set={() => setSection('Premium')} />
          <Btn text={t.reports} active={section === 'Reportes'} disabled={!isAdmin} set={() => setSection('Reportes')} />
          <Btn text={t.stats} active={section === 'Estadísticas'} disabled={bloqueado} set={() => setSection('Estadísticas')} />
          <Btn text={t.notifications} active={section === 'Notificaciones'} set={() => setSection('Notificaciones')} />

          <Btn text={t.profile} active={section === 'Ficha'} set={() => setSection('Ficha')} />
          <Btn text={t.payment} active={section === 'Pago'} set={() => setSection('Pago')} />
          <Btn text={t.evaluations} active={section === 'Evaluaciones'} disabled={bloqueado} set={() => setSection('Evaluaciones')} />
          {isAdmin && <Btn text={t.adminStudents} active={section === 'Admin'} set={() => setSection('Admin')} />}
          {isAdmin && <Btn text={t.purchaseLog} active={section === 'RegistroCompras'} set={() => setSection('RegistroCompras')} />}
        </div>
      </div>

      {bloqueado && (
        <div className="bg-red-950 border border-red-600 rounded-2xl sm:rounded-3xl p-5 sm:p-6 mb-8">
          <h2 className="text-2xl sm:text-3xl font-black text-red-400">{t.blockedTitle}</h2>
          <p className="text-zinc-300 mt-2">
            Tu cuenta está pendiente o morosa. Regulariza el pago para desbloquear rutinas,
            generador IA y métodos.
          </p>
          <button
            onClick={abrirPagoMensualidad}
            className="mt-5 bg-green-600 hover:bg-green-700 px-6 py-4 rounded-2xl font-black"
          >
            {t.payMonthly}
          </button>
        </div>
      )}

      {mostrarAvisoVencimiento && (
        <div className="bg-yellow-500 text-black rounded-2xl sm:rounded-3xl p-5 sm:p-6 mb-8">
          <h2 className="text-2xl sm:text-3xl font-black">MEMBRESÍA POR VENCER</h2>
          <p className="mt-2 font-bold">
            Tu membresía vence {diasParaVencer === 0 ? 'hoy' : `en ${diasParaVencer} día(s)`}.
            Regulariza el pago para evitar el bloqueo automático.
          </p>
          <button
            onClick={abrirPagoMensualidad}
            className="mt-5 bg-green-700 hover:bg-green-800 text-white px-6 py-4 rounded-2xl font-black"
          >
            Pagar mensualidad
          </button>
        </div>
      )}

      {section === 'AsistenciaQR' && (
        <AsistenciaQrPanel
          student={student}
          students={students}
          asistencias={asistencias}
          isAdmin={isAdmin}
        />
      )}

      {section === 'XPRangos' && !bloqueado && (
        <XpRangosPanel
          student={student}
          students={students}
          isAdmin={isAdmin}
        />
      )}

      {section === 'Metodos' && !bloqueado && <MetodosPage idioma={idioma} />}

      {section === 'Generador' && !bloqueado && (
        <GeneradorPage student={student} onUpdateStudent={() => cargarUsuario()} idioma={idioma} />
      )}

      {section === 'Rutinas' && !bloqueado && (
        <RutinasPage student={student} onUpdateStudent={() => cargarUsuario()} />
      )}

      {section === 'Premium' && (
        <PremiumPanel
          student={student}
          abrirPagoMensualidad={abrirPagoMensualidad}
        />
      )}

      {section === 'Reportes' && isAdmin && (
        <ReportesPanel
          students={students}
          asistencias={asistencias}
          registroCompras={registroCompras}
          descargarCSV={descargarCSV}
        />
      )}

      {section === 'Estadísticas' && !bloqueado && (
        <EstadísticasPanel
          students={students}
          asistencias={asistencias}
          recordsEntrenamiento={recordsEntrenamiento}
        />
      )}

      {section === 'Notificaciones' && (
        <NotificacionesPanel
          students={students}
          registroCompras={registroCompras}
          student={student}
          isAdmin={isAdmin}
        />
      )}

      {section === 'Ficha' && (
        <div className="bg-zinc-900 border border-yellow-500 rounded-2xl sm:rounded-3xl p-4 sm:p-6">
          <h2 className="text-3xl sm:text-4xl font-black text-yellow-400 mb-6">Ficha personal</h2>

          <div className="grid md:grid-cols-2 gap-4">
            <Info label="Nombre" value={student?.nombre} />
            <Info label="Correo" value={student?.email || user.email} />
            <Info label="Teléfono" value={student?.telefono} />
            <Info label="Fecha de cumpleaños" value={formatearFecha(student?.fecha_nacimiento)} />
            <Info label="Peso" value={student?.peso} />
            <Info label="Fecha de inicio" value={formatearFecha(student?.fecha_ingreso)} />
            <Info label="Tiempo en PowerFit" value={antiguedadTexto(student?.fecha_ingreso)} />
            <Info label="Fecha de pago" value={formatearFecha(student?.fecha_pago)} />
            <Info
              label="Fecha de salida / término"
              value={formatearFecha(student?.fecha_salida || student?.fecha_vencimiento)}
            />
            <Info label="Mensualidad" value={`$${student?.monto || 0}`} />
            <Info label="Estado pago" value={student?.estado_pago} />
            <Info label="Generaciones" value={student?.generaciones_disponibles || 0} />
          </div>

          <ProgressDashboard
            records={recordsEntrenamiento}
            rms={rmsAlumno}
            asistencias={asistencias}
            student={student}
          />
        </div>
      )}

      {section === 'Pago' && (
        <div className="bg-zinc-900 border border-green-600 rounded-2xl sm:rounded-3xl p-4 sm:p-6">
          <h2 className="text-3xl sm:text-4xl font-black text-green-400 mb-6">Pago / deuda</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <Info label="Estado" value={student?.estado_pago} />
            <Info label="Mensualidad" value={`$${student?.monto || 0}`} />
            <Info label="Fecha de pago" value={formatearFecha(student?.fecha_pago)} />
            <Info
              label="Fecha de salida / término"
              value={formatearFecha(student?.fecha_salida || student?.fecha_vencimiento)}
            />
          </div>

          <button
            onClick={abrirPagoMensualidad}
            className="mt-6 w-full bg-green-600 hover:bg-green-700 p-5 rounded-2xl font-black text-xl"
          >
            Pagar mensualidad
          </button>
        </div>
      )}

      {section === 'Evaluaciones' && !bloqueado && (
        <EvaluacionesPage
          student={student}
          user={user}
          onSaved={() => cargarUsuario()}
        />
      )}

      {section === 'Admin' && isAdmin && (
        <AdminAlumnosPanel
          students={students}
          asistencias={asistencias}
          busqueda={busquedaAdmin}
          setBusqueda={setBusquedaAdmin}
          alumnosFiltrados={alumnosFiltrados}
          abrirDetalle={setAlumnoDetalle}
          registrarPago={registrarPago}
        />
      )}

      {section === 'RegistroCompras' && isAdmin && (
        <RegistroComprasPage
          registroCompras={registroCompras}
          aprobarSolicitud={aprobarSolicitud}
          descargarCSV={descargarCSV}
        />
      )}

      <AdminAlumnoModal
        alumno={alumnoDetalle}
        asistencias={asistencias}
        onClose={() => setAlumnoDetalle(null)}
        onUpdate={actualizarAlumno}
        onRegistrarPago={registrarPago}
        onEnviarPago={abrirPagoAlumno}
        onEliminarGeneraciones={eliminarGeneraciones}
        onEliminarAlumno={eliminarAlumno}
      />
      </div>
    </div>
  )
}
