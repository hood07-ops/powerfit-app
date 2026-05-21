import { useEffect, useState } from 'react'
import { supabase } from './supabase'

import RutinasPage from './pages/RutinasPage'
import GeneradorPage from './pages/GeneradorPage'

export default function App() {
  const [user, setUser] = useState(null)
  const [student, setStudent] = useState(null)
  const [section, setSection] = useState('Rutinas')

  useEffect(() => {
    cargarUsuario()
  }, [])

  async function cargarUsuario() {
    const { data } = await supabase.auth.getUser()
    const currentUser = data?.user

    if (!currentUser) {
      setUser(null)
      return
    }

    setUser(currentUser)

    const { data: alumno } = await supabase
      .from('alumnos')
      .select('*')
      .eq('user_id', currentUser.id)
      .single()

    setStudent(alumno || null)
  }

  async function cerrarSesion() {
    await supabase.auth.signOut()
    setUser(null)
    setStudent(null)
    window.location.reload()
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="bg-zinc-900 p-8 rounded-3xl border border-red-600 text-center">
          <h1 className="text-4xl font-black text-red-500 mb-4">
            POWERFIT 360
          </h1>
          <p className="text-zinc-400">
            Vuelve al login para iniciar sesión.
          </p>
        </div>
      </div>
    )
  }

  const isAdmin = student?.role?.toLowerCase() === 'admin'

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="flex justify-between items-center mb-8 bg-zinc-900 border border-zinc-700 rounded-3xl p-6">
        <div>
          <h1 className="text-4xl font-black text-red-500">
            POWERFIT 360
          </h1>

          <p className="text-zinc-300 mt-2">
            {student?.nombre || user.email}
          </p>

          <p className="text-yellow-400 font-black mt-1">
            {isAdmin ? 'Administrador' : 'Alumno'}
          </p>
        </div>

        <button
          onClick={cerrarSesion}
          className="bg-red-600 hover:bg-red-700 px-6 py-4 rounded-2xl font-black"
        >
          Cerrar sesión
        </button>
      </div>

      <div className="flex flex-wrap gap-4 mb-10">
        <button
          onClick={() => setSection('Rutinas')}
          className="bg-zinc-800 px-6 py-4 rounded-2xl font-bold"
        >
          Rutinas
        </button>

        {isAdmin && (
          <button
            onClick={() => setSection('Generador')}
            className="bg-red-600 px-6 py-4 rounded-2xl font-bold"
          >
            Generador IA
          </button>
        )}
      </div>

      {section === 'Rutinas' && (
        <RutinasPage student={student} />
      )}

      {section === 'Generador' && isAdmin && (
        <GeneradorPage />
      )}
    </div>
  )
}