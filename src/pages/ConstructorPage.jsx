import { useMemo, useState } from 'react'
import { supabase } from '../supabase'
import { buildConstructorFundamentos } from './trainingKnowledge'

const TEXT = {
  es: {
    title: 'CONSTRUCTOR POWERFIT',
    subtitle:
      'Crea una planificacion manual usando los bloques del metodo PowerFit 360.',
    objective: 'Objetivo',
    macro: 'Macro',
    phase: 'Fase ATR',
    level: 'Nivel',
    sessionName: 'Nombre de la sesion',
    addExercise: 'Agregar ejercicio',
    save: 'Crear y guardar en rutinas',
    download: 'Crear y descargar Word',
    preview: 'Vista previa',
    saved: 'Planificacion creada. Se desconto 1 generacion disponible.',
    downloaded: 'Planificacion creada y descargada. Se desconto 1 generacion disponible.',
    saveError: 'No se pudo crear la planificacion. Intenta nuevamente.',
    noAvailable: 'No tienes generaciones disponibles para crear una planificacion.',
    available: 'Generaciones disponibles',
    max: 'Max',
    method: 'Metodo',
    duration: 'Duracion',
    exercise: 'Ejercicio',
    series: 'Series',
    reps: 'Reps / tiempo',
    rest: 'Descanso',
    remove: 'Quitar',
  },
  en: {
    title: 'POWERFIT BUILDER',
    subtitle: 'Create a manual plan using the PowerFit 360 block structure.',
    objective: 'Goal',
    macro: 'Macro',
    phase: 'ATR phase',
    level: 'Level',
    sessionName: 'Session name',
    addExercise: 'Add exercise',
    save: 'Create and save to routines',
    download: 'Create and download Word',
    preview: 'Preview',
    saved: 'Plan created. 1 available generation was used.',
    downloaded: 'Plan created and downloaded. 1 available generation was used.',
    saveError: 'Could not create the plan. Please try again.',
    noAvailable: 'You do not have available generations to create a plan.',
    available: 'Available generations',
    max: 'Max',
    method: 'Method',
    duration: 'Duration',
    exercise: 'Exercise',
    series: 'Sets',
    reps: 'Reps / time',
    rest: 'Rest',
    remove: 'Remove',
  },
}

const OBJECTIVES = [
  { value: 'boxeo', label: 'Boxeo / combate' },
  { value: 'tenis', label: 'Tenis' },
  { value: 'fuerza_funcional', label: 'Fuerza funcional' },
  { value: 'acondicionamiento', label: 'Acondicionamiento' },
  { value: 'casa_principiante', label: 'Casa principiante' },
]

const MACROS = [
  { value: 'base_transversal', label: 'Base transversal' },
  { value: 'potencia_rotacional', label: 'Potencia rotacional' },
  { value: 'resistencia_metabolica', label: 'Resistencia metabolica' },
  { value: 'retorno_progresivo', label: 'Retorno progresivo' },
  { value: 'evaluacion_inicial', label: 'Evaluacion inicial' },
  { value: 'sobrecarga_controlada', label: 'Sobrecarga controlada' },
  { value: 'salud_adherencia', label: 'Salud y adherencia' },
]

const PHASES = [
  { value: 'acumulacion', label: 'Acumulacion' },
  { value: 'transformacion', label: 'Transformacion' },
  { value: 'realizacion', label: 'Realizacion' },
]

const LEVELS = [
  { value: 'principiante', label: 'Principiante' },
  { value: 'intermedio', label: 'Intermedio' },
  { value: 'avanzado', label: 'Avanzado' },
]

