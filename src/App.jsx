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
      cargarRms(alumno.id)
    }

    const { data: alumnosData, error } = await supabase
      .from('alumnos')
      .select('*')
      .order('id', { ascending: false })

    if (error) {
      console.log(error.message)
    }

    setStudents(alumnosData || [])
  }

  async function cargarRms(alumnoId) {

    const { data } = await supabase
      .from('rm_alumnos')
      .select('*')
      .eq('alumno_id', alumnoId)

    setRms(data || [])
  }

  async function guardarRM() {

    if (!student) return

    await supabase
      .from('rm_alumnos')
      .insert([
        {
          alumno_id: student.id,
          user_id: student.user_id,
          ejercicio: nuevoRM.ejercicio,
          rm_kg: Number(nuevoRM.rm_kg),
        },
      ])

    setNuevoRM({
      ejercicio: '',
      rm_kg: '',
    })

    cargarRms(student.id)
  }

  async function actualizarAlumno(id, campo, valor) {

    await supabase
      .from('alumnos')
      .update({
        [campo]: valor,
      })
      .eq('id', id)

    cargarUsuario()
  }

  async function cerrarSesion() {

    await supabase.auth.signOut()

    setUser(null)
    setStudent(null)
  }

  if (!user) {
    return <LoginPage onLogin={setUser} />
  }

  const isAdmin =
    student?.role?.toLowerCase() === 'admin'

  return (

    <div className="min-h-screen bg-black text-white p-6">

      <div className="bg-zinc-900 border border-yellow-500 rounded-3xl p-6 mb-8 flex justify-between">

        <div>

          <h1 className="text-4xl font-black text-red-500">
            POWERFIT 360
          </h1>

          <p className="text-xl mt-2">
            {student?.nombre || user.email}
          </p>

          <p className="text-yellow-400 font-black">
            {isAdmin ? 'Administrador' : 'Alumno'}
          </p>

          <p className="text-green-400 font-black">
            Estado: {student?.estado_pago || 'Pendiente'}
          </p>

        </div>

        <button
          onClick={cerrarSesion}
          className="bg-red-600 hover:bg-red-700 px-6 py-4 rounded-2xl font-black"
        >
          Cerrar sesión
        </button>

      </div>

      <div className="flex flex-wrap gap-4 mb-8">

        <Btn text="Ficha" set={() => setSection('Ficha')} />

        <Btn text="Rutinas" set={() => setSection('Rutinas')} />

        <Btn text="Generador" set={() => setSection('Generador')} />

        <Btn text="Pagos" set={() => setSection('Pagos')} />

        <Btn text="QR" set={() => setSection('QR')} />

        {isAdmin && (
          <Btn text="ADMIN" set={() => setSection('Admin')} />
        )}

      </div>

      {section === 'Ficha' && (

        <Panel title="Ficha personal">

          <div className="grid md:grid-cols-2 gap-4">

            <Info label="Nombre" value={student?.nombre} />
            <Info label="Correo" value={student?.email} />
            <Info label="Teléfono" value={student?.telefono} />
            <Info label="Edad" value={student?.edad} />
            <Info label="Peso" value={student?.peso} />
            <Info label="Altura" value={student?.altura} />
            <Info label="XP" value={student?.xp || 0} />
            <Info label="Plan" value={student?.plan} />
            <Info label="Premium" value={student?.bloques_premium || 0} />
            <Info label="Generaciones" value={student?.generaciones_disponibles || 0} />

          </div>

          <h2 className="text-3xl font-black text-red-500 mt-10 mb-5">
            RM DEL ALUMNO
          </h2>

          <div className="grid md:grid-cols-3 gap-4">

            <input
              placeholder="Ejercicio"
              value={nuevoRM.ejercicio}
              onChange={(e) =>
                setNuevoRM({
                  ...nuevoRM,
                  ejercicio: e.target.value,
                })
              }
              className="bg-zinc-800 p-4 rounded-2xl"
            />

            <input
              type="number"
              placeholder="RM KG"
              value={nuevoRM.rm_kg}
              onChange={(e) =>
                setNuevoRM({
                  ...nuevoRM,
                  rm_kg: e.target.value,
                })
              }
              className="bg-zinc-800 p-4 rounded-2xl"
            />

            <button
              onClick={guardarRM}
              className="bg-red-600 rounded-2xl font-black"
            >
              Guardar RM
            </button>

          </div>

          <div className="grid md:grid-cols-2 gap-4 mt-6">

            {rms.map((rm) => (

              <div
                key={rm.id}
                className="bg-zinc-800 p-4 rounded-2xl"
              >

                <h3 className="text-yellow-400 font-black text-xl">
                  {rm.ejercicio}
                </h3>

                <p>RM: {rm.rm_kg} KG</p>

                <p>70%: {Math.round(rm.rm_kg * 0.7)} KG</p>

                <p>80%: {Math.round(rm.rm_kg * 0.8)} KG</p>

                <p>90%: {Math.round(rm.rm_kg * 0.9)} KG</p>

              </div>

            ))}

          </div>

        </Panel>

      )}

      {section === 'Rutinas' && (
        <RutinasPage student={student} />
      )}

      {section === 'Generador' && (
        <GeneradorPage
          student={student}
          onUpdateStudent={cargarUsuario}
        />
      )}

      {section === 'Pagos' && (

        <Panel title="Pagos y estado">

          <div className="grid md:grid-cols-2 gap-4">

            <Info label="Estado pago" value={student?.estado_pago} />
            <Info label="Monto" value={`$${student?.monto || 0}`} />
            <Info label="Fecha pago" value={student?.fecha_pago} />
            <Info label="Vencimiento" value={student?.fecha_vencimiento} />

          </div>

        </Panel>

      )}

      {section === 'QR' && (

        <Panel title="Asistencia QR">

          <img
            alt="qr"
            className="bg-white p-4 rounded-2xl"
            src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(window.location.origin)}`}
          />

        </Panel>

      )}

      {section === 'Admin' && isAdmin && (

        <Panel title="ADMINISTRADOR">

          <div className="space-y-8">

            {students.map((a) => (

              <div
                key={a.id}
                className="bg-zinc-800 rounded-3xl p-6 border border-yellow-500"
              >

                <h2 className="text-3xl font-black text-yellow-400 mb-6">
                  {a.nombre}
                </h2>

                <div className="grid md:grid-cols-3 gap-4">

                  <AdminInput
                    label="Nombre"
                    value={a.nombre || ''}
                    onSave={(v) =>
                      actualizarAlumno(a.id, 'nombre', v)
                    }
                  />

                  <AdminInput
                    label="Correo"
                    value={a.email || ''}
                    onSave={(v) =>
                      actualizarAlumno(a.id, 'email', v)
                    }
                  />

                  <AdminInput
                    label="Teléfono"
                    value={a.telefono || ''}
                    onSave={(v) =>
                      actualizarAlumno(a.id, 'telefono', v)
                    }
                  />

                  <AdminInput
                    label="Edad"
                    type="number"
                    value={a.edad || 0}
                    onSave={(v) =>
                      actualizarAlumno(a.id, 'edad', Number(v))
                    }
                  />

                  <AdminInput
                    label="Peso"
                    type="number"
                    value={a.peso || 0}
                    onSave={(v) =>
                      actualizarAlumno(a.id, 'peso', Number(v))
                    }
                  />

                  <AdminInput
                    label="Altura"
                    type="number"
                    value={a.altura || 0}
                    onSave={(v) =>
                      actualizarAlumno(a.id, 'altura', Number(v))
                    }
                  />

                  <AdminInput
                    label="Fecha ingreso"
                    type="date"
                    value={a.fecha_ingreso || ''}
                    onSave={(v) =>
                      actualizarAlumno(a.id, 'fecha_ingreso', v)
                    }
                  />

                  <AdminInput
                    label="Fecha pago"
                    type="date"
                    value={a.fecha_pago || ''}
                    onSave={(v) =>
                      actualizarAlumno(a.id, 'fecha_pago', v)
                    }
                  />

                  <AdminInput
                    label="Vencimiento"
                    type="date"
                    value={a.fecha_vencimiento || ''}
                    onSave={(v) =>
                      actualizarAlumno(a.id, 'fecha_vencimiento', v)
                    }
                  />

                  <AdminInput
                    label="Monto"
                    type="number"
                    value={a.monto || 0}
                    onSave={(v) =>
                      actualizarAlumno(a.id, 'monto', Number(v))
                    }
                  />

                  <AdminInput
                    label="XP"
                    type="number"
                    value={a.xp || 0}
                    onSave={(v) =>
                      actualizarAlumno(a.id, 'xp', Number(v))
                    }
                  />

                  <AdminInput
                    label="Premium"
                    type="number"
                    value={a.bloques_premium || 0}
                    onSave={(v) =>
                      actualizarAlumno(
                        a.id,
                        'bloques_premium',
                        Number(v)
                      )
                    }
                  />

                  <AdminInput
                    label="Generaciones"
                    type="number"
                    value={a.generaciones_disponibles || 0}
                    onSave={(v) =>
                      actualizarAlumno(
                        a.id,
                        'generaciones_disponibles',
                        Number(v)
                      )
                    }
                  />

                  <div className="bg-zinc-900 rounded-2xl p-4">

                    <p className="text-zinc-400 mb-2">
                      Estado pago
                    </p>

                    <select
                      value={a.estado_pago || 'Pendiente'}
                      onChange={(e) =>
                        actualizarAlumno(
                          a.id,
                          'estado_pago',
                          e.target.value
                        )
                      }
                      className="w-full bg-zinc-800 p-3 rounded-xl"
                    >

                      <option>Pendiente</option>
                      <option>Pagado</option>
                      <option>Vencido</option>

                    </select>

                  </div>

                  <div className="bg-zinc-900 rounded-2xl p-4">

                    <p className="text-zinc-400 mb-2">
                      Rol
                    </p>

                    <select
                      value={a.role || ''}
                      onChange={(e) =>
                        actualizarAlumno(
                          a.id,
                          'role',
                          e.target.value
                        )
                      }
                      className="w-full bg-zinc-800 p-3 rounded-xl"
                    >

                      <option value="">
                        Alumno
                      </option>

                      <option value="admin">
                        Admin
                      </option>

                    </select>

                  </div>

                </div>

              </div>

            ))}

          </div>

        </Panel>

      )}

    </div>
  )
}

function Btn({ text, set }) {

  return (

    <button
      onClick={set}
      className="bg-zinc-800 hover:bg-zinc-700 px-6 py-4 rounded-2xl font-black"
    >
      {text}
    </button>

  )
}

function Panel({ title, children }) {

  return (

    <div className="bg-zinc-900 border border-yellow-500 rounded-3xl p-6">

      <h2 className="text-4xl font-black text-yellow-400 mb-6">
        {title}
      </h2>

      {children}

    </div>

  )
}

function Info({ label, value }) {

  return (

    <div className="bg-zinc-800 p-4 rounded-2xl">

      <p className="text-zinc-400">
        {label}
      </p>

      <p className="text-xl font-black">
        {value || '-'}
      </p>

    </div>

  )
}

function AdminInput({
  label,
  value,
  onSave,
  type = 'text',
}) {

  return (

    <div className="bg-zinc-900 rounded-2xl p-4">

      <p className="text-zinc-400 mb-2">
        {label}
      </p>

      <input
        type={type}
        defaultValue={value}
        onBlur={(e) => onSave(e.target.value)}
        className="w-full bg-zinc-800 p-3 rounded-xl"
      />

    </div>

  )
}