import { useEffect, useState } from 'react'
import './App.css'
import { DEFAULT_BRANDING, POWERFIT_SIGNATURE, getAppEdition, loadBranding, saveBranding } from './appConfig'
import { applyPowerFitUpdate, listenForPowerFitUpdate } from './pwa'
import { supabase } from './supabase'

import CheckInPage from './pages/CheckInPage'
import ConstructorPage from './pages/ConstructorPage'
import GeneradorPage from './pages/GeneradorPage'
import LoginPage from './pages/LoginPage'
import MetodosPage from './pages/MetodosPage'
import MiQRPage from './pages/MiQRPage'
import RegistroComprasPage from './pages/RegistroComprasPage'
import RutinasPage from './pages/RutinasPage'

function Btn({ text, set, disabled, active, show = true }) {
  if (!show) return null

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
    workoutBuilder: 'Constructor',
    routines: 'Rutinas',
    premium: 'Premium',
    reports: 'Reportes',
    stats: 'Estadisticas',
    notifications: 'Notificaciones',
    profile: 'Ficha personal',
    payment: 'Pago / deuda',
    evaluations: 'Evaluaciones',
    customTrainings: 'Entrenos alumnos',
    adminStudents: 'ADMIN ALUMNOS',
    purchaseLog: 'Registro compras',
    brandSettings: 'Marca',
    language: 'Idioma',
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
    workoutBuilder: 'Workout builder',
    routines: 'Routines',
    premium: 'Premium',
    reports: 'Reports',
    stats: 'Statistics',
    notifications: 'Notifications',
    profile: 'Personal profile',
    payment: 'Payment / debt',
    evaluations: 'Evaluations',
    customTrainings: 'Student plans',
    adminStudents: 'STUDENTS ADMIN',
    purchaseLog: 'Purchase log',
    brandSettings: 'Brand',
    language: 'Language',
    payMonthly: 'Pay monthly fee',
  },
}

const NAV_ITEMS = {
  Admin: { label: 'adminStudents', adminOnly: true },
  Entrenamientos: { label: 'customTrainings', adminOnly: true },
  AsistenciaQR: { label: 'attendanceQr' },
  XPRangos: { label: 'xpRanks', lockable: true },
  Metodos: { label: 'library', lockable: true },
  Generador: { label: 'aiGenerator', lockable: true },
  Constructor: { label: 'workoutBuilder', lockable: true },
  Rutinas: { label: 'routines', lockable: true },
  Premium: { label: 'premium' },
  Reportes: { label: 'reports', adminOnly: true },
  Estadísticas: { label: 'stats', lockable: true },
  Notificaciones: { label: 'notifications' },
  Ficha: { label: 'profile' },
  Pago: { label: 'payment' },
  Evaluaciones: { label: 'evaluations', lockable: true },
  RegistroCompras: { label: 'purchaseLog', adminOnly: true },
  Marca: { label: 'brandSettings', adminOnly: true, brandingOnly: true },
}

const AVATAR_TEMPLATES = [
  {
    id: 'champion_red',
    label: 'Boxeador campeon rojo',
    ring: 'from-red-700 via-zinc-950 to-black',
    shorts: 'bg-red-700',
    gloves: 'bg-red-600',
    belt: 'bg-yellow-400',
  },
  {
    id: 'champion_gold',
    label: 'Boxeador campeon dorado',
    ring: 'from-yellow-500 via-zinc-950 to-black',
    shorts: 'bg-zinc-900',
    gloves: 'bg-yellow-500',
    belt: 'bg-red-600',
  },
  {
    id: 'champion_blue',
    label: 'Boxeador campeon azul',
    ring: 'from-blue-800 via-zinc-950 to-black',
    shorts: 'bg-blue-700',
    gloves: 'bg-blue-600',
    belt: 'bg-yellow-400',
  },
  {
    id: 'champion_white',
    label: 'Boxeador campeon blanco',
    ring: 'from-zinc-200 via-zinc-950 to-black',
    shorts: 'bg-zinc-100',
    gloves: 'bg-red-600',
    belt: 'bg-yellow-500',
  },
  {
    id: 'boxeadora_red',
    label: 'Boxeadora campeona roja',
    ring: 'from-red-800 via-zinc-950 to-black',
    shorts: 'bg-red-600',
    gloves: 'bg-red-500',
    belt: 'bg-yellow-400',
  },
  {
    id: 'boxeadora_gold',
    label: 'Boxeadora campeona dorada',
    ring: 'from-yellow-600 via-red-950 to-black',
    shorts: 'bg-yellow-500',
    gloves: 'bg-zinc-900',
    belt: 'bg-red-600',
  },
  {
    id: 'boxeadora_blue',
    label: 'Boxeadora campeona azul',
    ring: 'from-blue-700 via-zinc-950 to-black',
    shorts: 'bg-blue-600',
    gloves: 'bg-zinc-100',
    belt: 'bg-yellow-500',
  },
  {
    id: 'boxeadora_black',
    label: 'Boxeadora campeona negra',
    ring: 'from-zinc-800 via-red-950 to-black',
    shorts: 'bg-zinc-950',
    gloves: 'bg-zinc-200',
    belt: 'bg-yellow-500',
  },
]

function avatarTemplateById(templateId) {
  return AVATAR_TEMPLATES.find((template) => template.id === templateId) || AVATAR_TEMPLATES[0]
}

const TERMS_VERSION = '2026-07-18-v1'
const TERMS_TEXT = [
  'Declaro que los datos entregados son verdaderos y autorizo su uso para gestion de alumnos, asistencia, pagos, evaluaciones y planificaciones dentro de PowerFit 360.',
  'Entiendo que las rutinas, evaluaciones y recomendaciones de entrenamiento son orientativas y no reemplazan una evaluacion medica profesional.',
  'Me comprometo a informar lesiones, enfermedades, dolores, restricciones medicas o cualquier condicion que pueda afectar mi entrenamiento.',
  'Acepto que el uso de imagen/foto de perfil y avatar campeon es voluntario, y autorizo su uso dentro de mi ficha y experiencia PowerFit.',
  'Acepto las reglas de pago, vencimiento de mensualidad y registro de asistencia segun la administracion del gimnasio o escuela. El estado financiero no bloquea el acceso deportivo.',
  'Entiendo que el profesor/gimnasio es responsable de administrar sus alumnos y que PowerFit 360 puede mantener registro tecnico y comercial del servicio.',
]

function csvCell(value) {
  const text = String(value ?? '')
  return `"${text.replaceAll('"', '""')}"`
}

