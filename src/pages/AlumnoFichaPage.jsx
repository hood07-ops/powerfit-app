function formatDate(date) {
  if (!date) return '-'

  const value = String(date).slice(0, 10)
  const parts = value.split('-')

  if (parts.length === 3) {
    const [year, month, day] = parts
    if (year.length === 4 && month.length === 2 && day.length === 2) {
      return `${day}-${month}-${year}`
    }
  }

  const parsed = new Date(date)
  if (Number.isNaN(parsed.getTime())) return String(date)
  return parsed.toLocaleDateString('es-CL')
}

function formatMoney(value) {
  return `$${Number(value || 0).toLocaleString('es-CL')}`
}

function metadataRecord(record) {
  const metodo = String(record?.metodo || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')

  function buscar(campo) {
    const match = metodo.match(new RegExp(`${campo}:([^|]+)`))
    return match ? match[1].trim() : ''
  }

  return {
    fecha: buscar('Fecha'),
    atr: buscar('ATR'),
    rpe: Number(buscar('RPE') || 0),
    energia: Number(buscar('Energia') || 0),
    sueno: Number(buscar('Sueno') || 0),
    dolor: Number(buscar('Dolor') || 0),
    observacion: buscar('Obs'),
  }
}

function fechaRecord(record) {
  return metadataRecord(record).fecha || record?.created_at
}

function normalizarFaseAtr(fase) {
  const normalizada = String(fase || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')

  if (normalizada === 'Acumulacion') return 'Acumulacion'
  if (normalizada === 'Transformacion') return 'Transformacion'
  if (normalizada === 'Realizacion') return 'Realizacion'
  return fase || '-'
}

function faseAtrPorFecha(fecha) {
  const parsed = new Date(fecha)
  if (Number.isNaN(parsed.getTime())) return '-'

  const dia = parsed.getDate()
  if (dia <= 14) return 'Acumulacion'
  if (dia <= 24) return 'Transformacion'
  return 'Realizacion'
}

function faseAtrRecord(record) {
  return normalizarFaseAtr(metadataRecord(record).atr || faseAtrPorFecha(fechaRecord(record)))
}

function valorRecord(record) {
  if (Number(record?.peso_kg)) return Number(record.peso_kg)
  if (Number(record?.repeticiones)) return Number(record.repeticiones)
  if (Number(record?.vueltas)) return Number(record.vueltas)
  if (Number(record?.tiempo_segundos)) return Number(record.tiempo_segundos)
  return 0
}

function unidadRecord(record) {
  const nombre = String(record?.rutina_nombre || '').toLowerCase()

  if (Number(record?.peso_kg)) return 'kg'
  if (Number(record?.tiempo_segundos)) return 'seg'
  if (nombre.includes('salto')) return 'cm'
  if (nombre.includes('cooper') || nombre.includes('distancia')) return 'm'
  if (Number(record?.vueltas)) return 'vueltas'
  return 'reps'
}

function mejorRecord(records, filtro, menorEsMejor = false) {
  const filtrados = records.filter(filtro).filter((record) => valorRecord(record) > 0)
  if (filtrados.length === 0) return null

  return filtrados.reduce((mejor, actual) => {
    const actualValor = valorRecord(actual)
    const mejorValor = valorRecord(mejor)
    return menorEsMejor
      ? actualValor < mejorValor ? actual : mejor
      : actualValor > mejorValor ? actual : mejor
  })
}

function scoreRecord(record) {
  if (Number(record?.peso_kg)) return Number(record.peso_kg)
  if (Number(record?.repeticiones)) return Number(record.repeticiones) / 10
  if (Number(record?.vueltas)) return Number(record.vueltas) * 8
  if (Number(record?.tiempo_segundos)) return Math.max(1, 600 / Number(record.tiempo_segundos))
  return 0
}

function datosAtrMensual(records) {
  const hoy = new Date()
  const delMes = records.filter((record) => {
    const fecha = new Date(fechaRecord(record))
    return fecha.getMonth() === hoy.getMonth() && fecha.getFullYear() === hoy.getFullYear()
  })

  return ['Acumulacion', 'Transformacion', 'Realizacion'].map((fase) => {
    const registros = delMes.filter((record) => faseAtrRecord(record) === fase)
    const total = registros.reduce((sum, record) => sum + scoreRecord(record), 0)
    const promedio = registros.length ? total / registros.length : 0

    return {
      label: fase,
      value: Math.round(promedio * 10) / 10,
      count: registros.length,
    }
  })
}

function vo2Cooper(record) {
  if (!record) return null
  const metros = valorRecord(record)
  if (!metros) return null
  return Math.max(0, (metros - 504.9) / 44.73).toFixed(1)
}

export default function AlumnoFichaPage({
  student,
  payments = [],
  attendance = [],
  records = [],
  onBack,
}) {
  if (!student) {
    return (
      <div className="bg-zinc-900 rounded-3xl p-6">
        <h2 className="text-3xl font-bold">No hay alumno seleccionado</h2>
        <button onClick={onBack} className="mt-4 bg-red-600 px-5 py-3 rounded-xl font-bold">
          Volver
        </button>
      </div>
    )
  }

  const studentPayments = payments.filter((p) => p.alumno_id === student.id)
  const studentAttendance = attendance.filter((a) => a.alumno_id === student.id)
  const studentRecords = records
    .filter((r) => r.alumno_id === student.id)
    .sort((a, b) => new Date(fechaRecord(b)) - new Date(fechaRecord(a)))

  const totalPaid = studentPayments.reduce((acc, p) => acc + Number(p.monto || 0), 0)
  const fuerza = mejorRecord(studentRecords, (record) => Number(record.peso_kg))
  const tiempo = mejorRecord(studentRecords, (record) => Number(record.tiempo_segundos), true)
  const salto = mejorRecord(studentRecords, (record) =>
    String(record.rutina_nombre || '').toLowerCase().includes('salto')
  )
  const cooper = mejorRecord(studentRecords, (record) =>
    String(record.rutina_nombre || '').toLowerCase().includes('cooper')
  )
  const vueltas = mejorRecord(studentRecords, (record) => Number(record.vueltas))
  const atr = datosAtrMensual(studentRecords)
  const xpTotal = student.xp || 0
  const nivelMatatoa = student.nivel_matatoa || 'Iniciado'

  return (
    <div className="space-y-8">
      <button onClick={onBack} className="bg-zinc-800 hover:bg-red-600 px-5 py-3 rounded-xl font-bold">
        Volver al panel
      </button>

      <section className="bg-zinc-900 rounded-3xl p-6 border border-zinc-800">
        <h2 className="text-4xl font-black text-red-600">{student.nombre}</h2>
        <p className="text-zinc-400 mt-2">{student.categoria || 'Alumno PowerFit'}</p>
        <p className="text-zinc-500">{student.email || student.telefono || '-'}</p>
      </section>

      <section className="grid md:grid-cols-4 gap-5">
        <Card title="Cumpleanos" value={formatDate(student.fecha_nacimiento)} small />
        <Card title="Fecha de inicio" value={formatDate(student.fecha_ingreso)} small />
        <Card title="Fecha de salida / termino" value={formatDate(student.fecha_salida || student.fecha_vencimiento)} small />
        <Card title="Fecha de pago" value={formatDate(student.fecha_pago)} small />
      </section>

      <section className="grid md:grid-cols-4 gap-5">
        <Card title="XP Total" value={xpTotal} color="text-yellow-400" />
        <Card title="Rango Matato'a" value={nivelMatatoa} color="text-cyan-400" small />
        <Card title="Asistencias" value={studentAttendance.length} color="text-green-400" />
        <Card
          title="Estado pago"
          value={student.estado_pago || 'Pendiente'}
          color={student.estado_pago === 'Pagado' ? 'text-green-400' : 'text-red-400'}
          small
        />
      </section>

      <section className="grid md:grid-cols-4 gap-5">
        <Card title="Total pagado" value={formatMoney(totalPaid)} color="text-green-400" />
        <Card title="Evaluaciones" value={studentRecords.length} color="text-yellow-400" />
        <Card title="Mejor RM" value={fuerza ? `${fuerza.rutina_nombre}: ${valorRecord(fuerza)} kg` : '-'} small />
        <Card title="VO2 estimado" value={cooper ? `${vo2Cooper(cooper)} ml/kg/min` : '-'} small />
      </section>

      <section className="grid md:grid-cols-4 gap-5">
        <Card title="Mejor tiempo" value={tiempo ? `${valorRecord(tiempo)} seg` : '-'} color="text-red-400" />
        <Card title="Salto vertical" value={salto ? `${valorRecord(salto)} cm` : '-'} color="text-cyan-400" />
        <Card title="AMRAP / vueltas" value={vueltas ? `${valorRecord(vueltas)} vueltas` : '-'} color="text-orange-400" small />
        <Card title="Mensualidad" value={formatMoney(student.monto)} small />
      </section>

      <section className="bg-zinc-900 rounded-3xl p-6 border border-zinc-800">
        <h3 className="text-3xl font-bold mb-6">Crecimiento ATR del mes</h3>
        <div className="space-y-5">
          {atr.map((fase) => (
            <Bar
              key={fase.label}
              title={`${fase.label} (${fase.count} registros)`}
              value={Math.min(100, fase.value)}
              label={`${fase.value} pts`}
            />
          ))}
        </div>
      </section>

      <section className="bg-zinc-900 rounded-3xl p-6 border border-zinc-800">
        <h3 className="text-3xl font-bold mb-6">Ultimas evaluaciones</h3>

        <div className="space-y-3">
          {studentRecords.slice(0, 12).map((record) => {
            const meta = metadataRecord(record)

            return (
              <div key={record.id} className="bg-zinc-950 rounded-2xl p-4 border border-zinc-800">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                  <div>
                    <p className="font-bold">{record.rutina_nombre || record.bloque || 'Evaluacion PowerFit'}</p>
                    <p className="text-zinc-400">
                      {formatDate(fechaRecord(record))} - {valorRecord(record)} {unidadRecord(record)} - ATR {faseAtrRecord(record)}
                    </p>
                  </div>

                  <span className="bg-zinc-800 rounded-xl px-3 py-2 text-sm font-black">
                    {record.tipo_record || 'record'}
                  </span>
                </div>

                {(meta.rpe || meta.dolor || meta.sueno || meta.energia || meta.observacion) && (
                  <p className="text-zinc-500 mt-2">
                    RPE {meta.rpe || '-'} | Dolor {meta.dolor || '-'} | Sueno {meta.sueno || '-'} | Energia {meta.energia || '-'}
                    {meta.observacion ? ` | ${meta.observacion}` : ''}
                  </p>
                )}
              </div>
            )
          })}

          {studentRecords.length === 0 && (
            <p className="text-zinc-400">
              Aun no hay evaluaciones. Ingresalas desde Evaluaciones para activar graficos y records.
            </p>
          )}
        </div>
      </section>

      <section className="grid lg:grid-cols-2 gap-6">
        <History title="Historial de pagos" empty="No hay pagos registrados.">
          {studentPayments.map((payment) => (
            <div key={payment.id} className="bg-zinc-950 rounded-2xl p-4 border border-zinc-800">
              <p className="font-bold">{formatMoney(payment.monto)}</p>
              <p className="text-zinc-400">{formatDate(payment.fecha_pago || payment.created_at)}</p>
            </div>
          ))}
        </History>

        <History title="Historial de asistencia" empty="No hay asistencias registradas.">
          {studentAttendance.map((item) => (
            <div key={item.id} className="bg-zinc-950 rounded-2xl p-4 border border-zinc-800">
              <p className="font-bold">{item.nombre_alumno || student.nombre}</p>
              <p className="text-zinc-400">Estado al ingresar: {item.estado_pago || student.estado_pago || '-'}</p>
              <p className="text-zinc-500">{formatDate(item.fecha || item.created_at)}</p>
            </div>
          ))}
        </History>
      </section>
    </div>
  )
}

function Card({ title, value, color = 'text-white', small = false }) {
  return (
    <div className="bg-zinc-900 rounded-3xl p-6 border border-zinc-800">
      <p className="text-zinc-400">{title}</p>
      <h3 className={`${small ? 'text-2xl' : 'text-4xl'} font-black mt-3 ${color}`}>
        {value}
      </h3>
    </div>
  )
}

function Bar({ title, value, label }) {
  return (
    <div>
      <div className="flex justify-between mb-2 gap-3">
        <p className="text-zinc-400">{title}</p>
        <p className="font-bold">{label || `${value}%`}</p>
      </div>

      <div className="h-5 bg-zinc-800 rounded-full overflow-hidden">
        <div className="h-5 bg-red-500 rounded-full" style={{ width: `${Math.min(100, value)}%` }} />
      </div>
    </div>
  )
}

function History({ title, empty, children }) {
  const items = Array.isArray(children) ? children.filter(Boolean) : children
  const isEmpty = Array.isArray(items) ? items.length === 0 : !items

  return (
    <section className="bg-zinc-900 rounded-3xl p-6 border border-zinc-800">
      <h3 className="text-3xl font-bold mb-6">{title}</h3>
      <div className="space-y-3">
        {isEmpty ? <p className="text-zinc-400">{empty}</p> : items}
      </div>
    </section>
  )
}
