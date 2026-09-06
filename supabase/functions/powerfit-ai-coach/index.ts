import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import OpenAI from "npm:openai";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const WORKOUT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
    "name", "objective", "modality", "level", "duration",
    "warmup", "blocks", "cooldown", "estimatedLoad", "coachNotes", "warnings",
  ],
  properties: {
    name: { type: "string" },
    objective: { type: "string" },
    modality: { type: "string" },
    level: { type: "string" },
    duration: { type: "number" },
    warmup: { type: "array", items: { $ref: "#/$defs/exercise" } },
    blocks: { type: "array", items: { $ref: "#/$defs/block" } },
    cooldown: { type: "array", items: { $ref: "#/$defs/exercise" } },
    estimatedLoad: {
      type: "object", additionalProperties: false,
      required: ["level", "volume", "intensity", "notes"],
      properties: { level: { type: "string" }, volume: { type: "string" }, intensity: { type: "string" }, notes: { type: "string" } },
    },
    coachNotes: { type: "array", items: { type: "string" } },
    warnings: { type: "array", items: { type: "string" } },
  },
  $defs: {
    exercise: {
      type: "object", additionalProperties: false,
      required: ["exercise_id", "name", "sets", "reps", "duration", "distance", "load", "percentage_rm", "rpe", "rir", "rest", "tempo", "notes"],
      properties: {
        exercise_id: { type: ["string", "null"] }, name: { type: "string" }, sets: { type: ["number", "null"] }, reps: { type: ["string", "null"] }, duration: { type: ["number", "null"] }, distance: { type: ["number", "null"] }, load: { type: ["number", "null"] }, percentage_rm: { type: ["number", "null"] }, rpe: { type: ["number", "null"] }, rir: { type: ["number", "null"] }, rest: { type: ["number", "null"] }, tempo: { type: ["string", "null"] }, notes: { type: ["string", "null"] },
      },
    },
    block: {
      type: "object", additionalProperties: false,
      required: ["id", "type", "name", "objective", "duration", "rest", "intensity", "instructions", "exercises"],
      properties: {
        id: { type: "string" }, type: { type: "string" }, name: { type: "string" }, objective: { type: "string" }, duration: { type: "number" }, rest: { type: ["number", "null"] }, intensity: { type: ["string", "null"] }, instructions: { type: "string" }, exercises: { type: "array", items: { $ref: "#/$defs/exercise" } },
      },
    },
  },
};

const SYSTEM_PROMPT = `Eres PowerFit AI Coach, asistente profesional de programación de entrenamiento.
Genera una sola sesión clara, segura y aplicable.
Respeta modalidad, objetivo, nivel, duración, equipamiento y restricciones.

MEMORIA ADAPTATIVA:
- Usa adaptive_context y adaptive_decision.
- adaptive_context.rm es la única fuente autoritativa de RM.
- recent_records, rendimiento e intentos NO son RM.
- progress: progresa conservadoramente una o dos variables.
- maintain: conserva carga similar y prioriza técnica.
- deload: reduce volumen/intensidad prudentemente.
- adapt_pain: evita movimientos que razonablemente agraven la zona informada; no diagnostiques.

CARGA:
- Si no existe RM real, load y percentage_rm deben ser null y debes usar RPE/RIR.
- Nunca inventes kilos.
- No expongas razonamiento interno.
- Devuelve exclusivamente el JSON solicitado.`;

