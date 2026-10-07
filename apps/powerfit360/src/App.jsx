import { lazy, Suspense, useEffect, useState } from 'react'
import './App.css'
import { DEFAULT_BRANDING, POWERFIT_SIGNATURE, getAppEdition, loadBranding, saveBranding } from './appConfig'
import { applyPowerFitUpdate, listenForPowerFitUpdate } from './pwa'
import { supabase } from './supabase'

import CheckInPage from './pages/CheckInPage'
import LoginPage from './pages/LoginPage'
import MiQRPage from './pages/MiQRPage'
import PremiumDesktopNav from './PremiumDesktopNav'
import ChatWidget from './components/ChatWidget'
import SelfProfileEditor from './components/SelfProfileEditor'

const CombatPathPage = lazy(() => import('./pages/CombatPathPage'))
const ConstructorPage = lazy(() => import('./pages/ConstructorPage'))
const GeneradorPage = lazy(() => import('./pages/GeneradorPage'))
const MetodosPage = lazy(() => import('./pages/MetodosPage'))
const RegistroComprasPage = lazy(() => import('./pages/RegistroComprasPage'))
const RutinasPage = lazy(() => import('./pages/RutinasPage'))
const AssignedTrainingPage = lazy(() => import('./pages/AssignedTrainingPage'))

function LazyPanelFallback() {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6 text-zinc-300">
      Cargando módulo...
    </div>
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
    myTraining: 'Mi entrenamiento',
    combatPath: 'Mi Camino',
    graduations: 'Graduaciones',
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
    myTraining: 'My training',
    combatPath: 'My Path',
    graduations: 'Graduations',
    adminStudents: 'STUDENTS ADMIN',
    purchaseLog: 'Purchase log',
    brandSettings: 'Brand',
    language: 'Language',
    payMonthly: 'Pay monthly fee',
  },
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

const PAYMENT_PLANS = [
  {
    code: 'monthly',
    name: 'Plan mensual',
    months: 1,
    amount: 40000,
    saving: 0,
    badge: 'Ideal para comenzar',
  },
  {
    code: 'quarterly',
    name: 'Plan trimestral',
    months: 3,
    amount: 105000,
    saving: 15000,
    badge: 'Más elegido',
  },
  {
    code: 'semiannual',
    name: 'Plan semestral',
    months: 6,
    amount: 190000,
    saving: 50000,
    badge: 'Mejor relación precio/beneficio',
  },
  {
    code: 'annual',
    name: 'Plan anual',
    months: 12,
    amount: 360000,
    saving: 120000,
    badge: 'Mejor oferta',
  },
]

function paymentPlanByCode(code) {
  return PAYMENT_PLANS.find((plan) => plan.code === code) || PAYMENT_PLANS[0]
}

