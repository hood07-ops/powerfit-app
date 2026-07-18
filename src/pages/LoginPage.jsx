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

  function alumnoPayload(user, values = form) {
    const email = values.email || user?.email || ''
    const nombreBase = email ? email.split('@')[0] : 'Alumno'

    return {
      nombre: values.nombre || nombreBase,
      email,
      user_id: user.id,
      telefono: values.telefono || '',
      fecha_ingreso: values.fecha_ingreso || null,
      categoria: values.categoria || '',
      edad: values.edad ? Number(values.edad) : null,
      peso: values.peso ? Number(values.peso) : null,
      altura: values.altura ? Number(values.altura) : null,
      contacto_emergencia: values.contacto_emergencia || '',
      observaciones: values.observaciones || '',
      plan: 'Básico',
      estado_pago: 'Pendiente',
      monto: 0,
      xp: 0,
      bloques_premium: 0,
      generaciones_disponibles: 6,
    }
  }

  async function asegurarAlumno(user, values = form) {
    if (!user?.id) return null

    const { data: existente, error: buscarError } = await supabase
      .from('alumnos')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (buscarError) return buscarError
    if (existente?.id) return null

    const { error } = await supabase.from('alumnos').insert([
      alumnoPayload(user, values),
    ])

    return error
  }

  async function iniciarSesionConFicha() {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: form.email,
      password: form.password,
    })

    if (error) {
      setMessage('Correo o contraseña incorrectos')
      return false
    }

    const alumnoError = await asegurarAlumno(data.user)

    if (alumnoError) {
      setMessage(`Ingresaste, pero no se pudo crear la ficha de alumno: ${alumnoError.message}`)
      return false
    }

    onLogin(data.user)
    return true
  }

  async function registrarCuenta() {
    const { data, error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: {
          nombre: form.nombre,
          telefono: form.telefono,
          categoria: form.categoria,
        },
      },
    })

    if (error) {
      if (error.message.toLowerCase().includes('already registered')) {
        const ok = await iniciarSesionConFicha()

        if (!ok) {
          setMessage('Ese correo ya existe. Inicia sesión con tu contraseña o pide recuperar acceso.')
        }

        return
      }

      setMessage(error.message)
      return
    }

    if (data?.user && data?.session) {
      const alumnoError = await asegurarAlumno(data.user)

      if (alumnoError) {
        setMessage(`Cuenta creada, pero no se pudo crear la ficha: ${alumnoError.message}`)
        return
      }
    }

    setMessage(
      data?.session
        ? 'Cuenta creada. Ahora inicia sesión.'
        : 'Cuenta creada. Si Supabase pide confirmación, revisa el correo antes de iniciar sesión.'
    )
    setMode('login')
  }

  async function handleAuth(e) {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    if (mode === 'register') {
      await registrarCuenta()
      setLoading(false)
      return
    }

    await iniciarSesionConFicha()
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
      <div className="w-full max-w-2xl bg-zinc-900 border border-red-600 rounded-3xl p-6 sm:p-8">
        <img
          src="/powerfit-logo.png"
          alt="PowerFit 360"
          className="mx-auto h-40 w-40 sm:h-48 sm:w-48 rounded-full object-cover border border-red-600"
        />
        <h1 className="text-4xl font-black text-red-500 text-center mt-5">
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
