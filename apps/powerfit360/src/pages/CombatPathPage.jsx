import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '../supabase'

const ROUTE_LABELS = {
  BOXING: 'Boxeo',
  KICKBOXING: 'Kickboxing',
}

const FALLBACK_TOMOS = [
  [1, 'Fundamentos del Peleador'],
  [2, 'Técnica de Golpes'],
  [3, 'Defensa y Movimiento'],
  [4, 'Táctica y Estrategia'],
  [5, 'Kickboxing y K1'],
  [6, 'Fuerza y Potencia'],
  [7, 'Resistencia y Conditioning'],
  [8, 'Recuperación y Nutrición'],
  [9, 'Preparación Mental'],
  [10, 'Planificación del Entrenamiento'],
  [11, 'Combate y Competencia'],
  [12, 'Análisis Técnico y Video'],
  [13, 'Programas de Entrenamiento'],
  [14, 'Errores y Correcciones'],
  [15, 'Maestría, Coaching y Legado'],
  [16, 'Tomo Especial de Boxeo — Integración Táctica y Planificación por Objetivos'],
  [17, 'Kickboxing Negro 1er Dan — Integración Táctica y Planificación por Objetivos'],
]

const FALLBACK_ROUTES = [
  {
    code: 'BOXING',
    name: 'Boxeo',
    uses_belts: false,
    stages: [
      { stage_order: 1, label: 'Boxeo Nivel 1', minimum_months: 4, minimum_exam_score: 75, tomos: [1] },
      { stage_order: 2, label: 'Boxeo Nivel 2', minimum_months: 4, minimum_exam_score: 75, tomos: [2] },
      { stage_order: 3, label: 'Boxeo Nivel 3', minimum_months: 5, minimum_exam_score: 78, tomos: [3] },
      { stage_order: 4, label: 'Boxeo Nivel 4', minimum_months: 6, minimum_exam_score: 80, tomos: [4] },
      { stage_order: 5, label: 'Boxeo Nivel 5', minimum_months: 7, minimum_exam_score: 82, tomos: [6, 7] },
      { stage_order: 6, label: 'Boxeo Nivel 6', minimum_months: 8, minimum_exam_score: 85, tomos: [8, 9, 10] },
      { stage_order: 7, label: 'Boxeo Nivel 7', minimum_months: 8, minimum_exam_score: 85, tomos: [11, 12, 13, 14, 15, 16] },
    ],
  },
  {
    code: 'KICKBOXING',
    name: 'Kickboxing',
    uses_belts: true,
    stages: [
      { stage_order: 1, label: 'Blanco', minimum_months: 4, minimum_exam_score: 75, tomos: [1] },
      { stage_order: 2, label: 'Naranjo', minimum_months: 4, minimum_exam_score: 75, tomos: [2, 5] },
      { stage_order: 3, label: 'Verde', minimum_months: 5, minimum_exam_score: 78, tomos: [3, 5] },
      { stage_order: 4, label: 'Azul', minimum_months: 6, minimum_exam_score: 80, tomos: [4, 5] },
      { stage_order: 5, label: 'Café', minimum_months: 7, minimum_exam_score: 82, tomos: [6, 7] },
      { stage_order: 6, label: 'Café-Negro', minimum_months: 8, minimum_exam_score: 85, tomos: [8, 9, 10] },
      { stage_order: 7, label: 'Negro 1er Dan', minimum_months: 8, minimum_exam_score: 85, tomos: [11, 12, 13, 14, 15, 17] },
    ],
  },
].map((route) => ({
  ...route,
  enrollment: null,
  stages: route.stages.map((stage) => ({
    ...stage,
    tomos: stage.tomos.map((tomoNo) => ({
      tomo_no: tomoNo,
      title: FALLBACK_TOMOS.find(([id]) => id === tomoNo)?.[1] || `Tomo ${tomoNo}`,
      price_clp: 5000,
      access_status: 'LOCKED',
    })),
  })),
}))

const CARD_STATUS_LABELS = {
  LOCKED: 'Bloqueada',
  AVAILABLE: 'Disponible',
  LEARNING: 'Aprendiendo',
  VIDEO_REQUIRED: 'Video requerido',
  VIDEO_SUBMITTED: 'Video enviado',
  VIDEO_UNDER_REVIEW: 'En revisión',
  VIDEO_CORRECTION_REQUIRED: 'Corrección requerida',
  VIDEO_APPROVED: 'Video aprobado',
  LIVE_PENDING: 'Presencial pendiente',
  LIVE_CORRECTION_REQUIRED: 'Corrección presencial',
  LIVE_APPROVED: 'Presencial aprobada',
  COMPLETED: 'Completada',
}

