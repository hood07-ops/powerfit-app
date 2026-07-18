import { useState } from 'react'
import { supabase } from '../supabase'

export default function LoginPage({
  onLogin,
  initialMode = 'login',
  onPasswordUpdated,
}) {
  const [mode, setMode] = useState(initialMode)
  const [form, setForm] = useState({
    nombre: '',
    email: '',
    password: '',
    telefono: '',
    fecha_nacimiento: '',
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
      nombre: values.nombre || user?.user_metadata?.nombre || nombreBase,
      email,
      user_id: user.id,
      telefono: values.telefono || user?.user_metadata?.telefono || '',
      fecha_nacimiento:
        values.fecha_nacimiento || user?.user_metadata?.fecha_nacimiento || null,
      fecha_ingreso: values.fecha_ingreso || null,
      categoria: values.categoria || user?.user_metadata?.categoria || '',
      edad: values.edad ? Number(values.edad) : null,
      peso: values.peso ? Number(values.peso) : null,
      altura: values.altura ? Number(values.altura) : null,
      contacto_emergencia: values.contacto_emergencia || '',
      observaciones: values.observaciones || '',
      plan: 'Basico',
      estado_pago: 'Pendiente',
      monto: 0,
      xp: 0,
      bloques_premium: 0,
      generaciones_disponibles: 6,
    }
  }

  function esErrorSchemaCache(error) {
    return error?.message?.toLowerCase().includes('schema cache')
  }

  async function insertarAlumno(payload) {
    const { error } = await supabase.from('alumnos').insert([payload])

    if (!esErrorSchemaCache(error)) return error

    const payloadCompatible = { ...payload }
    delete payloadCompatible.fecha_nacimiento
    delete payloadCompatible.fecha_ingreso

    const { error: retryError } = await supabase
      .from('alumnos')
      .insert([payloadCompatible])

    return retryError
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

    return insertarAlumno(alumnoPayload(user, values))
  }

  async function iniciarSesionConFicha() {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: form.email,
      password: form.password,
    })

    if (error) {
      setMessage('Correo o contrasena incorrectos')
      return false
    }

    const alumnoError = await asegurarAlumno(data.user)

    if (alumnoError) {
      setMessage(`Ingresaste, pero no se pudo crear la ficha de alumno: ${alumnoError.message}`)
      return false
    }

    await onLogin?.(data.user)
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
          fecha_nacimiento: form.fecha_nacimiento,
          fecha_ingreso: form.fecha_ingreso,
          categoria: form.categoria,
        },
      },
    })

    if (error) {
      if (error.message.toLowerCase().includes('already registered')) {
        const ok = await iniciarSesionConFicha()

        if (!ok) {
          setMessage(
            'Ese correo ya existe. Usa Recuperar o modificar contrasena para volver a entrar.'
          )
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
        ? 'Cuenta creada. Ahora inicia sesion.'
        : 'Cuenta creada. Si Supabase pide confirmacion, revisa el correo antes de iniciar sesion.'
    )
    setMode('login')
  }

  async function recuperarPassword() {
    if (!form.email) {
      setMessage('Ingresa tu correo para enviarte el enlace de recuperacion.')
      return
    }

    const { error } = await supabase.auth.resetPasswordForEmail(form.email, {
      redirectTo: window.location.origin,
    })

    if (error) {
      setMessage(error.message)
      return
    }

    setMessage('Te enviamos un correo para recuperar o modificar tu contrasena.')
  }

  async function actualizarPassword() {
    if (!form.password || form.password.length < 6) {
      setMessage('La nueva contrasena debe tener al menos 6 caracteres.')
      return
    }

    const { error } = await supabase.auth.updateUser({
      password: form.password,
    })

    if (error) {
      setMessage(error.message)
      return
    }

    setMessage('Contrasena actualizada. Ya puedes ingresar a PowerFit.')
    onPasswordUpdated?.()
    await onLogin?.()
  }

  async function handleAuth(e) {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    if (mode === 'reset') {
      await recuperarPassword()
      setLoading(false)
      return
    }

    if (mode === 'update_password') {
      await actualizarPassword()
      setLoading(false)
      return
    }

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
          {mode === 'update_password' && (
            <div className="bg-black/40 border border-yellow-500 rounded-2xl p-4 text-center">
              <p className="font-black text-yellow-400">Nueva contrasena</p>
              <p className="text-sm text-zinc-300 mt-1">
                Escribe una nueva contrasena para recuperar el acceso.
              </p>
            </div>
          )}

          {mode === 'register' && (
            <>
              <Input label="Nombre completo" value={form.nombre} onChange={(v) => update('nombre', v)} />
              <Input label="Telefono" value={form.telefono} onChange={(v) => update('telefono', v)} />
              <Input type="date" label="Fecha de nacimiento" value={form.fecha_nacimiento} onChange={(v) => update('fecha_nacimiento', v)} />
              <Input type="date" label="Fecha ingreso" value={form.fecha_ingreso} onChange={(v) => update('fecha_ingreso', v)} />
              <Input label="Categoria" value={form.categoria} onChange={(v) => update('categoria', v)} />
              <Input type="number" label="Edad" value={form.edad} onChange={(v) => update('edad', v)} />
              <Input type="number" label="Peso kg" value={form.peso} onChange={(v) => update('peso', v)} />
              <Input type="number" label="Altura cm" value={form.altura} onChange={(v) => update('altura', v)} />
              <Input label="Contacto emergencia" value={form.contacto_emergencia} onChange={(v) => update('contacto_emergencia', v)} />
              <textarea
                placeholder="Observaciones medicas / lesiones"
                value={form.observaciones}
                onChange={(e) => update('observaciones', e.target.value)}
                className="w-full p-4 rounded-2xl bg-zinc-800"
              />
            </>
          )}

          {mode !== 'update_password' && (
            <Input type="email" label="Correo" value={form.email} onChange={(v) => update('email', v)} />
          )}

          {mode !== 'reset' && (
            <Input
              type="password"
              label={mode === 'update_password' ? 'Nueva contrasena' : 'Contrasena'}
              value={form.password}
              onChange={(v) => update('password', v)}
            />
          )}

          <button className="w-full bg-red-600 p-4 rounded-2xl font-black">
            {loading
              ? 'Cargando...'
              : mode === 'login'
                ? 'Ingresar'
                : mode === 'register'
                  ? 'Crear cuenta'
                  : mode === 'reset'
                    ? 'Enviar correo de recuperacion'
                    : 'Guardar nueva contrasena'}
          </button>
        </form>

        {message && <p className="text-yellow-400 text-center mt-4">{message}</p>}

        {mode !== 'update_password' && (
          <div className="mt-6 grid gap-3">
            <button
              onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
              className="w-full text-red-400 underline"
            >
              {mode === 'login' ? 'Crear cuenta nueva' : 'Ya tengo cuenta'}
            </button>

            <button
              onClick={() => setMode(mode === 'reset' ? 'login' : 'reset')}
              className="w-full text-yellow-400 underline"
            >
              {mode === 'reset' ? 'Volver al ingreso' : 'Recuperar o modificar contrasena'}
            </button>
          </div>
        )}
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
      required={
        label === 'Correo' ||
        label === 'Contrasena' ||
        label === 'Nueva contrasena' ||
        label === 'Nombre completo'
      }
    />
  )
}
