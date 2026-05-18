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
  const { error: alumnoError } = await supabase.from('alumnos').insert([
    {
      nombre: name,
      email: email,
      user_id: data.user.id,
      plan: 'Basico',
      estado_pago: 'Pendiente',
    }
  ])

  if (alumnoError) {
    setMessage(alumnoError.message)
    setLoading(false)
    return
  }
}
        if (error) {
          setMessage(error.message)
          setLoading(false)
          return
        }

        if (data.user) {
          await supabase.from('perfiles').insert([
            {
              id: data.user.id,
              nombre: name || email,
              email,
              rol:
                email ===
                'robinson.cortez.rojas@gmail.com'
                  ? 'admin'
                  : 'student',
            },
          ])
        }

        setMessage(
          'Cuenta creada correctamente 🔥'
        )

        setMode('login')
      } else {
        const { data, error } =
          await supabase.auth.signInWithPassword({
            email,
            password,
          })

        if (error) {
          setMessage(error.message)
          setLoading(false)
          return
        }

        const { data: profile } =
          await supabase
            .from('perfiles')
            .select('*')
            .eq('id', data.user.id)
            .single()

        onLogin({
          id: data.user.id,
          email: data.user.email,
          name:
            profile?.nombre ||
            data.user.email,
          role:
            profile?.rol || 'student',
          alumno_id:
            profile?.alumno_id || null,
        })
      }
    } catch (error) {
      setMessage(
        'Error inesperado'
      )
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 fade-in">

      <div className="w-full max-w-md glass rounded-[35px] overflow-hidden border border-zinc-800 red-glow">

        <div className="relative p-8">

          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: `url(${rongo})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />

          <div className="relative z-10">

            <div className="flex justify-center mb-6">

              <img
                src={logo}
                alt="Boxeo Rapa Nui"
                className="w-40 logo-spin"
              />
            </div>

            <h1 className="text-5xl font-black text-center text-red-600 title-shadow">
              BOXEO
            </h1>

            <h1 className="text-5xl font-black text-center mb-4">
              RAPA NUI
            </h1>

            <p className="text-center text-zinc-400 mb-8">
              Fuerza • Disciplina • Honor
            </p>

            <form
              onSubmit={handleAuth}
              className="space-y-4"
            >

              {mode === 'register' && (
                <input
                  type="text"
                  placeholder="Nombre"
                  value={name}
                  onChange={(e) =>
                    setName(e.target.value)
                  }
                  className="w-full bg-black/60 border border-zinc-800 rounded-2xl px-5 py-4"
                />
              )}

              <input
                type="email"
                placeholder="Correo electrónico"
                value={email}
                onChange={(e) =>
                  setEmail(e.target.value)
                }
                className="w-full bg-black/60 border border-zinc-800 rounded-2xl px-5 py-4"
              />

              <input
                type="password"
                placeholder="Contraseña"
                value={password}
                onChange={(e) =>
                  setPassword(e.target.value)
                }
                className="w-full bg-black/60 border border-zinc-800 rounded-2xl px-5 py-4"
              />

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-red-600 hover:bg-red-700 py-4 rounded-2xl font-black text-lg mt-2"
              >
                {loading
                  ? 'Cargando...'
                  : mode === 'login'
                  ? 'INICIAR SESIÓN'
                  : 'CREAR CUENTA'}
              </button>
            </form>

            {message && (
              <div className="mt-5 text-center text-red-400 font-bold">
                {message}
              </div>
            )}

            <button
              onClick={() =>
                setMode(
                  mode === 'login'
                    ? 'register'
                    : 'login'
                )
              }
              className="mt-6 text-zinc-400 hover:text-red-500 w-full"
            >
              {mode === 'login'
                ? 'Crear cuenta'
                : 'Ya tengo cuenta'}
            </button>

            <div className="mt-8 opacity-50">
              <img
                src={rongo}
                alt="Rongo"
                className="w-full"
              />
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}