function formatearCLP(value) {
  return `$${Number(value || 0).toLocaleString('es-CL')}`
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
  onReintegrarAlumno,
}) {
  const [fechaPago, setFechaPago] = useState(fechaHoy())
  const [planPago, setPlanPago] = useState('monthly')
  const [metodoPago, setMetodoPago] = useState('efectivo')

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
                defaultValue={alumno.rut || ''}
                onBlur={(e) => onUpdate(alumno.id, 'rut', e.target.value)}
                className="bg-black p-3 rounded-xl"
                placeholder="RUT"
              />
              <input
                defaultValue={alumno.telefono || ''}
                onBlur={(e) => onUpdate(alumno.id, 'telefono', e.target.value)}
                className="bg-black p-3 rounded-xl"
                placeholder="Teléfono"
              />
              <input
                defaultValue={alumno.contacto_emergencia || ''}
                onBlur={(e) => onUpdate(alumno.id, 'contacto_emergencia', e.target.value)}
                className="bg-black p-3 rounded-xl"
                placeholder="Contacto de emergencia"
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
                onBlur={(e) =>
                  onUpdate(alumno.id, 'peso', e.target.value === '' ? null : Number(e.target.value))
                }
                className="bg-black p-3 rounded-xl"
                placeholder="Peso (kg)"
              />
              <input
                type="number"
                defaultValue={alumno.altura || ''}
                onBlur={(e) =>
                  onUpdate(alumno.id, 'altura', e.target.value === '' ? null : Number(e.target.value))
                }
                className="bg-black p-3 rounded-xl"
                placeholder="Estatura (cm)"
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
              <div className="rounded-xl border border-zinc-800 bg-black p-3">
                <p className="text-xs font-black uppercase tracking-wide text-zinc-500">Edad automática</p>
                <p className="mt-1 text-lg font-black text-white">{alumno.edad ?? '-'}</p>
              </div>
              <textarea
                defaultValue={alumno.observaciones || ''}
                onBlur={(e) => onUpdate(alumno.id, 'observaciones', e.target.value)}
                className="min-h-28 bg-black p-3 rounded-xl md:col-span-2"
                placeholder="Observaciones"
              />
            </div>


            <div className="mt-5">
              <p className="text-sm font-black text-zinc-300 mb-3">Plan contratado</p>
              <div className="grid sm:grid-cols-2 gap-3">
                {PAYMENT_PLANS.map((plan) => {
                  const active = planPago === plan.code

                  return (
                    <button
                      key={plan.code}
                      type="button"
                      onClick={() => setPlanPago(plan.code)}
                      className={`text-left rounded-2xl border p-4 transition ${
                        active
                          ? 'border-yellow-400 bg-yellow-500/10 shadow-lg shadow-yellow-950/20'
                          : 'border-zinc-700 bg-zinc-950 hover:border-zinc-500'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className={`font-black uppercase ${active ? 'text-yellow-300' : 'text-white'}`}>
                            {plan.name}
                          </p>
                          <p className="text-2xl font-black mt-1">{formatearCLP(plan.amount)}</p>
                          <p className="text-sm text-zinc-400">
                            {plan.months} {plan.months === 1 ? 'mes' : 'meses'}
                          </p>
                        </div>
                        {plan.badge && (
                          <span className="rounded-lg bg-zinc-800 px-2 py-1 text-[11px] font-black uppercase text-zinc-200">
                            {plan.badge}
                          </span>
                        )}
                      </div>

                      {plan.saving > 0 && (
                        <p className="mt-3 text-sm font-black text-green-400">
                          Ahorras {formatearCLP(plan.saving)}
                        </p>
                      )}
                    </button>
                  )
                })}
              </div>

              <div className="mt-3 rounded-xl border border-zinc-700 bg-black p-3 text-sm">
                <span className="text-zinc-400">Seleccionado: </span>
                <span className="font-black text-white">
                  {paymentPlanByCode(planPago).name} · {formatearCLP(paymentPlanByCode(planPago).amount)} ·{' '}
                  {paymentPlanByCode(planPago).months} {paymentPlanByCode(planPago).months === 1 ? 'mes' : 'meses'}
                </span>
              </div>
            </div>
            <div className="mt-5">
              <label className="grid gap-2 text-sm font-black text-zinc-300">
                <span>Método de pago manual</span>
                <select
                  value={metodoPago}
                  onChange={(e) => setMetodoPago(e.target.value)}
                  className="w-full bg-black p-3 rounded-xl text-white border border-zinc-700"
                >
                  <option value="efectivo">Efectivo</option>
                  <option value="transferencia">Transferencia bancaria</option>
                  <option value="deposito">Depósito</option>
                  <option value="otro">Otro</option>
                </select>
              </label>
              <p className="mt-2 text-xs text-zinc-500">
                Este método se guarda en el historial financiero del alumno.
              </p>
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
                onClick={() => onRegistrarPago(alumno, fechaPago, planPago, metodoPago)}
                className="bg-green-600 hover:bg-green-700 p-3 rounded-xl font-black"
              >
                Registrar pago manual
              </button>
              <button
                onClick={() => onEnviarPago(alumno, planPago)}
                className="bg-green-800 hover:bg-green-900 p-3 rounded-xl font-black"
              >
                Enviar link Mercado Pago
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
                Retirar por morosidad
              </button>
              <button
                onClick={() => onReintegrarAlumno?.(alumno)}
                className="bg-zinc-700 hover:bg-zinc-600 p-3 rounded-xl font-black"
              >
                Reintegrar progreso (60 días)
              </button>
            </div>

            <div className="bg-black/40 border border-zinc-700 rounded-2xl p-4 mt-5">
              <p className="font-black text-yellow-400">Mercado Pago</p>
              <p className="text-zinc-400 mt-2">
                Cuando Mercado Pago confirme el pago, el webhook actualizará esta misma ficha:
                fecha de pago confirmada, vencimiento correspondiente y estado Pagado.
                Los créditos del Generador IA se administran por separado.
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
  setSection,
}) {
  const [filtroRapido, setFiltroRapido] = useState('todos')
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)

  const alumnoIdsHoy = new Set(
    asistencias
      .filter((item) => {
        const fecha = new Date(fechaAsistencia(item) || 0)
        fecha.setHours(0, 0, 0, 0)
        return fecha.getTime() === hoy.getTime()
      })
      .map((item) => String(item.alumno_id)),
  )

  const resumenById = new Map(
    students.map((alumno) => [String(alumno.id), resumenAsistenciaAlumno(alumno, asistencias)]),
  )

  const morosos = students.filter((alumno) => alumno.estado_pago === 'Moroso')
  const porVencer = students.filter((alumno) => {
    const dias = diferenciaDias(alumno.fecha_vencimiento)
    return alumno.estado_pago === 'Pagado' && dias !== null && dias >= 0 && dias <= 5
  })
  const inactivos14 = students.filter((alumno) => {
    const resumen = resumenById.get(String(alumno.id))
    return resumen?.diasSinAsistir !== null && Number(resumen?.diasSinAsistir) >= 14
  })

  const visibles = alumnosFiltrados.filter((alumno) => {
    if (filtroRapido === 'todos') return true
    if (filtroRapido === 'hoy') return alumnoIdsHoy.has(String(alumno.id))
    if (filtroRapido === 'morosos') return alumno.estado_pago === 'Moroso'
    if (filtroRapido === 'por_vencer') {
      const dias = diferenciaDias(alumno.fecha_vencimiento)
      return alumno.estado_pago === 'Pagado' && dias !== null && dias >= 0 && dias <= 5
    }
    if (filtroRapido === 'inactivos') {
      const resumen = resumenById.get(String(alumno.id))
      return resumen?.diasSinAsistir !== null && Number(resumen?.diasSinAsistir) >= 14
    }
    return true
  })

  const filtros = [
    ['todos', 'Todos', students.length],
    ['hoy', 'Asistieron hoy', alumnoIdsHoy.size],
    ['morosos', 'Morosos', morosos.length],
    ['por_vencer', 'Por vencer', porVencer.length],
    ['inactivos', 'Sin asistir 14+ días', inactivos14.length],
  ]

  return (
    <div className="admin-students-shell bg-zinc-900 border border-red-500/40 rounded-2xl sm:rounded-3xl p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-red-400">PowerFit 360</p>
          <h2 className="mt-1 text-3xl sm:text-4xl font-black text-white">
            Panel diario de alumnos
          </h2>
          <p className="text-zinc-400 mt-2">
            Prioriza asistencia, pagos y seguimiento antes de entrar a la ficha individual.
          </p>
        </div>

        <div className="rounded-2xl border border-red-500/20 bg-red-950/20 px-4 py-3 font-black text-white">
          <span className="text-red-400">👥</span> {visibles.length} / {students.length} alumnos
        </div>
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <button
          type="button"
          onClick={() => setSection('AsistenciaQR')}
          className="rounded-2xl border border-cyan-700 bg-cyan-950/30 p-4 text-left transition hover:border-cyan-400"
        >
          <p className="text-xs font-black uppercase tracking-wide text-cyan-400">Acción rápida</p>
          <p className="mt-1 text-lg font-black text-white">Pasar asistencia</p>
          <p className="mt-1 text-sm text-zinc-400">QR, registros y control del día.</p>
        </button>
        <button
          type="button"
          onClick={() => window.location.assign('/cps-admin.html')}
          className="rounded-2xl border border-yellow-700 bg-yellow-950/30 p-4 text-left transition hover:border-yellow-400"
        >
          <p className="text-xs font-black uppercase tracking-wide text-yellow-400">Acción rápida</p>
          <p className="mt-1 text-lg font-black text-white">CPS académico</p>
          <p className="mt-1 text-sm text-zinc-400">Teoría, videos, presencial y graduaciones.</p>
        </button>
        <button
          type="button"
          onClick={() => setSection('Entrenamientos')}
          className="rounded-2xl border border-blue-700 bg-blue-950/30 p-4 text-left transition hover:border-blue-400"
        >
          <p className="text-xs font-black uppercase tracking-wide text-blue-400">Acción rápida</p>
          <p className="mt-1 text-lg font-black text-white">Asignar entrenamiento</p>
          <p className="mt-1 text-sm text-zinc-400">Crear y revisar planes de alumnos.</p>
        </button>
        <button
          type="button"
          onClick={() => setSection('Reportes')}
          className="rounded-2xl border border-violet-700 bg-violet-950/30 p-4 text-left transition hover:border-violet-400"
        >
          <p className="text-xs font-black uppercase tracking-wide text-violet-400">Acción rápida</p>
          <p className="mt-1 text-lg font-black text-white">Reportes</p>
          <p className="mt-1 text-sm text-zinc-400">Operación, asistencia y finanzas.</p>
        </button>
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <div className="rounded-2xl border border-zinc-700 bg-black/40 p-4">
          <p className="text-xs font-black uppercase tracking-wide text-zinc-500">Alumnos</p>
          <p className="mt-1 text-3xl font-black text-white">{students.length}</p>
        </div>
        <div className="rounded-2xl border border-cyan-700/60 bg-cyan-950/20 p-4">
          <p className="text-xs font-black uppercase tracking-wide text-cyan-400">Asistieron hoy</p>
          <p className="mt-1 text-3xl font-black text-cyan-200">{alumnoIdsHoy.size}</p>
        </div>
        <div className="rounded-2xl border border-red-700/60 bg-red-950/20 p-4">
          <p className="text-xs font-black uppercase tracking-wide text-red-400">Morosos</p>
          <p className="mt-1 text-3xl font-black text-red-200">{morosos.length}</p>
        </div>
        <div className="rounded-2xl border border-yellow-700/60 bg-yellow-950/20 p-4">
          <p className="text-xs font-black uppercase tracking-wide text-yellow-400">Por vencer ≤5 días</p>
          <p className="mt-1 text-3xl font-black text-yellow-200">{porVencer.length}</p>
        </div>
        <div className="rounded-2xl border border-orange-700/60 bg-orange-950/20 p-4">
          <p className="text-xs font-black uppercase tracking-wide text-orange-400">Sin asistir 14+ días</p>
          <p className="mt-1 text-3xl font-black text-orange-200">{inactivos14.length}</p>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {filtros.map(([value, label, count]) => (
          <button
            key={value}
            type="button"
            onClick={() => setFiltroRapido(value)}
            className={`rounded-xl border px-3 py-2 text-sm font-black transition ${
              filtroRapido === value
                ? 'border-red-500 bg-red-600 text-white'
                : 'border-zinc-700 bg-zinc-950 text-zinc-300 hover:border-zinc-500'
            }`}
          >
            {label} · {count}
          </button>
        ))}
      </div>

      <div className="student-search-shell mb-6">
        <span className="student-search-icon" aria-hidden="true">⌕</span>
        <input
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar por nombre, correo o teléfono"
          className="student-search-input"
        />
      </div>

      <div className="space-y-3">
        {visibles.map((alumno) => {
          const resumen = resumenById.get(String(alumno.id)) || resumenAsistenciaAlumno(alumno, asistencias)
          const diasVence = diferenciaDias(alumno.fecha_vencimiento)
          const inactivo = resumen.diasSinAsistir !== null && Number(resumen.diasSinAsistir) >= 14

          return (
            <article
              key={alumno.id}
              className="admin-student-card rounded-3xl p-4 sm:p-5"
            >
              <div className="flex items-start gap-3">
                <div className="student-avatar-mark" aria-hidden="true">
                  {(alumno.nombre || alumno.email || '?').trim().charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xl font-black text-white leading-tight">
                    {alumno.nombre || '-'}
                  </p>
                  <p className="mt-1 truncate text-sm text-zinc-400">
                    {alumno.email || alumno.telefono || '-'}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {alumnoIdsHoy.has(String(alumno.id)) && (
                      <span className="rounded-full border border-cyan-700 bg-cyan-950 px-2 py-1 text-[11px] font-black text-cyan-300">
                        ASISTIÓ HOY
                      </span>
                    )}
                    {inactivo && (
                      <span className="rounded-full border border-orange-700 bg-orange-950 px-2 py-1 text-[11px] font-black text-orange-300">
                        14+ DÍAS SIN ASISTIR
                      </span>
                    )}
                  </div>
                </div>
                <span className="student-role-chip">{alumno.role || 'alumno'}</span>
              </div>

              <div className="mt-4">
                <StatusBadge estado={alumno.estado_pago} />
              </div>

              <div className="student-metrics-grid mt-4">
                <div className="student-metric">
                  <span>Vencimiento</span>
                  <strong>{alumno.fecha_vencimiento || '-'}</strong>
                  <small>
                    {diasVence === null
                      ? 'Sin fecha'
                      : diasVence < 0
                        ? `Vencida hace ${Math.abs(diasVence)} día(s)`
                        : `Faltan ${diasVence} día(s)`}
                  </small>
                </div>
                <div className="student-metric">
                  <span>Generaciones IA</span>
                  <strong>{alumno.generaciones_disponibles || 0}</strong>
                  <small>Disponibles</small>
                </div>
                <div className="student-metric">
                  <span>Asistencias</span>
                  <strong>{resumen.total}</strong>
                  <small>Total registradas</small>
                </div>
                <div className="student-metric">
                  <span>Este mes</span>
                  <strong>{resumen.mes}</strong>
                  <small>Asistencias</small>
                </div>
              </div>

              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                <button
                  onClick={() => abrirDetalle(alumno)}
                  className="student-primary-action"
                >
                  Ver ficha
                </button>
                <button
                  onClick={() => registrarPago(alumno)}
                  className="student-secondary-action"
                >
                  Registrar pago
                </button>
              </div>
            </article>
          )
        })}

        {visibles.length === 0 && (
          <p className="text-zinc-400">No hay alumnos que coincidan con este filtro.</p>
        )}
      </div>
    </div>
  )
}

function EntrenamientosCoachPanel({ students, user, onSaved }) {
  const alumnos = students.filter((alumno) => alumno.role !== 'admin')
  const objetivos = [
    {
      value: 'perdida_grasa',
      label: 'Pérdida de grasa',
      titulo: 'Pérdida de grasa - PowerFit',
      contenido:
        'ACTIVACIÓN\n- RAMP 8-10 min\n\nBLOQUE 1 - FUERZA FUNCIONAL\n- Sentadilla goblet 4x10\n- Remo con mancuerna 4x10 por lado\n- Flexiones 4x8-12\n\nBLOQUE 2 - METABÓLICO\n- Circuito 4 rondas\n- 12 kettlebell swing\n- 10 burpees técnicos\n- 200 m carrera o remo\n- 30 s plancha\n\nFINAL\n- Zona 2: 12-20 min\n\nNOTAS\n- Priorizar adherencia, gasto energético, técnica y progresión. Registrar RPE, dolor y observaciones.',
    },
    {
      value: 'fuerza',
      label: 'Fuerza',
      titulo: 'Fuerza - PowerFit',
      contenido:
        'ACTIVACIÓN\n- RAMP 8-10 min\n\nBLOQUE PRINCIPAL\n- Sentadilla 5x5\n- Press 5x5\n- Peso muerto 5x3\n- Remo 4x8\n\nACCESORIOS\n- Core antirotación 3x10 por lado\n\nNOTAS\n- Ajustar carga por RM y mantener técnica estable. Registrar RPE.',
    },
    {
      value: 'cardio',
      label: 'Cardio / resistencia',
      titulo: 'Cardio y resistencia - PowerFit',
      contenido:
        'ACTIVACIÓN\n- Movilidad + trote suave 8 min\n\nBLOQUE AERÓBICO\n- 4 x 4 min ritmo moderado\n- Descanso 2 min suave\n\nBLOQUE FINAL\n- 10 x 30/30 s controlados\n\nVUELTA A LA CALMA\n- 8 min suave + respiración\n\nNOTAS\n- Registrar distancia, tiempo, FC si está disponible y RPE.',
    },
    {
      value: 'fighter',
      label: 'Fighter / combate',
      titulo: 'Fighter conditioning - PowerFit',
      contenido:
        'ACTIVACIÓN\n- Movilidad + sombra técnica 8 min\n\nBLOQUE 1 - MOTOR TRANSVERSAL\n- Desplazamientos + rotación 4 rondas\n\nBLOQUE 2 - POTENCIA\n- Lanzamientos / bandas / saltos según fase\n\nBLOQUE 3 - CONDITIONING\n- 5 rounds x 3 min / 1 min pausa\n\nNOTAS\n- Mantener calidad técnica bajo fatiga y registrar RPE.',
    },
    {
      value: 'acondicionamiento',
      label: 'Acondicionamiento general',
      titulo: 'Acondicionamiento general - PowerFit',
      contenido:
        'ACTIVACIÓN\n- RAMP 8 min\n\nFUERZA FUNCIONAL\n- 4 ejercicios x 3-4 series\n\nCIRCUITO\n- 4 rondas de trabajo global\n\nCARDIO\n- 12 min continuo moderado\n\nNOTAS\n- Ajustar volumen al nivel del alumno y registrar RPE.',
    },
    {
      value: 'casa_principiante',
      label: 'Casa principiante',
      titulo: 'Casa principiante - PowerFit',
      contenido:
        'ACTIVACIÓN\n- Marcha suave + movilidad 6-8 min\n\nCIRCUITO 2-3 RONDAS\n- 8 sentadillas a silla\n- 8 flexiones inclinadas\n- 10 puentes de glúteos\n- 30 s marcha en el lugar\n\nVUELTA A LA CALMA\n- Movilidad + respiración 5 min\n\nNOTAS\n- Trabajo de bajo impacto, técnica y adherencia.',
    },
    {
      value: 'personalizado',
      label: 'Personalizado',
      titulo: 'Entrenamiento personalizado PowerFit',
      contenido:
        'ACTIVACIÓN\n- RAMP 8 min\n\nBLOQUE 1\n- Ejercicio / series / repeticiones\n\nBLOQUE 2\n- Ejercicio / series / repeticiones\n\nBLOQUE 3\n- Método / duración\n\nNOTAS\n- Registrar RPE, dolor y observaciones.',
    },
  ]

  function contenidoSesionPorObjetivo(objetivo, slot, fallback) {
    const presets = {
      perdida_grasa: [
        'FUERZA + GASTO ENERGÉTICO\n- RAMP 8-10 min\n- Sentadilla goblet 4x10\n- Remo con mancuerna 4x10 por lado\n- Flexiones 4x8-12\n- Peso muerto rumano 3x10\n- Final: 10 min zona 2',
        'METABÓLICO / INTERVALOS\n- Activación 8 min\n- Circuito 4 rondas\n- 12 kettlebell swing\n- 10 burpees técnicos\n- 200 m carrera o remo\n- 30 s plancha\n- Descanso 90 s',
        'CARDIO + FULL BODY\n- Movilidad 6-8 min\n- 20-30 min zona 2\n- 3 rondas: 12 zancadas, 10 press, 12 remo, 30 s core\n- Vuelta a la calma 5 min',
      ],
      fuerza: [
        'FUERZA A\n- Sentadilla 5x5\n- Press 5x5\n- Remo 4x8\n- Core antirotación 3x10',
        'FUERZA B\n- Peso muerto 5x3\n- Press vertical 4x6\n- Zancada 4x8 por lado\n- Farmer carry 4 tramos',
        'FUERZA C\n- Front squat 4x5\n- Bench press 4x6\n- Remo unilateral 4x8\n- Bisagra accesoria 3x10',
      ],
      cardio: [
        'BASE AERÓBICA\n- 30-45 min zona 2\n- Ritmo estable\n- Registrar distancia y RPE',
        'INTERVALOS\n- 10 min suave\n- 6 x 3 min fuerte / 2 min suave\n- 8 min vuelta a la calma',
        'UMBRAL CONTROLADO\n- 10 min suave\n- 3 x 8 min moderado-alto / 3 min suave\n- 8 min suave',
      ],
      fighter: [
        'TÉCNICA + MOTOR\n- Sombra técnica 4 rounds\n- Desplazamientos 4 rounds\n- Trabajo rotacional 4 series\n- Core 3 series',
        'POTENCIA + FUERZA\n- Lanzamientos rotacionales\n- Push press\n- Saltos según fase\n- Trabajo unilateral',
        'CONDITIONING FIGHTER\n- 5-8 rounds x 3 min\n- 1 min pausa\n- Mantener calidad técnica bajo fatiga',
      ],
      acondicionamiento: [
        'FULL BODY A\n- Sentadilla\n- Empuje\n- Tirón\n- Core\n- 3-4 series',
        'CONDICIONAMIENTO B\n- Circuito 4 rondas\n- Trabajo global\n- Intervalos 30/30',
        'FULL BODY C + CARDIO\n- Bisagra\n- Zancada\n- Press\n- Remo\n- 15 min cardio moderado',
      ],
      casa_principiante: [
        'CASA A\n- Sentadilla a silla 3x8\n- Flexión inclinada 3x8\n- Puente glúteos 3x10\n- Marcha 5 min',
        'CASA B\n- Step touch 4x45 s\n- Zancada asistida 3x6 por lado\n- Remo con banda/toalla 3x10\n- Core suave',
        'CASA C\n- Circuito bajo impacto 3 rondas\n- Sentadilla a silla\n- Empuje pared\n- Marcha\n- Movilidad',
      ],
    }

    const list = presets[objetivo] || []
    return list[slot % Math.max(1, list.length)] || fallback
  }

  function construirSesiones(objetivo, sesionesSemana, fallback) {
    return Array.from({ length: Number(sesionesSemana || 1) }, (_, index) =>
      contenidoSesionPorObjetivo(objetivo, index, fallback),
    )
  }

  const DIAS_SEMANA = [
    { value: 1, label: 'Lunes' },
    { value: 2, label: 'Martes' },
    { value: 3, label: 'Miércoles' },
    { value: 4, label: 'Jueves' },
    { value: 5, label: 'Viernes' },
    { value: 6, label: 'Sábado' },
    { value: 0, label: 'Domingo' },
  ]

  function diasSugeridos(cantidad) {
    const presets = {
      1: [1],
      2: [2, 4],
      3: [1, 3, 5],
      4: [1, 2, 4, 5],
      5: [1, 2, 3, 4, 5],
      6: [1, 2, 3, 4, 5, 6],
    }
    return presets[Number(cantidad)] || [1, 3, 5]
  }

  function fechaLocalISO(date) {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  function fechasPlanCoach(plan) {
    const contenido = String(plan?.contenido || '')
    const inicio = contenido.match(/PLAN_INICIO:(\d{4}-\d{2}-\d{2})/)?.[1]
    const dias = String(contenido.match(/PLAN_DIAS:([^\n]+)/)?.[1] || '')
      .split(',')
      .map(Number)
      .filter((value) => Number.isInteger(value) && value >= 0 && value <= 6)
    const meta = metaPlanCoach(plan)

    if (!inicio || dias.length === 0) return []

    const result = []
    const cursor = new Date(`${inicio}T12:00:00`)
    let guard = 0

    while (result.length < meta.totalSesiones && guard < 370) {
      if (dias.includes(cursor.getDay())) {
        result.push(fechaLocalISO(cursor))
      }
      cursor.setDate(cursor.getDate() + 1)
      guard += 1
    }

    return result
  }

  function estadoSesionCoach(plan, sessionNumber) {
    const record = completados[plan.id]?.sessions?.[sessionNumber]
    if (record || completados[plan.id]?.legacyComplete) return 'Completada'

    const fecha = fechasPlanCoach(plan)[sessionNumber - 1]
    if (!fecha) return 'Pendiente'

    const hoy = fechaHoy()
    if (fecha < hoy) return 'Atrasada'
    if (fecha === hoy) return 'Hoy'
    return 'Próxima'
  }

  const defaultObjective = objetivos[0]
  const [form, setForm] = useState({
    alumnoId: alumnos[0]?.id ? String(alumnos[0].id) : '',
    titulo: defaultObjective.titulo,
    objetivo: defaultObjective.value,
    nivel: 'intermedio',
    semanas: 1,
    sesionesSemana: 3,
    fechaInicio: fechaHoy(),
    diasSemana: diasSugeridos(3),
    contenido: defaultObjective.contenido,
  })
  const [sesionesContenido, setSesionesContenido] = useState(() =>
    construirSesiones(defaultObjective.value, 3, defaultObjective.contenido),
  )
  const [mensaje, setMensaje] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [asignados, setAsignados] = useState([])
  const [completados, setCompletados] = useState({})
  const [cargandoAsignados, setCargandoAsignados] = useState(false)

  const selectedAlumnoId = form.alumnoId || (alumnos[0]?.id ? String(alumnos[0].id) : '')
  const alumno = alumnos.find((item) => String(item.id) === String(selectedAlumnoId))

  useEffect(() => {
    async function cargarAsignados() {
      if (!selectedAlumnoId) {
        setAsignados([])
        return
      }

      setCargandoAsignados(true)
      const { data, error } = await supabase.rpc('get_powerfit_training_history_secure', {
        p_alumno_id: selectedAlumnoId,
        p_limit: 100,
      })

      if (error) {
        setAsignados([])
        setCargandoAsignados(false)
        return
      }

      const plans = Array.isArray(data?.plans) ? data.plans : []
      setAsignados(
        plans.filter((plan) => {
          const objetivo = String(plan?.objetivo || '')
          const sourceRef = String(plan?.source_ref || '')
          return objetivo.startsWith('coach_') || sourceRef === 'coach_assignment'
        }),
      )

      const completionMap = {}
      ;(data?.records || []).forEach((record) => {
        const texto = `${record?.metodo || ''} ${record?.observacion || ''}`
        const sessionMatch = texto.match(/SESION_COMPLETADA:([a-zA-Z0-9-]+):(\d+)/)
        const planMatch = texto.match(/PLAN_COMPLETADO:([a-zA-Z0-9-]+)/)

        if (sessionMatch?.[1]) {
          const planId = sessionMatch[1]
          const sessionNumber = Number(sessionMatch[2])
          completionMap[planId] = {
            ...(completionMap[planId] || {}),
            sessions: {
              ...(completionMap[planId]?.sessions || {}),
              [sessionNumber]: record,
            },
          }
        } else if (planMatch?.[1]) {
          completionMap[planMatch[1]] = {
            ...(completionMap[planMatch[1]] || {}),
            legacyComplete: record,
          }
        }
      })
      setCompletados(completionMap)
      setCargandoAsignados(false)
    }

    cargarAsignados()
  }, [selectedAlumnoId])

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  function cambiarObjetivo(value) {
    const preset = objetivos.find((item) => item.value === value)
    if (!preset) {
      update('objetivo', value)
      return
    }

    setForm((current) => ({
      ...current,
      objetivo: preset.value,
      titulo: preset.titulo,
      contenido: preset.contenido,
    }))
    setSesionesContenido(
      construirSesiones(preset.value, form.sesionesSemana, preset.contenido),
    )
  }

  function cambiarSesionesSemana(value) {
    const next = Number(value)
    setForm((current) => ({
      ...current,
      sesionesSemana: next,
      diasSemana: diasSugeridos(next),
    }))
    setSesionesContenido((current) =>
      Array.from({ length: next }, (_, index) =>
        current[index] ||
        contenidoSesionPorObjetivo(form.objetivo, index, form.contenido),
      ),
    )
  }

  function actualizarDiaSesion(index, value) {
    setForm((current) => ({
      ...current,
      diasSemana: current.diasSemana.map((day, dayIndex) =>
        dayIndex === index ? Number(value) : day,
      ),
    }))
  }

  function actualizarContenidoSesion(index, value) {
    setSesionesContenido((current) =>
      current.map((item, itemIndex) => (itemIndex === index ? value : item)),
    )
  }

  async function recargarAsignados() {
    if (!alumno?.id) return

    const { data, error } = await supabase.rpc('get_powerfit_training_history_secure', {
      p_alumno_id: alumno.id,
      p_limit: 100,
    })

    if (error) return

    const plans = Array.isArray(data?.plans) ? data.plans : []
    setAsignados(
      plans.filter((plan) => {
        const objetivo = String(plan?.objetivo || '')
        const sourceRef = String(plan?.source_ref || '')
        return objetivo.startsWith('coach_') || sourceRef === 'coach_assignment'
      }),
    )

    const completionMap = {}
    ;(data?.records || []).forEach((record) => {
      const texto = `${record?.metodo || ''} ${record?.observacion || ''}`
      const sessionMatch = texto.match(/SESION_COMPLETADA:([a-zA-Z0-9-]+):(\d+)/)
      const planMatch = texto.match(/PLAN_COMPLETADO:([a-zA-Z0-9-]+)/)

      if (sessionMatch?.[1]) {
        const planId = sessionMatch[1]
        const sessionNumber = Number(sessionMatch[2])
        completionMap[planId] = {
          ...(completionMap[planId] || {}),
          sessions: {
            ...(completionMap[planId]?.sessions || {}),
            [sessionNumber]: record,
          },
        }
      } else if (planMatch?.[1]) {
        completionMap[planMatch[1]] = {
          ...(completionMap[planMatch[1]] || {}),
          legacyComplete: record,
        }
      }
    })
    setCompletados(completionMap)
  }

  function metaPlanCoach(plan) {
    const contenido = String(plan?.contenido || '')
    const semanas = Number(contenido.match(/PLAN_SEMANAS:(\d+)/)?.[1] || 1)
    const sesionesSemana = Number(contenido.match(/PLAN_SESIONES_SEMANA:(\d+)/)?.[1] || 1)
    const totalSesiones = Math.max(1, semanas * sesionesSemana)
    const info = completados[plan.id] || {}
    const done = info.legacyComplete ? totalSesiones : Object.keys(info.sessions || {}).length

    return {
      semanas,
      sesionesSemana,
      totalSesiones,
      done: Math.min(done, totalSesiones),
      complete: done >= totalSesiones,
    }
  }

  async function guardarEntrenamiento() {
    if (!alumno?.id || guardando) return
    if (!form.titulo.trim() || !form.contenido.trim()) {
      setMensaje('Completa título y contenido del entrenamiento.')
      return
    }

    setGuardando(true)
    setMensaje('')

    const objetivoLabel =
      objetivos.find((item) => item.value === form.objetivo)?.label || form.objetivo

    const contenido = [
      'POWERFIT 360 - ENTRENAMIENTO ASIGNADO POR COACH',
      `Alumno: ${alumno.nombre || '-'}`,
      `Coach: ${user?.email || '-'}`,
      `Fecha: ${new Date().toLocaleString('es-CL')}`,
      `Título: ${form.titulo}`,
      `Objetivo: ${objetivoLabel}`,
      `Nivel: ${form.nivel}`,
      `PLAN_SEMANAS:${Number(form.semanas || 1)}`,
      `PLAN_SESIONES_SEMANA:${Number(form.sesionesSemana || 1)}`,
      `PLAN_INICIO:${form.fechaInicio || fechaHoy()}`,
      `PLAN_DIAS:${(form.diasSemana || []).join(',')}`,
      '',
      'ESTRUCTURA_SEMANAL',
      ...sesionesContenido.flatMap((contenidoSesion, index) => [
        `SESION_${index + 1}_INICIO`,
        contenidoSesion,
        `SESION_${index + 1}_FIN`,
        '',
      ]),
      'NOTAS_GENERALES',
      form.contenido,
    ].join('\n')

    const { error } = await supabase.rpc('save_powerfit_plan_secure', {
      p_alumno_id: alumno.id,
      p_objetivo: `coach_${form.objetivo}`,
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

    await recargarAsignados()
    setMensaje(`Entrenamiento "${form.titulo}" asignado a ${alumno.nombre} y visible en su app.`)
    setGuardando(false)
    onSaved?.()
  }

  return (
    <div className="space-y-6">
      <section className="bg-zinc-900 border border-blue-500 rounded-2xl sm:rounded-3xl p-4 sm:p-6">
        <h2 className="text-3xl sm:text-4xl font-black text-blue-300">
          Asignar entrenamiento
        </h2>
        <p className="text-zinc-400 mt-2">
          Elige un alumno, selecciona un objetivo, ajusta la plantilla y comprueba abajo los entrenamientos ya asignados.
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
              value={selectedAlumnoId}
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
            Objetivo del entrenamiento
            <select
              value={form.objetivo}
              onChange={(event) => cambiarObjetivo(event.target.value)}
              className="bg-black border border-zinc-700 rounded-xl p-3"
            >
              {objetivos.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-2 font-black text-sm text-zinc-300">
            Título
            <input
              value={form.titulo}
              onChange={(event) => update('titulo', event.target.value)}
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
              <option value="basico">Básico</option>
              <option value="intermedio">Intermedio</option>
              <option value="avanzado">Avanzado</option>
            </select>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="grid gap-2 font-black text-sm text-zinc-300">
              Semanas
              <select
                value={form.semanas}
                onChange={(event) => update('semanas', Number(event.target.value))}
                className="bg-black border border-zinc-700 rounded-xl p-3"
              >
                {[1, 2, 4, 6, 8, 12].map((value) => (
                  <option key={value} value={value}>{value}</option>
                ))}
              </select>
            </label>

            <label className="grid gap-2 font-black text-sm text-zinc-300">
              Sesiones / semana
              <select
                value={form.sesionesSemana}
                onChange={(event) => cambiarSesionesSemana(event.target.value)}
                className="bg-black border border-zinc-700 rounded-xl p-3"
              >
                {[1, 2, 3, 4, 5, 6].map((value) => (
                  <option key={value} value={value}>{value}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="rounded-2xl border border-blue-800 bg-blue-950/20 p-4">
            <p className="font-black text-blue-300">Estructura del plan</p>
            <p className="mt-1 text-sm text-zinc-400">
              {Number(form.semanas) * Number(form.sesionesSemana)} sesiones totales · {form.semanas} semana{Number(form.semanas) === 1 ? '' : 's'}.
            </p>
          </div>

          <div className="rounded-2xl border border-cyan-800 bg-cyan-950/20 p-4 space-y-3">
            <div>
              <p className="font-black text-cyan-300">Calendario del plan</p>
              <p className="mt-1 text-sm text-zinc-500">
                Define la fecha de inicio y el día correspondiente a cada sesión semanal.
              </p>
            </div>

            <label className="grid gap-2 text-sm font-black text-zinc-300">
              Fecha de inicio
              <input
                type="date"
                value={form.fechaInicio}
                onChange={(event) => update('fechaInicio', event.target.value)}
                className="bg-black border border-zinc-700 rounded-xl p-3"
              />
            </label>

            <div className="grid sm:grid-cols-2 gap-3">
              {Array.from({ length: Number(form.sesionesSemana || 1) }, (_, index) => (
                <label key={index} className="grid gap-2 text-sm font-black text-zinc-300">
                  Sesión {index + 1}
                  <select
                    value={form.diasSemana[index] ?? diasSugeridos(form.sesionesSemana)[index] ?? 1}
                    onChange={(event) => actualizarDiaSesion(index, event.target.value)}
                    className="bg-black border border-zinc-700 rounded-xl p-3"
                  >
                    {DIAS_SEMANA.map((day) => (
                      <option key={day.value} value={day.value}>{day.label}</option>
                    ))}
                  </select>
                </label>
              ))}
            </div>
          </div>

          <div className="bg-black/40 border border-zinc-800 rounded-2xl p-4">
            <p className="font-black text-yellow-400">Objetivos disponibles</p>
            <p className="text-sm text-zinc-400 mt-2">
              Pérdida de grasa, fuerza, cardio/resistencia, fighter, acondicionamiento general, casa principiante y personalizado.
            </p>
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-700 rounded-2xl sm:rounded-3xl p-4 sm:p-6 space-y-4">
          <div className="space-y-4">
            <div>
              <p className="font-black text-blue-300">Sesiones de la semana</p>
              <p className="mt-1 text-sm text-zinc-500">
                Estas sesiones se repiten como estructura base durante las semanas del plan. Puedes editar cada una por separado.
              </p>
            </div>

            {sesionesContenido.map((contenidoSesion, index) => (
              <label key={index} className="grid gap-2 font-black text-sm text-zinc-300">
                Sesión {index + 1}
                <textarea
                  value={contenidoSesion}
                  onChange={(event) => actualizarContenidoSesion(index, event.target.value)}
                  rows={9}
                  className="bg-black border border-zinc-700 rounded-xl p-3 font-mono text-sm"
                />
              </label>
            ))}

            <label className="grid gap-2 font-black text-sm text-zinc-300">
              Notas generales del plan
              <textarea
                value={form.contenido}
                onChange={(event) => update('contenido', event.target.value)}
                rows={7}
                className="bg-black border border-zinc-700 rounded-xl p-3 font-mono text-sm"
              />
            </label>
          </div>

          <button
            onClick={guardarEntrenamiento}
            disabled={guardando || alumnos.length === 0}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-2xl p-5 font-black"
          >
            {guardando ? 'Asignando...' : 'Asignar entrenamiento al alumno'}
          </button>
        </div>
      </section>

      <section className="bg-zinc-900 border border-emerald-600 rounded-2xl sm:rounded-3xl p-4 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-2xl sm:text-3xl font-black text-emerald-400">
              Entrenamientos asignados
            </h3>
            <p className="text-zinc-400 mt-1">
              {alumno ? `Historial visible para ${alumno.nombre || alumno.email || 'el alumno seleccionado'}.` : 'Selecciona un alumno.'}
            </p>
          </div>
          <span className="bg-black/50 border border-zinc-700 rounded-full px-4 py-2 font-black">
            {asignados.length} asignados
          </span>
        </div>

        {cargandoAsignados ? (
          <p className="text-zinc-400">Cargando entrenamientos...</p>
        ) : asignados.length === 0 ? (
          <p className="text-zinc-400">
            Este alumno todavía no tiene entrenamientos asignados por Coach.
          </p>
        ) : (
          <div className="space-y-3">
            {asignados.map((plan) => (
              <details key={plan.id} className="bg-black/50 border border-zinc-700 rounded-2xl p-4">
                <summary className="cursor-pointer font-black text-yellow-400">
                  {String(plan.objetivo || 'Entrenamiento').replace(/^coach_(personalizado_)?/, '').replaceAll('_', ' ')}
                  {' · '}
                  {plan.created_at ? new Date(plan.created_at).toLocaleDateString('es-CL') : 'Sin fecha'}
                </summary>
                <pre className="mt-4 whitespace-pre-wrap text-sm text-zinc-200 font-sans">
                  {plan.contenido || 'Sin contenido'}
                </pre>
                {(() => {
                  const progress = metaPlanCoach(plan)
                  const records = Object.values(completados[plan.id]?.sessions || {})
                    .sort((a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0))

                  return (
                    <div className="mt-4 rounded-2xl border border-zinc-700 bg-zinc-900 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="font-black text-emerald-400">
                            Progreso: {progress.done}/{progress.totalSesiones} sesiones
                          </p>
                          <p className="mt-1 text-sm text-zinc-400">
                            {progress.semanas} semana{progress.semanas === 1 ? '' : 's'} · {progress.sesionesSemana} sesión{progress.sesionesSemana === 1 ? '' : 'es'} por semana
                          </p>
                          {fechasPlanCoach(plan).length > 0 && (
                            <p className="mt-1 text-sm text-cyan-300">
                              Inicio {formatearFecha(fechasPlanCoach(plan)[0])} · Fin {formatearFecha(fechasPlanCoach(plan).at(-1))}
                            </p>
                          )}
                        </div>
                        <span className={`rounded-full border px-3 py-1 text-xs font-black ${
                          progress.complete
                            ? 'border-green-700 bg-green-950 text-green-300'
                            : 'border-yellow-700 bg-yellow-950 text-yellow-300'
                        }`}>
                          {progress.complete ? 'PLAN COMPLETADO' : 'EN PROGRESO'}
                        </span>
                      </div>

                      {records.length > 0 && (
                        <div className="mt-4 space-y-2">
                          {records.map((record, index) => (
                            <div key={record.id || index} className="rounded-xl bg-black/40 p-3">
                              <div className="flex items-center justify-between gap-3">
                                <p className="font-black text-green-300">
                                  Sesión {index + 1} completada
                                </p>
                                <span className="rounded-full border border-green-700 bg-green-950 px-2 py-1 text-[11px] font-black text-green-300">
                                  {estadoSesionCoach(plan, index + 1)}
                                </span>
                              </div>
                              <p className="mt-1 text-xs text-zinc-500">
                                {record.created_at ? new Date(record.created_at).toLocaleString('es-CL') : 'Registrada'}
                              </p>
                              <p className="mt-1 text-sm text-yellow-300">
                                {String(record.metodo || '').split('|').slice(1).join('|').trim()}
                              </p>
                              {record.observacion && !String(record.observacion).startsWith('SESION_COMPLETADA:') && (
                                <p className="mt-1 text-sm text-zinc-300">
                                  Comentario: {record.observacion}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })()}
              </details>
            ))}
          </div>
        )}
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
  const [trainingAlert, setTrainingAlert] = useState(null)

  useEffect(() => {
    async function cargarAvisoEntrenamiento() {
      if (isAdmin || !student?.id) {
        setTrainingAlert(null)
        return
      }

      const { data, error } = await supabase.rpc('get_powerfit_training_history_secure', {
        p_alumno_id: student.id,
        p_limit: 100,
      })

      if (error) {
        setTrainingAlert(null)
        return
      }

      const plans = (data?.plans || []).filter((plan) => {
        const objetivo = String(plan?.objetivo || '')
        const sourceRef = String(plan?.source_ref || '')
        return objetivo.startsWith('coach_') || sourceRef === 'coach_assignment'
      })

      const completionMap = {}
      ;(data?.records || []).forEach((record) => {
        const texto = `${record?.metodo || ''} ${record?.observacion || ''}`
        const match = texto.match(/SESION_COMPLETADA:([a-zA-Z0-9-]+):(\d+)/)
        if (match?.[1]) {
          completionMap[match[1]] = {
            ...(completionMap[match[1]] || {}),
            [Number(match[2])]: record,
          }
        }
      })

      function localISO(date) {
        const y = date.getFullYear()
        const m = String(date.getMonth() + 1).padStart(2, '0')
        const d = String(date.getDate()).padStart(2, '0')
        return `${y}-${m}-${d}`
      }

      for (const plan of plans) {
        const contenido = String(plan?.contenido || '')
        const semanas = Number(contenido.match(/PLAN_SEMANAS:(\d+)/)?.[1] || 1)
        const sesionesSemana = Number(contenido.match(/PLAN_SESIONES_SEMANA:(\d+)/)?.[1] || 1)
        const total = Math.max(1, semanas * sesionesSemana)
        const inicio = contenido.match(/PLAN_INICIO:(\d{4}-\d{2}-\d{2})/)?.[1] || ''
        const dias = String(contenido.match(/PLAN_DIAS:([^\n]+)/)?.[1] || '')
          .split(',')
          .map(Number)
          .filter((value) => Number.isInteger(value) && value >= 0 && value <= 6)

        const done = completionMap[plan.id] || {}
        let nextSession = null
        for (let n = 1; n <= total; n += 1) {
          if (!done[n]) {
            nextSession = n
            break
          }
        }
        if (!nextSession) continue

        let fecha = ''
        if (inicio && dias.length > 0) {
          const fechas = []
          const cursor = new Date(`${inicio}T12:00:00`)
          let guard = 0
          while (fechas.length < total && guard < 370) {
            if (dias.includes(cursor.getDay())) fechas.push(localISO(cursor))
            cursor.setDate(cursor.getDate() + 1)
            guard += 1
          }
          fecha = fechas[nextSession - 1] || ''
        }

        const hoy = localISO(new Date())
        const estado = !fecha ? 'Pendiente' : fecha < hoy ? 'Atrasada' : fecha === hoy ? 'Hoy' : 'Próxima'
        setTrainingAlert({
          plan,
          sessionNumber: nextSession,
          total,
          fecha,
          estado,
          progreso: Object.keys(done).length,
        })
        return
      }

      setTrainingAlert(null)
    }

    cargarAvisoEntrenamiento()
  }, [isAdmin, student?.id])

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
          Alertas de entrenamiento, pagos, vencimientos y solicitudes pendientes.
        </p>
      </div>

      <div className="grid md:grid-cols-4 gap-4">
        <Info label="Compras pendientes" value={comprasPendientes.length} />
        <Info label="Avatar IA" value={avatarsPendientes.length} />
        <Info label="Membresías por vencer" value={alumnosPorVencer.length} />
        <Info label="Morosos" value={morosos.length} />
      </div>

      {!isAdmin && trainingAlert && (
        <div className={`rounded-2xl border p-5 ${
          trainingAlert.estado === 'Hoy'
            ? 'border-blue-500 bg-blue-950/40'
            : trainingAlert.estado === 'Atrasada'
              ? 'border-red-600 bg-red-950/40'
              : 'border-cyan-700 bg-cyan-950/30'
        }`}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm font-black uppercase text-zinc-400">Entrenamiento</p>
              <h3 className={`mt-1 text-2xl font-black ${
                trainingAlert.estado === 'Hoy'
                  ? 'text-blue-300'
                  : trainingAlert.estado === 'Atrasada'
                    ? 'text-red-300'
                    : 'text-cyan-300'
              }`}>
                {trainingAlert.estado === 'Hoy'
                  ? 'Tienes entrenamiento hoy'
                  : trainingAlert.estado === 'Atrasada'
                    ? 'Tienes una sesión atrasada'
                    : 'Próxima sesión programada'}
              </h3>
              <p className="mt-2 text-zinc-300">
                Sesión {trainingAlert.sessionNumber} de {trainingAlert.total}
                {trainingAlert.fecha ? ` · ${formatearFecha(trainingAlert.fecha)}` : ''}
              </p>
              <p className="mt-1 text-sm text-zinc-500">
                Progreso: {trainingAlert.progreso}/{trainingAlert.total} sesiones.
              </p>
            </div>
            <span className="rounded-full border border-current px-3 py-1 text-xs font-black">
              {trainingAlert.estado}
            </span>
          </div>
        </div>
      )}

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

function cpsHomeNextStep(route) {
  if (!route?.enrolled) return 'Ruta no iniciada'
  const theoryDone = Number(route.stage_questions_approved || 0)
  const theoryTotal = Number(route.stage_questions_total || 0)
  const cardsDone = Number(route.stage_cards_completed || 0)
  const cardsTotal = Number(route.stage_cards_total || 0)
  const tomosDone = Number(route.stage_tomos_completed || 0)
  const tomosTotal = Number(route.stage_tomos_total || 0)

  if (theoryTotal > theoryDone) {
    const pending = theoryTotal - theoryDone
    return `Siguiente: aprobar ${pending} pregunta${pending === 1 ? '' : 's'} teórica${pending === 1 ? '' : 's'}`
  }
  if (cardsTotal > cardsDone) {
    const pending = cardsTotal - cardsDone
    return `Siguiente: completar ${pending} técnica${pending === 1 ? '' : 's'}`
  }
  if (tomosTotal > tomosDone) {
    const pending = tomosTotal - tomosDone
    return `Siguiente: cerrar ${pending} tomo${pending === 1 ? '' : 's'}`
  }
  if (route.stage_ready_for_exam) return 'Siguiente: examen final del nivel / grado'
  return 'Revisa Mi Camino para continuar'
}

function StudentHomePanel({ student, setSection, asistencias = [] }) {
  const [planes, setPlanes] = useState([])
  const [completados, setCompletados] = useState({})
  const [cpsResumen, setCpsResumen] = useState([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    async function cargar() {
      if (!student?.id) {
        setPlanes([])
        setCargando(false)
        return
      }

      setCargando(true)
      const [trainingResult, boxingResult, kickboxingResult] = await Promise.all([
        supabase.rpc('get_powerfit_training_history_secure', {
          p_alumno_id: student.id,
          p_limit: 50,
        }),
        supabase.rpc('get_powerfit_cps_route_progress_secure', {
          p_alumno_id: student.id,
          p_path_code: 'BOXING',
        }),
        supabase.rpc('get_powerfit_cps_route_progress_secure', {
          p_alumno_id: student.id,
          p_path_code: 'KICKBOXING',
        }),
      ])

      const { data, error } = trainingResult
      setCpsResumen(
        [boxingResult.data, kickboxingResult.data].filter((route) => route?.enrolled),
      )

      if (error) {
        setPlanes([])
        setCargando(false)
        return
      }

      const coachPlans = (data?.plans || []).filter((plan) => {
        const objetivo = String(plan?.objetivo || '')
        const sourceRef = String(plan?.source_ref || '')
        return objetivo.startsWith('coach_') || sourceRef === 'coach_assignment'
      })

      setPlanes(coachPlans)

      const completionMap = {}
      ;(data?.records || []).forEach((record) => {
        const texto = `${record?.metodo || ''} ${record?.observacion || ''}`
        const sessionMatch = texto.match(/SESION_COMPLETADA:([a-zA-Z0-9-]+):(\d+)/)
        const planMatch = texto.match(/PLAN_COMPLETADO:([a-zA-Z0-9-]+)/)

        if (sessionMatch?.[1]) {
          const planId = sessionMatch[1]
          const sessionNumber = Number(sessionMatch[2])
          completionMap[planId] = {
            ...(completionMap[planId] || {}),
            sessions: {
              ...(completionMap[planId]?.sessions || {}),
              [sessionNumber]: record,
            },
          }
        } else if (planMatch?.[1]) {
          completionMap[planMatch[1]] = {
            ...(completionMap[planMatch[1]] || {}),
            legacyComplete: record,
          }
        }
      })
      setCompletados(completionMap)
      setCargando(false)
    }

    cargar()
  }, [student?.id])

  function metaHome(plan) {
    const contenido = String(plan?.contenido || '')
    const semanas = Number(contenido.match(/PLAN_SEMANAS:(\d+)/)?.[1] || 1)
    const sesionesSemana = Number(contenido.match(/PLAN_SESIONES_SEMANA:(\d+)/)?.[1] || 1)
    const inicio = contenido.match(/PLAN_INICIO:(\d{4}-\d{2}-\d{2})/)?.[1] || ''
    const diasSemana = String(contenido.match(/PLAN_DIAS:([^\n]+)/)?.[1] || '')
      .split(',')
      .map(Number)
      .filter((value) => Number.isInteger(value) && value >= 0 && value <= 6)

    return {
      semanas: Math.max(1, semanas),
      sesionesSemana: Math.max(1, sesionesSemana),
      totalSesiones: Math.max(1, semanas * sesionesSemana),
      inicio,
      diasSemana,
    }
  }

  function progresoHome(plan) {
    const meta = metaHome(plan)
    const info = completados[plan.id] || {}
    const done = info.legacyComplete ? meta.totalSesiones : Object.keys(info.sessions || {}).length
    return { done: Math.min(done, meta.totalSesiones), totalSesiones: meta.totalSesiones, complete: done >= meta.totalSesiones }
  }

  function fechaHomeISO(date) {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  function fechasHome(plan) {
    const meta = metaHome(plan)
    if (!meta.inicio || meta.diasSemana.length === 0) return []

    const result = []
    const cursor = new Date(`${meta.inicio}T12:00:00`)
    let guard = 0
    while (result.length < meta.totalSesiones && guard < 370) {
      if (meta.diasSemana.includes(cursor.getDay())) result.push(fechaHomeISO(cursor))
      cursor.setDate(cursor.getDate() + 1)
      guard += 1
    }
    return result
  }

  function siguienteSesionHome(plan) {
    const meta = metaHome(plan)
    const info = completados[plan.id] || {}
    if (info.legacyComplete) return null

    for (let sessionNumber = 1; sessionNumber <= meta.totalSesiones; sessionNumber += 1) {
      if (!info.sessions?.[sessionNumber]) {
        const fecha = fechasHome(plan)[sessionNumber - 1] || ''
        const hoy = fechaHomeISO(new Date())
        const estado = !fecha ? 'Pendiente' : fecha < hoy ? 'Atrasada' : fecha === hoy ? 'Hoy' : 'Próxima'
        return { sessionNumber, fecha, estado }
      }
    }
    return null
  }

  function contenidoSesionHome(plan, sessionNumber) {
    const meta = metaHome(plan)
    const slot = ((Number(sessionNumber) - 1) % meta.sesionesSemana) + 1
    const contenido = String(plan?.contenido || '')
    const pattern = new RegExp(
      `SESION_${slot}_INICIO\\n([\\s\\S]*?)\\nSESION_${slot}_FIN`,
    )
    const match = contenido.match(pattern)
    if (match?.[1]) return match[1].trim()

    const general = contenido.split('NOTAS_GENERALES')[1]
    return general ? general.trim() : contenido
  }

  function formatearFechaHome(fecha) {
    if (!fecha) return ''
    return new Date(`${fecha}T12:00:00`).toLocaleDateString('es-CL', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
    })
  }

  const asistenciaHome = resumenAsistenciaAlumno(student, asistencias)

  const planActivo = planes.find((plan) => !progresoHome(plan).complete) || planes[0] || null
  const objetivo = String(planActivo?.objetivo || '')
    .replace(/^coach_(personalizado_)?/, '')
    .replaceAll('_', ' ')
  const siguienteSesion = planActivo ? siguienteSesionHome(planActivo) : null
  const tituloSesion =
    siguienteSesion?.estado === 'Hoy'
      ? 'Entrenamiento de hoy'
      : siguienteSesion?.estado === 'Atrasada'
        ? 'Entrenamiento atrasado'
        : siguienteSesion?.estado === 'Próxima'
          ? 'Próxima sesión'
          : 'Mi entrenamiento asignado'

  return (
    <div className="space-y-5">
      <section className="bg-zinc-900 border border-red-600 rounded-2xl sm:rounded-3xl p-5 sm:p-7">
        <p className="text-sm font-black uppercase tracking-wide text-red-400">Mi Inicio</p>
        <h2 className="mt-2 text-3xl sm:text-5xl font-black text-white">
          Hola, {student?.nombre || 'alumno'}
        </h2>
        <p className="mt-3 text-zinc-400">
          Aquí tienes lo importante de hoy. Tu coach controla las asignaciones y tú ves solamente tu información.
        </p>
      </section>

      <div className="grid lg:grid-cols-2 gap-5">
        <section className="bg-zinc-900 border border-blue-500 rounded-2xl sm:rounded-3xl p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-black uppercase text-blue-300">Entrenamiento</p>
              <h3 className="text-2xl font-black mt-1">{tituloSesion}</h3>
            </div>
            <span className="rounded-full bg-blue-950 border border-blue-700 px-3 py-1 text-xs font-black text-blue-200">
              {planes.filter((plan) => !progresoHome(plan).complete).length} pendiente{planes.filter((plan) => !progresoHome(plan).complete).length === 1 ? '' : 's'}
            </span>
          </div>

          {cargando ? (
            <p className="mt-5 text-zinc-400">Cargando entrenamiento...</p>
          ) : planActivo ? (
            <div className="mt-5 bg-black/50 border border-zinc-700 rounded-2xl p-4">
              <p className="text-yellow-400 font-black capitalize">{objetivo || 'Entrenamiento personalizado'}</p>
              {siguienteSesion?.fecha ? (
                <p className="text-sm text-cyan-300 mt-1 capitalize">
                  {formatearFechaHome(siguienteSesion.fecha)}
                </p>
              ) : (
                <p className="text-sm text-zinc-400 mt-1">
                  {planActivo.created_at ? new Date(planActivo.created_at).toLocaleDateString('es-CL') : 'Plan activo'}
                </p>
              )}

              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className={`inline-block rounded-full border px-3 py-1 text-xs font-black ${
                  progresoHome(planActivo).complete
                    ? 'bg-green-950 border-green-700 text-green-300'
                    : 'bg-yellow-950 border-yellow-700 text-yellow-300'
                }`}>
                  {progresoHome(planActivo).done}/{progresoHome(planActivo).totalSesiones} sesiones
                </span>
                {siguienteSesion && (
                  <span className={`inline-block rounded-full border px-3 py-1 text-xs font-black ${
                    siguienteSesion.estado === 'Hoy'
                      ? 'bg-blue-950 border-blue-500 text-blue-200'
                      : siguienteSesion.estado === 'Atrasada'
                        ? 'bg-red-950 border-red-700 text-red-300'
                        : siguienteSesion.estado === 'Próxima'
                          ? 'bg-cyan-950 border-cyan-700 text-cyan-300'
                          : 'bg-yellow-950 border-yellow-700 text-yellow-300'
                  }`}>
                    {siguienteSesion.estado}
                  </span>
                )}
              </div>

              {siguienteSesion ? (
                <>
                  <p className="mt-4 text-sm font-black text-zinc-400">
                    Sesión {siguienteSesion.sessionNumber} de {progresoHome(planActivo).totalSesiones}
                  </p>
                  <pre className="mt-2 whitespace-pre-wrap rounded-xl bg-zinc-950 p-3 font-sans text-sm text-zinc-200 max-h-56 overflow-auto">
                    {contenidoSesionHome(planActivo, siguienteSesion.sessionNumber)}
                  </pre>
                </>
              ) : (
                <p className="mt-4 text-sm font-black text-green-400">
                  Plan completado.
                </p>
              )}
            </div>
          ) : (
            <div className="mt-5 bg-black/50 border border-zinc-800 rounded-2xl p-4">
              <p className="font-black text-zinc-200">Aún no tienes un entrenamiento asignado.</p>
              <p className="text-sm text-zinc-500 mt-1">Cuando tu coach te asigne uno, aparecerá aquí automáticamente.</p>
            </div>
          )}

          <button
            type="button"
            onClick={() => setSection('MiEntrenamiento')}
            className="mt-4 w-full rounded-2xl bg-blue-600 hover:bg-blue-700 p-4 font-black"
          >
            Abrir mi entrenamiento
          </button>
        </section>

        <section className="bg-zinc-900 border border-zinc-700 rounded-2xl sm:rounded-3xl p-5">
          <p className="text-sm font-black uppercase text-zinc-400">Accesos rápidos</p>
          <div className="mt-4 grid sm:grid-cols-2 gap-3">
            <button onClick={() => setSection('MiCamino')} className="bg-zinc-950 border border-zinc-700 hover:border-yellow-500 rounded-2xl p-5 text-left">
              <p className="font-black text-yellow-400">Mi camino</p>
              <p className="text-sm text-zinc-500 mt-1">Nivel, progreso y contenido habilitado.</p>
            </button>
            <button onClick={() => setSection('Evaluaciones')} className="bg-zinc-950 border border-zinc-700 hover:border-cyan-500 rounded-2xl p-5 text-left">
              <p className="font-black text-cyan-400">Evaluaciones</p>
              <p className="text-sm text-zinc-500 mt-1">Tests, registros y evolución.</p>
            </button>
            <button onClick={() => setSection('Ficha')} className="bg-zinc-950 border border-zinc-700 hover:border-green-500 rounded-2xl p-5 text-left">
              <p className="font-black text-green-400">Mi ficha</p>
              <p className="text-sm text-zinc-500 mt-1">Datos personales y deportivos.</p>
            </button>
            <button onClick={() => setSection('Pago')} className="bg-zinc-950 border border-zinc-700 hover:border-red-500 rounded-2xl p-5 text-left">
              <p className="font-black text-red-400">Mi pago</p>
              <p className="text-sm text-zinc-500 mt-1">Estado: {student?.estado_pago || 'Pendiente'}.</p>
            </button>
          </div>
        </section>
      </div>

      <section className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-zinc-700 bg-zinc-900 p-4">
          <p className="text-xs font-black uppercase tracking-wide text-zinc-500">Mi constancia</p>
          <p className="mt-1 text-2xl font-black text-white">{asistenciaHome.mes}</p>
          <p className="text-sm text-zinc-500">asistencias este mes</p>
        </div>
        <div className="rounded-2xl border border-zinc-700 bg-zinc-900 p-4">
          <p className="text-xs font-black uppercase tracking-wide text-zinc-500">Última asistencia</p>
          <p className="mt-1 text-lg font-black text-white">
            {asistenciaHome.ultima ? new Date(asistenciaHome.ultima).toLocaleDateString('es-CL') : 'Sin registro'}
          </p>
          <p className="text-sm text-zinc-500">{asistenciaHome.total} registros totales</p>
        </div>
        <button
          type="button"
          onClick={() => setSection('AsistenciaQR')}
          className="rounded-2xl border border-emerald-700 bg-emerald-950/30 p-4 text-left hover:border-emerald-400"
        >
          <p className="text-xs font-black uppercase tracking-wide text-emerald-400">Asistencia QR</p>
          <p className="mt-1 font-black text-white">Mostrar mi QR</p>
          <p className="mt-1 text-sm text-zinc-400">Acceso directo para registrar tu ingreso.</p>
        </button>
      </section>

      <section className="bg-zinc-900 border border-yellow-600/70 rounded-2xl sm:rounded-3xl p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-black uppercase text-yellow-400">Mi progreso CPS</p>
            <h3 className="mt-1 text-xl font-black text-white">Nivel, grado y evolución</h3>
          </div>
          <button
            type="button"
            onClick={() => setSection('MiCamino')}
            className="rounded-xl bg-yellow-500 px-4 py-2 text-sm font-black text-black hover:bg-yellow-400"
          >
            Abrir Mi Camino
          </button>
        </div>

        {cpsResumen.length ? (
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {cpsResumen.map((route) => {
              const isKickboxing = route.route_code === 'KICKBOXING'
              const beltBackground = {
                Blanco: 'linear-gradient(90deg,#f8fafc,#e5e7eb)',
                Naranjo: 'linear-gradient(90deg,#fb923c,#f97316)',
                Verde: 'linear-gradient(90deg,#4ade80,#16a34a)',
                Azul: 'linear-gradient(90deg,#60a5fa,#2563eb)',
                Café: 'linear-gradient(90deg,#a16207,#713f12)',
                'Café-Negro': 'linear-gradient(90deg,#713f12 0%,#713f12 48%,#111827 52%,#111827 100%)',
                'Negro 1er Dan': 'linear-gradient(90deg,#18181b,#020617)',
              }[route.stage_label]

              return (
                <article key={route.route_code} className="rounded-2xl border border-zinc-700 bg-black/50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-black uppercase tracking-wide text-zinc-500">
                        {isKickboxing ? 'Kickboxing · grado actual' : 'Boxeo · nivel actual'}
                      </p>
                      <p className="mt-1 text-lg font-black text-white">{route.stage_label}</p>
                    </div>
                    <span className="text-sm font-black text-yellow-400">
                      {route.stage_progress_pct ?? 0}%
                    </span>
                  </div>

                  {isKickboxing && (
                    <div
                      className="mt-3 h-4 rounded-full border border-zinc-600"
                      style={{ background: beltBackground || '#27272a' }}
                    />
                  )}

                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-zinc-800">
                    <div
                      className="h-full rounded-full bg-yellow-500"
                      style={{
                        width: `${Math.max(0, Math.min(100, Number(route.stage_progress_pct || 0)))}%`,
                      }}
                    />
                  </div>

                  <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="rounded-xl bg-zinc-950 p-2">
                      <strong className="block text-white">{route.stage_questions_approved ?? 0}/{route.stage_questions_total ?? 0}</strong>
                      <span className="text-zinc-500">Teoría</span>
                    </div>
                    <div className="rounded-xl bg-zinc-950 p-2">
                      <strong className="block text-white">{route.stage_cards_completed ?? 0}/{route.stage_cards_total ?? 0}</strong>
                      <span className="text-zinc-500">Técnicas</span>
                    </div>
                    <div className="rounded-xl bg-zinc-950 p-2">
                      <strong className="block text-white">{route.route_progress_pct ?? 0}%</strong>
                      <span className="text-zinc-500">Total</span>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        ) : (
          <div className="mt-4 rounded-2xl border border-zinc-800 bg-black/40 p-4">
            <p className="font-black text-zinc-200">Aún no tienes una ruta CPS activa.</p>
            <p className="mt-1 text-sm text-zinc-500">
              Cuando estés inscrito en Boxeo o Kickboxing, tu nivel o grado aparecerá aquí.
            </p>
          </div>
        )}
      </section>

      <section className="bg-zinc-900 border border-emerald-700 rounded-2xl sm:rounded-3xl p-5">
        <h3 className="text-xl font-black text-emerald-400">Lo que comparte PowerFit contigo</h3>
        <p className="text-zinc-400 mt-2">
          Solo ves tus entrenamientos, progreso, evaluaciones, niveles habilitados, mensajes y estado de pago. La administración, otros alumnos, notas internas y configuración del sistema permanecen ocultos.
        </p>
      </section>
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
  const [initialSectionApplied, setInitialSectionApplied] = useState(false)
  const [busquedaAdmin, setBusquedaAdmin] = useState('')
  const [alumnoDetalle, setAlumnoDetalle] = useState(null)
  const [loading, setLoading] = useState(true)
  const [passwordRecovery, setPasswordRecovery] = useState(false)
  const [idioma, setIdioma] = useState(() => localStorage.getItem('powerfit_idioma') || 'es')
  const [branding, setBranding] = useState(() => loadBranding())
  const [gimnasio, setGimnasio] = useState(null)
  const [pwaUpdate, setPwaUpdate] = useState(null)
  const [studentPaymentPlan, setStudentPaymentPlan] = useState('monthly')
  const [paymentReturn, setPaymentReturn] = useState(() =>
    new URLSearchParams(window.location.search).get('payment'),
  )

  const params = new URLSearchParams(window.location.search)
  const alumnoCheckIn = params.get('checkin')
  const edition = getAppEdition()
  const t = UI_TEXT[idioma] || UI_TEXT.es
  const sessionIsAdmin = student?.role?.toLowerCase() === 'admin'

  useEffect(() => {
    if (!student?.id || initialSectionApplied) return undefined

    const requestedSection = new URLSearchParams(window.location.search).get('section')
    const timer = window.setTimeout(() => {
      if (!requestedSection) {
        setSection(sessionIsAdmin ? (edition.sections[0] || 'Admin') : 'Inicio')
      }
      setInitialSectionApplied(true)
    }, 0)

    return () => window.clearTimeout(timer)
  }, [edition.sections, initialSectionApplied, sessionIsAdmin, student?.id])


  useEffect(() => listenForPowerFitUpdate(setPwaUpdate), [])

  useEffect(() => {
    if (!user || !alumnoCheckIn || sessionIsAdmin) return

    const url = new URL(window.location.href)
    url.searchParams.delete('checkin')
    if (url.searchParams.get('mode') === 'attendance') {
      url.searchParams.delete('mode')
    }

    window.history.replaceState(
      {},
      '',
      `${url.pathname}${url.search}${url.hash}`,
    )
  }, [alumnoCheckIn, sessionIsAdmin, user])

  useEffect(() => {
    document.title = `${edition.appName || 'PowerFit 360'}`
  }, [edition.appName])

  function editionAllows(sectionName) {
    if (sectionName === 'Inicio' || sectionName === 'MiEntrenamiento') return true

    if (
      sectionName === 'Pago' &&
      student &&
      student.role?.toLowerCase() !== 'admin'
    ) {
      return true
    }

    return edition.sections.includes(sectionName)
  }

  function canOpenSection(sectionName, adminStatus) {
    if (!editionAllows(sectionName)) return false
    if (['Admin', 'Entrenamientos', 'Graduaciones', 'RegistroCompras', 'Reportes', 'Marca', 'Constructor'].includes(sectionName)) {
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
    const alumnosNormalizados = alumnosData
      .map(alumnoConEstadoAutomatico)
      .filter((alumno) => !['RETIRADO_MOROSIDAD', 'ELIMINADO'].includes(String(alumno.estado_powerfit || '').toUpperCase()))

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

  async function registrarPago(
    alumno,
    fechaPago = fechaHoy(),
    planCode = 'monthly',
    paymentMethod = 'efectivo',
  ) {
    await aplicarPagoConfirmado(alumno, fechaPago, planCode, paymentMethod)
  }

  async function aplicarPagoConfirmado(
    alumno,
    fechaPago = fechaHoy(),
    planCode = 'monthly',
    paymentMethod = 'efectivo',
  ) {
    if (!alumno?.id) return

    const selectedPlan = paymentPlanByCode(planCode)
    const safePaymentMethod = String(paymentMethod || 'efectivo').trim().toLowerCase()
    const requestId = `payment-${alumno.id}-${selectedPlan.code}-${safePaymentMethod}-${Date.now()}`

    const { data, error } = await supabase.rpc(
      'register_powerfit_payment_with_generation_reset_secure',
      {
        p_client_request_id: requestId,
        p_alumno_id: alumno.id,
        p_payment_method: safePaymentMethod,
        p_period_start: fechaPago || fechaHoy(),
        p_months: selectedPlan.months,
        p_amount: selectedPlan.amount,
        p_notes: `Pago ${selectedPlan.name} (${selectedPlan.months} meses) · método ${safePaymentMethod} · registrado desde panel PowerFit 360`,
        p_paid_on: fechaPago || fechaHoy(),
        p_generation_balance: 6,
      },
    )

    if (error) {
      const raw = String(error.message || '')
      const friendly =
        raw.includes('payment_received_on cannot be in the future') ||
        raw.includes('period_start cannot be in the future')
          ? 'La fecha seleccionada aparece adelantada por diferencia horaria. Revisa la fecha de pago e inténtalo nuevamente.'
          : raw.includes('PAYMENT_AMOUNT_NOT_ALLOWED')
            ? 'El monto no coincide con el plan seleccionado.'
            : raw.includes('ADMIN_REQUIRED') || raw.includes('FORBIDDEN')
              ? 'Tu sesión no tiene permiso de administrador para registrar este pago.'
              : raw

      window.alert(`No se pudo registrar el pago: ${friendly}`)
      return
    }

    await cargarUsuario()

    const payment = data?.payment || {}
    const due = payment?.new_due_date || payment?.payment?.new_due_date || null
    const receipt = payment?.receipt_code || payment?.payment?.receipt_code || null

    window.alert(
      [
        'Pago manual registrado correctamente.',
        due ? `Nueva fecha de vencimiento: ${formatearFecha(due)}` : '',
        receipt ? `Comprobante: ${receipt}` : '',
      ]
        .filter(Boolean)
        .join('\n'),
    )
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
      `Retirar a ${alumno.nombre || 'este alumno'} por morosidad? Se eliminarán sus datos deportivos y se conservará solo un punto de reintegro por 60 días.`
    )

    if (!confirmado) return

    const { data, error } = await supabase.rpc(
      'retire_powerfit_student_for_nonpayment_secure',
      {
        p_alumno_id: alumno.id,
      },
    )

    if (error) {
      const noMoroso = String(error.message || '').includes('STUDENT_NOT_DELINQUENT')
      window.alert(
        noMoroso
          ? 'Solo se puede usar este retiro cuando el alumno está Moroso o Pendiente.'
          : `No se pudo retirar al alumno: ${error.message}`,
      )
      return
    }

    window.alert(
      `Alumno retirado. El punto de reintegro se conservará hasta ${new Date(data?.retained_until || Date.now()).toLocaleDateString('es-CL')}.`,
    )
    setAlumnoDetalle(null)
    await cargarUsuario()
  }

  async function reintegrarAlumno(alumno) {
    if (!alumno?.id) return

    const { error } = await supabase.rpc(
      'restore_powerfit_student_from_retention_secure',
      {
        p_alumno_id: alumno.id,
      },
    )

    if (error) {
      const sinCheckpoint = String(error.message || '').includes('NO_ACTIVE_REJOIN_CHECKPOINT')
      window.alert(
        sinCheckpoint
          ? 'No existe un punto de reintegro vigente. Si pasaron más de 60 días, activa manualmente su nivel o grado desde Graduaciones.'
          : `No se pudo reintegrar el progreso: ${error.message}`,
      )
      return
    }

    window.alert('Progreso CPS reintegrado desde el último punto guardado.')
    await cargarUsuario()
  }

  async function abrirPagoAlumno(alumno, planCode = 'monthly') {
    if (!alumno) return

    const selectedPlan = paymentPlanByCode(planCode)
    const paymentPayload = {
      alumno_id: alumno.id,
      user_id: alumno.user_id || user.id,
      nombre: alumno.nombre || user.email,
      plan_code: selectedPlan.code,
      months: selectedPlan.months,
      monto: selectedPlan.amount,
      amount: selectedPlan.amount,
    }

    if (!paymentPayload.monto || paymentPayload.monto <= 0) {
      window.alert('El plan seleccionado no tiene un monto válido.')
      return
    }

    try {
      const { data, error } = await supabase.functions.invoke('create-preference', {
        body: paymentPayload,
      })
      const checkoutUrl = data?.init_point || data?.sandbox_init_point

      if (error || !checkoutUrl) {
        const context = await error?.context?.json?.().catch(() => null)
        window.alert(
          context?.message ||
            context?.error ||
            error?.message ||
            'No se pudo crear el pago de Mercado Pago.',
        )
        return
      }

      const isOwnPayment = String(alumno.id) === String(student?.id)

      if (isAdmin && !isOwnPayment) {
        const shareText = `Pago PowerFit 360 · ${selectedPlan.name} · ${Number(selectedPlan.amount || 0).toLocaleString('es-CL')}`
        if (navigator.share) {
          try {
            await navigator.share({
              title: 'Link de pago PowerFit 360',
              text: shareText,
              url: checkoutUrl,
            })
            return
          } catch (shareError) {
            if (shareError?.name === 'AbortError') return
          }
        }

        try {
          await navigator.clipboard.writeText(checkoutUrl)
          window.alert('Link de Mercado Pago copiado. Ya puedes enviárselo al alumno.')
        } catch {
          window.prompt('Copia y envía este link de Mercado Pago:', checkoutUrl)
        }
        return
      }

      // En iPhone/Safari evitamos abrir about:blank antes de esperar la respuesta.
      // Navegar en la misma pestaña es más estable y evita pestañas blancas.
      window.location.assign(checkoutUrl)
    } catch (error) {
      window.alert(
        `No se pudo iniciar Mercado Pago (${error.message}). Intenta nuevamente.`,
      )
    }
  }

  function abrirPagoMensualidad(planCode = studentPaymentPlan) {
    abrirPagoAlumno(student, planCode)
  }

  async function actualizarRetornoPago() {
    await cargarUsuario()
    setSection('Pago')

    const url = new URL(window.location.href)
    url.searchParams.delete('payment')
    window.history.replaceState(
      {},
      '',
      `${url.pathname}${url.search}${url.hash}`,
    )

    setPaymentReturn(null)
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

  if (alumnoCheckIn && !user) {
    return (
      <>
        <LoginPage onLogin={checkUser} />
        <ChatWidget student={null} idioma={idioma} />
      </>
    )
  }

  if (alumnoCheckIn && sessionIsAdmin) {
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

  if (!user) {
    return (
      <>
        <LoginPage onLogin={checkUser} />
        <ChatWidget student={null} idioma={idioma} />
      </>
    )
  }

  const isAdmin = sessionIsAdmin
  const termsFeatureActive = Object.prototype.hasOwnProperty.call(
    student || {},
    'terminos_aceptados'
  )
  const termsAccepted =
    !termsFeatureActive ||
    (Boolean(student?.terminos_aceptados) && student?.terminos_version === TERMS_VERSION)
  const visibleSection = canOpenSection(section, isAdmin) ? section : (isAdmin ? 'Admin' : 'Inicio')
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
    <div className="powerfit-app-shell min-h-screen bg-black text-white px-3 py-4 sm:p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
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

      <div className="app-profile-hero bg-zinc-900 border border-red-600 rounded-2xl sm:rounded-3xl p-4 sm:p-5 mb-3 sm:mb-6 flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
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

      <PremiumDesktopNav
        isAdmin={isAdmin}
        idioma={idioma}
        t={t}
        edition={edition}
        visibleSection={visibleSection}
        setSection={setSection}
        editionAllows={editionAllows}
      />

      {paymentReturn && (
        <div
          className={`rounded-2xl sm:rounded-3xl p-5 sm:p-6 mb-8 border ${
            paymentReturn === 'success'
              ? 'border-green-500 bg-green-950/60'
              : paymentReturn === 'pending'
                ? 'border-yellow-500 bg-yellow-950/50'
                : 'border-red-500 bg-red-950/50'
          }`}
        >
          <h2
            className={`text-2xl sm:text-3xl font-black ${
              paymentReturn === 'success'
                ? 'text-green-300'
                : paymentReturn === 'pending'
                  ? 'text-yellow-300'
                  : 'text-red-300'
            }`}
          >
            {paymentReturn === 'success'
              ? idioma === 'en'
                ? 'PAYMENT RECEIVED'
                : 'PAGO RECIBIDO'
              : paymentReturn === 'pending'
                ? idioma === 'en'
                  ? 'PAYMENT PENDING'
                  : 'PAGO PENDIENTE'
                : idioma === 'en'
                  ? 'PAYMENT NOT COMPLETED'
                  : 'PAGO NO COMPLETADO'}
          </h2>

          <p className="mt-2 font-bold text-zinc-200">
            {paymentReturn === 'success'
              ? idioma === 'en'
                ? 'Mercado Pago returned the payment as approved. Refresh your PowerFit payment record to confirm the webhook update.'
                : 'Mercado Pago devolvió el pago como aprobado. Actualiza tu ficha para confirmar el registro del webhook.'
              : paymentReturn === 'pending'
                ? idioma === 'en'
                  ? 'Mercado Pago is still processing the payment. Your membership will update only after approval.'
                  : 'Mercado Pago todavía está procesando el pago. Tu membresía se actualizará solo cuando sea aprobado.'
                : idioma === 'en'
                  ? 'The payment was cancelled or rejected. No membership period should be added.'
                  : 'El pago fue cancelado o rechazado. No se debe sumar ningún período a tu membresía.'}
          </p>

          <button
            type="button"
            onClick={actualizarRetornoPago}
            className="mt-4 rounded-xl bg-white px-5 py-3 font-black text-black hover:bg-zinc-200"
          >
            {idioma === 'en' ? 'Refresh payment status' : 'Actualizar estado de pago'}
          </button>
        </div>
      )}
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

      {!isAdmin && visibleSection === 'Inicio' && (
        <StudentHomePanel student={student} setSection={setSection} asistencias={asistencias} />
      )}

      {!isAdmin && editionAllows('MiEntrenamiento') && visibleSection === 'MiEntrenamiento' && (
        <Suspense fallback={<LazyPanelFallback />}>
          <AssignedTrainingPage
            student={student}
            onUpdateStudent={() => cargarUsuario()}
          />
        </Suspense>
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

      {editionAllows('MiCamino') && visibleSection === 'MiCamino' && (
        <Suspense fallback={<LazyPanelFallback />}>
          <CombatPathPage
            student={student}
            user={user}
            isAdmin={isAdmin}
          />
        </Suspense>
      )}

      {editionAllows('Graduaciones') && visibleSection === 'Graduaciones' && isAdmin && (
        <Suspense fallback={<LazyPanelFallback />}>
          <CombatPathPage
            student={student}
            user={user}
            isAdmin={isAdmin}
          />
        </Suspense>
      )}

      {editionAllows('Metodos') && visibleSection === 'Metodos' && (
        <Suspense fallback={<LazyPanelFallback />}>
          <MetodosPage idioma={idioma} />
        </Suspense>
      )}

      {editionAllows('Generador') && visibleSection === 'Generador' && (
        <Suspense fallback={<LazyPanelFallback />}>
          <GeneradorPage student={student} onUpdateStudent={() => cargarUsuario()} idioma={idioma} />
        </Suspense>
      )}

      {editionAllows('Constructor') && visibleSection === 'Constructor' && isAdmin && (
        <Suspense fallback={<LazyPanelFallback />}>
          <ConstructorPage student={student} onUpdateStudent={() => cargarUsuario()} idioma={idioma} />
        </Suspense>
      )}

      {editionAllows('Entrenamientos') && visibleSection === 'Entrenamientos' && isAdmin && (
        <EntrenamientosCoachPanel
          students={students}
          user={user}
          onSaved={() => cargarUsuario()}
        />
      )}

      {editionAllows('Rutinas') && visibleSection === 'Rutinas' && (
        <Suspense fallback={<LazyPanelFallback />}>
          <RutinasPage student={student} onUpdateStudent={() => cargarUsuario()} />
        </Suspense>
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

          <section className="mt-6 rounded-2xl border border-zinc-700 bg-black/30 p-4 sm:p-5">
            <div className="mb-4">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-zinc-500">
                Identidad y contacto
              </p>
              <h3 className="mt-1 text-xl font-black text-white">Mis datos personales</h3>
              <p className="mt-1 text-sm text-zinc-500">
                Información visible para ti y para la gestión segura de tu entrenamiento.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Info label="Nombre" value={student?.nombre} />
              <Info label="RUT" value={student?.rut} />
              <Info label="Correo" value={student?.email || user.email} />
              <Info label="Teléfono" value={student?.telefono} />
              <Info label="Fecha de nacimiento" value={formatearFecha(student?.fecha_nacimiento)} />
              <Info label="Edad" value={student?.edad} />
              <Info label="Peso" value={student?.peso ? `${student.peso} kg` : '-'} />
              <Info label="Estatura" value={student?.altura ? `${student.altura} cm` : '-'} />
              <Info label="Contacto de emergencia" value={student?.contacto_emergencia} />
              <Info label="Observaciones" value={student?.observaciones} />
            </div>
          </section>

          <section className="mt-4 rounded-2xl border border-amber-800/70 bg-amber-950/10 p-4 sm:p-5">
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-500">
                  Datos protegidos
                </p>
                <h3 className="mt-1 text-xl font-black text-white">Escuela y membresía</h3>
                <p className="mt-1 text-sm text-zinc-500">
                  Estos datos los administra la escuela y no se modifican desde tu ficha personal.
                </p>
              </div>
              <span className="rounded-full border border-amber-800 bg-amber-950/40 px-3 py-1 text-xs font-black text-amber-300">
                Sólo lectura
              </span>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Info label="Fecha de inicio" value={formatearFecha(student?.fecha_ingreso)} />
              <Info label="Tiempo en PowerFit" value={antiguedadTexto(student?.fecha_ingreso)} />
              <Info label="Estado de pago" value={student?.estado_pago} />
              <Info label="Mensualidad" value={`${student?.monto || 0}`} />
              <Info label="Último pago" value={formatearFecha(student?.fecha_pago)} />
              <Info
                label="Vencimiento"
                value={formatearFecha(student?.fecha_vencimiento)}
              />
              <Info label="Generaciones IA disponibles" value={student?.generaciones_disponibles || 0} />
            </div>
          </section>

          <SelfProfileEditor
            student={student}
            onSaved={() => cargarUsuario()}
          />

          <section className="mt-6">
            <div className="mb-4">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-violet-400">
                Evolución
              </p>
              <h3 className="mt-1 text-xl font-black text-white">Mi progreso deportivo</h3>
            </div>
            <ProgressDashboard
              records={recordsEntrenamiento}
              rms={rmsAlumno}
              asistencias={asistencias}
              student={student}
            />
          </section>
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

          <div className="mt-6">
            <p className="text-sm font-black uppercase tracking-wide text-zinc-300 mb-3">Elige tu plan</p>
            <div className="grid sm:grid-cols-2 gap-3">
              {PAYMENT_PLANS.map((plan) => {
                const active = studentPaymentPlan === plan.code
                return (
                  <button
                    key={plan.code}
                    type="button"
                    onClick={() => setStudentPaymentPlan(plan.code)}
                    className={`rounded-2xl border p-4 text-left transition ${active ? 'border-green-400 bg-green-500/10 shadow-lg shadow-green-950/20' : 'border-zinc-700 bg-black hover:border-zinc-500'}`}
                  >
                    <p className={`font-black uppercase ${active ? 'text-green-300' : 'text-white'}`}>{plan.name}</p>
                    <p className="mt-1 text-2xl font-black">{formatearCLP(plan.amount)}</p>
                    <p className="text-sm text-zinc-400">{plan.months} {plan.months === 1 ? 'mes' : 'meses'}</p>
                    {plan.saving > 0 && <p className="mt-3 text-sm font-black text-yellow-400">Ahorras {formatearCLP(plan.saving)}</p>}
                  </button>
                )
              })}
            </div>
          </div>

          <button
            onClick={() => abrirPagoMensualidad(studentPaymentPlan)}
            className="mt-6 w-full bg-green-600 hover:bg-green-700 p-5 rounded-2xl font-black text-xl"
          >
            Pagar {paymentPlanByCode(studentPaymentPlan).name} · {formatearCLP(paymentPlanByCode(studentPaymentPlan).amount)}
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
          setSection={setSection}
        />
      )}

      {editionAllows('RegistroCompras') && visibleSection === 'RegistroCompras' && isAdmin && (
        <Suspense fallback={<LazyPanelFallback />}>
          <RegistroComprasPage
            registroCompras={registroCompras}
            avatarRequests={avatarRequests}
            aprobarSolicitud={aprobarSolicitud}
            actualizarSolicitudAvatarIA={actualizarSolicitudAvatarIA}
            descargarCSV={descargarCSV}
          />
        </Suspense>
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
          onReintegrarAlumno={reintegrarAlumno}
      />
      <ChatWidget student={student} idioma={idioma} />
      <div className="powerfit-signature fixed bottom-3 right-3 z-50 rounded-full border border-red-600/60 bg-black/80 px-3 py-2 text-[11px] font-black uppercase tracking-wide text-zinc-300 shadow-lg">
        {POWERFIT_SIGNATURE}
      </div>
      </div>
    </div>
  )
}
