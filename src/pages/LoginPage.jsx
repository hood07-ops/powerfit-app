import { useState } from 'react'
import { supabase } from '../supabaseClient'

export default function LoginPage({ onLogin }) {
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleAuth(e) {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    // REGISTRO
    if (mode === 'signup') {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      })

      if (error) {
        setMessage(error.message)
      } else {
        setMessage('Cuenta creada correctamente. Ahora inicia sesión')
        setMode('login')
      }

      setLoading(false)
      return
    }

    // LOGIN
    if (mode === 'login') {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setMessage(error.message)
      } else {
        setMessage('Inicio de sesión correcto')

        if (onLogin) {
          onLogin(data.user)
        }
      }

      setLoading(false)
      return
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white">
      <form
        onSubmit={handleAuth}
        className="bg-zinc-900 p-8 rounded-2xl w-full max-w-md shadow-2xl"
      >
        <h1 className="text-3xl font-bold mb-6 text-center">
          POWERFIT 360
        </h1>

        <input
          type="email"
          placeholder="Correo"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-3 mb-4 rounded bg-zinc-800 border border-zinc-700"
        />

        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-3 mb-4 rounded bg-zinc-800 border border-zinc-700"
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-red-600 hover:bg-red-700 p-3 rounded font-bold"
        >
          {loading
            ? 'Cargando...'
            : mode === 'login'
            ? 'Iniciar sesión'
            : 'Crear cuenta'}
        </button>

        {message && (
          <p className="mt-4 text-center text-sm text-yellow-400">
            {message}
          </p>
        )}

        <div className="mt-6 text-center">
          {mode === 'login' ? (
            <button
              type="button"
              onClick={() => setMode('signup')}
              className="text-blue-400"
            >
              Crear una cuenta
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setMode('login')}
              className="text-blue-400"
            >
              Ya tengo cuenta
            </button>
          )}
        </div>
      </form>
    </div>
  )
}