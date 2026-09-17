import { useState } from 'react'
import { DEFAULT_BRANDING, loadBranding } from '../appConfig'
import { supabase } from '../supabase'

const POWERFIT_APP_URL =
  import.meta.env.VITE_POWERFIT_APP_URL || 'https://powerfit-app-cv9o.vercel.app'

function normalizeRut(value = '') {
  const clean = String(value).toUpperCase().replace(/[^0-9K]/g, '')
  if (clean.length < 2) return clean
  return `${clean.slice(0, -1)}-${clean.slice(-1)}`
}

function validateRut(value = '') {
  const normalized = normalizeRut(value)
  const [body, dv] = normalized.split('-')
  if (!/^\d{6,8}$/.test(body || '') || !/^[0-9K]$/.test(dv || '')) return false

  let sum = 0
  let factor = 2
  for (let i = body.length - 1; i >= 0; i -= 1) {
    sum += Number(body[i]) * factor
    factor = factor === 7 ? 2 : factor + 1
  }

  const result = 11 - (sum % 11)
  const expected = result === 11 ? '0' : result === 10 ? 'K' : String(result)
  return dv === expected
}

function calculateAge(value) {
  if (!value) return null
  const birth = new Date(`${value}T12:00:00`)
  if (Number.isNaN(birth.getTime())) return null
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const month = today.getMonth() - birth.getMonth()
  if (month < 0 || (month === 0 && today.getDate() < birth.getDate())) age -= 1
  return age >= 0 ? age : null
}

function friendlyProfileError(error) {
  const message = String(error?.message || error || '')
  if (message.includes('INVALID_RUT')) return 'El RUT no es válido.'
  if (message.includes('INVALID_BIRTH_DATE')) return 'La fecha de nacimiento no es válida.'
  if (message.includes('INVALID_WEIGHT')) return 'El peso debe estar entre 20 y 350 kg.'
  if (message.includes('INVALID_HEIGHT')) return 'La estatura debe estar entre 80 y 250 cm.'
  return message || 'No se pudo completar la operación.'
}

