import { useEffect, useState } from 'react'
import { supabase } from './supabase'

import LoginPage from './pages/LoginPage'
import RutinasPage from './pages/RutinasPage'
import GeneradorPage from './pages/GeneradorPage'

export default function App() {
  const [user, setUser] = useState(null)
  const [student, setStudent] = useState(null)
  const [students, setStudents] = useState([])
  const [section, setSection] = useState('Ficha')
  const [rms, setRms] = useState([])
  const [nuevoRM, setNuevoRM] = useState({ ejercicio: '', rm_kg: '' })

  useEffect(() => {
    cargarUsuario()
  }, [])

  async function cargarUsuario() {
    const { data } = await supabase.auth.getUser()
    const currentUser = data?.user
    if (!currentUser) return setUser(null)

    setUser(currentUser)

    const { data: alumno } = await supabase
      .from('alumnos')
      .select('*')
      .eq('user_id', currentUser.id)
      .single()

    setStudent(alumno || null)

    const { data: lista } = await supabase.from('alumnos').select('*').order('id')
    setStudents(lista || [])

    if (alumno) cargarRms(alumno.id)
  }

  async function cargarRms(alumnoId) {
    const { data } = await supabase
      .from('rm_alumnos')
      .select('*')
      .eq('alumno_id', alumnoId)

    setRms(data || [])
  }

  async function guardarRM() {
    if (!nuevoRM.ejercicio || !nuevoRM.rm_kg || !student) return

    await supabase.from('rm_alumnos').insert([
      {
        user_id: student.user_id,
        alumno_id: student.id,
        ejercicio: nuevoRM.ejercicio,
        rm_kg: Number(nuevoRM.rm_kg),
      },
    ])

    setNuevoRM({ ejercicio: '', rm_kg: '' })
    cargarRms(student.id)
  }

  async function actualizarAlumno(id, campo, valor) {
    await supabase.from('alumnos').update({ [campo]: valor }).eq('id', id)
    cargarUsuario()
  }

  async function cerrarSesion() {
    await supabase.auth.signOut()
    setUser(null)
    setStudent(null)
  }

  if (!user) return <LoginPage onLogin={setUser} />

  const isAdmin = student?.role?.toLowerCase() === 'admin'

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="bg-zinc-900 border border-zinc-700 rounded-3xl p-6 mb-8 flex justify-between">
        <div>
          <h1 className="text-4xl font-black text-red-500">POWERFIT 360</h1>
          <p>{student?.nombre || user.email}</p>
          <p className="text-yellow-400 font-black">{isAdmin ? 'Administrador' : 'Alumno'}</p>
          <p className={student?.estado_pago === 'Pagado' ? 'text-green-400' : 'text-red-400'}>
            Pago: {student?.estado_pago || 'Pendiente'}
          </p>
        </div>

        <button onClick={cerrarSesion} className="bg-red-600 px-6 py-4 rounded-2xl font-black">
          Cerrar sesión
        </button>
      </div>

      <div className="flex flex-wrap gap-4 mb-8">
        <Btn text="Ficha" set={() => setSection('Ficha')} />
        <Btn text="Rutinas" set={() => setSection('Rutinas')} />
        <Btn text="Generador" set={() => setSection('Generador')} />
        <Btn text="Pago / deuda" set={() => setSection('Pago')} />
        <Btn text="Asistencia QR" set={() => setSection('Asistencia')} />
        {isAdmin && <Btn text="Admin alumnos" set={() => setSection('Admin')} />}
      </div>

      {section === 'Ficha' && (
        <Ficha
          student={student}
          rms={rms}
          nuevoRM={nuevoRM}
          setNuevoRM={setNuevoRM}
          guardarRM={guardarRM}
        />
      )}

      {section === 'Rutinas' && <RutinasPage student={student} />}

      {section === 'Generador' && (
        <GeneradorPage student={student} onUpdateStudent={cargarUsuario} />
      )}

      {section === 'Pago' && (
        <Panel title="Pago / deuda">
          <Info label="Estado" value={student?.estado_pago} />
          <Info label="Monto" value={`$${student?.monto || 0}`} />
          <Info label="Fecha pago" value={student?.fecha_pago} />
          <Info label="Vencimiento" value={student?.fecha_vencimiento} />
        </Panel>
      )}

      {section === 'Asistencia' && (
        <Panel title="Asistencia QR">
          <img
            src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(window.location.origin + '?checkin=1')}`}
            className="bg-white p-4 rounded-2xl"
          />
        </Panel>
      )}

      {section === 'Admin' && isAdmin && (
        <Panel title="Admin alumnos / pagos">
          <div className="space-y-4">
            {students.map((a) => (
              <div key={a.id} className="bg-zinc-800 p-4 rounded-2xl grid md:grid-cols-5 gap-3">
                <input value={a.nombre || ''} onChange={(e) => actualizarAlumno(a.id, 'nombre', e.target.value)} className="bg-zinc-900 p-2 rounded" />
                <select value={a.estado_pago || 'Pendiente'} onChange={(e) => actualizarAlumno(a.id, 'estado_pago', e.target.value)} className="bg-zinc-900 p-2 rounded">
                  <option>Pendiente</option>
                  <option>Pagado</option>
                  <option>Vencido</option>
                </select>
                <input type="number" defaultValue={a.monto || 0} onBlur={(e) => actualizarAlumno(a.id, 'monto', Number(e.target.value))} className="bg-zinc-900 p-2 rounded" />
                <input type="date" defaultValue={a.fecha_vencimiento || ''} onBlur={(e) => actualizarAlumno(a.id, 'fecha_vencimiento', e.target.value)} className="bg-zinc-900 p-2 rounded" />
                <input type="number" defaultValue={a.generaciones_disponibles || 0} onBlur={(e) => actualizarAlumno(a.id, 'generaciones_disponibles', Number(e.target.value))} className="bg-zinc-900 p-2 rounded" />
              </div>
            ))}
          </div>
        </Panel>
      )}
    </div>
  )
}

function Ficha({ student, rms, nuevoRM, setNuevoRM, guardarRM }) {
  return (
    <Panel title="Ficha personal">
      <div className="grid md:grid-cols-2 gap-4">
        <Info label="Nombre" value={student?.nombre} />
        <Info label="Correo" value={student?.email} />
        <Info label="Teléfono" value={student?.telefono} />
        <Info label="Categoría" value={student?.categoria} />
        <Info label="XP" value={student?.xp || 0} />
        <Info label="Generaciones" value={student?.generaciones_disponibles || 0} />
      </div>

      <h3 className="text-3xl font-black text-red-500 mt-8">Mis RM</h3>

      <div className="grid md:grid-cols-3 gap-3 mt-4">
        <input placeholder="Ejercicio" value={nuevoRM.ejercicio} onChange={(e) => setNuevoRM({ ...nuevoRM, ejercicio: e.target.value })} className="bg-zinc-800 p-4 rounded-2xl" />
        <input type="number" placeholder="RM KG" value={nuevoRM.rm_kg} onChange={(e) => setNuevoRM({ ...nuevoRM, rm_kg: e.target.value })} className="bg-zinc-800 p-4 rounded-2xl" />
        <button onClick={guardarRM} className="bg-red-600 rounded-2xl font-black">Guardar RM</button>
      </div>

      <div className="grid md:grid-cols-2 gap-4 mt-6">
        {rms.map((rm) => (
          <div key={rm.id} className="bg-zinc-800 p-4 rounded-2xl">
            <h4 className="text-yellow-400 font-black">{rm.ejercicio}</h4>
            <p>RM: {rm.rm_kg} kg</p>
            <p>70%: {Math.round(rm.rm_kg * 0.7)} kg</p>
            <p>80%: {Math.round(rm.rm_kg * 0.8)} kg</p>
            <p>90%: {Math.round(rm.rm_kg * 0.9)} kg</p>
          </div>
        ))}
      </div>
    </Panel>
  )
}

function Btn({ text, set }) {
  return <button onClick={set} className="bg-zinc-800 px-6 py-4 rounded-2xl font-bold">{text}</button>
}

function Panel({ title, children }) {
  return <div className="bg-zinc-900 border border-yellow-500 rounded-3xl p-6"><h2 className="text-4xl font-black text-yellow-400 mb-6">{title}</h2>{children}</div>
}

function Info({ label, value }) {
  return <div className="bg-zinc-800 p-4 rounded-2xl"><p className="text-zinc-400">{label}</p><p className="text-xl font-black">{value || '-'}</p></div>
}