function descargarCSV(nombreArchivo, encabezado, filas, totalLabel, total) {
  const contenido =
    '\ufeff' + encabezado + '\n' + filas.join('\n') + '\n\n' + `${csvCell(totalLabel)},${csvCell(total)}`

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
    const { error } = await supabase.rpc('save_powerfit_rm_secure', {
      p_alumno_id: student.id,
      p_ejercicio: form.ejercicio,
      p_rm_kg: rmKg,
      p_fecha: form.fecha || null,
      p_reason: 'evaluacion_powerfit',
    })

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

      const { error } = await supabase.rpc('save_powerfit_training_record_secure', {
        p_alumno_id: payload.alumno_id,
        p_rutina_nombre: payload.rutina_nombre,
        p_metodo: payload.metodo,
        p_tipo_record: payload.tipo_record,
        p_vueltas: payload.vueltas,
        p_repeticiones: payload.repeticiones,
        p_tiempo_segundos: payload.tiempo_segundos,
        p_peso_kg: payload.peso_kg,
        p_porcentaje_rm: payload.porcentaje_rm,
        p_observacion: form.observacion || null,
        p_reason: 'evaluacion_powerfit',
      })

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
  const [fechaPago, setFechaPago] = useState(fechaHoy())

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
            Membresía vencida. Estado financiero moroso; el acceso deportivo se mantiene activo.
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


            <div className="mt-5">
              <label className="grid gap-2 text-sm font-black text-zinc-300">
                <span>Fecha de pago</span>
                <input
                  type="date"
                  value={fechaPago}
                  onChange={(e) => setFechaPago(e.target.value)}
                  className="w-full bg-black p-3 rounded-xl text-white border border-zinc-700"
                  title="Fecha real en que se recibió el pago"
                />
              </label>
            </div>

            <div className="grid sm:grid-cols-2 gap-3 mt-5">
              <button
                onClick={() => onRegistrarPago(alumno, fechaPago)}
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
                fecha de pago confirmada, vencimiento correspondiente, estado Pagado y generaciones disponibles.
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

function EntrenamientosCoachPanel({ students, user, onSaved }) {
  const alumnos = students.filter((alumno) => alumno.role !== 'admin')
  const [form, setForm] = useState({
    alumnoId: alumnos[0]?.id ? String(alumnos[0].id) : '',
    titulo: 'Entrenamiento personalizado PowerFit',
    objetivo: 'Fuerza funcional + motor transversal',
    nivel: 'intermedio',
    contenido:
      'ACTIVACION\n- RAMP 8 min\n\nBLOQUE 1 - MOTOR TRANSVERSAL\n- 3 rondas tecnicas\n\nBLOQUE 2 - FUERZA FUNCIONAL\n- 4 series principales\n\nBLOQUE 3 - SISTEMA METABOLICO\n- 8-12 min calidad\n\nNOTAS\n- Registrar RPE, dolor y observaciones.',
  })
  const [mensaje, setMensaje] = useState('')
  const [guardando, setGuardando] = useState(false)

  const alumno = alumnos.find((item) => String(item.id) === String(form.alumnoId))

  useEffect(() => {
    if (!form.alumnoId && alumnos[0]?.id) {
      update('alumnoId', String(alumnos[0].id))
    }
  }, [alumnos, form.alumnoId])

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  async function guardarEntrenamiento() {
    if (!alumno?.id || guardando) return
    if (!form.titulo.trim() || !form.contenido.trim()) {
      setMensaje('Completa titulo y contenido del entrenamiento.')
      return
    }

    setGuardando(true)
    setMensaje('')

    const contenido = [
      'POWERFIT 360 - ENTRENAMIENTO ASIGNADO POR COACH',
      `Alumno: ${alumno.nombre || '-'}`,
      `Coach: ${user?.email || '-'}`,
      `Fecha: ${new Date().toLocaleString('es-CL')}`,
      `Titulo: ${form.titulo}`,
      `Objetivo: ${form.objetivo}`,
      `Nivel: ${form.nivel}`,
      '',
      form.contenido,
    ].join('\n')

    const { error } = await supabase.rpc('save_powerfit_plan_secure', {
      p_alumno_id: alumno.id,
      p_objetivo: `coach_personalizado_${form.objetivo}`,
      p_nivel: form.nivel,
      p_contenido: contenido,
      p_source: 'manual',
      p_source_ref: 'coach_assignment',
    })

    if (error) {
      setMensaje(`No se pudo asignar el entrenamiento: ${error.message}`)
      setGuardando(false)
      return
    }

    setMensaje(`Entrenamiento asignado a ${alumno.nombre}.`)
    setGuardando(false)
    onSaved?.()
  }

  return (
    <div className="space-y-6">
      <section className="bg-zinc-900 border border-blue-500 rounded-2xl sm:rounded-3xl p-4 sm:p-6">
        <h2 className="text-3xl sm:text-4xl font-black text-blue-300">
          Entrenos alumnos
        </h2>
        <p className="text-zinc-400 mt-2">
          Carga entrenamientos personalizados desde Coach y dejalos disponibles en la app del alumno.
        </p>
      </section>

      {mensaje && (
        <div className="bg-yellow-500 text-black rounded-2xl p-4 font-black">
          {mensaje}
        </div>
      )}

      <section className="grid lg:grid-cols-2 gap-5">
        <div className="bg-zinc-900 border border-zinc-700 rounded-2xl sm:rounded-3xl p-4 sm:p-6 space-y-4">
          <label className="grid gap-2 font-black text-sm text-zinc-300">
            Alumno
            <select
              value={form.alumnoId}
              onChange={(event) => update('alumnoId', event.target.value)}
              className="bg-black border border-zinc-700 rounded-xl p-3"
            >
              {alumnos.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.nombre || item.email || item.id}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-2 font-black text-sm text-zinc-300">
            Titulo
            <input
              value={form.titulo}
              onChange={(event) => update('titulo', event.target.value)}
              className="bg-black border border-zinc-700 rounded-xl p-3"
            />
          </label>

          <label className="grid gap-2 font-black text-sm text-zinc-300">
            Objetivo
            <input
              value={form.objetivo}
              onChange={(event) => update('objetivo', event.target.value)}
              className="bg-black border border-zinc-700 rounded-xl p-3"
            />
          </label>

          <label className="grid gap-2 font-black text-sm text-zinc-300">
            Nivel
            <select
              value={form.nivel}
              onChange={(event) => update('nivel', event.target.value)}
              className="bg-black border border-zinc-700 rounded-xl p-3"
            >
              <option value="basico">Basico</option>
              <option value="intermedio">Intermedio</option>
              <option value="avanzado">Avanzado</option>
            </select>
          </label>
        </div>

        <div className="bg-zinc-900 border border-zinc-700 rounded-2xl sm:rounded-3xl p-4 sm:p-6 space-y-4">
          <label className="grid gap-2 font-black text-sm text-zinc-300">
            Entrenamiento
            <textarea
              value={form.contenido}
              onChange={(event) => update('contenido', event.target.value)}
              rows={16}
              className="bg-black border border-zinc-700 rounded-xl p-3 font-mono text-sm"
            />
          </label>

          <button
            onClick={guardarEntrenamiento}
            disabled={guardando || alumnos.length === 0}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-2xl p-5 font-black"
          >
            {guardando ? 'Asignando...' : 'Asignar entrenamiento al alumno'}
          </button>
        </div>
      </section>
    </div>
  )
}

function BrandSettingsPanel({ branding, setBranding, edition, gimnasio, onSaveRemote }) {
  const [form, setForm] = useState(branding)
  const comision = Number(gimnasio?.comision_powerfit ?? edition.commissionRate ?? 0)
  const gananciaPowerFit = Math.round(comision * 100)

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  async function guardarMarca() {
    const nextBranding = {
      ...DEFAULT_BRANDING,
      ...form,
      appName: form.appName?.trim() || DEFAULT_BRANDING.appName,
      logoUrl: form.logoUrl || DEFAULT_BRANDING.logoUrl,
    }

    setBranding(nextBranding)
    saveBranding(nextBranding)
    await onSaveRemote?.(nextBranding)
  }

  function restaurarMarca() {
    setForm(DEFAULT_BRANDING)
    setBranding(DEFAULT_BRANDING)
    saveBranding(DEFAULT_BRANDING)
  }

  function cargarLogo(event) {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => update('logoUrl', String(reader.result || DEFAULT_BRANDING.logoUrl))
    reader.readAsDataURL(file)
  }

  return (
    <div className="bg-zinc-900 border border-yellow-500 rounded-2xl sm:rounded-3xl p-4 sm:p-6">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5 mb-6">
        <div>
          <h2 className="text-3xl sm:text-4xl font-black text-yellow-400">
            Marca de escuela
          </h2>
          <p className="text-zinc-400 mt-2">
            Personaliza el nombre y logo visible para tu gimnasio o escuela.
          </p>
        </div>

        <div className="bg-black/40 border border-zinc-700 rounded-2xl p-4">
          <p className="text-sm text-zinc-400 font-black">Edicion</p>
          <p className="text-xl font-black text-red-400">{edition.label}</p>
          {gimnasio?.nombre && (
            <p className="text-zinc-300 mt-1">Gimnasio: {gimnasio.nombre}</p>
          )}
          {gananciaPowerFit > 0 && (
            <p className="text-zinc-300 mt-1">
              Modelo comercial: {gananciaPowerFit}% PowerFit por alumno integrado.
            </p>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_280px] gap-5">
        <div className="space-y-4">
          <label className="grid gap-2 font-black text-sm text-zinc-300">
            Nombre visible de la app
            <input
              value={form.appName || ''}
              onChange={(event) => update('appName', event.target.value)}
              className="bg-black border border-zinc-700 rounded-2xl p-4 text-white"
              placeholder="Nombre de tu escuela"
            />
          </label>

          <label className="grid gap-2 font-black text-sm text-zinc-300">
            Nombre interno / escuela
            <input
              value={form.schoolName || ''}
              onChange={(event) => update('schoolName', event.target.value)}
              className="bg-black border border-zinc-700 rounded-2xl p-4 text-white"
              placeholder="Ej: Academia Matatoa"
            />
          </label>

          <label className="grid gap-2 font-black text-sm text-zinc-300">
            Logo de la escuela
            <input
              type="file"
              accept="image/*"
              onChange={cargarLogo}
              className="bg-black border border-zinc-700 rounded-2xl p-4 text-white"
            />
          </label>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={guardarMarca}
              className="bg-green-600 hover:bg-green-700 px-5 py-4 rounded-2xl font-black"
            >
              Guardar marca
            </button>
            <button
              onClick={restaurarMarca}
              className="bg-zinc-700 hover:bg-zinc-600 px-5 py-4 rounded-2xl font-black"
            >
              Restaurar PowerFit
            </button>
          </div>
        </div>

        <div className="bg-black border border-zinc-700 rounded-2xl p-5 text-center">
          <img
            src={form.logoUrl || DEFAULT_BRANDING.logoUrl}
            alt={form.appName || DEFAULT_BRANDING.appName}
            className="mx-auto h-32 w-32 rounded-full object-cover border border-red-600"
          />
          <h3 className="text-2xl font-black text-red-500 mt-4">
            {form.appName || DEFAULT_BRANDING.appName}
          </h3>
          <p className="text-xs text-zinc-500 font-black mt-3">
            Desarrollado con {POWERFIT_SIGNATURE}
          </p>
        </div>
      </div>
    </div>
  )
}

function resizeProfilePhoto(file, maxSize = 420) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onerror = () => reject(new Error('No se pudo leer la foto.'))
    reader.onload = () => {
      const image = new Image()
      image.onerror = () => reject(new Error('No se pudo procesar la foto.'))
      image.onload = () => {
        const scale = Math.min(1, maxSize / Math.max(image.width, image.height))
        const canvas = document.createElement('canvas')
        canvas.width = Math.max(1, Math.round(image.width * scale))
        canvas.height = Math.max(1, Math.round(image.height * scale))

        const context = canvas.getContext('2d')
        context.drawImage(image, 0, 0, canvas.width, canvas.height)
        resolve(canvas.toDataURL('image/jpeg', 0.82))
      }
      image.src = String(reader.result || '')
    }

    reader.readAsDataURL(file)
  })
}

