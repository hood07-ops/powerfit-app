import { useEffect, useState } from 'react'
import './App.css'
import { supabase } from './supabase'

import AsistenciaPage from './pages/AsistenciaPage'
import AsistenciaResumenPage from './pages/AsistenciaResumenPage'
import CheckInPage from './pages/CheckInPage'
import GeneradorPage from './pages/GeneradorPage'
import LoginPage from './pages/LoginPage'
import MetodosPage from './pages/MetodosPage'
import MiQRPage from './pages/MiQRPage'
import RegistroComprasPage from './pages/RegistroComprasPage'
import RegistroMensualidadesPage from './pages/RegistroMensualidadesPage'
import RutinasPage from './pages/RutinasPage'

function Btn({ text, set, disabled }) {
  return (
    <button
      onClick={set}
      disabled={disabled}
      className={`px-4 py-3 rounded-2xl font-black ${
        disabled ? 'bg-zinc-700 opacity-40' : 'bg-zinc-800 hover:bg-red-600'
      }`}
    >
      {text}
    </button>
  )
}

function Info({ label, value }) {
  return (
    <div className="bg-zinc-800 rounded-2xl p-4">
      <p className="text-zinc-400">{label}</p>
      <p className="text-xl font-black">{value || '-'}</p>
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

export default function App() {
  const [user, setUser] = useState(null)
  const [student, setStudent] = useState(null)
  const [students, setStudents] = useState([])
  const [asistencias, setAsistencias] = useState([])
  const [registroCompras, setRegistroCompras] = useState([])
  const [section, setSection] = useState('Ficha')
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

    const { data: comprasData } = await supabase
      .from('solicitudes_compra')
      .select('*')
      .order('created_at', { ascending: false })

    setRegistroCompras(comprasData || [])

    const { data: alumnosData } = await supabase
      .from('alumnos')
      .select('*')
      .order('id', { ascending: false })

    const alumnosNormalizados = (alumnosData || []).map(alumnoConEstadoAutomatico)
    setStudents(alumnosNormalizados)

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
    const alumno = students.find((a) => a.id === solicitud.alumno_id)
    if (!alumno) return

    const nuevasGeneraciones =
      Number(alumno.generaciones_disponibles || 0) +
      Number(solicitud.generaciones || 2)

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

  return (
    <div className="min-h-screen bg-black text-white p-4">
      <div className="bg-zinc-900 border border-red-600 rounded-3xl p-5 mb-6 flex justify-between">
        <div>
          <h1 className="text-4xl font-black text-red-500">POWERFIT 360</h1>
          <p className="text-zinc-300">{student?.nombre || user.email}</p>
          <p className="text-yellow-400 font-black">
            {isAdmin ? 'ADMINISTRADOR' : 'ALUMNO'}
          </p>
          <p className={pagoAlDia ? 'text-green-400 font-black' : 'text-red-400 font-black'}>
            Estado pago: {student?.estado_pago || 'Pendiente'}
          </p>
        </div>

        <button
          onClick={cerrarSesion}
          className="bg-red-600 px-5 py-3 rounded-2xl font-black"
        >
          Cerrar sesión
        </button>
      </div>

      <div className="flex flex-wrap gap-3 mb-8">
        <Btn text="Ficha personal" set={() => setSection('Ficha')} />
        <Btn text="Pago / deuda" set={() => setSection('Pago')} />
        <Btn text="Rutinas" disabled={bloqueado} set={() => setSection('Rutinas')} />
        <Btn text="Generador IA" disabled={bloqueado} set={() => setSection('Generador')} />
        <Btn text="Métodos" disabled={bloqueado} set={() => setSection('Metodos')} />
        <Btn text="MI QR" set={() => setSection('MiQR')} />

        {isAdmin && <Btn text="ADMIN ALUMNOS" set={() => setSection('Admin')} />}
        {isAdmin && <Btn text="Asistencias" set={() => setSection('Asistencias')} />}
        {isAdmin && <Btn text="Resumen asistencia" set={() => setSection('ResumenAsistencia')} />}
        {isAdmin && <Btn text="Registro compras" set={() => setSection('RegistroCompras')} />}
        {isAdmin && <Btn text="Registro mensualidades" set={() => setSection('RegistroMensualidades')} />}
      </div>

      {bloqueado && (
        <div className="bg-red-950 border border-red-600 rounded-3xl p-6 mb-8">
          <h2 className="text-3xl font-black text-red-400">SERVICIOS BLOQUEADOS</h2>
          <p className="text-zinc-300 mt-2">
            Tu cuenta está pendiente o morosa. Regulariza el pago para desbloquear rutinas,
            generador IA y métodos.
          </p>
          <button
            onClick={abrirPagoMensualidad}
            className="mt-5 bg-green-600 hover:bg-green-700 px-6 py-4 rounded-2xl font-black"
          >
            Pagar mensualidad
          </button>
        </div>
      )}

      {section === 'Ficha' && (
        <div className="bg-zinc-900 border border-yellow-500 rounded-3xl p-6">
          <h2 className="text-4xl font-black text-yellow-400 mb-6">Ficha personal</h2>

          <div className="grid md:grid-cols-2 gap-4">
            <Info label="Nombre" value={student?.nombre} />
            <Info label="Correo" value={student?.email || user.email} />
            <Info label="Teléfono" value={student?.telefono} />
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
        <div className="bg-zinc-900 border border-green-600 rounded-3xl p-6">
          <h2 className="text-4xl font-black text-green-400 mb-6">Pago / deuda</h2>
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
        <div className="bg-zinc-900 border border-yellow-500 rounded-3xl p-6">
          <h2 className="text-4xl font-black text-yellow-400 mb-6">
            ADMINISTRADOR - ALUMNOS Y PAGOS
          </h2>

          <div className="space-y-3">
            {students.map((a) => (
              <div
                key={a.id}
                className="grid md:grid-cols-9 gap-2 items-center bg-zinc-800 rounded-2xl p-4"
              >
                <input
                  defaultValue={a.nombre || ''}
                  onBlur={(e) => actualizarAlumno(a.id, 'nombre', e.target.value)}
                  className="bg-black p-3 rounded-xl"
                  placeholder="Nombre"
                />

                <input
                  type="number"
                  defaultValue={a.peso || ''}
                  onBlur={(e) => actualizarAlumno(a.id, 'peso', Number(e.target.value))}
                  className="bg-black p-3 rounded-xl"
                  placeholder="Peso"
                />

                <input
                  type="date"
                  defaultValue={a.fecha_ingreso || ''}
                  onBlur={(e) => actualizarAlumno(a.id, 'fecha_ingreso', e.target.value)}
                  className="bg-black p-3 rounded-xl"
                />

                <input
                  type="date"
                  defaultValue={a.fecha_pago || ''}
                  onBlur={(e) => actualizarAlumno(a.id, 'fecha_pago', e.target.value)}
                  className="bg-black p-3 rounded-xl"
                />

                <input
                  type="date"
                  defaultValue={a.fecha_vencimiento || ''}
                  onBlur={(e) => actualizarAlumno(a.id, 'fecha_vencimiento', e.target.value)}
                  className="bg-black p-3 rounded-xl"
                />

                <input
                  type="number"
                  defaultValue={a.monto || 0}
                  onBlur={(e) => actualizarAlumno(a.id, 'monto', Number(e.target.value))}
                  className="bg-black p-3 rounded-xl"
                  placeholder="Mensualidad"
                />

                <button
                  onClick={() => registrarPago(a)}
                  className="bg-green-600 p-3 rounded-xl font-black"
                >
                  Registrar pago
                </button>

                <div className="md:col-span-9 text-sm text-zinc-300 flex flex-wrap gap-3 items-center">
                  <span>
                    Estado actual:{' '}
                    <StatusBadge estado={a.estado_pago} />
                  </span>

                  <span>| Generaciones: {a.generaciones_disponibles || 0}</span>
                  <span>| Premium: {a.bloques_premium || 0}</span>
                  <span>| Rol: {a.role || 'alumno'}</span>
                  <span>
                    | Asistencias:{' '}
                    {
                      asistencias.filter(
                        (x) => Number(x.alumno_id) === Number(a.id)
                      ).length
                    }
                  </span>
                  <span>
                    | Última:{' '}
                    {(() => {
                      const registros = asistencias
                        .filter((x) => Number(x.alumno_id) === Number(a.id))
                        .sort(
                          (a1, a2) => new Date(a2.fecha) - new Date(a1.fecha)
                        )

                      return registros[0]
                        ? new Date(registros[0].fecha).toLocaleDateString()
                        : '-'
                    })()}
                  </span>

                  <button
                    onClick={() => eliminarGeneraciones(a)}
                    className="bg-red-800 hover:bg-red-900 px-4 py-2 rounded-xl font-black"
                  >
                    Eliminar generaciones
                  </button>

                  <button
                    onClick={() => abrirPagoAlumno(a)}
                    className="bg-green-700 hover:bg-green-800 px-4 py-2 rounded-xl font-black"
                  >
                    Enviar link de pago
                  </button>

                  <button
                    onClick={() => eliminarAlumno(a)}
                    className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-xl font-black"
                  >
                    Eliminar alumno
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {section === 'Asistencias' && isAdmin && <AsistenciaPage />}

      {section === 'ResumenAsistencia' && isAdmin && (
        <AsistenciaResumenPage />
      )}

      {section === 'RegistroCompras' && isAdmin && (
        <RegistroComprasPage
          registroCompras={registroCompras}
          aprobarSolicitud={aprobarSolicitud}
          descargarCSV={descargarCSV}
        />
      )}

      {section === 'RegistroMensualidades' && isAdmin && (
        <RegistroMensualidadesPage
          students={students}
          descargarCSV={descargarCSV}
        />
      )}
    </div>
  )
}
