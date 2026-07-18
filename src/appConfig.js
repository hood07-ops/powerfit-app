export const DEFAULT_BRANDING = {
  appName: 'POWERFIT 360',
  logoUrl: '/powerfit-logo.png',
  schoolName: '',
}

export const POWERFIT_SIGNATURE = 'PowerFit 360'

const EDITIONS = {
  management: {
    id: 'management',
    label: 'Gestion asistencia',
    description: 'Asistencia, alumnos, pagos, reportes y administracion de gimnasio.',
    allowBranding: true,
    commissionRate: 0.1,
    sections: [
      'AsistenciaQR',
      'Admin',
      'Reportes',
      'Estadísticas',
      'Notificaciones',
      'Ficha',
      'Pago',
      'RegistroCompras',
      'Marca',
    ],
  },
  student: {
    id: 'student',
    label: 'Alumno',
    description: 'Acceso de alumno con asistencia, ficha, pago, rutinas y progreso.',
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
    label: 'Profesor completo',
    description: 'PowerFit completo para profesores, con alumnos propios y marca personalizable.',
    allowBranding: true,
    commissionRate: 0.1,
    sections: [
      'AsistenciaQR',
      'XPRangos',
      'Metodos',
      'Generador',
      'Constructor',
      'Rutinas',
      'Premium',
      'Reportes',
      'Estadísticas',
      'Notificaciones',
      'Ficha',
      'Pago',
      'Evaluaciones',
      'Admin',
      'RegistroCompras',
      'Marca',
    ],
  },
}

export function getAppEdition() {
  const configured = import.meta.env.VITE_POWERFIT_EDITION || 'professor_full'
  return EDITIONS[configured] || EDITIONS.professor_full
}

export function loadBranding() {
  try {
    const stored = JSON.parse(localStorage.getItem('powerfit_branding') || '{}')
    return { ...DEFAULT_BRANDING, ...stored }
  } catch {
    return DEFAULT_BRANDING
  }
}

export function saveBranding(branding) {
  localStorage.setItem('powerfit_branding', JSON.stringify(branding))
}
