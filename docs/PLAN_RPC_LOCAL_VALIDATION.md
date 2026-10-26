# Validación local de guardado y créditos

## Entorno elegido

PostgreSQL embebido PGlite, exclusivamente en memoria, sin credenciales, URL de Supabase ni clientes de red en el runner. Se intentó iniciar Docker Desktop instalado, pero el motor Linux no quedó disponible. No se cambió virtualización, WSL, servicios ni configuraciones de seguridad para forzarlo.

Instalación reproducible con `npm ci` y ejecución con `npm run test:plan-rpc`. La dependencia de pruebas `@electric-sql/pglite` está fijada en 0.5.12. No se incorpora al cliente ni al servidor de producción.

## Fuente inspeccionada

El 26 de octubre de 2026 se leyeron únicamente catálogos PostgreSQL del proyecto principal para conocer columnas y definiciones de funciones. No se consultaron filas de alumnos, planes, compras, registros ni datos de autenticación. No se ejecutó DDL/DML productivo.

Fixtures: seis tablas con tipos/defaults observados, cuatro tablas mínimas auxiliares para el lector y seis funciones originales. Solo hay personas ficticias, UUID de prueba y saldos de prueba. Los IDs identity se reconstruyen para la prueba. No es un clon completo: se omiten constraints, triggers, políticas y dependencias de producción ajenas al cuerpo probado. El esquema de autenticación local representa `auth.uid()` mediante configuración de transacción; no valida JWT reales.

## Resultados

Diez pruebas SQL ejecutan los cuerpos PL/pgSQL reales bajo rol `authenticated`, más una comprobación de ejecución anónima:

1. El propietario guarda texto adaptado, metadata y evento, descontando exactamente un crédito.
2. Un usuario sin identidad y otro alumno son rechazados sin escrituras parciales.
3. Admin conserva acceso; el RPC de consumo manual conserva su restricción actual para coach asignado. La propuesta no amplía permisos.
4. Sin crédito, alumno inexistente y contenido inválido no dejan registros ni descuentos parciales.
5. Un fallo inyectado al escribir auditoría revierte el plan, metadata, evento y saldo.
6. Tras consumir el último crédito, el siguiente intento se rechaza.
7. Se reproduce una brecha de autorización por propietario NULL en el SQL observado.
8. La propuesta de endurecimiento rechaza el propietario NULL en los dos puntos de escritura y en el lector del generador, conservando guardados legítimos.
9. Si las funciones cambian después del snapshot, el guard de hashes aborta y no sobrescribe esas modificaciones.
10. El rol `anon` no puede ejecutar las tres entradas. En los catálogos reales se confirmó propietario `postgres`, SECURITY DEFINER, propietario con bypass de RLS, permiso de ejecución para `authenticated` y sin permiso para `anon`; el fixture reproduce esos permisos de entrada.

## Hallazgo y corrección autorizada

`IF NOT (permiso_a OR permiso_b)` no entra en el rechazo cuando la expresión vale NULL. `alumnos.user_id` admite NULL. En el fixture se puede guardar y consumir crédito de ese alumno sin ser su propietario ni administrador. Esto verifica la debilidad de los cuerpos SQL observados, no demuestra por sí solo una explotación extremo a extremo en producción.

El SQL revisado `supabase/proposals/harden_plan_rpc_null_authorization.sql` cambia únicamente las tres condiciones de autorización a `(...) IS NOT TRUE`, conservando firmas, SECURITY DEFINER, search_path, zona horaria, validación y reglas de roles. Se aplicó con autorización explícita a Boxeo Rapa Nui mediante la migración registrada `20261026195820_harden_plan_rpc_null_authorization`. El archivo conserva el SQL de revisión y su guard de hashes: no debe reaplicarse sobre funciones ya corregidas.

El lector `get_powerfit_generator_state_secure` presenta el mismo patrón: se reproduce su acceso con datos ficticios y se incluye en la propuesta. No se probaron fugas con datos reales ni se afirma que todos los demás RPC del backend estén auditados.

Antes de aplicar se confirmaron los tres hashes originales y sus permisos. Después se confirmaron las condiciones corregidas y los mismos privilegios: propietario postgres, SECURITY DEFINER, ejecución para authenticated y sin ejecución para anon. Una transacción READ ONLY bajo rol authenticated y sin identidad verificó que las tres funciones rechazan la llamada; no creó planes ni consumió créditos. La publicación de la asesoría fue autorizada por el usuario de forma separada en la continuación del trabajo.

## Límites de lo verificado

- No es una prueba completa navegador → PostgREST → JWT → RLS → triggers productivos.
- No se demuestra aislamiento multigimnasio: el contrato productivo documentado es single-tenant. El ámbito del perfil local incluye gimnasio para evitar mezcla en el cliente, pero eso no constituye autorización de servidor.
- PGlite tiene una conexión exclusiva: se verifica consumo secuencial y atomicidad, no carreras entre conexiones de PostgreSQL reales.
- El RPC no implementa una clave de idempotencia para intentos repetidos con saldo suficiente. No se añadió una regla nueva de deduplicación ni se afirma que exista.
- Un coach asignado es rechazado por el wrapper manual aunque el guardado base contemple gestión asignada. Se conserva y documenta este contrato; cambiarlo ampliaría permisos y requiere una decisión explícita.

La revisión profesional de dosis y la prueba autenticada completa en staging real siguen pendientes. Se actualizaron solo las definiciones de las tres funciones; no se alteraron créditos ni filas de alumnos o planes.
