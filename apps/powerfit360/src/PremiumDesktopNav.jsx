function NavButton({ label, active, disabled = false, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`shrink-0 rounded-2xl px-4 py-3 text-sm font-black transition sm:text-base ${
        disabled
          ? 'bg-zinc-800 text-zinc-500 opacity-50'
          : active
            ? 'bg-red-600 text-white shadow-lg shadow-red-950/40'
            : 'bg-zinc-900 text-zinc-200 hover:bg-zinc-800 hover:text-white'
      }`}
    >
      {label}
    </button>
  )
}

export default function PremiumDesktopNav({
  isAdmin,
  idioma,
  t,
  edition,
  visibleSection,
  setSection,
  editionAllows,
}) {
  const primary = isAdmin
    ? [
        ['Admin', t.adminStudents],
        ['Entrenamientos', t.customTrainings],
        ['MiCamino', idioma === 'en' ? 'CPS' : 'CPS'],
        ['AsistenciaQR', t.attendanceQr],
        ['Graduaciones', t.graduations],
      ]
    : [
        ['Inicio', idioma === 'en' ? 'Home' : 'Mi Inicio'],
        ['MiEntrenamiento', t.myTraining],
        ['MiCamino', t.combatPath],
        ['AsistenciaQR', t.attendanceQr],
        ['Ficha', t.profile],
      ]

  const secondary = [
    ['XPRangos', t.xpRanks],
    ['Metodos', t.library],
    ...(isAdmin ? [['Generador', t.aiGenerator]] : []),
    ['Constructor', t.workoutBuilder],
    ['Rutinas', t.routines],
    ['Premium', t.premium],
    ['Estadísticas', t.stats],
    ['Notificaciones', t.notifications],
    ...(isAdmin ? [['Reportes', t.reports]] : []),
    ...(!isAdmin ? [['Pago', t.payment]] : []),
    ['Evaluaciones', t.evaluations],
    ...(isAdmin ? [['RegistroCompras', t.purchaseLog]] : []),
    ...(isAdmin && edition.allowBranding ? [['Marca', t.brandSettings]] : []),
    ...(isAdmin ? [['Ficha', t.profile], ['Pago', t.payment]] : []),
  ]

  const primarySections = new Set(primary.map(([section]) => section))
  const visibleSecondary = secondary.filter(
    ([section]) => !primarySections.has(section) && editionAllows(section),
  )
  const secondaryActive = visibleSecondary.some(([section]) => section === visibleSection)

  return (
    <div
      data-nav-items={primary.length + visibleSecondary.length}
      className="sticky top-0 z-40 -mx-3 mb-5 border-y border-zinc-900 bg-black/95 px-3 py-3 backdrop-blur sm:mx-0 sm:mb-8 sm:border-0 sm:px-0"
    >
      <div className="flex flex-wrap items-center gap-3">
        {primary.map(([section, label]) =>
          editionAllows(section) ? (
            <NavButton
              key={section}
              label={label}
              active={visibleSection === section}
              onClick={() => setSection(section)}
            />
          ) : null,
        )}

        {visibleSecondary.length > 0 && (
          <details className="group relative">
            <summary
              className={`cursor-pointer list-none rounded-2xl px-4 py-3 text-sm font-black transition sm:text-base ${
                secondaryActive
                  ? 'bg-red-950 text-red-200 ring-1 ring-red-700'
                  : 'bg-zinc-900 text-zinc-200 hover:bg-zinc-800'
              }`}
            >
              {idioma === 'en' ? 'More tools' : 'Más herramientas'}
            </summary>
            <div className="mt-3 grid min-w-[290px] gap-2 rounded-3xl border border-zinc-700 bg-zinc-950 p-3 shadow-2xl sm:absolute sm:right-0 sm:grid-cols-2">
              {visibleSecondary.map(([section, label]) => (
                <NavButton
                  key={section}
                  label={label}
                  active={visibleSection === section}
                  disabled={section === 'Reportes' && !isAdmin}
                  onClick={() => setSection(section)}
                />
              ))}
            </div>
          </details>
        )}
      </div>
    </div>
  )
}
