import { useEffect, useState } from 'react'
import './App.css'

import { supabase } from './supabase'

import LoginPage from './pages/LoginPage'
import RutinasPage from './pages/RutinasPage'
import EstadisticasPage from './pages/EstadisticasPage'
import AsistenciaPage from './pages/AsistenciaPage'
import GeneradorPage from './pages/GeneradorPage'
import AlumnoFichaPage from './pages/AlumnoFichaPage'
import MetodosPage from './pages/MetodosPage'

function Btn({ text, set }) {
  return (
    <button
      onClick={set}
      className="bg-zinc-800 hover:bg-red-600 px-4 py-3 rounded-2xl font-black"
    >
      {text}
    </button>
  )
}

export default function App() {

  const [user, setUser] = useState(null)

  const [student, setStudent] = useState(null)

  const [students, setStudents] = useState([])

  const [loading, setLoading] = useState(true)

  const [section, setSection] = useState('Rutinas')

  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {

    checkUser()

  }, [])

  async function checkUser() {

    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (session?.user) {

      setUser(session.user)

      await cargarUsuario(session.user)

    }

    setLoading(false)

  }

  async function cargarUsuario(usuario) {

    const { data } = await supabase
      .from('alumnos')
      .select('*')
      .eq('user_id', usuario.id)
      .single()

    if (data) {

      setStudent(data)

      if (data.role === 'admin') {

        setIsAdmin(true)

        cargarTodosLosAlumnos()

      }

    }

  }

  async function cargarTodosLosAlumnos() {

    const { data } = await supabase
      .from('alumnos')
      .select('*')
      .order('id', {
        ascending: false,
      })

    setStudents(data || [])

  }

  async function cerrarSesion() {

    await supabase.auth.signOut()

    window.location.reload()

  }

  async function actualizarEstado(
    id,
    campo,
    valor
  ) {

    await supabase
      .from('alumnos')
      .update({
        [campo]: valor,
      })
      .eq('id', id)

    cargarTodosLosAlumnos()

  }

  if (loading) {

    return (
      <div className="text-white p-10">
        Cargando...
      </div>
    )

  }

  if (!user) {

    return (
      <LoginPage />
    )

  }

  return (

    <div className="min-h-screen bg-black text-white p-4">

      <div className="bg-zinc-900 border border-red-600 rounded-3xl p-5 mb-6">

        <div className="flex flex-wrap justify-between items-center gap-4">

          <div>

            <h1 className="text-4xl font-black text-red-500">
              POWERFIT 360
            </h1>

            <p className="text-zinc-400 mt-2">
              {student?.nombre}
            </p>

            <p className="text-yellow-400 font-black">
              {isAdmin
                ? 'ADMINISTRADOR'
                : 'ALUMNO'}
            </p>

          </div>

          <button
            onClick={cerrarSesion}
            className="bg-red-600 hover:bg-red-700 px-5 py-3 rounded-2xl font-black"
          >
            Cerrar sesión
          </button>

        </div>

      </div>

      <div className="flex flex-wrap gap-3 mb-8">

        <Btn
          text="Rutinas"
          set={() =>
            setSection('Rutinas')
          }
        />

        <Btn
          text="Generador IA"
          set={() =>
            setSection('Generador')
          }
        />

        <Btn
          text="Asistencia QR"
          set={() =>
            setSection('Asistencia')
          }
        />

        <Btn
          text="Estadísticas"
          set={() =>
            setSection('Stats')
          }
        />

        <Btn
          text="Métodos"
          set={() =>
            setSection('Metodos')
          }
        />

        {isAdmin && (

          <Btn
            text="ADMIN"
            set={() =>
              setSection('Admin')
            }
          />

        )}

      </div>

      {section === 'Rutinas' && (

        <RutinasPage
          student={student}
        />

      )}

      {section === 'Generador' && (

        <GeneradorPage
          student={student}
          onUpdateStudent={
            cargarUsuario
          }
        />

      )}

      {section === 'Asistencia' && (

        <AsistenciaPage
          student={student}
        />

      )}

      {section === 'Stats' && (

        <EstadisticasPage
          student={student}
        />

      )}

      {section === 'Metodos' && (

        <MetodosPage />

      )}

      {section === 'Admin' &&
        isAdmin && (

          <div className="space-y-6">

            <div className="bg-zinc-900 border border-yellow-500 rounded-3xl p-6">

              <h2 className="text-4xl font-black text-yellow-400 mb-6">
                PANEL ADMIN
              </h2>

              <div className="space-y-5">

                {students.map((a) => (

                  <div
                    key={a.id}
                    className="bg-zinc-800 rounded-3xl p-5"
                  >

                    <div className="grid md:grid-cols-4 gap-4">

                      <div>

                        <p className="text-zinc-400">
                          Alumno
                        </p>

                        <p className="font-black text-xl">
                          {a.nombre}
                        </p>

                      </div>

                      <div>

                        <p className="text-zinc-400">
                          Estado Pago
                        </p>

                        <select
                          value={
                            a.estado_pago ||
                            'pendiente'
                          }
                          onChange={(e) =>
                            actualizarEstado(
                              a.id,
                              'estado_pago',
                              e.target.value
                            )
                          }
                          className="bg-black p-3 rounded-xl w-full"
                        >

                          <option value="pagado">
                            Pagado
                          </option>

                          <option value="pendiente">
                            Pendiente
                          </option>

                          <option value="vencido">
                            Vencido
                          </option>

                        </select>

                      </div>

                      <div>

                        <p className="text-zinc-400">
                          Premium
                        </p>

                        <select
                          value={
                            a.bloques_premium
                          }
                          onChange={(e) =>
                            actualizarEstado(
                              a.id,
                              'bloques_premium',
                              Number(
                                e.target.value
                              )
                            )
                          }
                          className="bg-black p-3 rounded-xl w-full"
                        >

                          <option value={0}>
                            No
                          </option>

                          <option value={1}>
                            Sí
                          </option>

                        </select>

                      </div>

                      <div>

                        <p className="text-zinc-400">
                          Generaciones
                        </p>

                        <input
                          type="number"
                          value={
                            a.generaciones_disponibles ||
                            0
                          }
                          onChange={(e) =>
                            actualizarEstado(
                              a.id,
                              'generaciones_disponibles',
                              Number(
                                e.target.value
                              )
                            )
                          }
                          className="bg-black p-3 rounded-xl w-full"
                        />

                      </div>

                    </div>

                  </div>

                ))}

              </div>

            </div>

          </div>

        )}

    </div>

  )

}