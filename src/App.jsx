import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'

import LoginPage from './pages/LoginPage'
import CheckInPage from './pages/CheckInPage'
import RutinasPage from './pages/RutinasPage'
import EstadisticasPage from './pages/EstadisticasPage'
import AsistenciaPage from './pages/AsistenciaPage'

export default function App() {
  const params = new URLSearchParams(window.location.search)

  if (params.get('checkin')) {
    return <CheckInPage />
  }

  const [user, setUser] = useState(null)
  const [section, setSection] = useState('Dashboard')
  const [students, setStudents] = useState([])
  const [studentProfile, setStudentProfile] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    checkSession()
  }, [])

  useEffect(() => {
    if (user) {
      getStudentProfile(user.id)
      getStudents()
    }
  }, [user])

  async function checkSession() {
    const { data } = await supabase.auth.getSession()

    if (data?.session?.user) {
      setUser(data.session.user)
    }
  }

  async function getStudentProfile(userId) {
    const { data } = await supabase
      .from('alumnos')
      .select('*')
      .eq('user_id', userId)
      .single()

    setStudentProfile(data || null)
  }

  async function getStudents() {
    const { data } = await supabase
      .from('alumnos')
      .select('*')
      .order('id', { ascending: false })

    setStudents(data || [])
  }

  async function updateAlumno(id, fields) {
    setLoading(true)

    const { error } = await supabase
      .from('alumnos')
      .update(fields)
      .eq('id', id)

    setLoading(false)

    if (error) {
      alert('Error al guardar: ' + error.message)
      return
    }

    await getStudents()

    if (studentProfile?.id === id) {
      await getStudentProfile(user.id)
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    setUser(null)
    setStudentProfile(null)
    setSection('Dashboard')
  }

  if (!user) {
    return <LoginPage onLogin={setUser} />
  }

  const isAdmin =
    studentProfile?.role?.toLowerCase() === 'admin'

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-5xl font-black text-red-600">
            BOXEO RAPA NUI
          </h1>

          <p className="text-2xl text-zinc-300 mt-2">
            Sistema Administrativo Deportivo · PowerFit 360
          </p>
        </div>

        <div className="text-right">
          <p className="text-xl font-bold">Usuario</p>

          <p className="text-green-400 font-bold">
            {isAdmin ? 'administrador' : 'alumno'}
          </p>

          <button
            onClick={handleLogout}
            className="mt-4 bg-zinc-800 px-6 py-3 rounded-2xl font-bold"
          >
            Cerrar sesión
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-4 mb-10">
        <button
          onClick={() => setSection('Dashboard')}
          className="bg-red-600 px-6 py-4 rounded-2xl font-bold"
        >
          Panel
        </button>

        <button
          onClick={() => setSection('Rutinas')}
          className="bg-zinc-800 px-6 py-4 rounded-2xl font-bold"
        >
          Rutinas
        </button>

        {isAdmin && (
          <>
            <button
              onClick={() => setSection('Pagos')}
              className="bg-green-600 px-6 py-4 rounded-2xl font-bold"
            >
              Pagos
            </button>

            <button
              onClick={() => setSection('Alumnos')}
              className="bg-purple-600 px-6 py-4 rounded-2xl font-bold"
            >
              Alumnos
            </button>

            <button
              onClick={() => setSection('Asistencia')}
              className="bg-yellow-600 px-6 py-4 rounded-2xl font-bold"
            >
              Asistencia
            </button>

            <button
              onClick={() => setSection('Estadisticas')}
              className="bg-blue-600 px-6 py-4 rounded-2xl font-bold"
            >
              Estadísticas
            </button>
          </>
        )}
      </div>

      {section === 'Dashboard' && (
        <>
          {isAdmin ? (
            <AdminDashboard students={students} />
          ) : studentProfile ? (
            <FichaAlumno student={studentProfile} />
          ) : (
            <div className="bg-zinc-900 rounded-3xl p-6 border border-yellow-500">
              <h2 className="text-3xl font-bold text-yellow-400">
                Ficha no vinculada
              </h2>
              <p className="text-zinc-400 mt-2">
                Tu cuenta todavía no está asociada a una ficha de alumno.
              </p>
            </div>
          )}
        </>
      )}

      {section === 'Rutinas' && <RutinasPage />}

      {section === 'Pagos' && isAdmin && (
        <AdminPagos
          students={students}
          updateAlumno={updateAlumno}
          loading={loading}
        />
      )}

      {section === 'Alumnos' && isAdmin && (
        <AdminAlumnos
          students={students}
          updateAlumno={updateAlumno}
          loading={loading}
        />
      )}

      {section === 'Asistencia' && isAdmin && <AsistenciaPage />}

      {section === 'Estadisticas' && isAdmin && <EstadisticasPage />}
    </div>
  )
}

function AdminDashboard({ students }) {
  const total = students.length
  const pagados = students.filter((a) => a.estado_pago === 'Pagado').length
  const pendientes = students.filter((a) => a.estado_pago !== 'Pagado').length
  const totalMonto = students.reduce((s, a) => s + Number(a.monto || 0), 0)

  return (
    <div className="space-y-6">
      <h2 className="text-4xl font-black text-yellow-400">
        Panel Administrador
      </h2>

      <div className="grid md:grid-cols-4 gap-4">
        <Card title="Alumnos" value={total} />
        <Card title="Pagados" value={pagados} />
        <Card title="Pendientes" value={pendientes} />
        <Card title="Monto total" value={`$${totalMonto}`} />
      </div>
    </div>
  )
}

