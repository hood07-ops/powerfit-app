import { useEffect, useState } from 'react'
import { supabase } from './supabase'

import RutinasPage from './pages/RutinasPage'
import GeneradorPage from './pages/GeneradorPage'

export default function App() {
  const [user, setUser] = useState(null)
  const [student, setStudent] = useState(null)
  const [section, setSection] = useState('Ficha')
  const [rms, setRms] = useState([])
  const [nuevoRM, setNuevoRM] = useState({
    ejercicio: '',
    rm_kg: '',
  })

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

    if (alumno) {
      cargarRms(currentUser.id)
    }
  }

  async function cargarRms(userId) {
    const { data } = await supabase
      .from('rm_alumnos')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    setRms(data || [])
  }

  async function guardarRM() {
    if (!user || !student) return

    if (!nuevoRM.ejercicio || !nuevoRM.rm_kg) {
      alert('Completa ejercicio y RM')
      return
    }

    const { error } = await supabase.from('rm_alumnos').insert([
      {
        user_id: user.id,
        alumno_id: student.id,
        ejercicio: nuevoRM.ejercicio,
        rm_kg: Number(nuevoRM.rm_kg),
      },
    ])

    if (error) {
      alert('Error guardando RM: ' + error.message)
      return
    }

    setNuevoRM({ ejercicio: '', rm_kg: '' })
    cargarRms(user.id)
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
          onClick={() => setSection('Ficha')}
          className="bg-yellow-600 px-6 py-4 rounded-2xl font-bold"
        >
          Ficha personal
        </button>

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

      {section === 'Ficha' && (
        <FichaPersonal
          student={student}
          user={user}
          rms={rms}
          nuevoRM={nuevoRM}
          setNuevoRM={setNuevoRM}
          guardarRM={guardarRM}
        />
      )}

      {section === 'Rutinas' && (
        <RutinasPage student={student} />
      )}

      {section === 'Generador' && isAdmin && (
        <GeneradorPage />
      )}
    </div>
  )
}

function FichaPersonal({
  student,
  user,
  rms,
  nuevoRM,
  setNuevoRM,
  guardarRM,
}) {
  return (
    <div className="space-y-8">
      <div className="bg-zinc-900 border border-yellow-500 rounded-3xl p-6">
        <h2 className="text-4xl font-black text-yellow-400 mb-6">
          Ficha Personal
        </h2>

        <div className="grid md:grid-cols-2 gap-6">
          <Info label="Nombre" value={student?.nombre} />
          <Info label="Correo" value={student?.email || user.email} />
          <Info label="Teléfono" value={student?.telefono} />
          <Info label="Categoría" value={student?.categoria} />
          <Info label="Plan" value={student?.plan} />
          <Info label="Estado pago" value={student?.estado_pago} />
          <Info label="Fecha ingreso" value={student?.fecha_ingreso} />
          <Info label="Vencimiento" value={student?.fecha_vencimiento} />
          <Info label="XP" value={student?.xp || 0} />
          <Info label="Bloques premium" value={student?.bloques_premium || 0} />
        </div>
      </div>

      <div className="bg-zinc-900 border border-red-600 rounded-3xl p-6">
        <h2 className="text-4xl font-black text-red-500 mb-4">
          Mis RM
        </h2>

        <p className="text-zinc-400 mb-6">
          Aquí registraremos los RM que luego usaremos para calcular porcentajes,
          cargas de trabajo y resultados automáticos como en tu archivo Excel RM.
        </p>

        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <select
            value={nuevoRM.ejercicio}
            onChange={(e) =>
              setNuevoRM({ ...nuevoRM, ejercicio: e.target.value })
            }
            className="bg-zinc-800 p-4 rounded-2xl"
          >
            <option value="">Seleccionar ejercicio</option>
            <option value="Back Squat">Back Squat</option>
            <option value="Front Squat">Front Squat</option>
            <option value="Deadlift">Deadlift</option>
            <option value="Bench Press">Bench Press</option>
            <option value="Push Press">Push Press</option>
            <option value="Push Jerk">Push Jerk</option>
            <option value="Thruster">Thruster</option>
            <option value="Hip Thrust">Hip Thrust</option>
            <option value="Clean">Clean</option>
            <option value="Snatch">Snatch</option>
            <option value="Kettlebell Swing">Kettlebell Swing</option>
          </select>

          <input
            type="number"
            placeholder="RM en KG"
            value={nuevoRM.rm_kg}
            onChange={(e) =>
              setNuevoRM({ ...nuevoRM, rm_kg: e.target.value })
            }
            className="bg-zinc-800 p-4 rounded-2xl"
          />

          <button
            onClick={guardarRM}
            className="bg-red-600 hover:bg-red-700 p-4 rounded-2xl font-black"
          >
            Guardar RM
          </button>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {rms.map((rm) => (
            <div
              key={rm.id}
              className="bg-zinc-800 rounded-2xl p-5 border border-zinc-700"
            >
              <h3 className="text-2xl font-black text-yellow-400">
                {rm.ejercicio}
              </h3>

              <p className="text-white text-xl mt-2">
                RM: {rm.rm_kg} kg
              </p>

              <div className="grid grid-cols-2 gap-2 mt-4 text-zinc-300">
                <p>50%: {Math.round(rm.rm_kg * 0.5)} kg</p>
                <p>60%: {Math.round(rm.rm_kg * 0.6)} kg</p>
                <p>70%: {Math.round(rm.rm_kg * 0.7)} kg</p>
                <p>80%: {Math.round(rm.rm_kg * 0.8)} kg</p>
                <p>85%: {Math.round(rm.rm_kg * 0.85)} kg</p>
                <p>90%: {Math.round(rm.rm_kg * 0.9)} kg</p>
                <p>95%: {Math.round(rm.rm_kg * 0.95)} kg</p>
                <p>100%: {rm.rm_kg} kg</p>
              </div>
            </div>
          ))}

          {rms.length === 0 && (
            <p className="text-zinc-400">
              Aún no tienes RM registrados.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

function Info({ label, value }) {
  return (
    <div className="bg-zinc-800 rounded-2xl p-4">
      <p className="text-zinc-400">{label}</p>
      <p className="text-xl font-black text-white">
        {value || '-'}
      </p>
    </div>
  )
}