import { useEffect, useState } from 'react'
import { supabase } from '../supabase'

const EMPTY = {
  nombre: '',
  telefono: '',
  fecha_nacimiento: '',
  peso: '',
  altura: '',
  contacto_emergencia: '',
  observaciones: '',
}

function initialForm(student) {
  return {
    nombre: student?.nombre || '',
    telefono: student?.telefono || '',
    fecha_nacimiento: student?.fecha_nacimiento || '',
    peso: student?.peso ?? '',
    altura: student?.altura ?? '',
    contacto_emergencia: student?.contacto_emergencia || '',
    observaciones: student?.observaciones || '',
  }
}

export default function SelfProfileEditor({ student, onSaved }) {
  const [form, setForm] = useState(() => initialForm(student))
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    setForm(student ? initialForm(student) : EMPTY)
  }, [student])

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
    setMessage('')
    setError('')
  }

  async function save(event) {
    event.preventDefault()
    setSaving(true)
    setMessage('')
    setError('')

    try {
      const patch = {
        nombre: form.nombre.trim(),
        telefono: form.telefono.trim(),
        fecha_nacimiento: form.fecha_nacimiento || null,
        peso: form.peso === '' ? null : Number(form.peso),
        altura: form.altura === '' ? null : Number(form.altura),
        contacto_emergencia: form.contacto_emergencia.trim(),
        observaciones: form.observaciones.trim(),
      }

      const { error: rpcError } = await supabase.rpc(
        'update_powerfit_self_profile_secure',
        { p_patch: patch },
      )

      if (rpcError) throw rpcError

      setMessage('Datos actualizados correctamente.')
      await onSaved?.()
    } catch (saveError) {
      const text = String(saveError?.message || saveError || 'No se pudo actualizar la ficha.')
      if (text.includes('INVALID_WEIGHT')) setError('El peso debe estar entre 20 y 350 kg.')
      else if (text.includes('INVALID_HEIGHT')) setError('La estatura debe estar entre 80 y 250 cm.')
      else if (text.includes('INVALID_BIRTH_DATE')) setError('Revisa la fecha de nacimiento.')
      else if (text.includes('NAME_REQUIRED')) setError('El nombre no puede quedar vacío.')
      else setError(text)
    } finally {
      setSaving(false)
    }
  }

  return (
    <form
      onSubmit={save}
      className="mt-6 rounded-2xl border border-cyan-800 bg-black/40 p-4 sm:p-5"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-400">
            Editar mis datos
          </p>
          <h3 className="mt-1 text-2xl font-black text-white">Ficha actualizable</h3>
          <p className="mt-2 text-sm text-zinc-400">
            Puedes mantener actualizados tus datos personales y deportivos. El RUT,
            pagos, rol y permisos permanecen protegidos por administración.
          </p>
        </div>
        <div className="rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm">
          <span className="text-zinc-500">RUT protegido</span>
          <strong className="ml-2 text-zinc-200">{student?.rut || 'Sin RUT'}</strong>
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        <label className="grid gap-1 text-sm font-black text-zinc-300">
          Nombre completo
          <input
            value={form.nombre}
            onChange={(e) => update('nombre', e.target.value)}
            className="rounded-xl border border-zinc-700 bg-zinc-950 p-3 text-white"
            autoComplete="name"
            required
          />
        </label>

        <label className="grid gap-1 text-sm font-black text-zinc-300">
          Teléfono
          <input
            value={form.telefono}
            onChange={(e) => update('telefono', e.target.value)}
            className="rounded-xl border border-zinc-700 bg-zinc-950 p-3 text-white"
            autoComplete="tel"
            inputMode="tel"
          />
        </label>

        <label className="grid gap-1 text-sm font-black text-zinc-300">
          Fecha de nacimiento
          <input
            type="date"
            value={form.fecha_nacimiento}
            onChange={(e) => update('fecha_nacimiento', e.target.value)}
            className="rounded-xl border border-zinc-700 bg-zinc-950 p-3 text-white"
          />
        </label>

        <label className="grid gap-1 text-sm font-black text-zinc-300">
          Contacto de emergencia
          <input
            value={form.contacto_emergencia}
            onChange={(e) => update('contacto_emergencia', e.target.value)}
            className="rounded-xl border border-zinc-700 bg-zinc-950 p-3 text-white"
            placeholder="Nombre y/o teléfono"
          />
        </label>

        <label className="grid gap-1 text-sm font-black text-zinc-300">
          Peso (kg)
          <input
            type="number"
            min="20"
            max="350"
            step="0.1"
            value={form.peso}
            onChange={(e) => update('peso', e.target.value)}
            className="rounded-xl border border-zinc-700 bg-zinc-950 p-3 text-white"
            inputMode="decimal"
          />
        </label>

        <label className="grid gap-1 text-sm font-black text-zinc-300">
          Estatura (cm)
          <input
            type="number"
            min="80"
            max="250"
            step="0.1"
            value={form.altura}
            onChange={(e) => update('altura', e.target.value)}
            className="rounded-xl border border-zinc-700 bg-zinc-950 p-3 text-white"
            inputMode="decimal"
          />
        </label>

        <label className="grid gap-1 text-sm font-black text-zinc-300 md:col-span-2">
          Observaciones
          <textarea
            value={form.observaciones}
            onChange={(e) => update('observaciones', e.target.value)}
            className="min-h-28 rounded-xl border border-zinc-700 bg-zinc-950 p-3 text-white"
            placeholder="Información útil para tu entrenamiento o para el coach."
          />
        </label>
      </div>

      {message && (
        <div className="mt-4 rounded-xl border border-green-700 bg-green-950/50 p-3 font-black text-green-300">
          {message}
        </div>
      )}
      {error && (
        <div className="mt-4 rounded-xl border border-red-700 bg-red-950/50 p-3 font-black text-red-300">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={saving}
        className="mt-4 w-full rounded-2xl bg-cyan-600 p-4 font-black text-white hover:bg-cyan-700 disabled:opacity-50"
      >
        {saving ? 'Guardando...' : 'Guardar mis datos'}
      </button>
    </form>
  )
}
