import { useState } from 'react'

export default function RegistroComprasPage({
  registroCompras,
  aprobarSolicitud,
  descargarCSV,
}) {
  const [desde, setDesde] = useState('')
  const [hasta, setHasta] = useState('')

  const comprasFiltradas = registroCompras.filter((s) => {
    const fecha = String(s.created_at || '').slice(0, 10)

    if (desde && fecha < desde) return false
    if (hasta && fecha > hasta) return false

    return true
  })

  const totalAprobado = comprasFiltradas
    .filter((s) => s.estado === 'Aprobado')
    .reduce((sum, s) => sum + Number(s.monto || 0), 0)

  function descargar() {
    descargarCSV(
      'registro_compras_powerfit.csv',
      'Alumno,Monto,Generaciones,Estado,Fecha',
      comprasFiltradas.map(
        (s) =>
          `${s.nombre_alumno},${s.monto},${s.generaciones},${s.estado},${s.created_at}`
      ),
      'Total ganancias compras aprobadas',
      totalAprobado
    )
  }

  return (
    <div className="bg-zinc-900 border border-green-600 rounded-3xl p-6">
      <h2 className="text-4xl font-black text-green-400 mb-6">
        Registro de compras por fecha
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
          Descargar CSV compras
        </button>

        <div className="bg-zinc-800 rounded-2xl p-4 font-black text-green-400">
          Total aprobado: ${totalAprobado}
        </div>
      </div>

      <div className="space-y-3">
        {comprasFiltradas.map((s) => (
          <div
            key={s.id}
            className="grid md:grid-cols-6 gap-3 bg-zinc-800 rounded-2xl p-4 items-center"
          >
            <p>{s.nombre_alumno}</p>
            <p>${s.monto}</p>
            <p>+{s.generaciones}</p>
            <p>{s.estado}</p>
            <p>{new Date(s.created_at).toLocaleDateString()}</p>

            {s.estado !== 'Aprobado' ? (
              <button
                onClick={() => aprobarSolicitud(s)}
                className="bg-green-600 hover:bg-green-700 p-3 rounded-xl font-black"
              >
                Aprobar +2
              </button>
            ) : (
              <p className="text-green-400 font-black">Archivado</p>
            )}
          </div>
        ))}

        {comprasFiltradas.length === 0 && (
          <p className="text-zinc-400">
            No hay compras registradas en este rango.
          </p>
        )}
      </div>
    </div>
  )
}