function positiveId(value: unknown): number | null {
  if (typeof value === "number" && Number.isSafeInteger(value) && value > 0) return value;
  if (typeof value === "string" && /^\d+$/.test(value)) {
    const n = Number(value);
    return Number.isSafeInteger(n) && n > 0 ? n : null;
  }
  return null;
}
function resolveAlumnoId(body: any): number | null {
  const context = body?.context ?? body?.athleteContext ?? body?.studentContext ?? {};
  const candidates = [body?.alumno_id, body?.alumnoId, body?.student_id, body?.studentId, context?.alumno_id, context?.student_id, context?.athlete_id, context?.alumno?.id, context?.student?.id, context?.athlete?.id];
  for (const candidate of candidates) { const id = positiveId(candidate); if (id) return id; }
  return null;
}
function safeRequestId(value: unknown): string | null { const v = String(value ?? "").trim(); return v.length >= 8 && v.length <= 160 ? v : null; }

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ ok: false, error: "METHOD_NOT_ALLOWED" }, 405);
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const apiKey = Deno.env.get("OPENAI_API_KEY");
  const authHeader = req.headers.get("Authorization");
  if (!supabaseUrl || !anonKey || !authHeader) return json({ ok: false, error: "SERVER_CONFIG_ERROR" }, 503);
  const userDb = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } }, auth: { persistSession: false, autoRefreshToken: false } });
  const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!serviceRole) return json({ ok: false, error: "MISSING_SERVICE_ROLE_KEY" }, 503);
  const serverDb = createClient(supabaseUrl, serviceRole, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: userData, error: userError } = await userDb.auth.getUser();
  if (userError || !userData?.user?.id) return json({ ok: false, error: "UNAUTHORIZED" }, 401);
  let body: any;
  try { body = await req.json(); } catch { return json({ ok: false, error: "INVALID_JSON" }, 400); }
  const alumnoId = resolveAlumnoId(body);
  if (!alumnoId) return json({ ok: false, error: "ALUMNO_ID_REQUIRED" }, 400);
  const { data: adaptiveContext, error: contextError } = await userDb.rpc("get_powerfit_adaptive_context_v3", { p_alumno_id: alumnoId });
  if (contextError) return json({ ok: false, error: "ADAPTIVE_CONTEXT_ERROR" }, 403);
  if (body?.mode === "context_only" || body?.context_only === true) return json({ ok: true, mode: "context_only", alumno_id: alumnoId, adaptive_context: adaptiveContext, context_version: adaptiveContext?.context_version ?? "phase2-adaptive-v3-active-plans" });
  const requestId = safeRequestId(body?.request_id ?? body?.requestId);
  if (!requestId) return json({ ok: false, error: "REQUEST_ID_REQUIRED" }, 400);
  if (!apiKey) return json({ ok: false, error: "MISSING_OPENAI_API_KEY" }, 503);
  let processingToken: string | null = null;
  let providerResponseId: string | null = null;
  let consumed = false;
  try {
    const { data: begin, error: beginError } = await serverDb.rpc("server_begin_powerfit_ai_generation", { p_actor_user_id: userData.user.id, p_alumno_id: alumnoId, p_request_id: requestId });
    if (beginError) { const noCredits = String(beginError.message || "").includes("NO_GENERATIONS_AVAILABLE"); return json({ ok: false, error: noCredits ? "NO_GENERATIONS_AVAILABLE" : "RESERVATION_ERROR" }, noCredits ? 409 : 500); }
    if (begin?.status === "consumed" && begin?.existing_result?.result) return json({ ok: true, mode: "idempotent_replay", workout: begin.existing_result.result, result: begin.existing_result.result, provider: begin.existing_result.provider, model: begin.existing_result.model, response_id: begin.response_id, planificacion_id: begin.existing_result.planificacion_id, ai_generation_id: begin.existing_result.ai_generation_id, quota_after: begin.quota_after, idempotent: true });
    if (begin?.status === "processing" && begin?.call_provider !== true) return json({ ok: false, error: "REQUEST_IN_PROGRESS", request_id: requestId, retry_after_seconds: begin?.retry_after_seconds ?? 3 }, 409);
    if (begin?.status === "released") return json({ ok: false, error: "REQUEST_RELEASED_USE_NEW_REQUEST_ID" }, 409);
    processingToken = begin?.processing_token ?? null;
    if (!processingToken) return json({ ok: false, error: "PROCESSING_TOKEN_MISSING" }, 500);
    const context = body?.context ?? body?.athleteContext ?? body?.studentContext ?? {};
    const configuration = body?.configuration ?? body?.config ?? body?.request ?? {};
    const coachPrompt = body?.prompt ?? configuration?.prompt ?? configuration?.instructions ?? "";
    const payload = { task: "Genera una sesión PowerFit estructurada, segura y adaptativa", athlete_context: context, adaptive_context: adaptiveContext, configuration, coach_prompt: coachPrompt, constraints: { do_not_invent_rm: true, respect_equipment: true, respect_restrictions: true, respect_duration: true, no_medical_diagnosis: true } };
    const client = new OpenAI({ apiKey, timeout: 25000, maxRetries: 0 });
    const started = Date.now();
    const response = await client.responses.create({ model: "gpt-4.1-mini", instructions: SYSTEM_PROMPT, input: JSON.stringify(payload), max_output_tokens: 2200, text: { format: { type: "json_schema", name: "powerfit_workout", strict: true, schema: WORKOUT_SCHEMA } } });
    providerResponseId = response.id;
    if (!response.output_text) throw Object.assign(new Error("EMPTY_AI_RESPONSE"), { code: "EMPTY_AI_RESPONSE" });
    const workout = JSON.parse(response.output_text);
    const contextSummary = { context_version: adaptiveContext?.context_version ?? null, adaptive_decision: adaptiveContext?.adaptive_decision ?? null, rm: adaptiveContext?.rm ?? [], plan_rules: adaptiveContext?.plan_rules ?? null };
    const finalizeArgs = { p_response_id: providerResponseId, p_prompt: coachPrompt, p_configuration: configuration ?? {}, p_context_summary: contextSummary, p_result: workout, p_plan_objective: String(workout?.objective || configuration?.objective || "PowerFit AI").slice(0, 300), p_plan_level: String(workout?.level || configuration?.level || "intermedio").slice(0, 120), p_plan_content: JSON.stringify(workout, null, 2), p_provider: "openai", p_model: "gpt-4.1-mini", p_warnings: Array.isArray(workout?.warnings) ? workout.warnings : [], p_adaptive_action: adaptiveContext?.adaptive_decision?.action ?? null, p_context_version: adaptiveContext?.context_version ?? null };
    let finalized: any = null; let finalizeError: any = null;
    for (let attempt = 0; attempt < 2; attempt += 1) {
      const result = await serverDb.rpc("server_finalize_powerfit_ai_generation", { p_actor_user_id: userData.user.id, p_request_id: requestId, p_processing_token: processingToken, p_response_id: finalizeArgs.p_response_id, p_prompt: finalizeArgs.p_prompt, p_configuration: finalizeArgs.p_configuration, p_context_summary: finalizeArgs.p_context_summary, p_result: finalizeArgs.p_result, p_plan_objective: finalizeArgs.p_plan_objective, p_plan_level: finalizeArgs.p_plan_level, p_plan_content: finalizeArgs.p_plan_content, p_provider: finalizeArgs.p_provider, p_model: finalizeArgs.p_model, p_warnings: finalizeArgs.p_warnings, p_adaptive_action: finalizeArgs.p_adaptive_action, p_context_version: finalizeArgs.p_context_version });
      finalized = result.data; finalizeError = result.error; if (!finalizeError) break; await new Promise((resolve) => setTimeout(resolve, 300));
    }
    if (finalizeError) throw Object.assign(new Error("FINALIZE_ERROR"), { code: "FINALIZE_ERROR" });
    consumed = true;
    return json({ ok: true, workout, result: workout, provider: "openai", model: "gpt-4.1-mini", mode: "live", elapsed_ms: Date.now() - started, request_id: requestId, response_id: providerResponseId, planificacion_id: finalized?.planificacion_id, ai_generation_id: finalized?.ai_generation_id, quota_before: finalized?.quota_before ?? begin?.quota_before, quota_after: finalized?.quota_after ?? begin?.quota_after, adaptive_context_used: true, adaptive_action: adaptiveContext?.adaptive_decision?.action ?? null, context_version: adaptiveContext?.context_version ?? null, idempotent: Boolean(finalized?.idempotent) });
  } catch (error) {
    if (!consumed) { try { await serverDb.rpc("server_release_powerfit_ai_generation", { p_actor_user_id: userData.user.id, p_request_id: requestId, p_processing_token: processingToken ?? "", p_reason: String((error as any)?.code || "provider_or_server_failure").slice(0, 200) }); } catch {} }
    const name = (error as any)?.name || "";
    const status = name === "APIConnectionTimeoutError" ? 504 : 500;
    const code = name === "APIConnectionTimeoutError" ? "OPENAI_TIMEOUT" : String((error as any)?.code || "AI_COACH_ERROR");
    console.error("powerfit-ai-coach-v11", { code, status, request_id: requestId, provider_response_id: providerResponseId });
    return json({ ok: false, error: code }, status);
  }
});