function ChampionAvatar({ photoUrl, templateId, name }) {
  const template = avatarTemplateById(templateId)
  const initials = String(name || 'PF')
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <div className={`relative mx-auto aspect-[3/4] w-full max-w-[280px] overflow-hidden rounded-2xl border border-red-600 bg-gradient-to-b ${template.ring} shadow-2xl`}>
      <div className="absolute inset-x-6 top-7 h-14 rounded-full bg-white/10 blur-md" />
      <div className="absolute left-1/2 top-[19%] z-20 h-20 w-20 -translate-x-1/2 overflow-hidden rounded-full border-4 border-zinc-100 bg-zinc-800 shadow-xl">
        {photoUrl ? (
          <img src={photoUrl} alt={name || 'Alumno'} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-2xl font-black text-yellow-400">
            {initials}
          </div>
        )}
      </div>

      <div className="absolute left-[19%] top-[18%] h-20 w-8 -rotate-[28deg] rounded-full bg-zinc-900 border border-zinc-600" />
      <div className={`absolute left-[11%] top-[11%] h-14 w-14 rounded-full ${template.gloves} border-4 border-zinc-950 shadow-xl`} />
      <div className="absolute right-[22%] top-[31%] h-28 w-8 rotate-[22deg] rounded-full bg-zinc-900 border border-zinc-600" />
      <div className={`absolute right-[12%] top-[42%] h-14 w-14 rounded-full ${template.gloves} border-4 border-zinc-950 shadow-xl`} />

      <div className="absolute left-1/2 top-[38%] h-36 w-36 -translate-x-1/2 rounded-t-[4rem] bg-zinc-900 border border-zinc-600 shadow-xl" />
      <div className="absolute left-[30%] top-[43%] h-24 w-10 -rotate-12 rounded-full bg-zinc-800" />
      <div className="absolute right-[30%] top-[43%] h-24 w-10 rotate-12 rounded-full bg-zinc-800" />
      <div className={`absolute left-1/2 top-[63%] h-10 w-40 -translate-x-1/2 rounded-xl ${template.shorts} border border-zinc-700`} />
      <div className={`absolute left-1/2 top-[58%] z-20 h-8 w-44 -translate-x-1/2 rounded-full ${template.belt} border-4 border-zinc-950 shadow-xl`}>
        <div className="mx-auto mt-1 h-4 w-14 rounded-full bg-zinc-950" />
      </div>

      <div className="absolute bottom-5 left-5 right-5 rounded-xl bg-black/70 px-3 py-2 text-center">
        <p className="text-xs font-black uppercase tracking-wide text-yellow-400">Campeon PowerFit</p>
        <p className="truncate text-lg font-black text-white">{name || 'Alumno'}</p>
      </div>
    </div>
  )
}

function ProfileAvatarPanel({ student, onSave, onUploadPhoto, onRequestAiAvatar }) {
  const [photoUrl, setPhotoUrl] = useState(student?.foto_url || '')
  const [photoStoragePath, setPhotoStoragePath] = useState(
    student?.foto_storage_path || '',
  )
  const [templateId, setTemplateId] = useState(
    student?.avatar_template || 'champion_red',
  )
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)

  async function saveProfile(
    nextPhoto = photoUrl,
    nextTemplate = templateId,
    nextStoragePath = photoStoragePath,
  ) {
    setSaving(true)
    setMessage('')

    const result = await onSave?.({
      foto_url: nextPhoto,
      foto_storage_path: nextStoragePath || null,
      avatar_template: nextTemplate,
    })

    setSaving(false)
    setMessage(
      result?.ok
        ? 'Perfil visual guardado.'
        : result?.message || 'No se pudo guardar el perfil visual.',
    )

    return result
  }

  async function handlePhoto(event) {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      setSaving(true)
      setMessage('')

      const resized = await resizeProfilePhoto(file)
      const uploaded = await onUploadPhoto?.(file, resized)

      if (!uploaded?.storagePath) {
        throw new Error('No se pudo guardar la foto privada.')
      }

      const nextPhoto = uploaded.previewUrl || resized
      const nextStoragePath = uploaded.storagePath

      setPhotoUrl(nextPhoto)
      setPhotoStoragePath(nextStoragePath)
      await saveProfile(nextPhoto, templateId, nextStoragePath)
    } catch (error) {
      setSaving(false)
      setMessage(error?.message || 'No se pudo procesar la foto.')
    }
  }

  async function selectTemplate(nextTemplate) {
    setTemplateId(nextTemplate)
    await saveProfile(photoUrl, nextTemplate, photoStoragePath)
  }

  return (
    <div className="mb-6 grid lg:grid-cols-[320px_1fr] gap-5 rounded-2xl border border-zinc-700 bg-black/30 p-4">
      <ChampionAvatar
        photoUrl={photoUrl}
        templateId={templateId}
        name={student?.nombre}
      />

      <div className="space-y-4">
        <div>
          <h3 className="text-2xl font-black text-red-400">Avatar campeon</h3>
          <p className="text-zinc-400 mt-1">
            Sube una foto de rostro y elige una pose de combate para tu ficha.
          </p>
        </div>

        <label className="grid gap-2 font-black text-sm text-zinc-300">
          Foto del alumno
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handlePhoto}
            className="w-full rounded-2xl border border-zinc-700 bg-zinc-950 p-4 text-white"
          />
        </label>

        <div className="grid sm:grid-cols-2 gap-3">
          {AVATAR_TEMPLATES.map((template) => (
            <button
              key={template.id}
              onClick={() => selectTemplate(template.id)}
              className={`rounded-2xl border p-4 text-left font-black transition ${
                templateId === template.id
                  ? 'border-yellow-400 bg-yellow-500 text-black'
                  : 'border-zinc-700 bg-zinc-900 hover:border-red-500'
              }`}
            >
              {template.label}
            </button>
          ))}
        </div>

        <button
          onClick={() => saveProfile()}
          disabled={saving}
          className="w-full rounded-2xl bg-green-600 p-4 font-black hover:bg-green-700 disabled:opacity-50"
        >
          {saving ? 'Guardando...' : 'Guardar avatar'}
        </button>

        <button
          onClick={async () => {
            setSaving(true)
            setMessage('')

            const result = await onRequestAiAvatar?.({
              foto_url: photoUrl,
              foto_storage_path: photoStoragePath || null,
              avatar_template: templateId,
            })

            setSaving(false)
            setMessage(
              result?.ok
                ? 'Solicitud de avatar IA enviada. Quedara pendiente para generar la imagen final.'
                : result?.message || 'No se pudo solicitar el avatar IA.',
            )
          }}
          disabled={saving || (!photoStoragePath && !photoUrl)}
          className="w-full rounded-2xl bg-yellow-500 p-4 font-black text-black hover:bg-yellow-400 disabled:opacity-50"
        >
          Solicitar avatar IA campeon
        </button>

        {message && (
          <p className="rounded-xl border border-zinc-700 bg-zinc-950 p-3 font-bold text-zinc-300">
            {message}
          </p>
        )}
      </div>
    </div>
  )
}

