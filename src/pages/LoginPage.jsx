import { useState } from 'react'
import { supabase } from '../supabase'

export default function LoginPage({ onLogin }) {
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({
    nombre: '',
    email: '',
    password: '',
    telefono: '',
    fecha_ingreso: '',
    categoria: '',
    edad: '',
    peso: '',
    altura: '',
    contacto_emergencia: '',
    observaciones: '',
  })
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  function update(field, value) {
    setForm({ ...form, [field]: value })
  }

  async function handleAuth(e) {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    if (mode === 'register') {
      const { data, error } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
      })

      if (error) {
        setMessage(error.message)
        setLoading(false)
        return
      }

      if (data?.user) {
        const { error: alumnoError } = await supabase.from('alumnos').insert([
          {
            nombre: form.nombre,
            email: form.email,
            user_id: data.user.id,
            telefono: form.telefono,
            fecha_ingreso: form.fecha_ingreso || null,
            categoria: form.categoria,
            edad: form.edad ? Number(form.edad) : null,
            peso: form.peso ? Number(form.peso) : null,
            altura: form.altura ? Number(form.altura) : null,
            contacto_emergencia: form.contacto_emergencia,
            observaciones: form.observaciones,
            plan: 'Basico',
            estado_pago: 'Pendiente',
            monto: 0,
            xp: 0,
            bloques_premium: 0,
            generaciones_disponibles: 6,
          },
        ])

        if (alumnoError) {
          setMessage(alumnoError.message)
          setLoading(false)
          return
        }
      }

      setMessage('Cuenta creada. Ahora inicia sesión.')
      setMode('login')
      setLoading(false)
      return
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: form.email,
      password: form.password,
    })

    if (error) {
      setMessage('Correo o contraseña incorrectos')
      setLoading(false)
      return
    }

    onLogin(data.user)
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
      <div className="w-full max-w-2xl bg-zinc-900 border border-red-600 rounded-3xl p-8">
        <h1 className="text-4xl font-black text-red-500 text-center">
          POWERFIT 360
        </h1>

        <form onSubmit={handleAuth} className="space-y-4 mt-6">
          {mode === 'register' && (
            <>
              <Input label="Nombre completo" value={form.nombre} onChange={(v) => update('nombre', v)} />
              <Input label="Teléfono" value={form.telefono} onChange={(v) => update('telefono', v)} />
              <Input type="date" label="Fecha ingreso" value={form.fecha_ingreso} onChange={(v) => update('fecha_ingreso', v)} />
              <Input label="Categoría" value={form.categoria} onChange={(v) => update('categoria', v)} />
              <Input type="number" label="Edad" value={form.edad} onChange={(v) => update('edad', v)} />
              <Input type="number" label="Peso kg" value={form.peso} onChange={(v) => update('peso', v)} />
              <Input type="number" label="Altura cm" value={form.altura} onChange={(v) => update('altura', v)} />
              <Input label="Contacto emergencia" value={form.contacto_emergencia} onChange={(v) => update('contacto_emergencia', v)} />
              <textarea
                placeholder="Observaciones médicas / lesiones"
                value={form.observaciones}
                onChange={(e) => update('observaciones', e.target.value)}
                className="w-full p-4 rounded-2xl bg-zinc-800"
              />
            </>
          )}

          <Input type="email" label="Correo" value={form.email} onChange={(v) => update('email', v)} />
          <Input type="password" label="Contraseña" value={form.password} onChange={(v) => update('password', v)} />

          <button className="w-full bg-red-600 p-4 rounded-2xl font-black">
            {loading ? 'Cargando...' : mode === 'login' ? 'Ingresar' : 'Crear cuenta'}
          </button>
        </form>

        {message && <p className="text-yellow-400 text-center mt-4">{message}</p>}

        <button
          onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
          className="w-full mt-6 text-red-400 underline"
        >
          {mode === 'login' ? 'Crear cuenta nueva' : 'Ya tengo cuenta'}
        </button>
      </div>
    </div>
  )
}

function Input({ label, value, onChange, type = 'text' }) {
  return (
    <input
      type={type}
      placeholder={label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full p-4 rounded-2xl bg-zinc-800"
      required={label === 'Correo' || label === 'Contraseña' || label === 'Nombre completo'}
    />
  )
}