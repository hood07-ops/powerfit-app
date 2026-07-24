export const DEFAULT_BRANDING = {
  appName: 'POWERFIT 360',
  logoUrl: '/powerfit-logo.png',
  schoolName: '',
}

export const POWERFIT_SIGNATURE = 'PowerFit 360'

const EDITIONS = {
  management: {
    id: 'management',
    appName: 'PowerFit Admin',
    label: 'PowerFit Admin',
    audience: 'Administrador',
    description: 'App para duenos o administradores: asistencia, alumnos, pagos, reportes y administracion de gimnasio.',
    allowBranding: true,
    commissionRate: 0.1,
    sections: [
      'Admin',
      'AsistenciaQR',
      'RegistroCompras',
      'Reportes',
      'Estadísticas',
      'Notificaciones',
      'Marca',
    ],
  },
  student: {
    id: 'student',
    appName: 'PowerFit Alumno',
    label: 'PowerFit Alumno',
    audience: 'Alumno',
    description: 'App del alumno: asistencia QR, ficha personal, pagos, rutinas, progreso, XP y evaluaciones.',
    allowBranding: false,
    commissionRate: 0,
    sections: [
      'AsistenciaQR',
      'XPRangos',
      'Rutinas',
      'Estadísticas',
      'Notificaciones',
      'Ficha',
      'Pago',
      'Evaluaciones',
    ],
  },
  professor_full: {
    id: 'professor_full',
    appName: 'PowerFit Coach',
    label: 'PowerFit Coach',
    audience: 'Entrenador',
    description: 'App completa para entrenadores: alumnos propios, generador IA, constructor, biblioteca, reportes y marca personalizable.',
    allowBranding: true,
    commissionRate: 0.1,
    sections: [
      'Admin',
      'Entrenamientos',
      'Generador',
      'Constructor',
      'Metodos',
      'Reportes',
      'Estadísticas',
      'RegistroCompras',
      'Notificaciones',
      'AsistenciaQR',
      'Marca',
    ],
  },
}

export function getAppEdition() {
  const configured = import.meta.env.VITE_POWERFIT_EDITION || 'professor_full'
  const edition = EDITIONS[configured] || EDITIONS.professor_full
  return {
    ...edition,
    appName: import.meta.env.VITE_POWERFIT_APP_NAME || edition.appName,
  }
}

export function getEditionBranding(edition = getAppEdition()) {
  return {
    ...DEFAULT_BRANDING,
    appName: edition.appName || DEFAULT_BRANDING.appName,
  }
}

export function loadBranding() {
  const defaults = getEditionBranding()

  try {
    const stored = JSON.parse(localStorage.getItem('powerfit_branding') || '{}')
    return {
      ...defaults,
      ...stored,
      appName: stored.appName || defaults.appName,
      logoUrl: stored.logoUrl || defaults.logoUrl,
    }
  } catch {
    return defaults
  }
}

export function saveBranding(branding) {
  localStorage.setItem('powerfit_branding', JSON.stringify(branding))
}