export default function LoginPage({
  onLogin,
  initialMode = 'login',
  onPasswordUpdated,
}) {
  const [branding] = useState(() => loadBranding())
  const [mode, setMode] = useState(initialMode)
  const [form, setForm] = useState({
    nombre: '',
    rut: '',
    email: '',
    password: '',
    telefono: '',
    fecha_nacimiento: '',
    peso: '',
    altura: '',
    contacto_emergencia: '',
    observaciones: '',
  })
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const edadCalculada = calculateAge(form.fecha_nacimiento)

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  async function asegurarIdentidad(values = form) {
    const { data, error } = await supabase.rpc('ensure_powerfit_self_profile', {
      p_nombre: values.nombre || null,
      p_telefono: values.telefono || null,
      p_fecha_nacimiento: values.fecha_nacimiento || null,
      p_contacto_emergencia: values.contacto_emergencia || null,
      p_categoria: null,
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
      email: form.email.trim(),
      password: form.password,
    })

    if (error) {
      setMessage('Correo o contraseña incorrectos.')
      return false
    }

    const identidad = await asegurarIdentidad()
    if (identidad.error) {
      await supabase.auth.signOut()
      setMessage(`No se pudo iniciar PowerFit: ${friendlyProfileError(identidad.error)}`)
      return false
    }

    await onLogin?.(data.user, identidad.shell)
    return true
  }

  function validarRegistro() {
    if (!form.nombre.trim()) return 'Ingresa el nombre completo.'
    if (!validateRut(form.rut)) return 'Ingresa un RUT chileno válido.'
    if (!form.telefono.trim()) return 'Ingresa un número telefónico.'
    if (edadCalculada === null) return 'Ingresa una fecha de nacimiento válida.'

    const peso = Number(form.peso)
    const altura = Number(form.altura)
    if (!peso || peso < 20 || peso > 350) return 'Ingresa un peso válido entre 20 y 350 kg.'
    if (!altura || altura < 80 || altura > 250) return 'Ingresa una estatura válida entre 80 y 250 cm.'
    if (!form.contacto_emergencia.trim()) return 'Ingresa un número o contacto de emergencia.'
    if (!form.email.trim()) return 'Ingresa un correo.'
    if (!form.password || form.password.length < 6) return 'La contraseña debe tener al menos 6 caracteres.'
    return null
  }

  async function registrarCuenta() {
    const validation = validarRegistro()
    if (validation) {
      setMessage(validation)
      return
    }

    const metadata = {
      nombre: form.nombre.trim(),
      rut: normalizeRut(form.rut),
      telefono: form.telefono.trim(),
      fecha_nacimiento: form.fecha_nacimiento,
      peso: Number(form.peso),
      altura: Number(form.altura),
      contacto_emergencia: form.contacto_emergencia.trim(),
      observaciones: form.observaciones.trim(),
    }

    const { data, error } = await supabase.auth.signUp({
      email: form.email.trim(),
      password: form.password,
      options: { data: metadata },
    })

    if (error) {
      if (error.message.toLowerCase().includes('already registered')) {
        const ok = await iniciarSesionConFicha()
        if (!ok) {
          setMessage('Ese correo ya existe. Usa Recuperar o modificar contraseña para volver a entrar.')
        }
        return
      }
      setMessage(friendlyProfileError(error))
      return
    }

    if (data?.user && data?.session) {
      const identidad = await asegurarIdentidad(metadata)
      if (identidad.error) {
        setMessage(`Cuenta creada, pero no se pudo iniciar la ficha: ${friendlyProfileError(identidad.error)}`)
        return
      }
    }

    setMessage(
      data?.session
        ? 'Cuenta creada. Ahora inicia sesión.'
        : 'Cuenta creada. Si se solicita confirmación, revisa tu correo antes de iniciar sesión.'
    )
    setMode('login')
  }

  async function recuperarPassword() {
    if (!form.email.trim()) {
      setMessage('Ingresa tu correo para enviarte el enlace de recuperación.')
      return
    }

    const { error } = await supabase.auth.resetPasswordForEmail(form.email.trim(), {
      redirectTo: POWERFIT_APP_URL,
    })

    setMessage(error ? friendlyProfileError(error) : 'Te enviamos un correo para recuperar o modificar tu contraseña.')
  }

  async function actualizarPassword() {
    if (!form.password || form.password.length < 6) {
      setMessage('La nueva contraseña debe tener al menos 6 caracteres.')
      return
    }

    const { error } = await supabase.auth.updateUser({ password: form.password })
    if (error) {
      setMessage(friendlyProfileError(error))
      return
    }

    const identidad = await asegurarIdentidad()
    if (identidad.error) {
      setMessage(`Contraseña actualizada, pero PowerFit no pudo iniciar la ficha: ${friendlyProfileError(identidad.error)}`)
      return
    }

    setMessage('Contraseña actualizada. Ya puedes ingresar a PowerFit.')
    onPasswordUpdated?.()
    await onLogin?.(undefined, identidad.shell)
  }

  async function handleAuth(event) {
    event.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      if (mode === 'reset') await recuperarPassword()
      else if (mode === 'update_password') await actualizarPassword()
      else if (mode === 'register') await registrarCuenta()
      else await iniciarSesionConFicha()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-3 py-5 sm:p-6">
      <div className="w-full max-w-2xl bg-zinc-900 border border-red-600 rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-2xl">
        <img
          src={branding.logoUrl || DEFAULT_BRANDING.logoUrl}
          alt={branding.appName || DEFAULT_BRANDING.appName}
          className="mx-auto h-28 w-28 sm:h-40 sm:w-40 rounded-full object-cover border border-red-600"
        />
        <h1 className="text-3xl sm:text-4xl font-black text-red-500 text-center mt-4">
          {branding.appName || DEFAULT_BRANDING.appName}
        </h1>
        <p className="text-center text-xs text-zinc-500 font-black mt-2">Desarrollado con PowerFit 360</p>

        <form onSubmit={handleAuth} className="space-y-4 mt-6">
          {mode === 'register' && (
            <div className="rounded-2xl border border-zinc-700 bg-black/30 p-4">
              <h2 className="text-xl font-black text-yellow-400">Crear ficha de alumno</h2>
              <p className="mt-1 text-sm text-zinc-400">Sólo pedimos los datos necesarios. La fecha de ingreso se registra automáticamente.</p>
            </div>
          )}

          {mode === 'update_password' && (
            <div className="rounded-2xl border border-yellow-500 bg-black/40 p-4 text-center">
              <p className="font-black text-yellow-400">Nueva contraseña</p>
              <p className="text-sm text-zinc-300 mt-1">Escribe una nueva contraseña para recuperar el acceso.</p>
            </div>
          )}

          {mode === 'register' && (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Nombre completo" value={form.nombre} onChange={(v) => update('nombre', v)} required className="sm:col-span-2" autoComplete="name" />
              <Field label="RUT" value={form.rut} onChange={(v) => update('rut', v)} required placeholder="12.345.678-5" inputMode="text" />
              <Field label="Número telefónico" value={form.telefono} onChange={(v) => update('telefono', v)} required type="tel" autoComplete="tel" />
              <Field label="Fecha de nacimiento" value={form.fecha_nacimiento} onChange={(v) => update('fecha_nacimiento', v)} required type="date" />
              <div className="rounded-2xl border border-zinc-700 bg-zinc-950 p-4">
                <p className="text-sm font-bold text-zinc-400">Edad calculada</p>
                <p className="mt-1 text-xl font-black text-white">{edadCalculada === null ? '—' : `${edadCalculada} años`}</p>
              </div>
              <Field label="Peso (kg)" value={form.peso} onChange={(v) => update('peso', v)} required type="number" min="20" max="350" step="0.1" />
              <Field label="Estatura (cm)" value={form.altura} onChange={(v) => update('altura', v)} required type="number" min="80" max="250" step="0.1" />
              <Field label="Contacto o número de emergencia" value={form.contacto_emergencia} onChange={(v) => update('contacto_emergencia', v)} required className="sm:col-span-2" />
              <label className="sm:col-span-2 grid gap-2">
                <span className="text-sm font-black text-zinc-300">Observaciones <span className="font-normal text-zinc-500">(opcional)</span></span>
                <textarea
                  value={form.observaciones}
                  onChange={(event) => update('observaciones', event.target.value)}
                  placeholder="Lesiones, restricciones, antecedentes relevantes u otra observación"
                  rows={3}
                  className="w-full rounded-2xl border border-zinc-700 bg-zinc-800 p-4 outline-none focus:border-red-500"
                />
              </label>
            </div>
          )}

          {mode !== 'update_password' && (
            <Field type="email" label="Correo" value={form.email} onChange={(v) => update('email', v)} required autoComplete="email" />
          )}

          {mode !== 'reset' && (
            <Field
              type="password"
              label={mode === 'update_password' ? 'Nueva contraseña' : 'Contraseña'}
              value={form.password}
              onChange={(v) => update('password', v)}
              required
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            />
          )}

          <button disabled={loading} className="w-full bg-red-600 hover:bg-red-700 p-4 rounded-2xl font-black text-lg disabled:opacity-50">
            {loading
              ? 'Procesando...'
              : mode === 'login'
                ? 'Ingresar'
                : mode === 'register'
                  ? 'Crear cuenta'
                  : mode === 'reset'
                    ? 'Enviar correo de recuperación'
                    : 'Guardar nueva contraseña'}
          </button>
        </form>

        {message && (
          <p className="mt-4 rounded-2xl border border-yellow-700 bg-yellow-950/40 p-4 text-center font-bold text-yellow-300">
            {message}
          </p>
        )}

        {mode !== 'update_password' && (
          <div className="mt-6 grid gap-3">
            <button type="button" onClick={() => setMode(mode === 'login' ? 'register' : 'login')} className="w-full text-red-400 underline">
              {mode === 'login' ? 'Crear cuenta nueva' : 'Ya tengo cuenta'}
            </button>
            <button type="button" onClick={() => setMode(mode === 'reset' ? 'login' : 'reset')} className="w-full text-yellow-400 underline">
              {mode === 'reset' ? 'Volver al ingreso' : 'Recuperar o modificar contraseña'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  required = false,
  className = '',
  placeholder,
  ...props
}) {
  return (
    <label className={`grid gap-2 ${className}`}>
      <span className="text-sm font-black text-zinc-300">{label}</span>
      <input
        {...props}
        type={type}
        value={value}
        required={required}
        placeholder={placeholder || label}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-2xl border border-zinc-700 bg-zinc-800 p-4 outline-none focus:border-red-500"
      />
    </label>
  )
}