function FichaAlumno({ student }) {
  return (
    <div className="bg-zinc-900 rounded-3xl p-8 border border-yellow-500">
      <h2 className="text-4xl font-black text-yellow-400 mb-6">
        Ficha Alumno
      </h2>

      <div className="grid md:grid-cols-2 gap-6 text-xl">
        <Info label="Nombre" value={student.nombre} />
        <Info label="Correo" value={student.email} />
        <Info label="Teléfono" value={student.telefono} />
        <Info label="Categoría" value={student.categoria} />
        <Info label="Plan" value={student.plan} />
        <Info label="Estado pago" value={student.estado_pago} />
        <Info label="Fecha ingreso" value={student.fecha_ingreso} />
        <Info label="Fecha pago" value={student.fecha_pago} />
        <Info label="Vencimiento" value={student.fecha_vencimiento} />
        <Info label="Monto" value={`$${student.monto || 0}`} />
        <Info label="XP" value={student.xp || 0} />
        <Info label="Premium" value={student.bloques_premium || 0} />
      </div>
    </div>
  )
}

function AdminPagos({ students, updateAlumno, loading }) {
  return (
    <div className="space-y-6">
      <h2 className="text-4xl font-black text-green-400">
        Administración de Pagos
      </h2>

      <div className="overflow-x-auto bg-zinc-900 rounded-3xl border border-zinc-700">
        <table className="w-full text-left">
          <thead className="bg-zinc-800">
            <tr>
              <th className="p-4">Alumno</th>
              <th className="p-4">Monto</th>
              <th className="p-4">Estado</th>
              <th className="p-4">Fecha pago</th>
              <th className="p-4">Vencimiento</th>
              <th className="p-4">Premium</th>
            </tr>
          </thead>

          <tbody>
            {students.map((student) => (
              <tr key={student.id} className="border-t border-zinc-800">
                <td className="p-4 font-bold">{student.nombre}</td>

                <td className="p-4">
                  <input
                    type="number"
                    defaultValue={student.monto || 0}
                    onBlur={(e) =>
                      updateAlumno(student.id, {
                        monto: Number(e.target.value || 0),
                      })
                    }
                    className="bg-zinc-800 p-2 rounded w-28"
                  />
                </td>

                <td className="p-4">
                  <select
                    defaultValue={student.estado_pago || 'Pendiente'}
                    onChange={(e) =>
                      updateAlumno(student.id, {
                        estado_pago: e.target.value,
                      })
                    }
                    className="bg-zinc-800 p-2 rounded"
                  >
                    <option value="Pendiente">Pendiente</option>
                    <option value="Pagado">Pagado</option>
                    <option value="Vencido">Vencido</option>
                  </select>
                </td>

                <td className="p-4">
                  <input
                    type="date"
                    defaultValue={student.fecha_pago || ''}
                    onBlur={(e) =>
                      updateAlumno(student.id, {
                        fecha_pago: e.target.value || null,
                      })
                    }
                    className="bg-zinc-800 p-2 rounded"
                  />
                </td>

                <td className="p-4">
                  <input
                    type="date"
                    defaultValue={student.fecha_vencimiento || ''}
                    onBlur={(e) =>
                      updateAlumno(student.id, {
                        fecha_vencimiento: e.target.value || null,
                      })
                    }
                    className="bg-zinc-800 p-2 rounded"
                  />
                </td>

                <td className="p-4">
                  <input
                    type="number"
                    defaultValue={student.bloques_premium || 0}
                    onBlur={(e) =>
                      updateAlumno(student.id, {
                        bloques_premium: Number(e.target.value || 0),
                      })
                    }
                    className="bg-zinc-800 p-2 rounded w-24"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {loading && <p className="text-yellow-400">Guardando...</p>}
    </div>
  )
}

function AdminAlumnos({ students, updateAlumno, loading }) {
  return (
    <div className="space-y-6">
      <h2 className="text-4xl font-black text-purple-400">
        Gestión de Alumnos
      </h2>

      <div className="grid gap-4">
        {students.map((student) => (
          <div
            key={student.id}
            className="bg-zinc-900 border border-zinc-700 rounded-3xl p-6"
          >
            <div className="grid md:grid-cols-3 gap-4">
              <input
                defaultValue={student.nombre || ''}
                onBlur={(e) =>
                  updateAlumno(student.id, { nombre: e.target.value })
                }
                className="bg-zinc-800 p-3 rounded"
              />

              <input
                defaultValue={student.telefono || ''}
                onBlur={(e) =>
                  updateAlumno(student.id, { telefono: e.target.value })
                }
                className="bg-zinc-800 p-3 rounded"
              />

              <input
                defaultValue={student.categoria || ''}
                onBlur={(e) =>
                  updateAlumno(student.id, { categoria: e.target.value })
                }
                className="bg-zinc-800 p-3 rounded"
              />

              <input
                defaultValue={student.role || ''}
                placeholder="role"
                onBlur={(e) =>
                  updateAlumno(student.id, { role: e.target.value })
                }
                className="bg-zinc-800 p-3 rounded"
              />

              <input
                defaultValue={student.email || ''}
                disabled
                className="bg-zinc-950 p-3 rounded text-zinc-500"
              />
            </div>
          </div>
        ))}
      </div>

      {loading && <p className="text-yellow-400">Guardando...</p>}
    </div>
  )
}

function Card({ title, value }) {
  return (
    <div className="bg-zinc-900 border border-zinc-700 rounded-3xl p-6">
      <p className="text-zinc-400">{title}</p>
      <p className="text-3xl font-black mt-2">{value}</p>
    </div>
  )
}

function Info({ label, value }) {
  return (
    <div>
      <p className="text-zinc-400">{label}</p>
      <p className="font-bold">{value || '-'}</p>
    </div>
  )
}