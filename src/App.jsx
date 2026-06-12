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

function diferenciaDias(fecha) {
  if (!fecha) return null

  const hoy = new Date(fechaHoy())
  const destino = new Date(fecha)

  if (Number.isNaN(destino.getTime())) return null

  return Math.ceil((destino - hoy) / (1000 * 60 * 60 * 24))
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
            Membresia por vencer:{' '}
            {diasVence <= 0 ? 'vence hoy' : `faltan ${diasVence} dia(s)`}.
          </div>
        )}

        {alumno.estado_pago === 'Moroso' && (
          <div className="bg-red-900 border border-red-500 rounded-2xl p-4 mb-6 font-black">
            Membresia vencida. El alumno queda bloqueado hasta registrar pago o confirmar Webpay.
          </div>
        )}

        <div className="grid md:grid-cols-4 gap-4 mb-6">
          <Info label="Asistencias total" value={resumen.total} />
          <Info label="Asistencias este mes" value={resumen.mes} />
          <Info
            label="Ultima asistencia"
            value={resumen.ultima ? new Date(resumen.ultima).toLocaleDateString() : '-'}
          />
          <Info
            label="Dias sin asistir"
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
                placeholder="Telefono"
              />
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
              <input
                type="date"
                defaultValue={alumno.fecha_ingreso || ''}
                onBlur={(e) => onUpdate(alumno.id, 'fecha_ingreso', e.target.value)}
                className="bg-black p-3 rounded-xl"
              />
              <input
                type="date"
                defaultValue={alumno.fecha_pago || ''}
                onBlur={(e) => onUpdate(alumno.id, 'fecha_pago', e.target.value)}
                className="bg-black p-3 rounded-xl"
              />
              <input
                type="date"
                defaultValue={alumno.fecha_vencimiento || ''}
                onBlur={(e) => onUpdate(alumno.id, 'fecha_vencimiento', e.target.value)}
                className="bg-black p-3 rounded-xl"
              />
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
              <p className="font-black text-yellow-400">Webpay</p>
              <p className="text-zinc-400 mt-2">
                Cuando Webpay confirme el pago, el backend debe actualizar esta misma ficha:
                fecha de pago hoy, vencimiento +1 mes, estado Pagado y generaciones disponibles.
              </p>
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
        placeholder="Buscar por nombre, correo, telefono, estado o rol..."
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
                      ? `Vencida hace ${Math.abs(diasVence)} dia(s)`
                      : `Faltan ${diasVence} dia(s)`}
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
          <p className="text-zinc-400">No hay alumnos para esa busqueda.</p>
        )}
      </div>
    </div>
  )
}

