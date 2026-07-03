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
  return Number(solicitud.generaciones ?? 1)
}

function textoGeneracionesCompra(generaciones) {
  if (generaciones <= 0) return 'Plan mensual'

  return `+${generaciones} generación${generaciones === 1 ? '' : 'es'}`
}

function toDateInput(date) {
  return date.toISOString().slice(0, 10)
}

function inicioSemana(date) {
  const copia = new Date(date)
  const dia = copia.getDay() || 7
  copia.setDate(copia.getDate() - dia + 1)
  return copia
}

function formatoFecha(date) {
  return toDateInput(date)
}

function calcularRango(tipo) {
  const hoy = new Date()

  if (tipo === 'dia') {
    return [formatoFecha(hoy), formatoFecha(hoy)]
  }

  if (tipo === 'semana') {
    const inicio = inicioSemana(hoy)
    const fin = new Date(inicio)
    fin.setDate(inicio.getDate() + 6)
    return [formatoFecha(inicio), formatoFecha(fin)]
  }

  if (tipo === 'mes') {
    const inicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1)
    const fin = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0)
    return [formatoFecha(inicio), formatoFecha(fin)]
  }

  const inicio = new Date(hoy.getFullYear(), 0, 1)
  const fin = new Date(hoy.getFullYear(), 11, 31)
  return [formatoFecha(inicio), formatoFecha(fin)]
}

function totalAprobadoEnRango(compras, desde, hasta) {
  return compras
    .filter((s) => estadoCompra(s) === 'Aprobado')
    .filter((s) => {
      const fecha = String(fechaCompra(s)).slice(0, 10)
      if (!fecha) return false
      if (desde && fecha < desde) return false
      if (hasta && fecha > hasta) return false
      return true
    })
    .reduce((sum, s) => sum + montoCompra(s), 0)
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
  const [rangoInicialDesde, rangoInicialHasta] = calcularRango('mes')
  const [desde, setDesde] = useState(rangoInicialDesde)
  const [hasta, setHasta] = useState(rangoInicialHasta)
  const [periodoActivo, setPeriodoActivo] = useState('mes')

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

  const totalAprobado = totalAprobadoEnRango(comprasFiltradas, desde, hasta)
  const [diaDesde, diaHasta] = calcularRango('dia')
  const [semanaDesde, semanaHasta] = calcularRango('semana')
  const [mesDesde, mesHasta] = calcularRango('mes')
  const [anioDesde, anioHasta] = calcularRango('anio')

  const totales = {
    dia: totalAprobadoEnRango(registroCompras, diaDesde, diaHasta),
    semana: totalAprobadoEnRango(registroCompras, semanaDesde, semanaHasta),
    mes: totalAprobadoEnRango(registroCompras, mesDesde, mesHasta),
    anio: totalAprobadoEnRango(registroCompras, anioDesde, anioHasta),
  }

  function aplicarPeriodo(tipo) {
    const [nuevoDesde, nuevoHasta] = calcularRango(tipo)
    setDesde(nuevoDesde)
    setHasta(nuevoHasta)
    setPeriodoActivo(tipo)
  }

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
    <div className="bg-zinc-900 border border-green-600 rounded-2xl sm:rounded-3xl p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h2 className="text-3xl sm:text-4xl font-black text-green-400">
            Registro de compras
          </h2>
          <p className="text-zinc-400 mt-2">
            Solicitudes pendientes: {pendientes.length}
          </p>
        </div>

        <div className="bg-zinc-800 rounded-2xl p-4 font-black text-green-400 w-full sm:w-auto">
          Total rango: ${totalAprobado}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <div className="bg-zinc-800 rounded-2xl p-3 sm:p-4">
          <p className="text-zinc-400">Hoy</p>
          <p className="text-xl sm:text-2xl font-black text-green-400">${totales.dia}</p>
        </div>
        <div className="bg-zinc-800 rounded-2xl p-3 sm:p-4">
          <p className="text-zinc-400">Semana</p>
          <p className="text-xl sm:text-2xl font-black text-green-400">${totales.semana}</p>
        </div>
        <div className="bg-zinc-800 rounded-2xl p-3 sm:p-4">
          <p className="text-zinc-400">Mes</p>
          <p className="text-xl sm:text-2xl font-black text-green-400">${totales.mes}</p>
        </div>
        <div className="bg-zinc-800 rounded-2xl p-3 sm:p-4">
          <p className="text-zinc-400">Año</p>
          <p className="text-xl sm:text-2xl font-black text-green-400">${totales.anio}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-3 mb-6">
        {[
          ['dia', 'Día'],
          ['semana', 'Semana'],
          ['mes', 'Mes'],
          ['anio', 'Año'],
        ].map(([tipo, label]) => (
          <button
            key={tipo}
            onClick={() => aplicarPeriodo(tipo)}
            className={`px-5 py-3 rounded-2xl font-black ${
              periodoActivo === tipo ? 'bg-green-600' : 'bg-zinc-800'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="grid md:grid-cols-3 gap-4 mb-6">
        <input
          type="date"
          value={desde}
          onChange={(e) => {
            setDesde(e.target.value)
            setPeriodoActivo('custom')
          }}
          className="bg-black p-3 rounded-xl"
        />

        <input
          type="date"
          value={hasta}
          onChange={(e) => {
            setHasta(e.target.value)
            setPeriodoActivo('custom')
          }}
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
              className="grid lg:grid-cols-7 gap-3 bg-zinc-800 rounded-2xl p-4 items-start lg:items-center"
            >
              <p className="font-black text-lg lg:text-base">{s.nombre_alumno || s.nombre || '-'}</p>
              <p>${montoCompra(s)}</p>
              <p>{textoGeneracionesCompra(generaciones)}</p>
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
                  {generaciones > 0
                    ? `Aprobar generación +${generaciones}`
                    : 'Aprobar plan mensual'}
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