const BLOCKS = [
  {
    id: 'activacion',
    title: 'Activacion',
    limit: 3,
    method: 'RAMP / movilidad activa',
    duration: '8-12 min',
    purpose: 'Subir temperatura, activar cadenas cruzadas y preparar articulaciones.',
  },
  {
    id: 'motor',
    title: 'Bloque 1 - Motor transversal',
    limit: 4,
    method: 'Calidad tecnica / cadenas cruzadas',
    duration: '12-18 min',
    purpose: 'Aceleracion, coordinacion, efecto serape y transferencia deportiva.',
  },
  {
    id: 'fuerza',
    title: 'Bloque 2 - Fuerza funcional',
    limit: 3,
    method: 'Fuerza + gesto explosivo',
    duration: '18-25 min',
    purpose: 'Fuerza util, fase concentrica explosiva y control postural.',
  },
  {
    id: 'metabolico',
    title: 'Bloque 3 - Sistema metabolico',
    limit: 4,
    method: 'HIIT / AMRAP / EMOM tecnico',
    duration: '8-16 min',
    purpose: 'Capacidad de trabajo sin perder calidad de movimiento.',
  },
  {
    id: 'calma',
    title: 'Vuelta a la calma',
    limit: 3,
    method: 'Movilidad / respiracion',
    duration: '6-10 min',
    purpose: 'Bajar pulsaciones, recuperar rango y cerrar la sesion.',
  },
]

const EXERCISES = {
  activacion: {
    base: [
      'Movilidad de tobillo apoyado en pared',
      'Caminata suave con respiracion nasal',
      'Activacion escapular en pared',
      'Puente de gluteos con pausa',
      'Plancha inclinada en pared o mesa firme',
    ],
    boxeo: [
      'Paso lateral con guardia',
      'Rotacion toracica en guardia',
      'Sombra tecnica suave 1-2',
    ],
    tenis: [
      'Split step suave',
      'Desplazamiento lateral corto',
      'Rotacion cadera-hombro con palo',
    ],
  },
  motor: {
    base: [
      'Pallof press con banda',
      'Lanzamiento rotacional de balon medicinal',
      'Corte diagonal con banda elastica',
      'Bear crawl controlado',
      'Saltos laterales con pausa',
    ],
    boxeo: [
      'Golpe recto con banda elastica',
      'Cross con rotacion de cadera',
      'Slip + paso lateral + golpe',
      'Flexoextension con salto lateral',
    ],
    tenis: [
      'Split step + salida diagonal',
      'Swing shadow con banda',
      'Lanzamiento lateral tipo drive',
      'Freno lateral + salida cruzada',
    ],
  },
  fuerza: {
    base: [
      'Deadlift',
      'Push jerk',
      'Sentadilla goblet',
      'Remo con mancuerna',
      'Fondos o flexiones',
      'Zancada posterior',
    ],
    boxeo: [
      'Push press + golpe con banda',
      'Step up explosivo',
      'Remo unilateral antirotacion',
    ],
    tenis: [
      'Peso muerto rumano unilateral',
      'Press landmine rotacional',
      'Sentadilla lateral',
    ],
    casa_principiante: [
      'Sentadilla a silla',
      'Flexion inclinada en pared',
      'Elevacion de talones apoyado con pausa',
      'Puente de gluteos',
    ],
  },
  metabolico: {
    base: [
      'AMRAP tecnico 8 min',
      'EMOM 10 min',
      'Intervalos 30/30',
      'Circuito funcional por estaciones',
    ],
    boxeo: [
      'Sombra por rounds 3x2 min',
      'Golpes con banda 20/20',
      'Burpee tecnico + desplazamiento',
    ],
    tenis: [
      'Shuttle lateral 15/15',
      'Split step + carrera corta',
      'Circuito de conos en diagonal',
    ],
    casa_principiante: [
      'Caminar por la casa suave',
      'Marcha en el lugar',
      'Step touch bajo impacto',
      'Subir y bajar escalon bajo',
    ],
  },
  calma: {
    base: [
      'Respiracion diafragmatica',
      'Movilidad de cadera 90/90',
      'Estiramiento de cadena posterior',
      'Movilidad toracica en el suelo',
      'Descarga de gemelos en pared',
    ],
  },
}

function getExerciseOptions(blockId, objective) {
  const pool = EXERCISES[blockId] || {}
  return [...(pool.base || []), ...(pool[objective] || [])]
}

function createItem(blockId, objective) {
  const firstExercise = getExerciseOptions(blockId, objective)[0] || 'Ejercicio tecnico'

  return {
    ejercicio: firstExercise,
    series: blockId === 'metabolico' ? '1' : '3',
    reps: blockId === 'calma' ? '45 seg' : blockId === 'metabolico' ? '8-12 min' : '8-10',
    descanso: blockId === 'metabolico' ? 'segun metodo' : '60-90 seg',
  }
}

