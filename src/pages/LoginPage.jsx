import { useState } from 'react'
import { supabase } from '../lib/supabase'

import logo from '../assets/logo.jpg'

export default function LoginPage({ onLogin }) {
  const [mode, setMode] = useState('login')

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const [telefono, setTelefono] = useState('')
  const [fechaIngreso, setFechaIngreso] = useState('')
  const [categoria, setCategoria] = useState('')
  const [edad, setEdad] = useState('')
  const [peso, setPeso] = useState('')
  const [altura, setAltura] = useState('')
  const [contactoEmergencia, setContactoEmergencia] = useState('')
  const [observaciones, setObservaciones] = useState('')

  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleAuth(e) {
    e.preventDefault()

    setLoading(true)
    setMessage('')

    try {
      // =========================
      // REGISTRO
      // =========================
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
                email,
                user_id: data.user.id,
                telefono,
                fecha_ingreso: fechaIngreso || null,
                categoria,
                edad: edad ? Number(edad) : null,
                peso: peso ? Number(peso) : null,
                altura: altura ? Number(altura) : null,
                contacto_emergencia: contactoEmergencia,
                observaciones,
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

      // =========================
      // LOGIN NORMAL
      // =========================
      if (mode === 'login') {
        const { data, error } =
          await supabase.auth.signInWithPassword({
            email,
            password,
          })

        if (error) {
          setMessage('Correo o contraseña incorrectos')
          setLoading(false)
          return
        }

        if (data?.user) {
          onLogin(data.user)
        }

        setLoading(false)
        return
      }
    } catch (err) {
      setMessage('Error inesperado')
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
      <div className="w-full max-w-2xl bg-zinc-900 rounded-3xl p-8 border border-red-600">
        <div className="text-center mb-6">
          <img
            src={logo}
            alt="logo"
            className="w-28 h-28 object-cover rounded-full mx-auto mb-4"
          />

          <h1 className="text-4xl font-black text-red-600">
            BOXEO RAPA NUI
          </h1>

          <p className="text-zinc-400 mt-2">
            Sistema Administrativo Deportivo · PowerFit 360
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          {mode === 'register' && (
            <>
              <input
                type="text"
                placeholder="Nombre completo"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-4 rounded-2xl bg-zinc-800 border border-zinc-700"
                required
              />

              <input
                type="text"
                placeholder="Teléfono"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                className="w-full p-4 rounded-2xl bg-zinc-800 border border-zinc-700"
              />

              <input
                type="date"
                value={fechaIngreso}
                onChange={(e) => setFechaIngreso(e.target.value)}
                className="w-full p-4 rounded-2xl bg-zinc-800 border border-zinc-700"
              />

              <select
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
                className="w-full p-4 rounded-2xl bg-zinc-800 border border-zinc-700"
              >
                <option value="">Seleccionar categoría</option>
                <option value="Boxeo">Boxeo</option>
                <option value="Kickboxing">Kickboxing</option>
                <option value="K1">K1</option>
                <option value="PowerFit 360">PowerFit 360</option>
                <option value="Infantil">Infantil</option>
                <option value="Juvenil">Juvenil</option>
                <option value="Adulto">Adulto</option>
              </select>

              <div className="grid md:grid-cols-3 gap-3">
                <input
                  type="number"
                  placeholder="Edad"
                  value={edad}
                  onChange={(e) => setEdad(e.target.value)}
                  className="w-full p-4 rounded-2xl bg-zinc-800 border border-zinc-700"
                />

                <input
                  type="number"
                  placeholder="Peso kg"
                  value={peso}
                  onChange={(e) => setPeso(e.target.value)}
                  className="w-full p-4 rounded-2xl bg-zinc-800 border border-zinc-700"
                />

                <input
                  type="number"
                  placeholder="Altura cm"
                  value={altura}
                  onChange={(e) => setAltura(e.target.value)}
                  className="w-full p-4 rounded-2xl bg-zinc-800 border border-zinc-700"
                />
              </div>

              <input
                type="text"
                placeholder="Contacto emergencia"
                value={contactoEmergencia}
                onChange={(e) => setContactoEmergencia(e.target.value)}
                className="w-full p-4 rounded-2xl bg-zinc-800 border border-zinc-700"
              />

              <textarea
                placeholder="Observaciones"
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                className="w-full p-4 rounded-2xl bg-zinc-800 border border-zinc-700 min-h-24"
              />
            </>
          )}

          <input
            type="email"
            placeholder="Correo electrónico"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-4 rounded-2xl bg-zinc-800 border border-zinc-700"
            required
          />

          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-4 rounded-2xl bg-zinc-800 border border-zinc-700"
            required
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-red-600 hover:bg-red-700 transition-all p-4 rounded-2xl font-black text-xl"
          >
            {loading
              ? 'Cargando...'
              : mode === 'login'
              ? 'Ingresar'
              : 'Crear cuenta'}
          </button>
        </form>

        {message && (
          <div className="mt-6 bg-zinc-800 p-4 rounded-2xl text-center text-yellow-400 font-bold">
            {message}
          </div>
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