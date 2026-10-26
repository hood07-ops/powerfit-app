# Preparador físico por objetivos — revisión

## Alcance y evidencia

Base inspeccionada: `origin/main`, commit `dfd8812`. Se conserva además la corrección de sesiones sin OpenAI publicada en `5993e98`; ambos cambios están incluidos en este diff para evitar reintroducir la dependencia obligatoria de IA.

| Capacidad | Estado comprobado | Evidencia |
| --- | --- | --- |
| Chat existente compartido | EXISTE | `apps/powerfit360/src/components/ChatWidget.jsx`, `packages/ai-chat/src/index.js` |
| Contexto autorizado del chat en servidor | PARCIALMENTE AUDITADO | `supabase/functions/powerfit-chat/index.ts`: autenticación/contexto/rate limit presentes en código; no se ha comprobado su configuración productiva |
| Generación por objetivo y nivel | EXISTE | `apps/powerfit360/src/pages/workoutSystem.js` |
| Semana técnica por deporte y objetivo táctico | EXISTE | `apps/powerfit360/src/pages/technicalPlanningSystem.js` |
| Asesoría por objetivos en chat y generador | EN PRUEBAS | `packages/training-engine/src/physicalConsultant.js` y sus dos consumidores |
| Handoff con asignación humana y resolución persistida | NO IMPLEMENTADO | Solo aviso explícito de revisión y bloqueo local de nuevas propuestas de entrenamiento en la conversación actual |
| Sesión local adaptada por objetivo, prioridad, material y minutos | EN PRUEBAS | `packages/training-engine/src/adaptivePlanning.js`; no adapta ejercicios a lesiones |
| Semana y cuatro semanas de revisión | EN PRUEBAS | Distribuye días declarados entre preparación física, práctica fácil y recuperación; progresión condicional, sin aumento automático |
| Análisis de sesiones completadas declaradas | EN PRUEBAS | Registros manuales en memoria, sRPE descriptivo; no se consulta historial oficial ni se infiere progreso de planes guardados |
| Asesor financiero/Meta/operaciones | FUERA DEL PEDIDO ACTUAL | No se modificaron |

Se detectan nombres de archivos `.env` versionados en `apps/powerfit360/`: `.env`, `.env.management`, `.env.professor_full`, `.env.student`. No se leyeron sus valores para esta auditoría. La presencia de un archivo no demuestra que contenga un secreto. Revisar por separado; no se ejecutó saneamiento ni rotación.

Rapa Nui Tour AI no se consultó ni modificó: este pedido se resuelve extendiendo el chat y motor existentes de PowerFit, sin necesitar código turístico.

## Comportamiento

- Flag nuevo: `VITE_POWERFIT_PHYSICAL_CONSULTANT`; desactivado salvo valor literal `true`. La primera versión de asesoría es en español; el chat en inglés conserva su ruta actual.
- Seis objetivos: combate, tenis, fuerza, pérdida de grasa, resistencia e inicio en casa. El chat solicita un objetivo principal si hay varios o una negación.
- Nivel, disponibilidad, prioridad deportiva, equipamiento, meta y fecha de evento se conservan en memoria y se comparten entre chat y generador. El ámbito incluye usuario visor, gimnasio y alumno. No se escriben en localStorage, cookies ni backend; al recargar se borran.
- Cada orientación explica prioridades, criterios de progreso, datos faltantes y procedencia local. No usa OpenAI ni necesita otra clave.
- La sesión local usa ejercicios compatibles con material declarado y asigna presupuestos de práctica/descanso cuya suma coincide con los minutos disponibles. No asume banco, silla, saco, anclaje ni balón. No calcula kilos desde RM. El contenido adaptado se guarda/descarga por la RPC existente y lleva referencia de versión. La vista de consulta y el chat solo crean borradores, sin consumir créditos.
- El plan mensual, la semana técnica y la opción OpenAI conservan sus motores y formatos; la interfaz explica este límite. No se modifican Edge Functions ni llamadas OpenAI.
- Los borradores adaptados requieren objetivo, nivel, disponibilidad, equipo y confirmación de persona adulta. Ante datos faltantes, se pide completar; ante molestia, se marca revisión. No constituye cribado médico ni autorización clínica.
- Los registros manuales aceptan solo sesiones completadas con duración/esfuerzo válidos, conservan hasta 30 registros por consulta y calculan minutos y sRPE descriptivos. No predicen lesiones ni autorizan progresión automática.
- Una limitación marcada en el generador detiene esa solicitud antes de consultar créditos o generar. En el chat, las propuestas de entrenamiento quedan pendientes de revisión durante la conversación actual; pagos y ayuda de navegación continúan por el servicio existente.
- No se cambian políticas RLS, autorización, pagos, saldos, porcentajes, contratos ni canales externos. La persistencia de planes sigue las RPC existentes.

## Validación

