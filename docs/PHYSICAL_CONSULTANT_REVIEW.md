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
| Ajuste automático de ejercicios por equipamiento, días o síntomas | NO IMPLEMENTADO | El chat recoge disponibilidad/equipo para orientar y preguntar; no prescribe un programa completo ni modifica automáticamente ejercicios con estos datos |
| Análisis del rendimiento realizado | NO IMPLEMENTADO | Se distingue planificación de cumplimiento; no se infiere progreso de planes guardados |
| Asesor financiero/Meta/operaciones | FUERA DEL PEDIDO ACTUAL | No se modificaron |

Se detectan nombres de archivos `.env` versionados en `apps/powerfit360/`: `.env`, `.env.management`, `.env.professor_full`, `.env.student`. No se leyeron sus valores para esta auditoría. La presencia de un archivo no demuestra que contenga un secreto. Revisar por separado; no se ejecutó saneamiento ni rotación.

Rapa Nui Tour AI no se consultó ni modificó: este pedido se resuelve extendiendo el chat y motor existentes de PowerFit, sin necesitar código turístico.

## Comportamiento

- Flag nuevo: `VITE_POWERFIT_PHYSICAL_CONSULTANT`; desactivado salvo valor literal `true`. La primera versión de asesoría es en español; el chat en inglés conserva su ruta actual.
- Seis objetivos: combate, tenis, fuerza, pérdida de grasa, resistencia e inicio en casa. El chat solicita un objetivo principal si hay varios o una negación.
- Nivel, disponibilidad y equipamiento declarados se conservan en memoria en el chat, sin consultas nuevas ni escritura de perfiles. No se comparte automáticamente ese contexto con el generador ni entre sesiones.
- Cada orientación explica prioridades, criterios de progreso, datos faltantes y procedencia local. No usa OpenAI ni necesita otra clave.
- La asesoría visible en el generador sigue objetivo/nivel seleccionados. En la sesión local, se incorpora al contenido que se guarda y descarga. No se modifica el formato Excel mensual ni el contenido ya persistido por el proveedor IA.
- Una limitación marcada en el generador detiene esa solicitud antes de consultar créditos o generar. En el chat, las propuestas de entrenamiento quedan pendientes de revisión durante la conversación actual; pagos y ayuda de navegación continúan por el servicio existente.
- No se cambian políticas RLS, autorización, pagos, saldos, porcentajes, contratos ni canales externos. La persistencia de planes sigue las RPC existentes.

## Validación

- PASS: 8 pruebas de reglas, continuidad de contexto, objetivos ambiguos/negados, revisión humana, ausencia de RM e independencia de consultas de pago.
- PASS: ESLint en los archivos cambiados.
- PASS: compilación estándar con flag apagado.
- PASS: compilaciones Admin, Coach y Alumno con flag activado.
- Pendiente: revisión visual y prueba autenticada completa en staging; verificar persistencia, créditos y permisos contra el backend autorizado. No se hicieron llamadas de generación con coste ni cambios productivos.

Prueba del motor: `node --test packages/training-engine/src/physicalConsultant.test.js`.

Para revisión local, establecer `VITE_POWERFIT_PHYSICAL_CONSULTANT=true` antes de compilar. No requiere migraciones ni nuevas credenciales.

## Entrega y reversión

Diff en rama aislada `codex/physical-consultant-goals`; sin cambios a main ni despliegue productivo. El árbol de trabajo original y su índice se conservan.

Reversión funcional: omitir el flag o establecerlo en `false` y volver a compilar la misma versión. Si se decide desplegar, conservar la versión anterior para rollback. Publicación, activación productiva, envío de mensajes o migraciones requieren autorización específica.