function TermsGate({ student, user, branding, onAccept }) {
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [acceptContract, setAcceptContract] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const canAccept = acceptTerms && acceptContract

  async function handleAccept() {
    if (!canAccept) return

    setSaving(true)
    setMessage('')
    const result = await onAccept?.({
      version: TERMS_VERSION,
      acepto_terminos: acceptTerms,
      acepto_contrato: acceptContract,
      user_agent: navigator.userAgent,
    })
    setSaving(false)

    if (!result?.ok) {
      setMessage(result?.message || 'No se pudo registrar la aceptacion.')
    }
  }

  return (
    <div className="min-h-screen bg-black text-white px-4 py-6">
      <div className="mx-auto max-w-4xl rounded-3xl border border-yellow-500 bg-zinc-900 p-5 sm:p-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
          <img
            src={branding.logoUrl || DEFAULT_BRANDING.logoUrl}
            alt={branding.appName || DEFAULT_BRANDING.appName}
            className="h-20 w-20 rounded-full border border-red-600 object-cover"
          />
          <div>
            <h1 className="text-3xl sm:text-4xl font-black text-yellow-400">
              Terminos, condiciones y contrato
            </h1>
            <p className="text-zinc-400 mt-1">
              {branding.appName || DEFAULT_BRANDING.appName} - version {TERMS_VERSION}
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-700 bg-black/40 p-4">
          <p className="font-black text-red-400">Aceptante</p>
          <p className="text-zinc-300">{student?.nombre || user?.email}</p>
          <p className="text-zinc-500 text-sm">{student?.email || user?.email}</p>
        </div>

        <div className="mt-5 space-y-3">
          {TERMS_TEXT.map((item, index) => (
            <div key={item} className="rounded-2xl border border-zinc-700 bg-zinc-950 p-4">
              <p className="font-black text-yellow-400">Clausula {index + 1}</p>
              <p className="text-zinc-300 mt-1">{item}</p>
            </div>
          ))}
        </div>

        <div className="mt-5 space-y-3">
          <label className="flex gap-3 rounded-2xl border border-zinc-700 bg-black/40 p-4 font-bold">
            <input
              type="checkbox"
              checked={acceptTerms}
              onChange={(event) => setAcceptTerms(event.target.checked)}
              className="mt-1 h-5 w-5"
            />
            <span>Acepto los terminos y condiciones de uso de la aplicacion.</span>
          </label>

          <label className="flex gap-3 rounded-2xl border border-zinc-700 bg-black/40 p-4 font-bold">
            <input
              type="checkbox"
              checked={acceptContract}
              onChange={(event) => setAcceptContract(event.target.checked)}
              className="mt-1 h-5 w-5"
            />
            <span>Acepto el contrato de uso, entrenamiento, registro de datos y politicas de pago.</span>
          </label>
        </div>

        {message && (
          <p className="mt-4 rounded-xl border border-red-700 bg-red-950 p-4 font-bold text-red-200">
            {message}
          </p>
        )}

        <button
          onClick={handleAccept}
          disabled={!canAccept || saving}
          className="mt-6 w-full rounded-2xl bg-green-600 p-5 text-xl font-black hover:bg-green-700 disabled:opacity-40"
        >
          {saving ? 'Registrando...' : 'Acepto y quiero usar la app'}
        </button>

        <p className="mt-4 text-center text-xs font-black text-zinc-500">
          Desarrollado con {POWERFIT_SIGNATURE}
        </p>
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

function ReportesPanel({ students, asistencias, registroCompras, recordsEntrenamiento, descargarCSV }) {
  const comprasAprobadas = registroCompras.filter(
    (compra) => (compra.estado || compra.estado_pago) === 'Aprobado'
  )
  const inicioDia = new Date()
  inicioDia.setHours(0, 0, 0, 0)
  const inicioSemana = new Date(inicioDia)
  inicioSemana.setDate(inicioSemana.getDate() - inicioSemana.getDay())
  const inicioMes = new Date(inicioDia.getFullYear(), inicioDia.getMonth(), 1)
  const inicioAnio = new Date(inicioDia.getFullYear(), 0, 1)
  const fechaCompra = (compra) => new Date(compra.fecha_pago || compra.updated_at || compra.created_at)
  const totalDesde = (desde) =>
    comprasAprobadas
      .filter((compra) => fechaCompra(compra) >= desde)
      .reduce((sum, compra) => sum + Number(compra.monto || 0), 0)
  const totalCompras = comprasAprobadas.reduce(
    (sum, compra) => sum + Number(compra.monto || 0),
    0
  )
  const pagados = students.filter((alumno) => alumno.estado_pago === 'Pagado')
  const pendientes = students.filter((alumno) => alumno.estado_pago === 'Pendiente')
  const morosos = students.filter((alumno) => alumno.estado_pago === 'Moroso')
  const ranking = students
    .map((alumno) => ({
      alumno,
      asistencias: asistencias.filter((item) => String(item.alumno_id) === String(alumno.id)).length,
      evaluaciones: recordsEntrenamiento.filter((item) => String(item.alumno_id) === String(alumno.id)).length,
    }))
    .sort((a, b) => b.asistencias + b.evaluaciones - (a.asistencias + a.evaluaciones))
  const totalDia = totalDesde(inicioDia)
  const totalSemana = totalDesde(inicioSemana)
  const totalMes = totalDesde(inicioMes)
  const totalAnio = totalDesde(inicioAnio)

  function descargarReporte() {
    const filasResumen = [
      ['SECCION', 'METRICA', 'VALOR'],
      ['Resumen', 'Alumnos', students.length],
      ['Resumen', 'Pagados', pagados.length],
      ['Resumen', 'Pendientes', pendientes.length],
      ['Resumen', 'Morosos', morosos.length],
      ['Resumen', 'Asistencias', asistencias.length],
      ['Resumen', 'Evaluaciones', recordsEntrenamiento.length],
      ['Finanzas', 'Compras aprobadas', comprasAprobadas.length],
      ['Finanzas', 'Total dia', totalDia],
      ['Finanzas', 'Total semana', totalSemana],
      ['Finanzas', 'Total mes', totalMes],
      ['Finanzas', 'Total anio', totalAnio],
      ['Finanzas', 'Total historico compras', totalCompras],
      [],
      ['ALUMNO', 'ESTADO_PAGO', 'VENCE', 'MONTO', 'ASISTENCIAS', 'EVALUACIONES'],
      ...ranking.map(({ alumno, asistencias: total, evaluaciones }) => [
        alumno.nombre || '-',
        alumno.estado_pago || 'Pendiente',
        alumno.fecha_vencimiento || '-',
        alumno.monto || 0,
        total,
        evaluaciones,
      ]),
      [],
      ['COMPRAS_APROBADAS', 'ALUMNO', 'TIPO', 'MONTO', 'FECHA'],
      ...comprasAprobadas.map((compra) => [
        compra.id || '-',
        compra.nombre_alumno || compra.alumno_nombre || '-',
        compra.tipo || compra.descripcion || 'Compra PowerFit',
        compra.monto || 0,
        fechaCompra(compra).toLocaleString(),
      ]),
    ]

    descargarCSV(
      'reporte_powerfit_360.csv',
      '',
      filasResumen.map((fila) => fila.map(csvCell).join(',')),
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
        <Info label="Ingresos compras" value={`$${totalCompras.toLocaleString('es-CL')}`} />
      </div>

      <div className="grid md:grid-cols-4 gap-4">
        <Info label="Hoy" value={`$${totalDia.toLocaleString('es-CL')}`} />
        <Info label="Semana" value={`$${totalSemana.toLocaleString('es-CL')}`} />
        <Info label="Mes" value={`$${totalMes.toLocaleString('es-CL')}`} />
        <Info label="Año" value={`$${totalAnio.toLocaleString('es-CL')}`} />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-zinc-900 border border-zinc-700 rounded-2xl sm:rounded-3xl p-4 sm:p-6">
          <h3 className="text-2xl font-black text-blue-300 mb-4">Ranking operativo</h3>
          <div className="space-y-3">
            {ranking.slice(0, 8).map(({ alumno, asistencias: total, evaluaciones }) => (
              <div key={alumno.id} className="grid sm:grid-cols-4 gap-3 bg-zinc-800 rounded-2xl p-4">
                <p className="font-black">{alumno.nombre || '-'}</p>
                <p>{total} asistencias</p>
                <p>{evaluaciones} evaluaciones</p>
                <StatusBadge estado={alumno.estado_pago} />
              </div>
            ))}
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-700 rounded-2xl sm:rounded-3xl p-4 sm:p-6">
          <h3 className="text-2xl font-black text-blue-300 mb-4">Últimas compras aprobadas</h3>
          <div className="space-y-3">
            {comprasAprobadas.slice(0, 8).map((compra) => (
              <div key={compra.id} className="bg-zinc-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:justify-between gap-2">
                <div>
                  <p className="font-black">{compra.nombre_alumno || compra.alumno_nombre || 'Alumno PowerFit'}</p>
                  <p className="text-zinc-400 text-sm">{fechaCompra(compra).toLocaleDateString()}</p>
                </div>
                <p className="text-green-400 font-black">${Number(compra.monto || 0).toLocaleString('es-CL')}</p>
              </div>
            ))}

            {comprasAprobadas.length === 0 && (
              <p className="text-zinc-400">Aún no hay compras aprobadas.</p>
            )}
          </div>
        </div>
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
  const hoy = new Date()
  const esEsteMes = (fecha) => {
    const parsed = new Date(fecha)
    return parsed.getMonth() === hoy.getMonth() && parsed.getFullYear() === hoy.getFullYear()
  }
  const asistenciasMes = asistencias.filter((item) => esEsteMes(item.fecha || item.created_at))
  const evaluacionesMes = recordsEntrenamiento.filter((item) => esEsteMes(fechaRecord(item)))
  const mejorRm = mejorRecord(recordsEntrenamiento, (record) => Number(record.peso_kg))
  const mejorTiempo = mejorRecord(recordsEntrenamiento, (record) => Number(record.tiempo_segundos), true)
  const mejorSalto = mejorRecord(recordsEntrenamiento, (record) =>
    String(record.rutina_nombre || '').toLowerCase().includes('salto')
  )
  const mejorVueltas = mejorRecord(recordsEntrenamiento, (record) => Number(record.vueltas))
  const ranking = students
    .map((alumno) => ({
      alumno,
      asistencias: asistencias.filter((item) => String(item.alumno_id) === String(alumno.id)).length,
      evaluaciones: recordsEntrenamiento.filter((item) => String(item.alumno_id) === String(alumno.id)).length,
    }))
    .sort((a, b) => b.asistencias + b.evaluaciones - (a.asistencias + a.evaluaciones))

  return (
    <div className="space-y-6">
      <div className="bg-zinc-900 border border-green-600 rounded-2xl sm:rounded-3xl p-4 sm:p-6">
        <h2 className="text-3xl sm:text-4xl font-black text-green-400">
          Estadísticas
        </h2>
        <p className="text-zinc-400 mt-2">
          Lectura mensual de asistencia, pagos, evaluaciones, records y crecimiento PowerFit.
        </p>
      </div>

      <div className="grid md:grid-cols-4 gap-4">
        <Info label="Pagados" value={pagados} />
        <Info label="Pendientes" value={pendientes} />
        <Info label="Morosos" value={morosos} />
        <Info label="Evaluaciones" value={recordsEntrenamiento.length} />
      </div>

      <div className="grid md:grid-cols-4 gap-4">
        <Info label="Asistencias mes" value={asistenciasMes.length} />
        <Info label="Evaluaciones mes" value={evaluacionesMes.length} />
        <Info label="Alumnos activos" value={students.length} />
        <Info label="Adherencia prom." value={`${students.length ? Math.round((asistenciasMes.length / students.length) * 10) / 10 : 0} asist.`} />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-zinc-900 border border-zinc-700 rounded-2xl sm:rounded-3xl p-4 sm:p-6">
          <h3 className="text-2xl font-black text-green-300 mb-4">
            Ranking asistencia + evaluaciones
          </h3>
          <div className="space-y-3">
            {ranking.slice(0, 12).map(({ alumno, asistencias: total, evaluaciones }) => (
              <div key={alumno.id} className="grid sm:grid-cols-4 gap-3 bg-zinc-800 rounded-2xl p-4">
                <p className="font-black">{alumno.nombre || '-'}</p>
                <p>{total} asistencias</p>
                <p>{evaluaciones} evaluaciones</p>
                <StatusBadge estado={alumno.estado_pago} />
              </div>
            ))}
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-700 rounded-2xl sm:rounded-3xl p-4 sm:p-6">
          <h3 className="text-2xl font-black text-green-300 mb-4">
            Mejores marcas PowerFit
          </h3>
          <div className="space-y-3">
            {[mejorRm, mejorTiempo, mejorSalto, mejorVueltas].filter(Boolean).map((record) => (
              <div key={record.id} className="bg-zinc-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <p className="font-black">{record.rutina_nombre || 'Record PowerFit'}</p>
                  <p className="text-zinc-400 text-sm">
                    {new Date(fechaRecord(record)).toLocaleDateString()} - ATR {faseAtrRecord(record)}
                  </p>
                </div>
                <p className="text-red-400 font-black">
                  {valorRecord(record)} {unidadRecord(record)}
                </p>
              </div>
            ))}

            {!mejorRm && !mejorTiempo && !mejorSalto && !mejorVueltas && (
              <p className="text-zinc-400">Aún no hay records suficientes para comparar.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function NotificacionesPanel({ students, registroCompras, avatarRequests, student, isAdmin }) {
  const comprasPendientes = registroCompras.filter(
    (compra) => (compra.estado || compra.estado_pago || 'Pendiente') !== 'Aprobado'
  )
  const avatarsPendientes = avatarRequests.filter(
    (solicitud) => (solicitud.estado || 'Pendiente') === 'Pendiente'
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

      <div className="grid md:grid-cols-4 gap-4">
        <Info label="Compras pendientes" value={comprasPendientes.length} />
        <Info label="Avatar IA" value={avatarsPendientes.length} />
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
          {[
            ...avatarsPendientes.map((item) => ({ ...item, tipoAlerta: 'Avatar IA pendiente' })),
            ...comprasPendientes,
            ...alumnosPorVencer,
            ...morosos,
          ].slice(0, 16).map((item, index) => (
            <div key={item.id || index} className="bg-zinc-800 rounded-2xl p-4">
              <p className="font-black">{item.tipoAlerta || item.nombre_alumno || item.nombre || 'Alumno'}</p>
              <p className="text-zinc-400">
                {item.tipoAlerta
                  ? `Alumno #${item.alumno_id || '-'} - plantilla ${item.template || 'champion_red'}`
                  : item.monto
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
  const [avatarRequests, setAvatarRequests] = useState([])
  const [section, setSection] = useState(() => {
    const requestedSection = new URLSearchParams(window.location.search).get('section')
    return requestedSection || getAppEdition().sections[0] || 'AsistenciaQR'
  })
  const [busquedaAdmin, setBusquedaAdmin] = useState('')
  const [alumnoDetalle, setAlumnoDetalle] = useState(null)
  const [loading, setLoading] = useState(true)
  const [passwordRecovery, setPasswordRecovery] = useState(false)
  const [idioma, setIdioma] = useState(() => localStorage.getItem('powerfit_idioma') || 'es')
  const [branding, setBranding] = useState(() => loadBranding())
  const [gimnasio, setGimnasio] = useState(null)
  const [pwaUpdate, setPwaUpdate] = useState(null)

  const params = new URLSearchParams(window.location.search)
  const alumnoCheckIn = params.get('checkin')
  const edition = getAppEdition()
  const t = UI_TEXT[idioma] || UI_TEXT.es

  useEffect(() => listenForPowerFitUpdate(setPwaUpdate), [])

  useEffect(() => {
    document.title = `${edition.appName || 'PowerFit 360'}`
  }, [edition.appName])

  function editionAllows(sectionName) {
    return edition.sections.includes(sectionName)
  }

  function canOpenSection(sectionName, adminStatus) {
    if (!editionAllows(sectionName)) return false
    if (['Admin', 'Entrenamientos', 'RegistroCompras', 'Reportes', 'Marca'].includes(sectionName)) {
      return adminStatus
    }

    return true
  }

  function cambiarIdioma(nuevoIdioma) {
    setIdioma(nuevoIdioma)
    localStorage.setItem('powerfit_idioma', nuevoIdioma)
  }

  async function cargarMarcaGimnasio() {
    const { data, error } = await supabase.rpc('get_powerfit_brand_settings')

    if (error || !data) {
      setGimnasio(null)
      return
    }

    const brandState = {
      id: 1,
      nombre: data.organization_name || data.app_name || DEFAULT_BRANDING.appName,
      logo_url: data.logo_url || DEFAULT_BRANDING.logoUrl,
      comision_powerfit: 0,
    }

    setGimnasio(brandState)

    const nextBranding = {
      ...DEFAULT_BRANDING,
      appName: data.app_name || DEFAULT_BRANDING.appName,
      schoolName: data.organization_name || '',
      logoUrl: data.logo_url || DEFAULT_BRANDING.logoUrl,
    }

    setBranding(nextBranding)
    saveBranding(nextBranding)
  }

  async function guardarMarcaGimnasio(nextBranding) {
    const { data, error } = await supabase.rpc('save_powerfit_brand_settings', {
      p_organization_name:
        nextBranding.schoolName || nextBranding.appName || DEFAULT_BRANDING.appName,
      p_app_name: nextBranding.appName || DEFAULT_BRANDING.appName,
      p_logo_url: nextBranding.logoUrl || DEFAULT_BRANDING.logoUrl,
      p_support_contact: null,
      p_reason: 'Actualizacion de marca desde PowerFit 360',
    })

    if (error || !data) {
      window.alert(`No se pudo guardar la marca: ${error?.message || 'sin respuesta'}`)
      return
    }

    const brandState = {
      id: 1,
      nombre: data.organization_name || data.app_name,
      logo_url: data.logo_url,
      comision_powerfit: 0,
    }

    setGimnasio(brandState)

    const persisted = {
      ...DEFAULT_BRANDING,
      appName: data.app_name || nextBranding.appName,
      schoolName: data.organization_name || nextBranding.schoolName || '',
      logoUrl: data.logo_url || nextBranding.logoUrl,
    }

    setBranding(persisted)
    saveBranding(persisted)
  }

  async function asegurarFichaAlumno(currentUser) {
    if (!currentUser?.id) return null

    const metadata = currentUser.user_metadata || {}
    const { error: bootstrapError } = await supabase.rpc('ensure_powerfit_self_profile', {
      p_nombre:
        metadata.nombre ||
        (currentUser.email ? currentUser.email.split('@')[0] : 'Alumno'),
      p_telefono: metadata.telefono || '',
      p_fecha_nacimiento: metadata.fecha_nacimiento || null,
      p_contacto_emergencia: metadata.contacto_emergencia || '',
      p_categoria: metadata.categoria || '',
    })

    if (bootstrapError) {
      console.error('No se pudo asegurar la ficha PowerFit:', bootstrapError)
      return null
    }

    const { data, error } = await supabase.rpc('get_powerfit_self_profile_secure')

    if (error) {
      console.error('No se pudo cargar el perfil seguro:', error)
      return null
    }

    return data?.profile || null
  }

  async function cargarUsuario(currentUser = user) {
    if (!currentUser) return

    const alumno = await asegurarFichaAlumno(currentUser)

    let alumnoActual = alumno ? alumnoConEstadoAutomatico(alumno) : null

    if (alumnoActual?.foto_storage_path) {
      const privatePhotos = supabase.storage.from('profile-photos-private')
      const { data: signedPhoto, error: signedError } =
        await privatePhotos.createSignedUrl(alumnoActual.foto_storage_path, 3600)

      if (!signedError && signedPhoto?.signedUrl) {
        alumnoActual = {
          ...alumnoActual,
          foto_url: signedPhoto.signedUrl,
        }
      }
    }

    setStudent(alumnoActual)
    await cargarMarcaGimnasio(alumnoActual)

    if (alumnoActual?.id) {
      const { data: historyData, error: historyError } = await supabase.rpc(
        'get_powerfit_training_history_secure',
        {
          p_alumno_id: alumnoActual.id,
          p_limit: 100,
        },
      )

      setRecordsEntrenamiento(historyError ? [] : historyData?.records || [])
      setRmsAlumno(historyError ? [] : historyData?.rm || [])
    } else {
      setRecordsEntrenamiento([])
      setRmsAlumno([])
    }

    const { data: purchaseCenter, error: comprasError } = await supabase.rpc(
      'get_powerfit_purchase_center',
    )

    if (comprasError) {
      console.error('Error cargando solicitudes de compra:', comprasError)
      setRegistroCompras([])
    } else {
      const comprasNormalizadas = (purchaseCenter?.requests || []).map((item) => ({
        id: item.id,
        alumno_id: item.alumno_id,
        nombre_alumno: item.nombre,
        monto: item.amount,
        generaciones: item.generations,
        estado:
          item.legacy_status ||
          (item.status === 'approved'
            ? 'Aprobado'
            : item.status === 'rejected'
              ? 'Rechazado'
              : item.status === 'cancelled'
                ? 'Cancelado'
                : 'Pendiente'),
        created_at: item.created_at,
        origin: item.origin,
        status: item.status,
        credit_status: item.credit_status,
        package_id: item.package_id,
        decision_note: item.decision_note,
        decided_at: item.decided_at,
      }))

      setRegistroCompras(ordenarCompras(comprasNormalizadas))
    }

    const { data: avatarQueue, error: avatarError } = await supabase.rpc(
      'get_powerfit_avatar_ai_queue',
    )

    const avatarNormalizados = (avatarQueue?.items || []).map((item) => ({
      id: item.request_id,
      alumno_id: item.alumno_id,
      nombre: item.nombre,
      nombre_alumno: item.nombre,
      template: item.template,
      estado: item.status,
      credit_status: item.credit_status,
      costo_creditos: item.cost_credits,
      foto_storage_path: item.source_photo?.storage_path || null,
      foto_url: item.source_photo?.reference || null,
      resultado_storage_path: item.result?.storage_path || null,
      resultado_url: item.result?.reference || null,
      created_at: item.created_at,
      completed_at: item.completed_at,
      rejected_at: item.rejected_at,
      decision_note: item.decision_note,
    }))

    setAvatarRequests(avatarError ? [] : avatarNormalizados)

    const { data: directoryData, error: directoryError } = await supabase.rpc(
      'get_powerfit_student_directory_full_secure',
    )

    const alumnosData = directoryError ? [] : directoryData?.students || []
    const alumnosNormalizados = alumnosData.map(alumnoConEstadoAutomatico)

    setStudents(alumnosNormalizados)
    setAlumnoDetalle((actual) => {
      if (!actual) return null

      return (
        alumnosNormalizados.find((item) => String(item.id) === String(actual.id)) ||
        null
      )
    })

    const { data: attendanceOverview, error: attendanceError } = await supabase.rpc(
      'get_powerfit_attendance_overview_secure',
      {
        p_limit: 1000,
      },
    )

    if (attendanceError) {
      console.error('Error cargando asistencia segura:', attendanceError)
      setAsistencias([])
    } else {
      setAsistencias(attendanceOverview?.items || [])
    }
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
    const { error } = await supabase.rpc(
      'update_powerfit_student_field_admin_secure',
      {
        p_alumno_id: id,
        p_field: campo,
        p_value: valor,
        p_reason: 'Edicion administrativa desde ficha de alumno PowerFit 360',
      },
    )

    if (error) {
      window.alert(`No se pudo actualizar el alumno: ${error.message}`)
      return
    }

    await cargarUsuario()
  }
  async function guardarPerfilVisual(payload) {
    if (!student?.id) {
      return { ok: false, message: 'No se encontro la ficha del alumno.' }
    }

    const { error } = await supabase.rpc('save_powerfit_visual_profile', {
      p_alumno_id: student.id,
      p_avatar_template:
        payload?.avatar_template || student.avatar_template || 'champion_red',
      p_photo_storage_path:
        payload?.foto_storage_path || student.foto_storage_path || null,
      p_clear_photo: false,
      p_reason: 'Actualizacion de perfil visual desde PowerFit 360',
    })

    if (error) {
      return { ok: false, message: error.message }
    }

    await cargarUsuario()
    return { ok: true }
  }

  async function subirFotoPerfil(file, resizedDataUrl = null) {
    if (!user?.id || !student?.id || !file) return null

    const sourceBlob = resizedDataUrl
      ? await fetch(resizedDataUrl).then((response) => response.blob())
      : file

    const mime = sourceBlob.type || file.type || 'image/jpeg'

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(mime)) {
      throw new Error('Formato de imagen no permitido. Usa JPG, PNG o WebP.')
    }

    if (sourceBlob.size > 3 * 1024 * 1024) {
      throw new Error('La foto supera el limite de 3 MB.')
    }

    const extension =
      mime === 'image/png' ? 'png' : mime === 'image/webp' ? 'webp' : 'jpg'

    const path = `${user.id}/${student.id}/profile-${Date.now()}.${extension}`
    const privatePhotos = supabase.storage.from('profile-photos-private')

    const { error: uploadError } = await privatePhotos.upload(path, sourceBlob, {
      cacheControl: '3600',
      contentType: mime,
      upsert: false,
    })

    if (uploadError) {
      throw new Error(`No se pudo subir la foto privada: ${uploadError.message}`)
    }

    const { data: signedPhoto, error: signedError } =
      await privatePhotos.createSignedUrl(path, 3600)

    if (signedError) {
      console.warn('Foto privada subida sin preview firmado:', signedError.message)
    }

    return {
      storagePath: path,
      previewUrl: signedPhoto?.signedUrl || resizedDataUrl || null,
    }
  }

  async function solicitarAvatarIA(payload) {
    if (!student?.id) {
      return { ok: false, message: 'No se encontro la ficha del alumno.' }
    }

    const tieneFoto =
      payload?.foto_storage_path ||
      student?.foto_storage_path ||
      payload?.foto_url ||
      student?.foto_url

    if (!tieneFoto) {
      return { ok: false, message: 'Primero sube una foto de rostro.' }
    }

    const { error } = await supabase.rpc('request_powerfit_avatar_ai', {
      p_template: payload?.avatar_template || 'champion_red',
    })

    if (error) {
      return { ok: false, message: error.message }
    }

    await cargarUsuario()
    return { ok: true }
  }

  async function actualizarSolicitudAvatarIA(solicitud, estado, resultadoUrl = '') {
    const decision =
      estado === 'Completado'
        ? 'completed'
        : estado === 'Rechazado'
          ? 'rejected'
          : estado

    const { error } = await supabase.rpc('decide_powerfit_avatar_ai', {
      p_request_id: solicitud.id,
      p_decision: decision,
      p_result_url: resultadoUrl || null,
      p_result_storage_path: null,
      p_note: 'Actualizado desde panel PowerFit 360',
    })

    if (error) {
      window.alert(`No se pudo actualizar la solicitud: ${error.message}`)
      return
    }

    await cargarUsuario()
  }

  async function aceptarTerminos(payload) {
    if (!student?.id) {
      return { ok: false, message: 'No se encontro la ficha del alumno.' }
    }

    const { error } = await supabase.rpc('accept_powerfit_terms', {
      p_version: payload.version,
      p_accept_terms: Boolean(payload.acepto_terminos),
      p_accept_contract: Boolean(payload.acepto_contrato),
      p_user_agent: payload.user_agent || navigator.userAgent,
    })

    if (error) {
      return { ok: false, message: error.message }
    }

    await cargarUsuario()
    return { ok: true }
  }

  async function registrarPago(alumno, fechaPago = fechaHoy()) {
    await aplicarPagoConfirmado(alumno, fechaPago)
  }

  async function aplicarPagoConfirmado(alumno, fechaPago = fechaHoy()) {
    if (!alumno?.id) return

    const requestId = `payment-${alumno.id}-${Date.now()}`

    const { error } = await supabase.rpc(
      'register_powerfit_payment_with_generation_reset_secure',
      {
        p_client_request_id: requestId,
        p_alumno_id: alumno.id,
        p_payment_method: 'manual',
        p_period_start: alumno.fecha_vencimiento
          ? null
          : fechaPago || fechaHoy(),
        p_months: 1,
        p_amount:
          Number.isFinite(Number(alumno.monto)) && Number(alumno.monto) > 0
            ? Number(alumno.monto)
            : null,
        p_notes: 'Pago registrado desde panel PowerFit 360',
        p_paid_on: fechaPago || fechaHoy(),
        p_generation_balance: 6,
      },
    )

    if (error) {
      window.alert(`No se pudo registrar el pago: ${error.message}`)
      return
    }

    await cargarUsuario()
  }

  async function aprobarSolicitud(solicitud) {
    if (!solicitud?.id) return

    const { error } = await supabase.rpc(
      'approve_powerfit_purchase_request_compat_secure',
      {
        p_request_id: solicitud.id,
        p_note: 'Aprobado desde panel administrativo PowerFit 360',
      },
    )

    if (error) {
      window.alert(`No se pudo aprobar la solicitud: ${error.message}`)
      return
    }

    await cargarUsuario()
  }

  async function eliminarGeneraciones(alumno) {
    const { error } = await supabase.rpc('adjust_powerfit_generation_balance', {
      p_alumno_id: alumno.id,
      p_target_balance: 0,
      p_reason: 'Reinicio manual de generaciones desde panel administrativo',
    })

    if (error) {
      window.alert(`No se pudieron reiniciar las generaciones: ${error.message}`)
      return
    }

    await cargarUsuario()
  }

  async function eliminarAlumno(alumno) {
    const confirmado = window.confirm(
      `Eliminar definitivamente a ${alumno.nombre || 'este alumno'}? Solo se borrara si no tiene historial.`
    )

    if (!confirmado) return

    const { error } = await supabase.rpc('hard_delete_powerfit_student_if_empty', {
      p_alumno_id: alumno.id,
      p_reason: 'Eliminacion solicitada desde panel administrativo PowerFit 360',
    })

    if (error) {
      const tieneHistorial = String(error.message || '').includes('STUDENT_HAS_HISTORY')
      window.alert(
        tieneHistorial
          ? 'Este alumno tiene historial y no puede eliminarse fisicamente. Sus datos deportivos se conservaran.'
          : `No se pudo eliminar el alumno: ${error.message}`
      )
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
  const termsFeatureActive = Object.prototype.hasOwnProperty.call(
    student || {},
    'terminos_aceptados'
  )
  const termsAccepted =
    !termsFeatureActive ||
    (Boolean(student?.terminos_aceptados) && student?.terminos_version === TERMS_VERSION)
  const visibleSection = canOpenSection(section, isAdmin) ? section : 'AsistenciaQR'
  const pagoAlDia = student?.estado_pago === 'Pagado'
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

  if (!termsAccepted) {
    return (
      <TermsGate
        student={student}
        user={user}
        branding={branding}
        onAccept={aceptarTerminos}
      />
    )
  }

  return (
    <div className="min-h-screen bg-black text-white px-3 py-4 sm:p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
      <div className="max-w-7xl mx-auto">
      {pwaUpdate && (
        <div className="mb-3 sm:mb-4 bg-green-600 text-white rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <p className="font-black">Nueva versión disponible</p>
            <p className="text-sm text-green-50">Actualiza PowerFit 360 para usar los últimos cambios.</p>
          </div>
          <button
            onClick={() => applyPowerFitUpdate(pwaUpdate)}
            className="bg-black/30 hover:bg-black/50 px-4 py-3 rounded-xl font-black"
          >
            Actualizar app
          </button>
        </div>
      )}

      <div className="bg-zinc-900 border border-red-600 rounded-2xl sm:rounded-3xl p-4 sm:p-5 mb-3 sm:mb-6 flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
        <div className="min-w-0 flex items-center gap-4">
          <img
            src={branding.logoUrl || DEFAULT_BRANDING.logoUrl}
            alt={branding.appName || DEFAULT_BRANDING.appName}
            className="h-20 w-20 sm:h-24 sm:w-24 rounded-full object-cover border border-red-600"
          />
          <div className="min-w-0">
            <h1 className="text-3xl sm:text-4xl font-black text-red-500">
              {branding.appName || DEFAULT_BRANDING.appName}
            </h1>
            {branding.schoolName && (
              <p className="text-zinc-400 truncate">{branding.schoolName}</p>
            )}
            <p className="text-zinc-300 truncate">{student?.nombre || user.email}</p>
            <p className="text-yellow-400 font-black">
              {isAdmin ? t.admin : t.student}
            </p>
            <p className="text-xs sm:text-sm text-blue-300 font-black uppercase">
              {edition.label} · {edition.audience}
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

      <div data-nav-items={Object.keys(NAV_ITEMS).length} className="sticky top-0 z-40 -mx-3 sm:mx-0 px-3 sm:px-0 py-3 mb-5 sm:mb-8 bg-black/95 backdrop-blur border-y border-zinc-900 sm:border-0">
        <div className="flex flex-nowrap sm:flex-wrap gap-3 overflow-x-auto pb-1 sm:pb-0">
          {isAdmin && <Btn show={editionAllows('Admin')} text={t.adminStudents} active={visibleSection === 'Admin'} set={() => setSection('Admin')} />}
          {isAdmin && <Btn show={editionAllows('Entrenamientos')} text={t.customTrainings} active={visibleSection === 'Entrenamientos'} set={() => setSection('Entrenamientos')} />}
          <Btn show={editionAllows('AsistenciaQR')} text={t.attendanceQr} active={visibleSection === 'AsistenciaQR'} set={() => setSection('AsistenciaQR')} />
          <Btn show={editionAllows('XPRangos')} text={t.xpRanks} active={visibleSection === 'XPRangos'} set={() => setSection('XPRangos')} />
          <Btn show={editionAllows('Metodos')} text={t.library} active={visibleSection === 'Metodos'} set={() => setSection('Metodos')} />
          <Btn show={editionAllows('Generador')} text={t.aiGenerator} active={visibleSection === 'Generador'} set={() => setSection('Generador')} />
          <Btn show={editionAllows('Constructor')} text={t.workoutBuilder} active={visibleSection === 'Constructor'} set={() => setSection('Constructor')} />
          <Btn show={editionAllows('Rutinas')} text={t.routines} active={visibleSection === 'Rutinas'} set={() => setSection('Rutinas')} />
          <Btn show={editionAllows('Premium')} text={t.premium} active={visibleSection === 'Premium'} set={() => setSection('Premium')} />
          <Btn show={editionAllows('Reportes')} text={t.reports} active={visibleSection === 'Reportes'} disabled={!isAdmin} set={() => setSection('Reportes')} />
          <Btn show={editionAllows('Estadísticas')} text={t.stats} active={visibleSection === 'Estadísticas'} set={() => setSection('Estadísticas')} />
          <Btn show={editionAllows('Notificaciones')} text={t.notifications} active={visibleSection === 'Notificaciones'} set={() => setSection('Notificaciones')} />

          <Btn show={editionAllows('Ficha')} text={t.profile} active={visibleSection === 'Ficha'} set={() => setSection('Ficha')} />
          <Btn show={editionAllows('Pago')} text={t.payment} active={visibleSection === 'Pago'} set={() => setSection('Pago')} />
          <Btn show={editionAllows('Evaluaciones')} text={t.evaluations} active={visibleSection === 'Evaluaciones'} set={() => setSection('Evaluaciones')} />
          {isAdmin && <Btn show={editionAllows('RegistroCompras')} text={t.purchaseLog} active={visibleSection === 'RegistroCompras'} set={() => setSection('RegistroCompras')} />}
          {isAdmin && <Btn show={edition.allowBranding && editionAllows('Marca')} text={t.brandSettings} active={visibleSection === 'Marca'} set={() => setSection('Marca')} />}
        </div>
      </div>

      {mostrarAvisoVencimiento && (
        <div className="bg-yellow-500 text-black rounded-2xl sm:rounded-3xl p-5 sm:p-6 mb-8">
          <h2 className="text-2xl sm:text-3xl font-black">MEMBRESÍA POR VENCER</h2>
          <p className="mt-2 font-bold">
            Tu membresía vence {diasParaVencer === 0 ? 'hoy' : `en ${diasParaVencer} día(s)`}.
            Regulariza el pago para mantener tu situación financiera al día.
          </p>
          <button
            onClick={abrirPagoMensualidad}
            className="mt-5 bg-green-700 hover:bg-green-800 text-white px-6 py-4 rounded-2xl font-black"
          >
            Pagar mensualidad
          </button>
        </div>
      )}

      {editionAllows('AsistenciaQR') && visibleSection === 'AsistenciaQR' && (
        <AsistenciaQrPanel
          student={student}
          students={students}
          asistencias={asistencias}
          isAdmin={isAdmin}
        />
      )}

      {editionAllows('XPRangos') && visibleSection === 'XPRangos' && (
        <XpRangosPanel
          student={student}
          students={students}
          isAdmin={isAdmin}
        />
      )}

      {editionAllows('Metodos') && visibleSection === 'Metodos' && <MetodosPage idioma={idioma} />}

      {editionAllows('Generador') && visibleSection === 'Generador' && (
        <GeneradorPage student={student} onUpdateStudent={() => cargarUsuario()} idioma={idioma} />
      )}

      {editionAllows('Constructor') && visibleSection === 'Constructor' && (
        <ConstructorPage student={student} onUpdateStudent={() => cargarUsuario()} idioma={idioma} />
      )}

      {editionAllows('Entrenamientos') && visibleSection === 'Entrenamientos' && isAdmin && (
        <EntrenamientosCoachPanel
          students={students}
          user={user}
          onSaved={() => cargarUsuario()}
        />
      )}

      {editionAllows('Rutinas') && visibleSection === 'Rutinas' && (
        <RutinasPage student={student} onUpdateStudent={() => cargarUsuario()} />
      )}

      {editionAllows('Premium') && visibleSection === 'Premium' && (
        <PremiumPanel
          student={student}
          abrirPagoMensualidad={abrirPagoMensualidad}
        />
      )}

      {editionAllows('Reportes') && visibleSection === 'Reportes' && isAdmin && (
        <ReportesPanel
          students={students}
          asistencias={asistencias}
          registroCompras={registroCompras}
          recordsEntrenamiento={recordsEntrenamiento}
          descargarCSV={descargarCSV}
        />
      )}

      {editionAllows('Estadísticas') && visibleSection === 'Estadísticas' && (
        <EstadísticasPanel
          students={students}
          asistencias={asistencias}
          recordsEntrenamiento={recordsEntrenamiento}
        />
      )}

      {editionAllows('Notificaciones') && visibleSection === 'Notificaciones' && (
        <NotificacionesPanel
          students={students}
          registroCompras={registroCompras}
          avatarRequests={avatarRequests}
          student={student}
          isAdmin={isAdmin}
        />
      )}

      {editionAllows('Ficha') && visibleSection === 'Ficha' && (
        <div className="bg-zinc-900 border border-yellow-500 rounded-2xl sm:rounded-3xl p-4 sm:p-6">
          <h2 className="text-3xl sm:text-4xl font-black text-yellow-400 mb-6">Ficha personal</h2>

          <ProfileAvatarPanel
            key={`${student?.id || 'self'}-${student?.foto_storage_path || student?.foto_url || 'no-photo'}-${student?.avatar_template || 'champion_red'}`}
            student={student}
            onSave={guardarPerfilVisual}
            onUploadPhoto={subirFotoPerfil}
            onRequestAiAvatar={solicitarAvatarIA}
          />

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

      {editionAllows('Pago') && visibleSection === 'Pago' && (
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

      {editionAllows('Evaluaciones') && visibleSection === 'Evaluaciones' && (
        <EvaluacionesPage
          student={student}
          user={user}
          onSaved={() => cargarUsuario()}
        />
      )}

      {editionAllows('Admin') && visibleSection === 'Admin' && isAdmin && (
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

      {editionAllows('RegistroCompras') && visibleSection === 'RegistroCompras' && isAdmin && (
        <RegistroComprasPage
          registroCompras={registroCompras}
          avatarRequests={avatarRequests}
          aprobarSolicitud={aprobarSolicitud}
          actualizarSolicitudAvatarIA={actualizarSolicitudAvatarIA}
          descargarCSV={descargarCSV}
        />
      )}

      {edition.allowBranding && editionAllows('Marca') && visibleSection === 'Marca' && isAdmin && (
        <BrandSettingsPanel
          branding={branding}
          setBranding={setBranding}
          edition={edition}
          gimnasio={gimnasio}
          onSaveRemote={guardarMarcaGimnasio}
        />
      )}

      <AdminAlumnoModal
        key={alumnoDetalle?.id || 'closed'}
        alumno={alumnoDetalle}
        asistencias={asistencias}
        onClose={() => setAlumnoDetalle(null)}
        onUpdate={actualizarAlumno}
        onRegistrarPago={registrarPago}
        onEnviarPago={abrirPagoAlumno}
        onEliminarGeneraciones={eliminarGeneraciones}
        onEliminarAlumno={eliminarAlumno}
      />
      <div className="fixed bottom-3 right-3 z-50 rounded-full border border-red-600/60 bg-black/80 px-3 py-2 text-[11px] font-black uppercase tracking-wide text-zinc-300 shadow-lg">
        {POWERFIT_SIGNATURE}
      </div>
      </div>
    </div>
  )
}