function clp(value) {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(value || 0)
}

function classForStatus(status) {
  if (['UNLOCKED', 'TOMO_COMPLETED', 'COMPLETED', 'VIDEO_APPROVED', 'LIVE_APPROVED'].includes(status)) {
    return 'border-green-500 bg-green-950/30 text-green-200'
  }

  if (['VIDEO_CORRECTION_REQUIRED', 'LIVE_CORRECTION_REQUIRED', 'FAILED'].includes(status)) {
    return 'border-red-500 bg-red-950/30 text-red-200'
  }

  if (['VIDEO_UNDER_REVIEW', 'PAYMENT_PENDING', 'SCHEDULED'].includes(status)) {
    return 'border-yellow-500 bg-yellow-950/30 text-yellow-200'
  }

  return 'border-zinc-700 bg-zinc-950 text-zinc-200'
}

function Badge({ children, status }) {
  return (
    <span className={`inline-flex rounded-xl border px-3 py-1 text-xs font-black uppercase ${classForStatus(status)}`}>
      {children}
    </span>
  )
}

function CombatMetric({ label, value }) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-black p-4">
      <p className="text-xs font-black uppercase text-zinc-500">{label}</p>
      <p className="mt-1 text-xl font-black text-white">{value}</p>
    </div>
  )
}

function buildFallbackDetail(pathCode, tomoNo) {
  const tomo = FALLBACK_TOMOS.find(([id]) => id === Number(tomoNo))
  return {
    path_code: pathCode,
    tomo: { tomo_no: Number(tomoNo), title: tomo?.[1] || `Tomo ${tomoNo}`, school_price_clp: 5000 },
    access_status: 'LOCKED',
    cards: [],
  }
}