export default function App() {
  const [user, setUser] = useState(null)
  const [student, setStudent] = useState(null)
  const [students, setStudents] = useState([])
  const [asistencias, setAsistencias] = useState([])
  const [registroCompras, setRegistroCompras] = useState([])
  const [section, setSection] = useState('Ficha')
  const [busquedaAdmin, setBusquedaAdmin] = useState('')
  const [alumnoDetalle, setAlumnoDetalle] = useState(null)
  const [loading, setLoading] = useState(true)

  const params = new URLSearchParams(window.location.search)
  const alumnoCheckIn = params.get('checkin')

  async function cargarUsuario(currentUser = user) {
    if (!currentUser) return

    const { data: alumno } = await supabase
      .from('alumnos')
      .select('*')
      .eq('user_id', currentUser.id)
      .single()

    const alumnoActual = alumno ? alumnoConEstadoAutomatico(alumno) : null
    setStudent(alumnoActual)

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
    Promise.resolve().then(() => checkUser())
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
      Number(solicitud.generaciones || 1)

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

  function abrirPagoAlumno(alumno) {
    if (!alumno) return

    const paymentUrl = import.meta.env.VITE_PAYMENT_URL

    if (paymentUrl) {
      const url = new URL(paymentUrl)
      url.searchParams.set('alumno_id', alumno.id)
      url.searchParams.set('user_id', alumno.user_id || user.id)
      url.searchParams.set('nombre', alumno.nombre || '')
      url.searchParams.set('monto', String(alumno.monto || 0))
      window.open(url.toString(), '_blank', 'noopener,noreferrer')
      return
    }

    const texto = `Hola Robinson, soy ${alumno.nombre || user.email}. Quiero pagar mi mensualidad PowerFit de $${alumno.monto || 0}.`
    window.open(
      `https://wa.me/56988497852?text=${encodeURIComponent(texto)}`,
      '_blank',
      'noopener,noreferrer'
    )
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
              {isAdmin ? 'ADMINISTRADOR' : 'ALUMNO'}
            </p>
            <p className={pagoAlDia ? 'text-green-400 font-black' : 'text-red-400 font-black'}>
              Estado pago: {student?.estado_pago || 'Pendiente'}
            </p>
          </div>
        </div>

        <button
          onClick={cerrarSesion}
          className="bg-red-600 px-5 py-3 rounded-2xl font-black w-full sm:w-auto"
        >
          Cerrar sesion
        </button>
      </div>

      <div className="sticky top-0 z-40 -mx-3 sm:mx-0 px-3 sm:px-0 py-3 mb-5 sm:mb-8 bg-black/95 backdrop-blur border-y border-zinc-900 sm:border-0">
        <div className="flex flex-nowrap sm:flex-wrap gap-3 overflow-x-auto pb-1 sm:pb-0">
          <Btn text="Ficha personal" active={section === 'Ficha'} set={() => setSection('Ficha')} />
          <Btn text="Pago / deuda" active={section === 'Pago'} set={() => setSection('Pago')} />
          <Btn text="Rutinas" active={section === 'Rutinas'} disabled={bloqueado} set={() => setSection('Rutinas')} />
          <Btn text="Generador IA" active={section === 'Generador'} disabled={bloqueado} set={() => setSection('Generador')} />
          <Btn text="Biblioteca" active={section === 'Metodos'} disabled={bloqueado} set={() => setSection('Metodos')} />
          <Btn text="MI QR" active={section === 'MiQR'} set={() => setSection('MiQR')} />

          {isAdmin && <Btn text="ADMIN ALUMNOS" active={section === 'Admin'} set={() => setSection('Admin')} />}
          {isAdmin && <Btn text="Registro compras" active={section === 'RegistroCompras'} set={() => setSection('RegistroCompras')} />}
        </div>
      </div>

      {bloqueado && (
        <div className="bg-red-950 border border-red-600 rounded-2xl sm:rounded-3xl p-5 sm:p-6 mb-8">
          <h2 className="text-2xl sm:text-3xl font-black text-red-400">SERVICIOS BLOQUEADOS</h2>
          <p className="text-zinc-300 mt-2">
            Tu cuenta esta pendiente o morosa. Regulariza el pago para desbloquear rutinas,
            generador IA y metodos.
          </p>
          <button
            onClick={abrirPagoMensualidad}
            className="mt-5 bg-green-600 hover:bg-green-700 px-6 py-4 rounded-2xl font-black"
          >
            Pagar mensualidad
          </button>
        </div>
      )}

      {mostrarAvisoVencimiento && (
        <div className="bg-yellow-500 text-black rounded-2xl sm:rounded-3xl p-5 sm:p-6 mb-8">
          <h2 className="text-2xl sm:text-3xl font-black">MEMBRESIA POR VENCER</h2>
          <p className="mt-2 font-bold">
            Tu membresia vence {diasParaVencer === 0 ? 'hoy' : `en ${diasParaVencer} dia(s)`}.
            Regulariza el pago para evitar el bloqueo automatico.
          </p>
          <button
            onClick={abrirPagoMensualidad}
            className="mt-5 bg-green-700 hover:bg-green-800 text-white px-6 py-4 rounded-2xl font-black"
          >
            Pagar mensualidad
          </button>
        </div>
      )}

      {section === 'Ficha' && (
        <div className="bg-zinc-900 border border-yellow-500 rounded-2xl sm:rounded-3xl p-4 sm:p-6">
          <h2 className="text-3xl sm:text-4xl font-black text-yellow-400 mb-6">Ficha personal</h2>

          <div className="grid md:grid-cols-2 gap-4">
            <Info label="Nombre" value={student?.nombre} />
            <Info label="Correo" value={student?.email || user.email} />
            <Info label="Telefono" value={student?.telefono} />
            <Info label="Peso" value={student?.peso} />
            <Info label="Fecha ingreso" value={student?.fecha_ingreso} />
            <Info label="Fecha pago" value={student?.fecha_pago} />
            <Info label="Vencimiento" value={student?.fecha_vencimiento} />
            <Info label="Mensualidad" value={`$${student?.monto || 0}`} />
            <Info label="Estado pago" value={student?.estado_pago} />
            <Info label="Generaciones" value={student?.generaciones_disponibles || 0} />
          </div>
        </div>
      )}

      {section === 'Pago' && (
        <div className="bg-zinc-900 border border-green-600 rounded-2xl sm:rounded-3xl p-4 sm:p-6">
          <h2 className="text-3xl sm:text-4xl font-black text-green-400 mb-6">Pago / deuda</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <Info label="Estado" value={student?.estado_pago} />
            <Info label="Mensualidad" value={`$${student?.monto || 0}`} />
            <Info label="Fecha pago" value={student?.fecha_pago} />
            <Info label="Vencimiento" value={student?.fecha_vencimiento} />
          </div>

          <button
            onClick={abrirPagoMensualidad}
            className="mt-6 w-full bg-green-600 hover:bg-green-700 p-5 rounded-2xl font-black text-xl"
          >
            Pagar mensualidad
          </button>
        </div>
      )}

      {section === 'Rutinas' && !bloqueado && <RutinasPage student={student} />}

      {section === 'Generador' && !bloqueado && (
        <GeneradorPage student={student} onUpdateStudent={() => cargarUsuario()} />
      )}

      {section === 'Metodos' && !bloqueado && <MetodosPage />}

      {section === 'MiQR' && <MiQRPage student={student} />}

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