- PASS: 19 pruebas, incluidas 720 combinaciones de objetivo/nivel/material/duración, datos inválidos, minoría de edad declarada, fechas, prioridades deportivas, continuidad del chat, revisión, aislamiento de memoria y registros completados.
- PASS: ESLint en los archivos cambiados.
- PASS: compilación estándar con flag apagado.
- PASS: compilaciones Admin, Coach y Alumno con flag activado.
- PASS: compilación CPS y compilación estándar con flag explícitamente apagado.
- PASS: revisión visual local con datos ficticios, escritorio y viewport 390×844; perfil compartido → sesión sin material → respuesta semanal en chat sin OpenAI. Se corrigió el desplazamiento del chat hacia la respuesta más reciente.
- Pendiente: prueba autenticada completa en staging; verificar persistencia, créditos y permisos contra el backend autorizado. No se hicieron llamadas de generación con coste ni cambios productivos.

Prueba del motor: `node --test packages/training-engine/src/physicalConsultant.test.js packages/training-engine/src/adaptivePlanning.test.js`.

## Fuentes y alcance deportivo

- ACSM, actualización 2026: https://acsm.org/resistance-training-guidelines-update-2026/
- OMS, actividad física por grupo de edad: https://www.who.int/initiatives/behealthy/physical-activity/

Consultadas para criterios generales de individualización, constancia y combinación de actividad/fuerza. La biblioteca de ejercicios, reparto de minutos, límites de sesiones y estructura de cuatro semanas son decisiones locales de PowerFit para revisión, no protocolos prescritos ni validados clínicamente por estas fuentes. No se promete una preparación competitiva ni pérdida de peso en una fecha.

## Limitaciones y siguiente validación

- La conversación local tiene reconocimiento de patrones y formularios; no interpreta cualquier frase como un modelo de lenguaje. Mensajes de cuenta/navegación siguen el chat autorizado existente.
- El estado `HUMAN_REQUIRED` bloquea propuestas locales en esa consulta. No existe bandeja humana persistida, asignación de entrenador ni confirmación real de atención. Borrar una consulta no acredita una aprobación profesional.
- La recomendación según registros es conservadora y descriptiva. Faltan medidas comparables, contexto clínico y revisión humana para una prescripción individual avanzada.
- El preview temporal local usa datos ficticios y no se incluye en el commit. No debe publicarse como ruta de producto.
- Antes de activar en producción: prueba autenticada de guardado/cuota por rol en staging y revisión profesional de las reglas de dosis. Para permitir nuevas consultas API, cambiar credenciales o migrar persistencia, hace falta decisión específica; esta versión no requiere nada de eso para sus borradores locales.

Para revisión local, establecer `VITE_POWERFIT_PHYSICAL_CONSULTANT=true` antes de compilar. No requiere migraciones ni nuevas credenciales.

## Entrega y reversión

### Pruebas locales de la transacción y permisos

Se añadió `npm run test:plan-rpc`: nueve pruebas con PostgreSQL PGlite en memoria, sin URLs ni credenciales. Con las 19 pruebas deportivas, se verifican 28 pruebas. El workflow ejecuta también esta integración SQL. Detalles y límites: `docs/PLAN_RPC_LOCAL_VALIDATION.md`.

Se verificó localmente guardado/crédito atómico, errores y rollback, separación propietario/otro alumno, admin, restricción vigente para coach asignado y agotamiento de saldo. No se reemplaza la prueba HTTP/JWT/RLS/triggers ni se simula concurrencia multiconexión.

La prueba reproduce una condición permisiva con propietario NULL en tres funciones inspeccionadas. Se preparó una propuesta SQL transaccional con guard de drift (`supabase/proposals/harden_plan_rpc_null_authorization.sql`), validada solo en memoria. NO está en migrations y NO se aplicó a producción. Su ejecución real requiere autorización específica y revisión fresca. El PR no debe considerarse autorización para aplicarla ni para activar la nueva asesoría.

### Continuación de validación del PR #34

El primer CI pasó calidad y CodeQL, pero su auditoría detectó vulnerabilidades ya presentes en las dependencias base. Se fijaron versiones exactas de `@modelcontextprotocol/server` 2.4.0, `zod` 4.6.6 y `vite` 8.3.5, con lockfile actualizado. Ambas auditorías (`npm audit --audit-level=critical` y `npm audit --omit=dev --audit-level=high`) informan cero vulnerabilidades en la validación local.

Se incorporaron las pruebas del consultor y una compilación con el flag activado al workflow de calidad. El smoke test MCP prueba también tres clientes independientes que reutilizan el mismo identificador JSON-RPC, compatible con la fábrica de servidor existente. No se modificó el endpoint MCP ni sus permisos.

La declaración de molestia prevalece aunque falten duración/esfuerzo, y el formulario marca revisión inmediatamente. ESLint ignora ahora `dist` en todos los paquetes para excluir únicamente artefactos generados. Las vistas temporales de prueba se retiraron.

Revalidación local: 19 pruebas, MCP inicial e independiente, validación de paquetes CPS, escaneo de credenciales cliente, ESLint completo y builds estándar/Admin/Coach/Alumno/CPS/Coach con flag activado: PASS. Sigue pendiente la prueba autenticada de persistencia/créditos en staging y la validación profesional de dosis; no se ha fusionado ni publicado a producción.

Diff en rama aislada `codex/physical-consultant-goals`; sin cambios a main ni despliegue productivo. El árbol de trabajo original y su índice se conservan.

Reversión funcional: omitir el flag o establecerlo en `false` y volver a compilar la misma versión. Si se decide desplegar, conservar la versión anterior para rollback. Publicación, activación productiva, envío de mensajes o migraciones requieren autorización específica.
