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
  const [payments, setPayments] = useState([])
  const [attendance, setAttendance] = useState([])
  const [records, setRecords] = useState([])
  const [profiles, setProfiles] = useState([])

  const [studentProfile, setStudentProfile] = useState(null)

  useEffect(() => {
    checkSession()
    loadAll()
  }, [])

  useEffect(() => {
    if (user) {
      getStudentProfile()
    }
  }, [user])

  async function checkSession() {
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (session?.user) {
      setUser(session.user)
    }
  }

  async function loadAll() {
    getStudents()
    getPayments()
    getAttendance()
    getRecords()
    getProfiles()
  }

  async function getStudentProfile() {
    if (!user) return

    const { data, error } = await supabase
      .from('alumnos')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (!error && data) {
      setStudentProfile(data)
    }
  }

  async function getStudents() {
    const { data } = await supabase
      .from('alumnos')
      .select('*')

    setStudents(data || [])
  }

  async function getPayments() {
    const { data } = await supabase
      .from('pagos')
      .select('*')

    setPayments(data || [])
  }

  async function getAttendance() {
    const { data } = await supabase
      .from('asistencia')
      .select('*')

    setAttendance(data || [])
  }

  async function getRecords() {
    const { data } = await supabase
      .from('records')
      .select('*')

    setRecords(data || [])
  }

  async function getProfiles() {
    const { data } = await supabase
      .from('perfiles')
      .select('*')

    setProfiles(data || [])
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    setUser(null)
    setStudentProfile(null)
  }

  if (!user) {
    return <LoginPage onLogin={setUser} />
  }

  const normalizedRole = String(user.role || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')

  const isAdmin =
    normalizedRole.includes('admin') ||
    normalizedRole.includes('administr')

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
            autenticado
          </p>

          <button
            onClick={handleLogout}
            className="mt-4 bg-zinc-800 px-6 py-3 rounded-2xl font-bold"
          >
            Cerrar sesión
          </button>
        </div>
      </div>

      <div className="flex gap-4 mb-10">
        <button
          onClick={() => setSection('Dashboard')}
          className="bg-red-600 px-6 py-4 rounded-2xl font-bold"
        >
          Panel
        </button>

        <button
          onClick={() => setSection('Comunidad')}
          className="bg-zinc-800 px-6 py-4 rounded-2xl font-bold"
        >
          Comunidad
        </button>

        <button
          onClick={() => setSection('Rutinas')}
          className="bg-zinc-800 px-6 py-4 rounded-2xl font-bold"
        >
          Rutinas
        </button>
      </div>

      {section === 'Dashboard' && (
        <>
          {studentProfile ? (
            <div className="bg-zinc-900 rounded-3xl p-8 border border-yellow-500">
              <h2 className="text-4xl font-black text-yellow-400 mb-6">
                Ficha Alumno
              </h2>

              <div className="grid md:grid-cols-2 gap-6 text-xl">
                <div>
                  <p className="text-zinc-400">Nombre</p>
                  <p className="font-bold">
                    {studentProfile.nombre}
                  </p>
                </div>

                <div>
                  <p className="text-zinc-400">Correo</p>
                  <p className="font-bold">
                    {studentProfile.email}
                  </p>
                </div>

                <div>
                  <p className="text-zinc-400">Plan</p>
                  <p className="font-bold">
                    {studentProfile.plan}
                  </p>
                </div>

                <div>
                  <p className="text-zinc-400">
                    Estado pago
                  </p>

                  <p className="font-bold text-green-400">
                    {studentProfile.estado_pago}
                  </p>
                </div>

                <div>
                  <p className="text-zinc-400">
                    Fecha pago
                  </p>

                  <p className="font-bold">
                    {studentProfile.fecha_pago || '-'}
                  </p>
                </div>

                <div>
                  <p className="text-zinc-400">
                    Vencimiento
                  </p>

                  <p className="font-bold">
                    {studentProfile.fecha_vencimiento || '-'}
                  </p>
                </div>

                <div>
                  <p className="text-zinc-400">Monto</p>

                  <p className="font-bold">
                    ${studentProfile.monto || 0}
                  </p>
                </div>
              </div>
            </div>
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

      {section === 'Rutinas' && (
        <RutinasPage />
      )}

      {section === 'Estadisticas' && isAdmin && (
        <EstadisticasPage />
      )}

      {section === 'Asistencia' && isAdmin && (
        <AsistenciaPage />
      )}
    </div>
  )
}