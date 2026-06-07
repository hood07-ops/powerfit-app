export default function AlumnoFichaPage({
  student,
  payments,
  attendance,
  records,
  onBack,
}) {
  if (!student) {
    return (
      <div className="bg-zinc-900 rounded-3xl p-6">
        <h2 className="text-3xl font-bold">No hay alumno seleccionado</h2>
        <button
          onClick={onBack}
          className="mt-4 bg-red-600 px-5 py-3 rounded-xl font-bold"
        >
          Volver
        </button>
      </div>
    )
  }

  const studentPayments = payments.filter((p) => p.alumno_id === student.id)
  const studentAttendance = attendance.filter((a) => a.alumno_id === student.id)
  const studentRecords = records.filter((r) => r.alumno_id === student.id)

  const totalPaid = studentPayments.reduce(
    (acc, p) => acc + Number(p.monto || 0),
    0
  )

  const attendancePercent = Math.min(100, studentAttendance.length * 5)
  const growthPercent = Math.min(100, studentRecords.length * 5)
  const lastRecord = studentRecords[0]

  const xpTotal = student.xp || 0
  const nivelMatatoa = student.nivel_matatoa || 'Iniciado'

  return (
    <div className="space-y-8">
      <button
        onClick={onBack}
        className="bg-zinc-800 hover:bg-red-600 px-5 py-3 rounded-xl font-bold"
      >
        Volver al panel
      </button>

      <section className="bg-zinc-900 rounded-3xl p-6 border border-zinc-800">
        <h2 className="text-4xl font-black text-red-600">
          {student.nombre}
        </h2>

        <p className="text-zinc-400 mt-2">
          {student.categoria || 'Alumno'}
        </p>

        <p className="text-zinc-500">
          {student.telefono || '-'}
        </p>
      </section>

      <section className="grid md:grid-cols-4 gap-5">
        <Card title="Edad" value={student.edad || '-'} />
        <Card title="Peso" value={`${student.peso || '-'} kg`} />
        <Card title="Altura" value={`${student.altura || '-'} m`} />
        <Card title="Ingreso" value={student.fecha_ingreso || '-'} small />
      </section>

      <section className="grid md:grid-cols-4 gap-5">
        <Card
          title="XP Total"
          value={xpTotal}
          color="text-yellow-400"
        />

        <Card
          title="Nivel Matato'a"
          value={nivelMatatoa}
          color="text-cyan-400"
          small
        />

        <Card
          title="Asistencias"
          value={studentAttendance.length}
          color="text-green-400"
        />

        <Card
          title="Estado pago"
          value={student.estado_pago || 'Pendiente'}
          color={
            student.estado_pago === 'Pagado'
              ? 'text-green-400'
              : 'text-red-400'
          }
          small
        />
      </section>

      <section className="grid md:grid-cols-4 gap-5">
        <Card
          title="Total pagado"
          value={`$${totalPaid}`}
          color="text-green-400"
        />

        <Card
          title="Registros PowerFit"
          value={studentRecords.length}
          color="text-yellow-400"
        />

        <Card
          title="Último tiempo"
          value={lastRecord?.tiempo || '-'}
          color="text-red-400"
        />

        <Card
          title="Vencimiento"
          value={student.fecha_vencimiento || '-'}
          color="text-cyan-400"
          small
        />
      </section>

      <section className="bg-zinc-900 rounded-3xl p-6 border border-zinc-800">
        <h3 className="text-3xl font-bold mb-6">
          Gráficos de avance
        </h3>

        <div className="space-y-5">
          <Bar
            title="Frecuencia de entrenamiento"
            value={attendancePercent}
          />

          <Bar
            title="Crecimiento PowerFit"
            value={growthPercent}
          />

          <Bar
            title="Última carga usada"
            value={Math.min(100, Number(lastRecord?.carga || 0))}
            label={`${lastRecord?.carga || 0} kg`}
          />
        </div>
      </section>

      <section className="bg-zinc-900 rounded-3xl p-6 border border-zinc-800">
        <h3 className="text-3xl font-bold mb-6">
          Historial de pagos
        </h3>

        <div className="space-y-3">
          {studentPayments.map((payment) => (
            <div
              key={payment.id}
              className="bg-zinc-950 rounded-2xl p-4 border border-zinc-800"
            >
              <p className="font-bold">
                ${payment.monto}
              </p>

              <p className="text-zinc-400">
                {payment.fecha_pago}
              </p>
            </div>
          ))}

          {studentPayments.length === 0 && (
            <p className="text-zinc-400">
              No hay pagos registrados.
            </p>
          )}
        </div>
      </section>

      <section className="bg-zinc-900 rounded-3xl p-6 border border-zinc-800">
        <h3 className="text-3xl font-bold mb-6">
          Historial de asistencia
        </h3>

        <div className="space-y-3">
          {studentAttendance.map((item) => (
            <div
              key={item.id}
              className="bg-zinc-950 rounded-2xl p-4 border border-zinc-800"
            >
              <p className="font-bold">
                {item.nombre_alumno || student.nombre}
              </p>

              <p className="text-zinc-400">
                Estado al ingresar: {item.estado_pago || '-'}
              </p>

              <p className="text-zinc-500">
                Fecha:{' '}
                {item.fecha
                  ? new Date(item.fecha).toLocaleString()
                  : item.created_at
                  ? new Date(item.created_at).toLocaleString()
                  : '-'}
              </p>
            </div>
          ))}

          {studentAttendance.length === 0 && (
            <p className="text-zinc-400">
              No hay asistencias registradas.
            </p>
          )}
        </div>
      </section>

      <section className="bg-zinc-900 rounded-3xl p-6 border border-zinc-800">
        <h3 className="text-3xl font-bold mb-6">
          Historial PowerFit
        </h3>

        <div className="space-y-3">
          {studentRecords.map((record) => (
            <div
              key={record.id}
              className="bg-zinc-950 rounded-2xl p-4 border border-zinc-800"
            >
              <p className="font-bold">
                Bloque {record.bloque}
              </p>

              <p className="text-zinc-400">
                Tiempo: {record.tiempo} · Carga: {record.carga || '-'} kg
              </p>

              <p className="text-zinc-500">
                {record.observaciones}
              </p>
            </div>
          ))}

          {studentRecords.length === 0 && (
            <p className="text-zinc-400">
              No hay registros PowerFit todavía.
            </p>
          )}
        </div>
      </section>
    </div>
  )
}

function Card({ title, value, color = 'text-white', small = false }) {
  return (
    <div className="bg-zinc-900 rounded-3xl p-6 border border-zinc-800">
      <p className="text-zinc-400">
        {title}
      </p>

      <h3
        className={`${small ? 'text-2xl' : 'text-4xl'} font-black mt-3 ${color}`}
      >
        {value}
      </h3>
    </div>
  )
}

function Bar({ title, value, label }) {
  return (
    <div>
      <div className="flex justify-between mb-2">
        <p className="text-zinc-400">
          {title}
        </p>

        <p className="font-bold">
          {label || `${value}%`}
        </p>
      </div>

      <div className="h-5 bg-zinc-800 rounded-full overflow-hidden">
        <div
          className="h-5 bg-red-500 rounded-full"
          style={{ width: `${Math.min(100, value)}%` }}
        />
      </div>
    </div>
  )
}