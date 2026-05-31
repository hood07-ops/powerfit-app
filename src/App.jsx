import { useEffect, useState } from 'react'
import './App.css'
import { supabase } from './supabase'

import LoginPage from './pages/LoginPage'
import RutinasPage from './pages/RutinasPage'
import GeneradorPage from './pages/GeneradorPage'
import MetodosPage from './pages/MetodosPage'

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

export default function App() {
  const [user, setUser] = useState(null)
  const [student, setStudent] = useState(null)
  const [students, setStudents] = useState([])
  const [solicitudes, setSolicitudes] = useState([])
  const [section, setSection] = useState('Ficha')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkUser()
  }, [])

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

  async function cargarUsuario(currentUser = user) {
    if (!currentUser) return

    const { data: alumno } = await supabase
      .from('alumnos')
      .select('*')
      .eq('user_id', currentUser.id)
      .single()

    setStudent(alumno || null)

    const { data: solicitudesData } = await supabase
      .from('solicitudes_compra')
      .select('*')
      .order('created_at', { ascending: false })

    setSolicitudes(solicitudesData || [])

    const { data: alumnosData } = await supabase
      .from('alumnos')
      .select('*')
      .order('id', { ascending: false })

    setStudents(alumnosData || [])
  }

  async function actualizarAlumno(id, campo, valor) {
    await supabase.from('alumnos').update({ [campo]: valor }).eq('id', id)
    await cargarUsuario()
  }

  async function cambiarEstadoPago(alumno, estado) {
    const hoy = new Date()
    const vencimiento = new Date()
    vencimiento.setMonth(vencimiento.getMonth() + 1)

    const updateData = {
      estado_pago: estado,
    }

    if (estado === 'Pagado') {
      updateData.fecha_pago = hoy.toISOString().slice(0, 10)
      updateData.fecha_vencimiento = vencimiento.toISOString().slice(0, 10)
      updateData.generaciones_disponibles = 6
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
    .update({
      generaciones_disponibles: nuevasGeneraciones,
    })
    .eq('id', alumno.id)

  await supabase
    .from('solicitudes_compra')
    .update({
      estado: 'Aprobado',
    })
    .eq('id', solicitud.id)

  await cargarUsuario()
}
  async function cerrarSesion() {
    await supabase.auth.signOut()
    window.location.reload()
  }

  if (loading) return <div className="min-h-screen bg-black text-white p-10">Cargando...</div>
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
          <p className="text-yellow-400 font-black">{isAdmin ? 'ADMINISTRADOR' : 'ALUMNO'}</p>
          <p className={pagoAlDia ? 'text-green-400 font-black' : 'text-red-400 font-black'}>
            Estado pago: {student?.estado_pago || 'Pendiente'}
          </p>
        </div>

        <button onClick={cerrarSesion} className="bg-red-600 px-5 py-3 rounded-2xl font-black">
          Cerrar sesión
        </button>
      </div>

      <div className="flex flex-wrap gap-3 mb-8">
        <Btn text="Ficha personal" set={() => setSection('Ficha')} />
        <Btn text="Pago / deuda" set={() => setSection('Pago')} />
        <Btn text="Rutinas" disabled={bloqueado} set={() => setSection('Rutinas')} />
        <Btn text="Generador IA" disabled={bloqueado} set={() => setSection('Generador')} />
        <Btn text="Métodos" disabled={bloqueado} set={() => setSection('Metodos')} />
        {isAdmin && <Btn text="ADMIN ALUMNOS" set={() => setSection('Admin')} />}
      </div>

      {bloqueado && (
        <div className="bg-red-950 border border-red-600 rounded-3xl p-6 mb-8">
          <h2 className="text-3xl font-black text-red-400">SERVICIOS BLOQUEADOS</h2>
          <p className="text-zinc-300 mt-2">
            Tu cuenta está pendiente o morosa. Regulariza el pago para desbloquear rutinas,
            generador IA y métodos.
          </p>
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
          <Info label="Estado" value={student?.estado_pago} />
          <Info label="Mensualidad" value={`$${student?.monto || 0}`} />
          <Info label="Fecha pago" value={student?.fecha_pago} />
          <Info label="Vencimiento" value={student?.fecha_vencimiento} />
        </div>
      )}

      {section === 'Rutinas' && !bloqueado && <RutinasPage student={student} />}
      {section === 'Generador' && !bloqueado && <GeneradorPage student={student} onUpdateStudent={() => cargarUsuario()} />}
      {section === 'Metodos' && !bloqueado && <MetodosPage />}

      {section === 'Admin' && isAdmin && (
        <div className="bg-zinc-900 border border-yellow-500 rounded-3xl p-6">
          <h2 className="text-4xl font-black text-yellow-400 mb-6">
            ADMINISTRADOR — ALUMNOS Y PAGOS
          </h2>
<div className="bg-zinc-800 rounded-3xl p-5 mb-8 border border-green-600">
  <h3 className="text-3xl font-black text-green-400 mb-5">
    Solicitudes de compra
  </h3>

  <div className="space-y-3">
    {solicitudes.map((s) => (
      <div
        key={s.id}
        className="grid md:grid-cols-5 gap-3 items-center bg-zinc-900 rounded-2xl p-4"
      >
        <p className="font-black">{s.nombre_alumno}</p>
        <p>${s.monto}</p>
        <p>+{s.generaciones} generaciones</p>
        <p>{s.estado}</p>

        {s.estado !== 'Aprobado' && (
          <button
            onClick={() => aprobarSolicitud(s)}
            className="bg-green-600 hover:bg-green-700 p-3 rounded-xl font-black"
          >
            Aprobar +2
          </button>
        )}
      </div>
    ))}

    {solicitudes.length === 0 && (
      <p className="text-zinc-400">
        No hay solicitudes todavía.
      </p>
    )}
  </div>
</div>
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
                  onClick={() => cambiarEstadoPago(a, 'Pagado')}
                  className="bg-green-600 p-3 rounded-xl font-black"
                >
                  Pagado
                </button>

                <button
                  onClick={() => cambiarEstadoPago(a, 'Pendiente')}
                  className="bg-yellow-500 text-black p-3 rounded-xl font-black"
                >
                  Pendiente
                </button>

                <button
                  onClick={() => cambiarEstadoPago(a, 'Moroso')}
                  className="bg-red-600 p-3 rounded-xl font-black"
                >
                  Moroso
                </button>

                <div className="md:col-span-9 text-sm text-zinc-300">
                  Estado actual:{' '}
                  <span className={
                    a.estado_pago === 'Pagado'
                      ? 'text-green-400 font-black'
                      : 'text-red-400 font-black'
                  }>
                    {a.estado_pago || 'Pendiente'}
                  </span>
                  {' '} | Generaciones: {a.generaciones_disponibles || 0}
                  {' '} | Premium: {a.bloques_premium || 0}
                  {' '} | Rol: {a.role || 'alumno'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}