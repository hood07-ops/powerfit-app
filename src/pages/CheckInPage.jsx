import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function CheckInPage() {
  const [message, setMessage] = useState('Registrando asistencia...')

  useEffect(() => {
    registerAttendance()
  }, [])

  async function registerAttendance() {
    const params = new URLSearchParams(window.location.search)
    const alumnoId = params.get('checkin')

    if (!alumnoId) {
      setMessage('QR inválido')
      return
    }

    const today = new Date().toISOString().split('T')[0]

    const { error } = await supabase.from('asistencia').insert([
      {
        alumno_id: Number(alumnoId),
        fecha: today,
        clase: 'PowerFit 360',
        presente: true,
        metodo: 'qr',
        qr_codigo: `QR-${alumnoId}-${today}`,
      },
    ])

    if (error) {
      setMessage('Error registrando asistencia')
      return
    }

    setMessage('Asistencia registrada correctamente 🔥')
  }

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
      <div className="bg-zinc-900 rounded-3xl p-8 border border-zinc-800 text-center max-w-md">
        <h1 className="text-4xl font-black text-red-600 mb-4">
          BOXEO RAPA NUI
        </h1>

        <p className="text-2xl font-bold">
          {message}
        </p>

        <p className="text-zinc-400 mt-4">
          Ya puedes cerrar esta ventana.
        </p>
      </div>
    </div>
  )
}