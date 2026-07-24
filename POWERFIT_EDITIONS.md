# PowerFit 360 Editions

PowerFit usa un solo codigo base, pero se compila como 3 apps separadas por modo.

## 1. PowerFit Admin

App para duenos o administradores de gimnasio.

Comando:

```bash
npm run build:admin
```

Incluye:

- Asistencia QR
- Administracion de alumnos
- Pagos
- Registro de compras
- Reportes
- Estadisticas
- Notificaciones
- Marca de escuela

No incluye:

- Generador IA
- Constructor de entrenamientos
- Biblioteca completa de metodos

## 2. PowerFit Coach

App completa para entrenadores/profesores.

Comando:

```bash
npm run build:coach
```

Incluye:

- Todo lo administrativo
- Generador IA
- Constructor PowerFit
- Biblioteca
- Rutinas
- Evaluaciones
- XP y rangos
- Marca personalizable

Modelo comercial:

- El profesor puede usar su nombre/logo.
- PowerFit 360 queda como firma pequena.
- La comision base configurada es 10% por alumno integrado.

## 3. PowerFit Alumno

App para alumnos.

Comando:

```bash
npm run build:alumno
```

Incluye:

- Asistencia QR
- Ficha personal
- Pago de mensualidad
- Rutinas
- Evaluaciones
- Progreso
- XP y rangos
- Notificaciones

No incluye:

- Admin alumnos
- Reportes administrativos
- Registro de compras
- Marca de escuela
- Generador IA administrativo

## Estrategia

No son 3 repositorios distintos. Son 3 builds del mismo proyecto:

- `management` produce PowerFit Admin.
- `professor_full` produce PowerFit Coach.
- `student` produce PowerFit Alumno.

Cuando creemos APKs separados, cada build deberia tener su propio `appId`, `appName` e icono final:

- `cl.powerfit.admin`
- `cl.powerfit.coach`
- `cl.powerfit.alumno`

Las credenciales de Supabase pueden ser las mismas, pero las reglas RLS y `gimnasio_id` separan los datos por alumno/profesor/gimnasio.