function createBlocks(objective) {
  return BLOCKS.map((block) => ({
    ...block,
    items: [createItem(block.id, objective)],
  }))
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

function downloadWord(content, studentName) {
  const html = `
    <html>
      <head><meta charset="utf-8" /></head>
      <body>
        <pre style="font-family: Arial; font-size: 14px; white-space: pre-wrap;">
${escapeHtml(content)}
        </pre>
      </body>
    </html>
  `

  const blob = new Blob([html], { type: 'application/msword;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `PowerFit-Manual-${studentName || 'alumno'}-${Date.now()}.doc`
  link.click()
  URL.revokeObjectURL(url)
}

function findLabel(list, value) {
  return list.find((item) => item.value === value)?.label || value
}

function buildPlan({ student, sessionName, objective, macro, phase, level, blocks }) {
  const fundamentos = buildConstructorFundamentos({ objective, macro, phase, level })
  const lines = [
    'POWERFIT 360 - PLANIFICACION MANUAL',
    `Alumno: ${student?.nombre || 'Alumno PowerFit'}`,
    `Sesion: ${sessionName}`,
    `Objetivo: ${findLabel(OBJECTIVES, objective)}`,
    `Macro: ${findLabel(MACROS, macro)}`,
    `Fase ATR: ${findLabel(PHASES, phase)}`,
    `Nivel: ${findLabel(LEVELS, level)}`,
    '',
    'Reglas del metodo:',
    '- Priorizar calidad tecnica antes que volumen.',
    '- Usar fuerza funcional, motor transversal y transferencia deportiva.',
    '- Desde transformacion se integran trabajos pliometricos y potencia.',
    '- Ajustar cargas por RM cuando corresponda y respetar descanso muscular.',
    '',
    'Fundamentos del Manual PowerFit 2026:',
    ...fundamentos.map((fundamento) => `- ${fundamento}`),
    '',
  ]

  blocks.forEach((block) => {
    lines.push(block.title.toUpperCase())
    lines.push(`Metodo: ${block.method}`)
    lines.push(`Duracion: ${block.duration}`)
    lines.push(`Objetivo del bloque: ${block.purpose}`)
    block.items.forEach((item, index) => {
      lines.push(
        `${index + 1}. ${item.ejercicio} - ${item.series} series x ${item.reps} - descanso: ${item.descanso}`,
      )
    })
    lines.push('')
  })

  lines.push('Cierre tecnico:')
  lines.push('Registrar sensacion, carga usada, tiempo total y observaciones del alumno.')
  return lines.join('\n')
}

export default function ConstructorPage({ student, onUpdateStudent, idioma = 'es' }) {
  const t = TEXT[idioma] || TEXT.es
  const [objective, setObjective] = useState('boxeo')
  const [macro, setMacro] = useState('base_transversal')
  const [phase, setPhase] = useState('acumulacion')
  const [level, setLevel] = useState('intermedio')
  const [sessionName, setSessionName] = useState('Sesion PowerFit manual')
  const [blocks, setBlocks] = useState(() => createBlocks('boxeo'))
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  const planText = useMemo(
    () => buildPlan({ student, sessionName, objective, macro, phase, level, blocks }),
    [blocks, level, macro, objective, phase, sessionName, student],
  )

  function changeObjective(nextObjective) {
    setObjective(nextObjective)
    setBlocks(createBlocks(nextObjective))
  }

  function updateBlock(blockId, field, value) {
    setBlocks((current) =>
      current.map((block) => (block.id === blockId ? { ...block, [field]: value } : block)),
    )
  }

  function updateItem(blockId, index, field, value) {
    setBlocks((current) =>
      current.map((block) => {
        if (block.id !== blockId) return block

        return {
          ...block,
          items: block.items.map((item, itemIndex) =>
            itemIndex === index ? { ...item, [field]: value } : item,
          ),
        }
      }),
    )
  }

  function addItem(blockId) {
    setBlocks((current) =>
      current.map((block) => {
        if (block.id !== blockId || block.items.length >= block.limit) return block
        return { ...block, items: [...block.items, createItem(blockId, objective)] }
      }),
    )
  }

  function removeItem(blockId, index) {
    setBlocks((current) =>
      current.map((block) => {
        if (block.id !== blockId || block.items.length === 1) return block
        return { ...block, items: block.items.filter((_, itemIndex) => itemIndex !== index) }
      }),
    )
  }

  async function createPlan({ shouldDownload = false } = {}) {
    setSaving(true)
    setMessage('')

    const alumnoId = student?.id || null
    const userId = student?.user_id || null

    if (!alumnoId) {
      setSaving(false)
      setMessage(t.saveError)
      return
    }

    const { data: alumnoActual, error: alumnoError } = await supabase
      .from('alumnos')
      .select('generaciones_disponibles')
      .eq('id', alumnoId)
      .single()

    const disponibles = Number(alumnoActual?.generaciones_disponibles || 0)

    if (alumnoError || disponibles < 1) {
      setSaving(false)
      setMessage(t.noAvailable)
      return
    }

    const { data: planes, error: insertError } = await supabase.from('planificaciones_generadas').insert([
      {
        user_id: userId,
        alumno_id: alumnoId,
        nombre_alumno: student?.nombre || 'Alumno PowerFit',
        objetivo: `manual_${objective}`,
        nivel: level,
        contenido: planText,
      },
    ]).select()

    if (insertError) {
      setSaving(false)
      setMessage(t.saveError)
      return
    }

    const { error: updateError } = await supabase
      .from('alumnos')
      .update({ generaciones_disponibles: Math.max(0, disponibles - 1) })
      .eq('id', alumnoId)

    if (updateError) {
      const ids = (planes || []).map((plan) => plan.id).filter(Boolean)
      if (ids.length > 0) {
        await supabase.from('planificaciones_generadas').delete().in('id', ids)
      }

      setSaving(false)
      setMessage(t.saveError)
      return
    }

    if (shouldDownload) {
      downloadWord(planText, student?.nombre)
    }

    setSaving(false)
    setMessage(shouldDownload ? t.downloaded : t.saved)
    onUpdateStudent?.()
  }

  return (
    <div className="space-y-5">
      <section className="bg-zinc-900 border border-yellow-500 rounded-2xl sm:rounded-3xl p-4 sm:p-6">
        <div className="flex flex-col gap-2 mb-5">
          <h2 className="text-3xl sm:text-4xl font-black text-yellow-400">{t.title}</h2>
          <p className="text-zinc-300 font-bold">{t.subtitle}</p>
        </div>

        <div className="grid md:grid-cols-2 xl:grid-cols-5 gap-3">
          <label className="grid gap-2 font-black text-sm text-zinc-300">
            {t.sessionName}
            <input
              value={sessionName}
              onChange={(event) => setSessionName(event.target.value)}
              className="bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-3 text-white"
            />
          </label>

          <label className="grid gap-2 font-black text-sm text-zinc-300">
            {t.objective}
            <select
              value={objective}
              onChange={(event) => changeObjective(event.target.value)}
              className="bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-3 text-white"
            >
              {OBJECTIVES.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-2 font-black text-sm text-zinc-300">
            {t.macro}
            <select
              value={macro}
              onChange={(event) => setMacro(event.target.value)}
              className="bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-3 text-white"
            >
              {MACROS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-2 font-black text-sm text-zinc-300">
            {t.phase}
            <select
              value={phase}
              onChange={(event) => setPhase(event.target.value)}
              className="bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-3 text-white"
            >
              {PHASES.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-2 font-black text-sm text-zinc-300">
            {t.level}
            <select
              value={level}
              onChange={(event) => setLevel(event.target.value)}
              className="bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-3 text-white"
            >
              {LEVELS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <div className="grid xl:grid-cols-2 gap-5">
        {blocks.map((block) => (
          <section
            key={block.id}
            className="bg-zinc-900 border border-zinc-800 rounded-2xl sm:rounded-3xl p-4 sm:p-5"
          >
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
              <div>
                <h3 className="text-2xl font-black text-red-400">{block.title}</h3>
                <p className="text-sm text-zinc-400 font-bold">
                  {t.max}: {block.limit} ejercicios
                </p>
              </div>
              <button
                onClick={() => addItem(block.id)}
                disabled={block.items.length >= block.limit}
                className="bg-yellow-500 hover:bg-yellow-400 disabled:opacity-40 text-black px-4 py-3 rounded-xl font-black"
              >
                {t.addExercise}
              </button>
            </div>

            <div className="grid sm:grid-cols-2 gap-3 mb-4">
              <label className="grid gap-2 font-black text-sm text-zinc-300">
                {t.method}
                <input
                  value={block.method}
                  onChange={(event) => updateBlock(block.id, 'method', event.target.value)}
                  className="bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-3 text-white"
                />
              </label>
              <label className="grid gap-2 font-black text-sm text-zinc-300">
                {t.duration}
                <input
                  value={block.duration}
                  onChange={(event) => updateBlock(block.id, 'duration', event.target.value)}
                  className="bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-3 text-white"
                />
              </label>
            </div>

            <div className="space-y-3">
              {block.items.map((item, index) => (
                <div
                  key={`${block.id}-${index}`}
                  className="grid lg:grid-cols-[1.5fr_0.7fr_0.9fr_0.9fr_auto] gap-2 items-end bg-zinc-950 border border-zinc-800 rounded-2xl p-3"
                >
                  <label className="grid gap-2 font-black text-xs text-zinc-400">
                    {t.exercise}
                    <select
                      value={item.ejercicio}
                      onChange={(event) =>
                        updateItem(block.id, index, 'ejercicio', event.target.value)
                      }
                      className="bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-3 text-white text-sm"
                    >
                      {getExerciseOptions(block.id, objective).map((exercise) => (
                        <option key={exercise} value={exercise}>
                          {exercise}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="grid gap-2 font-black text-xs text-zinc-400">
                    {t.series}
                    <input
                      value={item.series}
                      onChange={(event) =>
                        updateItem(block.id, index, 'series', event.target.value)
                      }
                      className="bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-3 text-white text-sm"
                    />
                  </label>
                  <label className="grid gap-2 font-black text-xs text-zinc-400">
                    {t.reps}
                    <input
                      value={item.reps}
                      onChange={(event) => updateItem(block.id, index, 'reps', event.target.value)}
                      className="bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-3 text-white text-sm"
                    />
                  </label>
                  <label className="grid gap-2 font-black text-xs text-zinc-400">
                    {t.rest}
                    <input
                      value={item.descanso}
                      onChange={(event) =>
                        updateItem(block.id, index, 'descanso', event.target.value)
                      }
                      className="bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-3 text-white text-sm"
                    />
                  </label>
                  <button
                    onClick={() => removeItem(block.id, index)}
                    disabled={block.items.length === 1}
                    className="bg-red-700 hover:bg-red-600 disabled:opacity-40 px-3 py-3 rounded-xl font-black text-sm"
                  >
                    {t.remove}
                  </button>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      <section className="bg-zinc-900 border border-zinc-800 rounded-2xl sm:rounded-3xl p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div>
            <h3 className="text-2xl font-black text-yellow-400">{t.preview}</h3>
            <p className="text-zinc-400 font-bold mt-1">
              {t.available}: {student?.generaciones_disponibles || 0}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => createPlan({ shouldDownload: true })}
              disabled={saving || Number(student?.generaciones_disponibles || 0) < 1}
              className="bg-zinc-700 hover:bg-zinc-600 disabled:opacity-50 px-5 py-3 rounded-xl font-black"
            >
              {t.download}
            </button>
            <button
              onClick={() => createPlan()}
              disabled={saving || Number(student?.generaciones_disponibles || 0) < 1}
              className="bg-green-600 hover:bg-green-700 disabled:opacity-50 px-5 py-3 rounded-xl font-black"
            >
              {saving ? 'Guardando...' : t.save}
            </button>
          </div>
        </div>

        {message && (
          <p className="mb-4 bg-zinc-950 border border-zinc-700 rounded-xl px-4 py-3 font-bold">
            {message}
          </p>
        )}

        <pre className="bg-black border border-zinc-800 rounded-2xl p-4 overflow-x-auto whitespace-pre-wrap text-sm leading-6 text-zinc-200">
          {planText}
        </pre>
      </section>
    </div>
  )
}
