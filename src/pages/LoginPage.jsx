import { useState } from 'react'
import { supabase } from '../lib/supabase'

import logo from '../assets/logo.jpg'
import rongo from '../assets/rongo.jpg'

export default function LoginPage({ onLogin }) {
  const [mode, setMode] = useState('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleAuth(e) {
    e.preventDefault()

    setLoading(true)
    setMessage('')

    try {
      if (mode === 'register') {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        })

        if (error) {
          setMessage(error.message)
          setLoading(false)
          return
        }

        if (data?.user) {
          const { error: alumnoError } = await supabase
            .from('alumnos')
            .insert([
              {
                nombre: name,
                email: email,
                user_id: data.user.id,
                plan: 'Basico',
                estado_pago: 'Pendiente',
                fecha_pago: null,
                fecha_vencimiento: null,
                monto: 0,
              },
            ])

          if (alumnoError) {
            setMessage(alumnoError.message)
            setLoading(false)
            return
          }
        }

        setMessage('Cuenta creada correctamente. Ahora inicia sesión.')
        setMode('login')
        setLoading(false)
        return
      }

      if (mode === 'login') {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (error) {
          setMessage(error.message)
          setLoading(false)
          return
        }

        if (data?.user) {
          onLogin(data.user)
        }
      }
    } catch (err) {
      setMessage('Error inesperado')
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-gray-950 border border-red-600 rounded-2xl p-6 shadow-xl">
        <div className="text-center mb-6">
          <img src={logo} alt="Logo" className="mx-auto w-32 mb-4" />
          <h1 className="text-3xl font-black text-red-600">
            Boxeo Rapa Nui
          </h1>
          <p className="text-gray-400 mt-2">
            Sistema Administrativo Deportivo · PowerFit 360
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          {mode === 'register' && (
            <input
              type="text"
              placeholder="Nombre completo"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-3 rounded bg-gray-900 border border-gray-700 text-white"
              required
            />
          )}

          <input
            type="email"
            placeholder="Correo electrónico"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-3 rounded bg-gray-900 border border-gray-700 text-white"
            required
          />

          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 rounded bg-gray-900 border border-gray-700 text-white"
            required
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-red-600 hover:bg-red-700 p-3 rounded font-bold"
          >
            {loading
              ? 'Cargando...'
              : mode === 'login'
              ? 'Ingresar'
              : 'Crear cuenta'}
          </button>
        </form>

        {message && (
          <p className="mt-4 text-center text-yellow-400 font-bold">
            {message}
          </p>
        )}

        <div className="text-center mt-6">
          {mode === 'login' ? (
            <button
              onClick={() => setMode('register')}
              className="text-red-400 underline"
            >
              Crear cuenta nueva
            </button>
          ) : (
            <button
              onClick={() => setMode('login')}
              className="text-red-400 underline"
            >
              Ya tengo cuenta
            </button>
          )}
        </div>
      </div>
    </div>
  )
}