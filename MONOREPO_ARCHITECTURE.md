# CPS + PowerFit360 Monorepo Architecture

## Objetivo

Mantener **CPS** y **PowerFit360** como productos independientes, con despliegue, marca, navegación y lógica comercial separadas, pero compartiendo código, contenido técnico y servicios comunes cuando corresponda.

La migración debe hacerse sin interrumpir producción y sin modificar inicialmente RLS, autenticación, Mercado Pago ni Supabase productivo.

## Principios

1. `main` continúa siendo producción hasta que la nueva arquitectura esté validada.
2. CPS y PowerFit360 conservan identidad, dominio y despliegue independientes.
3. El contenido técnico compartido debe tener una sola fuente de verdad.
4. No duplicar lógica de pagos, evaluaciones, videos, progresión o traducciones.
5. Las bases de datos pueden seguir separadas durante la primera etapa.
6. Ninguna migración de datos se ejecuta hasta pasar build, auth, RLS, pagos y pruebas funcionales.

## Arquitectura objetivo

```text
/
├─ apps/
│  ├─ powerfit360/
│  └─ cps/
├─ packages/
│  ├─ ui/
│  ├─ auth/
│  ├─ payments/
│  ├─ evaluations/
│  ├─ video/
│  ├─ training-engine/
│  ├─ cps-content/
│  ├─ graduation/
│  ├─ i18n/
│  ├─ types/
│  └─ supabase-client/
├─ services/
│  ├─ payment-gateway/
│  └─ content-api/
├─ supabase/
│  ├─ powerfit360/
│  ├─ cps/
│  └─ shared/
└─ tooling/
```

## Responsabilidades por producto

### CPS

Producto especializado en deportes de combate.

Incluye, entre otros:

- CPS Fighter
- CPS Coach
- Tomos y biblioteca técnica
- Técnicas, drills y combinaciones
- Evaluaciones por video y presenciales
- Sistema de graduación/progresión
- Contenido ES/EN

### PowerFit360

Plataforma de gestión, entrenamiento y rendimiento.

Incluye, entre otros:

- Admin
- Coach
- Alumno
- Asistencia
- Fichas
- Planificaciones
- Pagos
- Reportes
- Progreso
- Gestión de gimnasios

PowerFit360 puede consumir módulos CPS sin convertirse en CPS.

## Paquetes compartidos previstos

### `packages/cps-content`

Fuente única para:

- tomos
- técnicas
- pasos
- biomecánica
- errores y correcciones
- drills
- combinaciones
- metadatos de video

### `packages/evaluations`

- rúbricas
- criterios
- puntajes
- estados de revisión
- evaluaciones por video
- evaluaciones presenciales

### `packages/video`

- carga
- validación
- almacenamiento
- estados de procesamiento
- permisos

### `packages/payments`

- creación de preferencias
- identificación de producto
- `external_reference`
- origen `cps` / `powerfit360`
- webhook normalizado
- reglas de desbloqueo

### `packages/i18n`

- español
- inglés
- claves compartidas

## Mercado Pago

Ambas aplicaciones pueden usar la misma cuenta de Mercado Pago, pero todo pago debe registrar el origen.

Ejemplo:

```text
CPS-TOMO-01-<user-id>
PF360-MEMBERSHIP-<user-id>
```

Nunca depender solo del monto para identificar un producto.

## Estrategia de migración

### Fase 0 — Inventario

- identificar código fuente CPS
- inventariar rutas, componentes, servicios y tablas
- detectar duplicación CPS/PowerFit360
- identificar variables de entorno

### Fase 1 — Fundación sin mover producción

- crear estructura `apps/` y `packages/`
- añadir configuración de workspaces
- mantener PowerFit360 operativo
- no cambiar Vercel ni Supabase productivo

### Fase 2 — Extraer módulos seguros

Primeros candidatos:

1. `types`
2. `i18n`
3. utilidades puras
4. componentes UI no acoplados

### Fase 3 — Extraer dominio compartido

- contenido CPS
- evaluaciones
- video
- graduación
- training engine

### Fase 4 — Pagos compartidos

- encapsular Mercado Pago
- mantener webhooks compatibles
- conservar trazabilidad por aplicación

### Fase 5 — CPS como app independiente

- `apps/cps`
- dominio propio
- configuración propia
- variables propias
- despliegue propio

### Fase 6 — Validación

Cada app debe pasar:

- install
- lint
- build
- login
- roles
- RLS
- subida de videos
- evaluaciones
- descargas
- Mercado Pago
- webhooks
- rollback

## Regla de rollback

Mientras la migración no haya sido aprobada, la versión actual en `main` es el punto de restauración.

No se elimina código legado hasta que la nueva ruta haya pasado pruebas funcionales y producción estable.

## Estado actual

Repositorio localizado:

- `hood07-ops/powerfit-app`

PowerFit360 actualmente usa Vite + React y compila múltiples ediciones desde un solo código base.

El código fuente independiente de CPS todavía debe localizarse antes de moverlo al monorepo.
