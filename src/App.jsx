import EstadisticasPage from "./pages/EstadisticasPage";
import RutinasPage from "./pages/RutinasPage";
import { useEffect, useState } from 'react'
import QRCode from 'react-qr-code'
import { supabase } from './lib/supabase'
import LoginPage from './pages/LoginPage'
import PowerFitPage from './pages/PowerFitPage'
import AsistenciaPage from './pages/AsistenciaPage'
import CheckInPage from './pages/CheckInPage'

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

  const [selectedProfile, setSelectedProfile] = useState(null)

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [category, setCategory] = useState('Boxeo')
  const [age, setAge] = useState('')
  const [weight, setWeight] = useState('')
  const [height, setHeight] = useState('')
  const [entryDate, setEntryDate] = useState(new Date().toISOString().split('T')[0])

  const [selectedStudent, setSelectedStudent] = useState('')
  const [paymentAmount, setPaymentAmount] = useState('')

  const [profileUserId, setProfileUserId] = useState('')
  const [profileStudentId, setProfileStudentId] = useState('')

  useEffect(() => {
    loadAll()
  }, [])

  async function loadAll() {
    getStudents()
    getPayments()
    getAttendance()
    getRecords()
    getProfiles()
  }

  async function getStudents() {
    const { data } = await supabase
      .from('alumnos')
      .select('*')
      .order('xp', { ascending: false })

    setStudents(data || [])
  }

  async function getPayments() {
    const { data } = await supabase
      .from('pagos')
      .select('*')
      .order('id', { ascending: false })

    setPayments(data || [])
  }

  async function getAttendance() {
    const { data } = await supabase
      .from('asistencia')
      .select('*')
      .order('fecha', { ascending: false })

    setAttendance(data || [])
  }

  async function getRecords() {
    const { data } = await supabase
      .from('rendimiento_powerfit')
      .select('*')
      .order('id', { ascending: false })

    setRecords(data || [])
  }

  async function getProfiles() {
    const { data } = await supabase
      .from('perfiles')
      .select('*')
      .order('created_at', { ascending: false })

    setProfiles(data || [])
  }

  async function addStudent() {
    if (!name) return

    await supabase.from('alumnos').insert([
      {
        nombre: name,
        telefono: phone,
        categoria: category,
        edad: age ? Number(age) : null,
        peso: weight ? Number(weight) : null,
        altura: height ? Number(height) : null,
        fecha_ingreso: entryDate,
        nivel: 1,
        bloque_actual: 1,
        xp: 0,
        rango: 'Bronce',
        medalla: '🥉',
        streak: 0,
      },
    ])

    setName('')
    setPhone('')
    setCategory('Boxeo')
    setAge('')
    setWeight('')
    setHeight('')
    setEntryDate(new Date().toISOString().split('T')[0])

    loadAll()
  }

  async function addPayment() {
    if (!selectedStudent || !paymentAmount) return

    await supabase.from('pagos').insert([
      {
        alumno_id: Number(selectedStudent),
        monto: Number(paymentAmount),
        estado: 'Pagado',
        fecha_pago: new Date().toISOString().split('T')[0],
      },
    ])

    setSelectedStudent('')
    setPaymentAmount('')
    loadAll()
  }

  async function linkProfileToStudent() {
    if (!profileUserId || !profileStudentId) return

    await supabase
      .from('perfiles')
      .update({
        alumno_id: Number(profileStudentId),
      })
      .eq('id', profileUserId)

    setProfileUserId('')
    setProfileStudentId('')
    loadAll()
  }

  function getStudentStatus(student) {
    const studentPayments = payments.filter(
      (payment) => payment.alumno_id === student.id
    )

    if (studentPayments.length === 0) return 'Moroso'

    const today = new Date()
    const lastPayment = new Date(studentPayments[0].fecha_pago)
    const diffDays = Math.floor((today - lastPayment) / (1000 * 60 * 60 * 24))

    if (diffDays <= 30) return 'Pagado'
    if (diffDays <= 40) return 'Pendiente'

    return 'Moroso'
  }

  function getStudentAttendancePercent(student) {
    const total = attendance.filter((item) => item.alumno_id === student.id).length
    return Math.min(100, total * 5)
  }

  function getStudentRecords(student) {
    return records.filter((record) => record.alumno_id === student.id)
  }

  function getStudentPayments(student) {
    return payments.filter((payment) => payment.alumno_id === student.id)
  }

  function getXpPercent(xp) {
    return Math.min(100, (xp / 5000) * 100)
  }

  function sendWhatsApp(student) {
    const message = `Hola ${student.nombre}, sigue avanzando en Boxeo Rapa Nui y PowerFit 360 🔥`
    const url = `https://wa.me/${student.telefono}?text=${encodeURIComponent(message)}`
    window.open(url, '_blank')
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

  const studentProfile =
    !isAdmin && user.alumno_id
      ? students.find((student) => student.id === Number(user.alumno_id))
      : null

  const menu = isAdmin
    ? ['Dashboard', 'Comunidad', 'Alumnos', 'Pagos', 'Asistencia', 'Rutinas', 'Estadísticas', 'Vincular']
    : ['Dashboard', 'Comunidad', 'Rutinas']

  const totalIncome = payments.reduce(
    (acc, payment) => acc + Number(payment.monto || 0),
    0
  )

  const debtors = students.filter(
    (student) => getStudentStatus(student) === 'Moroso'
  )

  const averageAttendance =
    students.length > 0
      ? Math.round(
          students.reduce(
            (acc, student) => acc + getStudentAttendancePercent(student),
            0
          ) / students.length
        )
      : 0

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-6 mb-10">
          <div>
            <h1 className="text-5xl font-black text-red-600">
              BOXEO RAPA NUI
            </h1>

            <p className="text-zinc-400 text-xl mt-2">
              Sistema Administrativo Deportivo · PowerFit 360
            </p>
          </div>

          <div className="text-right">
            <p className="text-zinc-400">Usuario</p>
            <h3 className="text-2xl font-black">{user.name}</h3>
            <p className="text-green-400 font-bold">{user.role}</p>

            <button
              onClick={() => setUser(null)}
              className="mt-4 bg-zinc-800 hover:bg-red-600 px-5 py-3 rounded-xl font-bold"
            >
              Cerrar sesión
            </button>
          </div>
        </div>

        <div className="flex gap-3 overflow-x-auto mb-8">
          {menu.map((item) => (
            <button
              key={item}
              onClick={() => setSection(item)}
              className={`px-5 py-3 rounded-2xl font-bold border whitespace-nowrap ${
                section === item
                  ? 'bg-red-600 border-red-600'
                  : 'bg-zinc-900 border-zinc-800'
              }`}
            >
              {item}
            </button>
          ))}
        </div>

        {section === 'Dashboard' && isAdmin && (
          <div className="space-y-8">
            <div className="grid md:grid-cols-5 gap-5">
              <Card title="Alumnos" value={students.length} />
              <Card title="Ingresos privados" value={`$${totalIncome}`} color="text-green-400" />
              <Card title="Morosos" value={debtors.length} color="text-red-400" />
              <Card title="Asistencia promedio" value={`${averageAttendance}%`} color="text-cyan-400" />
              <Card title="Registros PowerFit" value={records.length} color="text-yellow-400" />
            </div>

            <div className="bg-zinc-900 rounded-3xl p-6 border border-zinc-800">
              <h2 className="text-4xl font-black mb-8">Resumen Matato'a</h2>

              <div className="space-y-4">
                {students.map((student, index) => (
                  <StudentRow
                    key={student.id}
                    index={index}
                    student={student}
                    status={getStudentStatus(student)}
                    xpPercent={getXpPercent(student.xp || 0)}
                    attendancePercent={getStudentAttendancePercent(student)}
                    onOpen={() => {
                      setSelectedProfile(student)
                      setSection('Ficha')
                    }}
                    onWhatsApp={() => sendWhatsApp(student)}
                    isAdmin={isAdmin}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {section === 'Dashboard' && !isAdmin && (
          <div className="space-y-8">
            {studentProfile ? (
              <StudentDashboard
                student={studentProfile}
                payments={getStudentPayments(studentProfile)}
                attendance={attendance.filter((item) => item.alumno_id === studentProfile.id)}
                records={getStudentRecords(studentProfile)}
                status={getStudentStatus(studentProfile)}
                xpPercent={getXpPercent(studentProfile.xp || 0)}
              />
            ) : (
              <div className="bg-zinc-900 rounded-3xl p-6 border border-yellow-600">
                <h2 className="text-3xl font-bold text-yellow-400">
                  Ficha no vinculada
                </h2>

                <p className="text-zinc-400 mt-2">
                  Tu cuenta todavía no está asociada a una ficha de alumno.
                  El administrador debe vincular tu usuario con tu ficha.
                </p>
              </div>
            )}
          </div>
        )}

        {section === 'Comunidad' && (
          <div className="space-y-8">
            <div className="bg-zinc-900 rounded-3xl p-6 border border-zinc-800">
              <h2 className="text-4xl font-black mb-8">
                Ranking Público Matato'a 🔥
              </h2>

              <div className="space-y-4">
                {students.map((student, index) => (
                  <StudentRow
                    key={student.id}
                    index={index}
                    student={student}
                    status={null}
                    xpPercent={getXpPercent(student.xp || 0)}
                    attendancePercent={getStudentAttendancePercent(student)}
                    onOpen={() => {
                      if (isAdmin) {
                        setSelectedProfile(student)
                        setSection('Ficha')
                      }
                    }}
                    onWhatsApp={() => sendWhatsApp(student)}
                    isAdmin={isAdmin}
                    publicMode
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {section === 'Ficha' && isAdmin && selectedProfile && (
          <FichaAlumno
            student={selectedProfile}
            payments={getStudentPayments(selectedProfile)}
            attendance={attendance.filter((a) => a.alumno_id === selectedProfile.id)}
            records={getStudentRecords(selectedProfile)}
            status={getStudentStatus(selectedProfile)}
            onBack={() => setSection('Dashboard')}
            sendWhatsApp={sendWhatsApp}
          />
        )}

        {section === 'Alumnos' && isAdmin && (
          <div className="space-y-8">
            <div className="bg-zinc-900 rounded-3xl p-6 border border-zinc-800">
              <h2 className="text-3xl font-bold mb-6">Nuevo Matato'a</h2>

              <div className="grid md:grid-cols-4 gap-4">
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre" className="bg-zinc-800 rounded-xl px-4 py-3" />
                <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="WhatsApp" className="bg-zinc-800 rounded-xl px-4 py-3" />
                <input value={age} onChange={(e) => setAge(e.target.value)} placeholder="Edad" className="bg-zinc-800 rounded-xl px-4 py-3" />
                <input value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="Peso kg" className="bg-zinc-800 rounded-xl px-4 py-3" />
                <input value={height} onChange={(e) => setHeight(e.target.value)} placeholder="Altura m" className="bg-zinc-800 rounded-xl px-4 py-3" />

                <select value={category} onChange={(e) => setCategory(e.target.value)} className="bg-zinc-800 rounded-xl px-4 py-3">
                  <option>Boxeo</option>
                  <option>PowerFit 360</option>
                  <option>Kickboxing</option>
                  <option>BJJ</option>
                  <option>Nado</option>
                </select>

                <input type="date" value={entryDate} onChange={(e) => setEntryDate(e.target.value)} className="bg-zinc-800 rounded-xl px-4 py-3" />

                <button onClick={addStudent} className="bg-red-600 hover:bg-red-700 rounded-xl font-bold">
                  Guardar
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {students.map((student, index) => (
                <StudentRow
                  key={student.id}
                  index={index}
                  student={student}
                  status={getStudentStatus(student)}
                  xpPercent={getXpPercent(student.xp || 0)}
                  attendancePercent={getStudentAttendancePercent(student)}
                  onOpen={() => {
                    setSelectedProfile(student)
                    setSection('Ficha')
                  }}
                  onWhatsApp={() => sendWhatsApp(student)}
                  isAdmin={isAdmin}
                />
              ))}
            </div>
          </div>
        )}

        {section === 'Pagos' && isAdmin && (
          <div className="space-y-8">
            <div className="bg-zinc-900 rounded-3xl p-6 border border-zinc-800">
              <h2 className="text-3xl font-bold mb-6">Registrar pago</h2>

              <div className="grid md:grid-cols-3 gap-4">
                <select value={selectedStudent} onChange={(e) => setSelectedStudent(e.target.value)} className="bg-zinc-800 rounded-xl px-4 py-3">
                  <option value="">Seleccionar alumno</option>

                  {students.map((student) => (
                    <option key={student.id} value={student.id}>
                      {student.nombre}
                    </option>
                  ))}
                </select>

                <input value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} placeholder="Monto" className="bg-zinc-800 rounded-xl px-4 py-3" />

                <button onClick={addPayment} className="bg-red-600 hover:bg-red-700 rounded-xl font-bold">
                  Guardar Pago
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {payments.map((payment) => {
                const student = students.find((item) => item.id === payment.alumno_id)

                return (
                  <div key={payment.id} className="bg-zinc-900 rounded-2xl p-5 border border-zinc-800">
                    <h3 className="text-2xl font-bold">{student?.nombre || 'Alumno'}</h3>
                    <p className="text-green-400 font-bold">${payment.monto}</p>
                    <p className="text-zinc-500">Fecha: {payment.fecha_pago}</p>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {section === 'Asistencia' && isAdmin && <AsistenciaPage />}


{section === 'Rutinas' && (
  <RutinasPage />
)}

        {section === 'Estadísticas' && isAdmin && (
          <div className="space-y-8">
            <div className="grid md:grid-cols-5 gap-5">
              <Card title="Alumnos" value={students.length} />
              <Card title="Ingresos privados" value={`$${totalIncome}`} color="text-green-400" />
              <Card title="Morosos" value={debtors.length} color="text-red-400" />
              <Card title="Asistencia" value={`${averageAttendance}%`} color="text-cyan-400" />
              <Card title="Registros" value={records.length} color="text-yellow-400" />
            </div>

            <div className="bg-zinc-900 rounded-3xl p-6 border border-zinc-800">
              <h2 className="text-3xl font-bold mb-6">Ranking por XP</h2>

              <div className="space-y-4">
                {students.map((student, index) => (
                  <div key={student.id} className="bg-zinc-950 rounded-2xl p-5 border border-zinc-800">
                    <div className="flex justify-between mb-3">
                      <p className="font-bold">#{index + 1} {student.medalla || '🥉'} {student.nombre}</p>
                      <p className="text-yellow-400 font-bold">{student.xp || 0} XP</p>
                    </div>

                    <MiniChart title="Progreso XP" value={getXpPercent(student.xp || 0)} label={`${student.xp || 0} XP`} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {section === 'Vincular' && isAdmin && (
          <div className="space-y-8">
            <div className="bg-zinc-900 rounded-3xl p-6 border border-zinc-800">
              <h2 className="text-3xl font-bold mb-6">Vincular cuenta con ficha de alumno</h2>

              <div className="grid md:grid-cols-3 gap-4">
                <select value={profileUserId} onChange={(e) => setProfileUserId(e.target.value)} className="bg-zinc-800 rounded-xl px-4 py-3">
                  <option value="">Seleccionar usuario</option>

                  {profiles.map((profile) => (
                    <option key={profile.id} value={profile.id}>
                      {profile.nombre || profile.email} · {profile.email}
                    </option>
                  ))}
                </select>

                <select value={profileStudentId} onChange={(e) => setProfileStudentId(e.target.value)} className="bg-zinc-800 rounded-xl px-4 py-3">
                  <option value="">Seleccionar ficha alumno</option>

                  {students.map((student) => (
                    <option key={student.id} value={student.id}>
                      {student.nombre}
                    </option>
                  ))}
                </select>

                <button onClick={linkProfileToStudent} className="bg-red-600 hover:bg-red-700 rounded-xl font-bold">
                  Vincular
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {profiles.map((profile) => {
                const linkedStudent = students.find((student) => student.id === profile.alumno_id)

                return (
                  <div key={profile.id} className="bg-zinc-900 rounded-2xl p-5 border border-zinc-800">
                    <h3 className="text-2xl font-bold">{profile.nombre || profile.email}</h3>
                    <p className="text-zinc-400">{profile.email}</p>
                    <p className="text-green-400 font-bold">Rol: {profile.rol}</p>
                    <p className="text-cyan-400">
                      Ficha vinculada: {linkedStudent?.nombre || 'Sin vincular'}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function StudentDashboard({ student, payments, attendance, records, status, xpPercent }) {
  const lastPayment = payments[0]
  const lastRecord = records[0]

  return (
    <div className="space-y-8">
      <section className="bg-zinc-900 rounded-3xl p-6 border border-zinc-800">
        <div className="flex items-center gap-5">
          <span className="text-7xl">{student.medalla || '🥉'}</span>

          <div>
            <h2 className="text-5xl font-black text-red-600">{student.nombre}</h2>
            <p className="text-yellow-400 text-2xl font-bold mt-2">{student.rango || 'Bronce'}</p>
            <p className="text-zinc-400 mt-2">Nivel {student.nivel || 1} · Bloque {student.bloque_actual || 1}</p>
          </div>
        </div>
      </section>

      <section className="grid md:grid-cols-4 gap-5">
        <Card title="Estado mensualidad" value={status} color={status === 'Pagado' ? 'text-green-400' : status === 'Pendiente' ? 'text-yellow-400' : 'text-red-400'} />
        <Card title="Último pago" value={lastPayment?.fecha_pago || '-'} color="text-cyan-400" />
        <Card title="Mensualidad" value={`$${lastPayment?.monto || 0}`} />
        <Card title="XP" value={student.xp || 0} color="text-yellow-400" />
      </section>

      <section className="grid md:grid-cols-3 gap-5">
        <MiniChart title="XP" value={xpPercent} label={`${student.xp || 0} XP`} />
        <MiniChart title="Frecuencia" value={Math.min(100, attendance.length * 5)} />
        <MiniChart title="Carga última" value={Math.min(100, Number(lastRecord?.carga || 0))} label={`${lastRecord?.carga || 0} kg`} />
      </section>
    </div>
  )
}

function FichaAlumno({ student, payments, attendance, records, status, onBack, sendWhatsApp }) {
  const totalPaid = payments.reduce((acc, p) => acc + Number(p.monto || 0), 0)
  const lastRecord = records[0]
  const lastPayment = payments[0]
  const qrLink = `${window.location.origin}/?checkin=${student.id}`

  function copyQrLink() {
    navigator.clipboard.writeText(qrLink)
    alert('Link QR copiado')
  }

  return (
    <div className="space-y-8">
      <button onClick={onBack} className="bg-zinc-800 hover:bg-red-600 px-5 py-3 rounded-xl font-bold">
        Volver
      </button>

      <section className="bg-zinc-900 rounded-3xl p-6 border border-zinc-800">
        <div className="flex flex-col md:flex-row justify-between gap-5">
          <div className="flex items-center gap-5">
            <span className="text-7xl">{student.medalla || '🥉'}</span>

            <div>
              <h2 className="text-5xl font-black text-red-600">{student.nombre}</h2>
              <p className="text-yellow-400 text-2xl font-bold mt-2">{student.rango || 'Bronce'}</p>
              <p className="text-zinc-400 mt-2">Nivel {student.nivel || 1} · Bloque {student.bloque_actual || 1}</p>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <span className={`px-4 py-2 rounded-full font-bold text-center ${
              status === 'Pagado'
                ? 'bg-green-500/20 text-green-400'
                : status === 'Pendiente'
                ? 'bg-yellow-500/20 text-yellow-400'
                : 'bg-red-500/20 text-red-400'
            }`}>
              {status}
            </span>

            <button onClick={() => sendWhatsApp(student)} className="bg-green-600 px-5 py-3 rounded-xl font-bold">
              WhatsApp
            </button>
          </div>
        </div>
      </section>

      <section className="grid md:grid-cols-5 gap-5">
        <Card title="XP" value={student.xp || 0} color="text-yellow-400" />
        <Card title="Bloque" value={student.bloque_actual || 1} color="text-cyan-400" />
        <Card title="Récord" value={student.record_personal || '-'} color="text-green-400" />
        <Card title="Tiempo" value={student.mejor_tiempo || '-'} color="text-red-400" />
        <Card title="Streak" value={`🔥 ${student.streak || 0}`} color="text-orange-400" />
      </section>

      <section className="grid md:grid-cols-4 gap-5">
        <Card title="Total pagado" value={`$${totalPaid}`} color="text-green-400" />
        <Card title="Último pago" value={lastPayment?.fecha_pago || '-'} color="text-cyan-400" />
        <Card title="Asistencias" value={attendance.length} color="text-yellow-400" />
        <Card title="Registros" value={records.length} color="text-red-400" />
      </section>

      <section className="grid md:grid-cols-3 gap-5">
        <MiniChart title="XP" value={Math.min(100, ((student.xp || 0) / 5000) * 100)} label={`${student.xp || 0} XP`} />
        <MiniChart title="Asistencia" value={Math.min(100, attendance.length * 5)} />
        <MiniChart title="Carga" value={Math.min(100, Number(lastRecord?.carga || 0))} label={`${lastRecord?.carga || 0} kg`} />
      </section>

      <section className="bg-zinc-900 rounded-3xl p-6 border border-zinc-800">
        <h3 className="text-3xl font-bold mb-4">
          QR de asistencia
        </h3>

        <p className="text-zinc-400 mb-6">
          Escanea este QR para registrar asistencia automática.
        </p>

        <div className="flex flex-col items-center">
          <div className="bg-white p-5 rounded-3xl">
            <QRCode value={qrLink} size={220} />
          </div>

          <div className="mt-5 text-center break-all text-zinc-500 max-w-md">
            {qrLink}
          </div>

          <div className="flex flex-col md:flex-row gap-3 mt-6 w-full max-w-md">
            <button
              onClick={copyQrLink}
              className="bg-blue-600 hover:bg-blue-700 px-5 py-3 rounded-xl font-bold flex-1"
            >
              Copiar link
            </button>

            <a
              href={qrLink}
              target="_blank"
              rel="noreferrer"
              className="bg-green-600 hover:bg-green-700 px-5 py-3 rounded-xl font-bold text-center flex-1"
            >
              Probar QR
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}

function StudentRow({ index, student, status, xpPercent, attendancePercent, onOpen, onWhatsApp, isAdmin, publicMode = false }) {
  return (
    <div className="bg-zinc-950 rounded-3xl p-5 border border-zinc-800">
      <div className="flex flex-col md:flex-row justify-between gap-6">
        <div>
          <p className="text-zinc-500">Ranking #{index + 1}</p>

          <div className="flex items-center gap-3 mt-2">
            <span className="text-5xl">{student.medalla || '🥉'}</span>

            <div>
              <h3 className="text-3xl font-black">{student.nombre}</h3>
              <p className="text-yellow-400 font-bold">{student.rango || 'Bronce'}</p>
            </div>
          </div>

          <div className="mt-4 space-y-1">
            <p className="text-zinc-400">Nivel: {student.nivel || 1}</p>
            <p className="text-zinc-400">XP: {student.xp || 0}</p>
            <p className="text-zinc-400">Bloque: {student.bloque_actual || 1}</p>
            <p className="text-zinc-400">Streak: 🔥 {student.streak || 0}</p>
            {!publicMode && status && (
              <p className="text-zinc-400">Estado pago: {status}</p>
            )}
          </div>
        </div>

        <div className="md:w-96 space-y-4">
          <MiniChart title="XP" value={xpPercent} label={`${student.xp || 0} XP`} />
          <MiniChart title="Frecuencia" value={attendancePercent} />

          {isAdmin && !publicMode && (
            <button onClick={onWhatsApp} className="bg-green-600 hover:bg-green-700 px-5 py-3 rounded-xl font-bold w-full">
              WhatsApp
            </button>
          )}

          {isAdmin && (
            <button onClick={onOpen} className="bg-blue-600 hover:bg-blue-700 px-5 py-3 rounded-xl font-bold w-full">
              Ver ficha atleta
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function Card({ title, value, color = 'text-white' }) {
  return (
    <div className="bg-zinc-900 rounded-3xl p-6 border border-zinc-800">
      <p className="text-zinc-400">{title}</p>
      <h3 className={`text-4xl font-black mt-3 ${color}`}>{value}</h3>
    </div>
  )
}

function MiniChart({ title, value, label }) {
  return (
    <div className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800">
      <div className="flex justify-between mb-2">
        <p className="text-zinc-400">{title}</p>
        <p className="font-bold">{label || `${Math.round(value)}%`}</p>
      </div>

      <div className="h-4 bg-zinc-800 rounded-full overflow-hidden">
        <div
          className="h-4 bg-red-500 rounded-full"
          style={{ width: `${Math.min(100, value)}%` }}
        />
      </div>
    </div>
  )
}