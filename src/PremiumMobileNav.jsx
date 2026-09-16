import { useEffect, useMemo, useState } from 'react'
import { supabase } from './supabase'

const STUDENT_PRIMARY = [
  { label: 'Inicio', aliases: ['Asistencia QR', 'QR attendance'] },
  { label: 'CPS', aliases: ['Mi Camino', 'My Path'] },
  { label: 'QR', aliases: ['Asistencia QR', 'QR attendance'] },
  { label: 'Ficha', aliases: ['Ficha personal', 'Personal profile'] },
]

const ADMIN_PRIMARY = [
  { label: 'Inicio', aliases: ['ADMIN ALUMNOS', 'STUDENTS ADMIN'] },
  { label: 'Alumnos', aliases: ['ADMIN ALUMNOS', 'STUDENTS ADMIN'] },
  { label: 'QR', aliases: ['Asistencia QR', 'QR attendance'] },
  { label: 'CPS', aliases: ['Graduaciones', 'Graduations', 'Mi Camino', 'My Path'] },
]

function normalize(text) {
  return String(text || '').trim().toLowerCase()
}

function findButton(aliases) {
  const nav = document.querySelector('[data-nav-items]')
  if (!nav) return null
  const buttons = [...nav.querySelectorAll('button')]
  return buttons.find((button) => aliases.some((alias) => normalize(button.textContent) === normalize(alias))) || null
}

function ageFromBirth(value) {
  if (!value) return '-'
  const birth = new Date(`${String(value).slice(0, 10)}T12:00:00`)
  if (Number.isNaN(birth.getTime())) return '-'
  const now = new Date()
  let age = now.getFullYear() - birth.getFullYear()
  const month = now.getMonth() - birth.getMonth()
  if (month < 0 || (month === 0 && now.getDate() < birth.getDate())) age -= 1
  return age >= 0 ? age : '-'
}

function Field({ label, value, onChange, type = 'text', multiline = false }) {
  const shared = 'w-full rounded-2xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-white outline-none focus:border-red-500'
  return (
    <label className="grid gap-2 text-sm font-black text-zinc-300">
      <span>{label}</span>
      {multiline ? (
        <textarea value={value ?? ''} onChange={(e) => onChange(e.target.value)} className={`${shared} min-h-24`} />
      ) : (
        <input type={type} value={value ?? ''} onChange={(e) => onChange(e.target.value)} className={shared} />
      )}
    </label>
  )
}

function PremiumStudentEditor({ onClose }) {
  const [students, setStudents] = useState([])
  const [query, setQuery] = useState('')
  const [selectedId, setSelectedId] = useState('')
  const [draft, setDraft] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      const { data, error } = await supabase.rpc('get_powerfit_student_directory_full_secure')
      if (cancelled) return
      if (error) {
        setMessage(`No se pudo cargar alumnos: ${error.message}`)
        setStudents([])
      } else {
        const rows = data?.students || []
        setStudents(rows)
        if (rows[0]?.id) setSelectedId(String(rows[0].id))
      }
      setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [])

  const filtered = useMemo(() => {
    const q = normalize(query)
    if (!q) return students
    return students.filter((student) => normalize([student.nombre, student.rut, student.telefono, student.email].join(' ')).includes(q))
  }, [students, query])

  useEffect(() => {
    const selected = students.find((student) => String(student.id) === String(selectedId))
    setDraft(selected ? {
      id: selected.id,
      nombre: selected.nombre || '',
      rut: selected.rut || '',
      telefono: selected.telefono || '',
      fecha_nacimiento: selected.fecha_nacimiento || '',
      peso: selected.peso ?? '',
      altura: selected.altura ?? '',
      contacto_emergencia: selected.contacto_emergencia || '',
      observaciones: selected.observaciones || '',
    } : null)
    setMessage('')
  }, [selectedId, students])

  async function save() {
    if (!draft?.id || saving) return
    setSaving(true)
    setMessage('')
    const original = students.find((student) => String(student.id) === String(draft.id)) || {}
    const fields = ['nombre', 'rut', 'telefono', 'fecha_nacimiento', 'peso', 'altura', 'contacto_emergencia', 'observaciones']

    for (const field of fields) {
      const nextValue = draft[field] === '' ? null : draft[field]
      const previousValue = original[field] === '' ? null : original[field]
      if (String(nextValue ?? '') === String(previousValue ?? '')) continue
      const { error } = await supabase.rpc('update_powerfit_student_field_admin_secure', {
        p_alumno_id: draft.id,
        p_field: field,
        p_value: nextValue,
        p_reason: 'Edicion ficha premium movil',
      })
      if (error) {
        setMessage(`No se pudo guardar ${field}: ${error.message}`)
        setSaving(false)
        return
      }
    }

    setStudents((current) => current.map((student) => String(student.id) === String(draft.id) ? { ...student, ...draft, edad: ageFromBirth(draft.fecha_nacimiento) } : student))
    setMessage('Ficha guardada correctamente.')
    setSaving(false)
  }

  return (
    <div className="premium-sheet premium-editor" role="dialog" aria-modal="true" aria-label="Editor premium de alumno">
      <div className="premium-sheet-card">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-red-400">PowerFit 360</p>
            <h2 className="mt-1 text-2xl font-black text-white">Ficha de alumno</h2>
            <p className="mt-1 text-sm text-zinc-400">Edición rápida, sólo datos esenciales.</p>
          </div>
          <button type="button" onClick={onClose} className="premium-close">Cerrar</button>
        </div>

        {loading ? <p className="py-8 text-center text-zinc-400">Cargando alumnos...</p> : (
          <>
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar por nombre, RUT o teléfono" className="premium-search mt-5" />
            <select value={selectedId} onChange={(e) => setSelectedId(e.target.value)} className="premium-search mt-3">
              {filtered.map((student) => <option key={student.id} value={student.id}>{student.nombre || `Alumno #${student.id}`}</option>)}
            </select>

            {draft && (
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <Field label="Nombre completo" value={draft.nombre} onChange={(v) => setDraft((d) => ({ ...d, nombre: v }))} />
                <Field label="RUT" value={draft.rut} onChange={(v) => setDraft((d) => ({ ...d, rut: v }))} />
                <Field label="Teléfono" value={draft.telefono} onChange={(v) => setDraft((d) => ({ ...d, telefono: v }))} />
                <Field label="Fecha de nacimiento" type="date" value={String(draft.fecha_nacimiento || '').slice(0, 10)} onChange={(v) => setDraft((d) => ({ ...d, fecha_nacimiento: v }))} />
                <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
                  <p className="text-xs font-black uppercase text-zinc-500">Edad automática</p>
                  <p className="mt-1 text-2xl font-black text-white">{ageFromBirth(draft.fecha_nacimiento)} años</p>
                </div>
                <Field label="Peso (kg)" type="number" value={draft.peso} onChange={(v) => setDraft((d) => ({ ...d, peso: v }))} />
                <Field label="Estatura (cm)" type="number" value={draft.altura} onChange={(v) => setDraft((d) => ({ ...d, altura: v }))} />
                <Field label="Contacto de emergencia" value={draft.contacto_emergencia} onChange={(v) => setDraft((d) => ({ ...d, contacto_emergencia: v }))} />
                <div className="sm:col-span-2"><Field label="Observaciones" multiline value={draft.observaciones} onChange={(v) => setDraft((d) => ({ ...d, observaciones: v }))} /></div>
              </div>
            )}

            {message && <div className={`mt-4 rounded-2xl p-4 font-black ${message.startsWith('Ficha') ? 'bg-green-600/20 text-green-300' : 'bg-red-600/20 text-red-300'}`}>{message}</div>}
            <button type="button" disabled={!draft || saving} onClick={save} className="premium-primary mt-5 w-full">{saving ? 'Guardando...' : 'Guardar ficha'}</button>
          </>
        )}
      </div>
    </div>
  )
}

