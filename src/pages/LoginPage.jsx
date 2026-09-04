import { useState } from 'react'
import { DEFAULT_BRANDING, loadBranding } from '../appConfig'
import { supabase } from '../supabase'

const POWERFIT_APP_URL =
  import.meta.env.VITE_POWERFIT_APP_URL || 'https://powerfit-app-cv9o.vercel.app'

export default function LoginPage({
  onLogin,
  initialMode = 'login',
  onPasswordUpdated,
}) {
  const [branding] = useState(() => loadBranding())
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

  async function asegurarIdentidad(values = form) {
    const { data, error } = await supabase.rpc('ensure_powerfit_self_profile', {
      p_nombre: values.nombre || null,
      p_telefono: values.telefono || null,
      p_fecha_nacimiento: values.fecha_nacimiento || null,
      p_contacto_emergencia: values.contacto_emergencia || null,
      p_categoria: values.categoria || null,
    })

    if (error) return { error, shell: null }
    if (data?.shell) return { error: null, shell: data.shell }

    const { data: shellData, error: shellError } = await supabase.rpc(
      'get_powerfit_user_shell'
    )

    return { error: shellError, shell: shellData || null }
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

    const identidad = await asegurarIdentidad()

    if (identidad.error) {
      await supabase.auth.signOut()
      setMessage(`No se pudo iniciar PowerFit de forma segura: ${identidad.error.message}`)
      return false
    }

    await onLogin?.(data.user, identidad.shell)
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
      const identidad = await asegurarIdentidad()
      if (identidad.error) {
        setMessage(`Cuenta creada, pero no se pudo iniciar la ficha segura: ${identidad.error.message}`)
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
      redirectTo: POWERFIT_APP_URL,
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

    const identidad = await asegurarIdentidad()

    if (identidad.error) {
      setMessage(`Contrasena actualizada, pero PowerFit no pudo iniciar la ficha segura: ${identidad.error.message}`)
      return
    }

    setMessage('Contrasena actualizada. Ya puedes ingresar a PowerFit.')
    onPasswordUpdated?.()
    await onLogin?.(undefined, identidad.shell)
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
          src={branding.logoUrl || DEFAULT_BRANDING.logoUrl}
          alt={branding.appName || DEFAULT_BRANDING.appName}
          className="mx-auto h-40 w-40 sm:h-48 sm:w-48 rounded-full object-cover border border-red-600"
        />
        <h1 className="text-4xl font-black text-red-500 text-center mt-5">
          {branding.appName || DEFAULT_BRANDING.appName}
        </h1>
        <p className="text-center text-xs text-zinc-500 font-black mt-2">
          Desarrollado con PowerFit 360
        </p>

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

          <button disabled={loading} className="w-full bg-red-600 p-4 rounded-2xl font-black disabled:opacity-50">
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
