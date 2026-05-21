import { useEffect, useState } from 'react'
import { supabase } from './supabase'

import RutinasPage from './pages/RutinasPage'
import GeneradorPage from './pages/GeneradorPage'

export default function App() {
  const [user, setUser] = useState(null)
  const [student, setStudent] = useState(null)
  const [section, setSection] = useState('Ficha')
  const [rms, setRms] = useState([])

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

    if (currentUser) {
      const { data: rmData } = await supabase
        .from('rm_alumnos')
        .select('*')
        .eq('user_id', currentUser.id)

      setRms(rmData || [])
    }
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
          <p className="text-zinc-400">Debes iniciar sesión.</p>
        </div>
      </div>
    )
  }

  const isAdmin = student?.role?.toLowerCase() === 'admin'
  const pago = student?.estado_pago || 'Pendiente'

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

          <p className={`font-black mt-1 ${
            pago === 'Pagado' ? 'text-green-400' : 'text-red-400'
          }`}>
            Estado pago: {pago}
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
        <button onClick={() => setSection('Ficha')} className="bg-yellow-600 px-6 py-4 rounded-2xl font-bold">
          Ficha personal
        </button>

        <button onClick={() => setSection('Rutinas')} className="bg-zinc-800 px-6 py-4 rounded-2xl font-bold">
          Rutinas
        </button>

        <button onClick={() => setSection('Pago')} className="bg-green-700 px-6 py-4 rounded-2xl font-bold">
          Pago / deuda
        </button>

        <button onClick={() => setSection('Asistencia')} className="bg-blue-700 px-6 py-4 rounded-2xl font-bold">
          Asistencia QR
        </button>

        {isAdmin && (
          <button onClick={() => setSection('Generador')} className="bg-red-600 px-6 py-4 rounded-2xl font-bold">
            Generador IA
          </button>
        )}
      </div>

      {section === 'Ficha' && (
        <div className="bg-zinc-900 border border-yellow-500 rounded-3xl p-6">
          <h2 className="text-4xl font-black text-yellow-400 mb-6">
            Ficha Personal
          </h2>

          <div className="grid md:grid-cols-2 gap-4">
            <Info label="Nombre" value={student?.nombre} />
            <Info label="Correo" value={student?.email || user.email} />
            <Info label="Teléfono" value={student?.telefono} />
            <Info label="Categoría" value={student?.categoria} />
            <Info label="Plan" value={student?.plan} />
            <Info label="Estado pago" value={student?.estado_pago} />
            <Info label="Fecha ingreso" value={student?.fecha_ingreso} />
            <Info label="Vencimiento" value={student?.fecha_vencimiento} />
            <Info label="XP" value={student?.xp || 0} />
            <Info label="Premium" value={student?.bloques_premium || 0} />
          </div>

          <h3 className="text-3xl font-black text-red-500 mt-10 mb-4">
            Mis RM
          </h3>

          <div className="grid md:grid-cols-2 gap-4">
            {rms.map((rm) => (
              <div key={rm.id} className="bg-zinc-800 rounded-2xl p-5">
                <h4 className="text-xl font-black text-yellow-400">{rm.ejercicio}</h4>
                <p>RM: {rm.rm_kg} kg</p>
                <p>70%: {Math.round(rm.rm_kg * 0.7)} kg</p>
                <p>80%: {Math.round(rm.rm_kg * 0.8)} kg</p>
                <p>90%: {Math.round(rm.rm_kg * 0.9)} kg</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {section === 'Pago' && (
        <div className="bg-zinc-900 border border-green-600 rounded-3xl p-6">
          <h2 className="text-4xl font-black text-green-400 mb-6">
            Pago / Deuda
          </h2>

          <Info label="Estado" value={student?.estado_pago} />
          <Info label="Monto" value={`$${student?.monto || 0}`} />
          <Info label="Fecha pago" value={student?.fecha_pago} />
          <Info label="Vencimiento" value={student?.fecha_vencimiento} />

          {student?.estado_pago !== 'Pagado' && (
            <p className="text-red-400 font-black mt-6">
              Tienes pago pendiente o vencido. Regulariza para desbloquear premium.
            </p>
          )}
        </div>
      )}

      {section === 'Asistencia' && (
        <div className="bg-zinc-900 border border-blue-600 rounded-3xl p-6">
          <h2 className="text-4xl font-black text-blue-400 mb-6">
            Asistencia QR
          </h2>

          <p className="text-zinc-300 mb-4">
            Escanea este QR para registrar asistencia.
          </p>

          <img
            src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(window.location.origin + '?checkin=1')}`}
            alt="QR asistencia"
            className="bg-white p-4 rounded-2xl"
          />
        </div>
      )}

      {section === 'Rutinas' && <RutinasPage student={student} />}

      {section === 'Generador' && isAdmin && <GeneradorPage />}
    </div>
  )
}

function Info({ label, value }) {
  return (
    <div className="bg-zinc-800 rounded-2xl p-4 mb-3">
      <p className="text-zinc-400">{label}</p>
      <p className="text-xl font-black">{value || '-'}</p>
    </div>
  )
}