export default function CombatPathPage({ student, user, isAdmin = false }) {
  const [home, setHome] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState({ path: 'BOXING', tomo: 1 })
  const [detail, setDetail] = useState(null)
  const [uploadingCard, setUploadingCard] = useState(null)
  const [grantReason, setGrantReason] = useState('Acceso administrativo CPS')

  const routes = home?.routes?.length ? home.routes : FALLBACK_ROUTES
  const selectedRoute = routes.find((route) => route.code === selected.path) || routes[0]
  const selectedStage =
    selectedRoute?.stages?.find((stage) =>
      stage.tomos?.some((tomo) => Number(tomo.tomo_no) === Number(selected.tomo)),
    ) || selectedRoute?.stages?.[0]

  const queue = useMemo(() => home?.coach_queue || [], [home])

  const loadHome = useCallback(async function loadHome() {
    setLoading(true)
    const { data, error: rpcError } = await supabase.rpc('get_powerfit_combat_home_secure')

    if (rpcError) {
      setError(`CPS aún no está disponible en esta base: ${rpcError.message}`)
      setHome({ routes: FALLBACK_ROUTES, coach_queue: [] })
    } else {
      setError('')
      setHome(data)
    }

    setLoading(false)
  }, [])

  const loadDetail = useCallback(async function loadDetail(pathCode, tomoNo) {
    const { data, error: rpcError } = await supabase.rpc('get_powerfit_tomo_detail_secure', {
      p_path_code: pathCode,
      p_tomo_no: Number(tomoNo),
    })

    if (rpcError) {
      setDetail(buildFallbackDetail(pathCode, tomoNo))
      return
    }

    setDetail(data)
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadHome()
    }, 0)
    return () => window.clearTimeout(timer)
  }, [loadHome])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadDetail(selected.path, selected.tomo)
    }, 0)
    return () => window.clearTimeout(timer)
  }, [loadDetail, selected.path, selected.tomo])

  async function enroll(pathCode) {
    const { error: rpcError } = await supabase.rpc('enroll_powerfit_combat_path_secure', {
      p_alumno_id: student?.id || null,
      p_path_code: pathCode,
      p_reason: 'Inscripción desde Mi Camino de Combate',
    })

    if (rpcError) {
      window.alert(`No se pudo matricular la ruta: ${rpcError.message}`)
      return
    }

    await loadHome()
  }

  async function grantAccess(pathCode, tomoNo) {
    if (!student?.id || !isAdmin) return
    const reason = window.prompt('Motivo obligatorio para otorgar acceso:', grantReason)
    if (!reason?.trim()) return
    setGrantReason(reason)

    const { error: rpcError } = await supabase.rpc('grant_powerfit_tomo_access_secure', {
      p_alumno_id: student.id,
      p_path_code: pathCode,
      p_tomo_no: Number(tomoNo),
      p_reason: reason,
    })

    if (rpcError) {
      window.alert(`No se pudo otorgar acceso: ${rpcError.message}`)
      return
    }

    await loadHome()
    await loadDetail(pathCode, tomoNo)
  }

  async function buyTomo(pathCode, tomoNo) {
    if (!student?.id) return
    const popup = window.open('', '_blank', 'noopener,noreferrer')

    try {
      const { data, error: invokeError } = await supabase.functions.invoke('create-preference', {
        body: {
          payment_type: 'cps_tomo',
          alumno_id: student.id,
          path_code: pathCode,
          tomo_no: Number(tomoNo),
        },
      })

      const checkoutUrl = data?.init_point || data?.sandbox_init_point

      if (invokeError || !checkoutUrl) {
        popup?.close()
        const context = await invokeError?.context?.json?.().catch(() => null)
        window.alert(
          context?.message ||
            context?.error ||
            invokeError?.message ||
            'No se pudo crear el pago CPS en Mercado Pago.',
        )
        return
      }

      if (popup) {
        popup.location.href = checkoutUrl
      } else {
        window.location.href = checkoutUrl
      }
    } catch (paymentError) {
      popup?.close()
      window.alert(`No se pudo iniciar el pago CPS: ${paymentError.message}`)
    }
  }

  async function uploadVideo(card, file) {
    if (!file || !student?.id || !user?.id) return
    setUploadingCard(card.id)

    try {
      const safeName = file.name.replace(/[^\w.-]+/g, '_')
      const path = `${user.id}/${selected.path}/${card.id}/${file.lastModified || file.size}-${safeName}`
      const { error: uploadError } = await supabase.storage
        .from('cps-technique-submissions')
        .upload(path, file, {
          cacheControl: '3600',
          contentType: file.type || 'video/mp4',
          upsert: false,
        })

      if (uploadError) throw uploadError

      const { error: rpcError } = await supabase.rpc('submit_powerfit_card_video_secure', {
        p_path_code: selected.path,
        p_card_id: card.id,
        p_storage_path: path,
        p_original_filename: file.name,
      })

      if (rpcError) throw rpcError
      await loadDetail(selected.path, selected.tomo)
    } catch (uploadError) {
      window.alert(`No se pudo subir el video CPS: ${uploadError.message}`)
    } finally {
      setUploadingCard(null)
    }
  }

  if (loading) {
    return (
      <div className="rounded-3xl border border-red-600 bg-zinc-900 p-6">
        <p className="font-black text-white">Cargando Mi Camino de Combate...</p>
      </div>
    )
  }

  return (
    <div className="cps-mobile-safe space-y-6">
      <section className="rounded-3xl border border-red-600 bg-zinc-900 p-4 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-black uppercase text-red-400">PowerFit 360 CPS</p>
            <h2 className="text-3xl font-black text-white sm:text-4xl">Mi Camino de Combate</h2>
            <p className="mt-2 max-w-3xl text-sm font-bold text-zinc-300">
              Dos caminos independientes: Boxeo Nivel 1-7 y Kickboxing Blanco a Negro 1er Dan. El pago desbloquea tomos; la promoción siempre requiere evaluación y aprobación del coach.
            </p>
          </div>
          <Badge status="UNLOCKED">Tomo escuela {clp(home?.price_school_member_clp || 5000)}</Badge>
        </div>

        {error && (
          <div className="mt-4 rounded-2xl border border-yellow-500 bg-yellow-950/30 p-4 text-sm font-bold text-yellow-100">
            {error}
          </div>
        )}

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          {routes.map((route) => {
            const enrollment = route.enrollment
            const currentStage =
              route.stages?.find((stage) => stage.stage_order === enrollment?.current_stage_order) ||
              route.stages?.[0]
            const tomos = route.stages?.flatMap((stage) => stage.tomos || []) || []
            const unlocked = tomos.filter((tomo) => tomo.access_status && tomo.access_status !== 'LOCKED').length
            const completed = tomos.filter((tomo) => tomo.access_status === 'TOMO_COMPLETED').length

            return (
              <article key={route.code} className="rounded-3xl border border-zinc-700/80 bg-gradient-to-b from-zinc-950 to-black p-4 sm:p-5 shadow-xl shadow-black/20">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-2xl font-black text-white">{ROUTE_LABELS[route.code] || route.name}</h3>
                    <p className="text-sm font-bold text-zinc-400">
                      {route.uses_belts ? 'Grados Blanco → Negro 1er Dan' : 'Boxeo Nivel 1 → 7 + Tomo Especial final'}
                    </p>
                  </div>
                  <Badge status={enrollment?.status || 'LOCKED'}>{enrollment?.status || 'No matriculado'}</Badge>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <CombatMetric label="Actual" value={currentStage?.label || '-'} />
                  <CombatMetric label="Meses mínimos" value={currentStage?.minimum_months || 4} />
                  <CombatMetric label="Tomos desbloqueados" value={`${unlocked}/${tomos.length}`} />
                  <CombatMetric label="Tomos completos" value={`${completed}/${tomos.length}`} />
                </div>

                <div className="mt-4 flex gap-2 overflow-x-auto pb-1 sm:flex-wrap">
                  {!enrollment && (
                    <button
                      type="button"
                      onClick={() => enroll(route.code)}
                      className="rounded-2xl bg-red-600 px-4 py-3 font-black text-white hover:bg-red-700"
                    >
                      Matricular ruta
                    </button>
                  )}
                  {route.stages?.map((stage) =>
                    stage.tomos?.map((tomo) => (
                      <button
                        key={`${route.code}-${stage.stage_order}-${tomo.tomo_no}`}
                        type="button"
                        onClick={() => setSelected({ path: route.code, tomo: tomo.tomo_no })}
                        className={`shrink-0 rounded-xl border px-3 py-2 text-sm font-black ${
                          selected.path === route.code && Number(selected.tomo) === Number(tomo.tomo_no)
                            ? 'border-red-500 bg-red-600 text-white'
                            : 'border-zinc-700 bg-zinc-900 text-zinc-200 hover:border-red-500'
                        }`}
                      >
                        T{tomo.tomo_no}
                      </button>
                    )),
                  )}
                </div>
              </article>
            )
          })}
        </div>
      </section>

      <section className="mobile-safe-section rounded-3xl border border-red-500/30 bg-zinc-900 p-4 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-black uppercase text-yellow-400">
              {ROUTE_LABELS[selected.path]} · {selectedStage?.label}
            </p>
            <h3 className="text-3xl font-black text-white">
              Tomo {selected.tomo}: {detail?.tomo?.title || `Tomo ${selected.tomo}`}
            </h3>
            <p className="mt-2 text-sm font-bold text-zinc-400">
              Precio alumno escuela {clp(detail?.tomo?.school_price_clp || detail?.tomo?.price_clp || 5000)}. Desbloquear un tomo no aprueba técnica, prueba ni promoción.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge status={detail?.access_status || 'LOCKED'}>{detail?.access_status || 'LOCKED'}</Badge>
            {detail?.access_status === 'LOCKED' && (
              <button
                type="button"
                onClick={() => buyTomo(selected.path, selected.tomo)}
                className="rounded-xl bg-green-600 px-4 py-2 font-black text-white hover:bg-green-700"
              >
                Comprar tomo {clp(detail?.tomo?.school_price_clp || detail?.tomo?.price_clp || 5000)}
              </button>
            )}
            {isAdmin && (
              <button
                type="button"
                onClick={() => grantAccess(selected.path, selected.tomo)}
                className="rounded-xl bg-yellow-500 px-4 py-2 font-black text-black hover:bg-yellow-400"
              >
                Otorgar acceso
              </button>
            )}
          </div>
        </div>

        {(detail?.access_status !== 'LOCKED' || isAdmin) && detail?.tomo?.study_content && (
          <div className="mt-6 rounded-2xl border border-yellow-500/40 bg-black p-4 sm:p-5">
            <p className="text-xs font-black uppercase tracking-wide text-yellow-400">Contenido de estudio</p>
            <pre className="mt-3 whitespace-pre-wrap font-sans text-sm leading-6 text-zinc-200">
              {detail.tomo.study_content}
            </pre>
          </div>
        )}

        <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_1.2fr]">
          <div className="rounded-2xl border border-zinc-800 bg-black p-4">
            <h4 className="text-xl font-black text-white">Flujo obligatorio</h4>
            <ol className="mt-3 space-y-2 text-sm font-bold text-zinc-300">
              {[
                'Pago / acceso',
                'Aprendizaje',
                'Tarjetas técnicas',
                'Video del alumno',
                'Revisión del coach',
                'Evaluación presencial',
                'Prueba del tomo',
                'Examen final',
                'Promoción registrada',
              ].map((item) => (
                <li key={item} className="rounded-xl bg-zinc-950 px-3 py-2">{item}</li>
              ))}
            </ol>
          </div>

          <div className="space-y-3">
            {(detail?.cards || []).length === 0 && (
              <div className="rounded-2xl border border-zinc-700 bg-black p-5 text-sm font-bold text-zinc-300">
                Las tarjetas se cargarán desde la migración CPS al aplicar la base de datos.
              </div>
            )}
            {(detail?.cards || []).map((card) => (
              <article key={card.id || card.code} className="rounded-2xl border border-zinc-700 bg-black p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-xs font-black uppercase text-red-400">{card.code}</p>
                    <h4 className="text-xl font-black text-white">{card.name}</h4>
                    <p className="mt-1 text-sm font-bold text-zinc-400">{card.objective}</p>
                  </div>
                  <Badge status={card.status}>{CARD_STATUS_LABELS[card.status] || card.status || 'LOCKED'}</Badge>
                </div>

                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <div className="rounded-xl bg-zinc-950 p-3">
                    <p className="text-xs font-black uppercase text-zinc-500">Pasos</p>
                    <ul className="mt-2 list-inside list-disc text-sm text-zinc-300">
                      {(card.steps || []).map((step) => <li key={step}>{step}</li>)}
                    </ul>
                  </div>
                  <div className="rounded-xl bg-zinc-950 p-3">
                    <p className="text-xs font-black uppercase text-zinc-500">Errores críticos</p>
                    <ul className="mt-2 list-inside list-disc text-sm text-zinc-300">
                      {(card.critical_errors || []).map((item) => <li key={item}>{item}</li>)}
                    </ul>
                  </div>
                </div>

                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-wrap gap-2">
                    {card.video_required && <Badge status="VIDEO_REQUIRED">Video obligatorio</Badge>}
                    {card.live_required && <Badge status="LIVE_PENDING">Presencial obligatoria</Badge>}
                    {card.critical && <Badge status="FAILED">Crítica</Badge>}
                  </div>

                  {card.video_required && (
                    <label className="cursor-pointer rounded-xl bg-red-600 px-4 py-3 text-center text-sm font-black text-white hover:bg-red-700">
                      {uploadingCard === card.id ? 'Subiendo...' : 'Grabar / subir video'}
                      <input
                        type="file"
                        accept="video/mp4,video/webm,video/quicktime"
                        className="hidden"
                        disabled={uploadingCard === card.id}
                        onChange={(event) => uploadVideo(card, event.target.files?.[0])}
                      />
                    </label>
                  )}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {isAdmin && (
        <section className="rounded-3xl border border-blue-500 bg-zinc-900 p-4 sm:p-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-black uppercase text-blue-300">Coach/Admin</p>
              <h3 className="text-3xl font-black text-white">Graduaciones</h3>
            </div>
            <Badge status="VIDEO_UNDER_REVIEW">{queue.length} videos pendientes</Badge>
          </div>

          <div className="mt-5 grid gap-3">
            {queue.length === 0 && (
              <div className="rounded-2xl border border-zinc-700 bg-black p-5 text-sm font-bold text-zinc-300">
                No hay videos CPS pendientes de revisión.
              </div>
            )}
            {queue.map((item) => (
              <div key={item.submission_id} className="rounded-2xl border border-zinc-700 bg-black p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-black text-white">{item.alumno_nombre}</p>
                    <p className="text-sm text-zinc-400">
                      {ROUTE_LABELS[item.route_code]} · {item.card_name} · intento {item.attempt_no}
                    </p>
                  </div>
                  <Badge status={item.status}>{item.status}</Badge>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