export default function PremiumMobileNav() {
  const [visible, setVisible] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [moreOpen, setMoreOpen] = useState(false)
  const [editorOpen, setEditorOpen] = useState(false)
  const [navButtons, setNavButtons] = useState([])

  useEffect(() => {
    let frame = null
    const sync = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const nav = document.querySelector('[data-nav-items]')
        const buttons = nav ? [...nav.querySelectorAll('button')].filter((button) => !button.disabled) : []
        setVisible(Boolean(nav))
        setNavButtons(buttons.map((button) => button.textContent.trim()).filter(Boolean))
        setIsAdmin(buttons.some((button) => ['admin alumnos', 'students admin'].includes(normalize(button.textContent))))
      })
    }
    sync()
    const observer = new MutationObserver(sync)
    observer.observe(document.body, { childList: true, subtree: true, attributes: true })
    window.addEventListener('resize', sync)
    return () => {
      observer.disconnect()
      window.removeEventListener('resize', sync)
      cancelAnimationFrame(frame)
    }
  }, [])

  const primary = isAdmin ? ADMIN_PRIMARY : STUDENT_PRIMARY

  function openAliases(aliases) {
    const button = findButton(aliases)
    if (button) {
      button.click()
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
    setMoreOpen(false)
  }

  function openByText(text) {
    const nav = document.querySelector('[data-nav-items]')
    const button = nav ? [...nav.querySelectorAll('button')].find((item) => item.textContent.trim() === text) : null
    if (button) {
      button.click()
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
    setMoreOpen(false)
  }

  if (!visible) return null

  return (
    <>
      <nav className="premium-mobile-nav" aria-label="Navegación principal móvil">
        {primary.map((item, index) => (
          <button key={`${item.label}-${index}`} type="button" onClick={() => openAliases(item.aliases)} className="premium-mobile-nav-button">
            <span className="premium-nav-dot" />
            <span>{item.label}</span>
          </button>
        ))}
        <button type="button" onClick={() => setMoreOpen(true)} className="premium-mobile-nav-button">
          <span className="premium-nav-more">•••</span>
          <span>Más</span>
        </button>
      </nav>

      {moreOpen && (
        <div className="premium-sheet" role="dialog" aria-modal="true" aria-label="Más opciones">
          <div className="premium-sheet-card premium-more-card">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-red-400">PowerFit 360</p>
                <h2 className="mt-1 text-2xl font-black">Más opciones</h2>
              </div>
              <button type="button" onClick={() => setMoreOpen(false)} className="premium-close">Cerrar</button>
            </div>

            {isAdmin && (
              <button type="button" onClick={() => { setMoreOpen(false); setEditorOpen(true) }} className="premium-feature-action mt-5">
                <span>
                  <strong>Editar ficha alumno</strong>
                  <small>RUT, edad, peso, estatura, emergencia y observaciones</small>
                </span>
                <b>→</b>
              </button>
            )}

            <div className="premium-more-grid mt-5">
              {navButtons.map((text) => (
                <button key={text} type="button" onClick={() => openByText(text)}>{text}</button>
              ))}
            </div>
          </div>
        </div>
      )}

      {editorOpen && isAdmin && <PremiumStudentEditor onClose={() => setEditorOpen(false)} />}
    </>
  )
}
