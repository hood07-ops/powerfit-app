import { QRCodeCanvas } from 'qrcode.react'

export default function MiQRPage({ student }) {
  const urlCheckIn = `${window.location.origin}?checkin=${student?.id}`

  return (
    <div className="bg-zinc-900 border border-green-600 rounded-3xl p-6 text-center">
      <h2 className="text-4xl font-black text-green-400 mb-4">
        MI QR DE ASISTENCIA
      </h2>

      <p className="text-zinc-300 mb-6">
        Muestra este QR al profesor al llegar a entrenar.
      </p>

      <div className="bg-white inline-block p-5 rounded-3xl">
        <QRCodeCanvas
          value={urlCheckIn}
          size={260}
        />
      </div>

      <div className="bg-zinc-800 rounded-2xl p-5 mt-6">
        <p className="text-yellow-400 font-black text-2xl">
          {student?.nombre}
        </p>

        <p className="text-zinc-300 mt-2">
          Estado pago: {student?.estado_pago || 'Pendiente'}
        </p>

        <p className="text-zinc-300">
          Vencimiento: {student?.fecha_vencimiento || '-'}
        </p>
      </div>
    </div>
  )
}