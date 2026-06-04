import { useState } from 'react'

export default function RegistroMensualidadesPage({ students, descargarCSV }) {
  const [desde, setDesde] = useState('')
  const [hasta, setHasta] = useState('')

  const pagosFiltrados = students.filter((a) => {
    const fecha = a.fecha_pago || ''

    if (a.estado_pago !== 'Pagado') return false
    if (desde && fecha < desde) return false
    if (hasta && fecha > hasta) return false

    return true
  })

  const totalPagado = pagosFiltrados.reduce(
    (sum, a) => sum + Number(a.monto || 0),
    0
  )

  function descargar() {
    descargarCSV(
      'registro_mensualidades_powerfit.csv',
      'Alumno,Estado,Monto,Fecha pago,Vencimiento',
      pagosFiltrados.map(
        (a) =>
          `${a.nombre},${a.estado_pago},${a.monto},${a.fecha_pago},${a.fecha_vencimiento}`
      ),
      'Total mensualidades pagadas',
      totalPagado
    )
  }

  return (
    <div className="bg-zinc-900 border border-blue-600 rounded-3xl p-6">
      <h2 className="text-4xl font-black text-blue-400 mb-6">
        Registro de mensualidades por fecha
      </h2>

      <div className="grid md:grid-cols-4 gap-4 mb-6">
        <input
          type="date"
          value={desde}
          onChange={(e) => setDesde(e.target.value)}
          className="bg-black p-3 rounded-xl"
        />

        <input
          type="date"
          value={hasta}
          onChange={(e) => setHasta(e.target.value)}
          className="bg-black p-3 rounded-xl"
        />

        <button
          onClick={descargar}
          className="bg-blue-600 hover:bg-blue-700 px-5 py-3 rounded-2xl font-black"
        >
          Descargar CSV mensualidades
        </button>

        <div className="bg-zinc-800 rounded-2xl p-4 font-black text-blue-400">
          Total pagado: ${totalPagado}
        </div>
      </div>

      <div className="space-y-3">
        {pagosFiltrados.map((a) => (
          <div
            key={a.id}
            className="grid md:grid-cols-5 gap-3 bg-zinc-800 rounded-2xl p-4"
          >
            <p>{a.nombre}</p>
            <p>{a.estado_pago}</p>
            <p>${a.monto}</p>
            <p>{a.fecha_pago}</p>
            <p>{a.fecha_vencimiento}</p>
          </div>
        ))}

        {pagosFiltrados.length === 0 && (
          <p className="text-zinc-400">
            No hay mensualidades pagadas en este rango.
          </p>
        )}
      </div>
    </div>
  )
}