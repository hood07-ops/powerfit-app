import { useState } from 'react'

function fechaCompra(solicitud) {
  return solicitud.created_at || solicitud.fecha || solicitud.fecha_pago || ''
}

function estadoCompra(solicitud) {
  return solicitud.estado || solicitud.estado_pago || 'Pendiente'
}

function montoCompra(solicitud) {
  return Number(solicitud.monto || 0)
}

function generacionesCompra(solicitud) {
  return Number(solicitud.generaciones || 1)
}

function EstadoCompra({ estado }) {
  const styles = {
    Aprobado: 'bg-green-600 text-white',
    Pagado: 'bg-blue-600 text-white',
    Pendiente: 'bg-yellow-500 text-black',
    Rechazado: 'bg-red-600 text-white',
  }

  return (
    <span
      className={`rounded-xl px-3 py-2 text-sm font-black ${
        styles[estado] || styles.Pendiente
      }`}
    >
      {estado}
    </span>
  )
}

export default function RegistroComprasPage({
  registroCompras,
  aprobarSolicitud,
  descargarCSV,
}) {
  const [desde, setDesde] = useState('')
  const [hasta, setHasta] = useState('')

  const comprasOrdenadas = [...registroCompras].sort((a, b) => {
    const estadoA = estadoCompra(a) === 'Pendiente' ? 0 : 1
    const estadoB = estadoCompra(b) === 'Pendiente' ? 0 : 1

    if (estadoA !== estadoB) return estadoA - estadoB

    return new Date(fechaCompra(b) || 0) - new Date(fechaCompra(a) || 0)
  })

  const comprasFiltradas = comprasOrdenadas.filter((s) => {
    const fecha = String(fechaCompra(s)).slice(0, 10)

    if (desde && fecha < desde) return false
    if (hasta && fecha > hasta) return false

    return true
  })

  const pendientes = comprasFiltradas.filter(
    (s) => estadoCompra(s) !== 'Aprobado'
  )

  const totalAprobado = comprasFiltradas
    .filter((s) => estadoCompra(s) === 'Aprobado')
    .reduce((sum, s) => sum + montoCompra(s), 0)

  function descargar() {
    descargarCSV(
      'registro_compras_powerfit.csv',
      'Alumno,Monto,Generaciones,Estado,Fecha,Referencia',
      comprasFiltradas.map((s) =>
        [
          s.nombre_alumno || s.nombre || '-',
          montoCompra(s),
          generacionesCompra(s),
          estadoCompra(s),
          fechaCompra(s),
          s.webpay_token || s.payment_id || s.referencia || '',
        ].join(',')
      ),
      'Total ganancias compras aprobadas',
      totalAprobado
    )
  }

  return (
    <div className="bg-zinc-900 border border-green-600 rounded-3xl p-6">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h2 className="text-4xl font-black text-green-400">
            Registro de compras
          </h2>
          <p className="text-zinc-400 mt-2">
            Solicitudes pendientes: {pendientes.length}
          </p>
        </div>

        <div className="bg-zinc-800 rounded-2xl p-4 font-black text-green-400">
          Total aprobado: ${totalAprobado}
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4 mb-6">
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
          Descargar CSV compras
        </button>
      </div>

      <div className="space-y-3">
        {comprasFiltradas.map((s) => {
          const estado = estadoCompra(s)
          const generaciones = generacionesCompra(s)
          const fecha = fechaCompra(s)

          return (
            <div
              key={s.id}
              className="grid md:grid-cols-7 gap-3 bg-zinc-800 rounded-2xl p-4 items-center"
            >
              <p className="font-black">{s.nombre_alumno || s.nombre || '-'}</p>
              <p>${montoCompra(s)}</p>
              <p>+{generaciones} generacion</p>
              <EstadoCompra estado={estado} />
              <p>{fecha ? new Date(fecha).toLocaleDateString() : '-'}</p>
              <p className="text-xs text-zinc-400">
                {s.webpay_token || s.payment_id || s.referencia || 'Manual'}
              </p>

              {estado !== 'Aprobado' ? (
                <button
                  onClick={() => aprobarSolicitud(s)}
                  className="bg-green-600 hover:bg-green-700 p-3 rounded-xl font-black"
                >
                  Aprobar generacion +{generaciones}
                </button>
              ) : (
                <p className="text-green-400 font-black">Aprobado</p>
              )}
            </div>
          )
        })}

        {comprasFiltradas.length === 0 && (
          <p className="text-zinc-400">
            No hay solicitudes registradas en este rango.
          </p>
        )}
      </div>
    </div>
  )
}
