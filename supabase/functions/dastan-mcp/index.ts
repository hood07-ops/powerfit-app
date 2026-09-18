import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { findKnowledgeAnswer } from "./knowledge.ts";

const PROTOCOL_VERSION = "2025-06-18";
const serverInfo = { name: "powerfit-cps-dastan", version: "1.0.0" };

const tools = [
  {
    name: "search_app_help",
    title: "Search PowerFit and CPS help",
    description: "Search public help about PowerFit360 and CPS. Never returns private student data.",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", minLength: 2, maxLength: 500 },
        surface: { type: "string", enum: ["powerfit360","cps","web"], default: "web" },
        language: { type: "string", enum: ["es","en"], default: "es" }
      },
      required: ["query"],
      additionalProperties: false
    },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false }
  },
  {
    name: "get_powerfit_overview",
    title: "PowerFit360 overview",
    description: "Return a public overview of PowerFit360 features.",
    inputSchema: { type:"object", properties:{ language:{type:"string",enum:["es","en"],default:"es"} }, additionalProperties:false },
    annotations: { readOnlyHint:true, destructiveHint:false, idempotentHint:true, openWorldHint:false }
  },
  {
    name: "get_cps_overview",
    title: "CPS overview",
    description: "Return public CPS structure and progression rules.",
    inputSchema: { type:"object", properties:{ language:{type:"string",enum:["es","en"],default:"es"} }, additionalProperties:false },
    annotations: { readOnlyHint:true, destructiveHint:false, idempotentHint:true, openWorldHint:false }
  },
  {
    name: "get_ai_generation_policy",
    title: "AI generation entitlement",
    description: "Return the current public rule for PowerFit AI workout generation credits.",
    inputSchema: { type:"object", properties:{ language:{type:"string",enum:["es","en"],default:"es"} }, additionalProperties:false },
    annotations: { readOnlyHint:true, destructiveHint:false, idempotentHint:true, openWorldHint:false }
  },
  {
    name: "get_cps_evaluation_flow",
    title: "CPS evaluation flow",
    description: "Explain the public CPS video, live assessment and tomo-test progression flow.",
    inputSchema: { type:"object", properties:{ language:{type:"string",enum:["es","en"],default:"es"} }, additionalProperties:false },
    annotations: { readOnlyHint:true, destructiveHint:false, idempotentHint:true, openWorldHint:false }
  },
  {
    name: "get_security_overview",
    title: "PowerFit/CPS security overview",
    description: "Return a public summary of security controls without implementation secrets.",
    inputSchema: { type:"object", properties:{ language:{type:"string",enum:["es","en"],default:"es"} }, additionalProperties:false },
    annotations: { readOnlyHint:true, destructiveHint:false, idempotentHint:true, openWorldHint:false }
  }
];

function headers(extra: Record<string,string> = {}) {
  return {
    "Content-Type":"application/json; charset=utf-8",
    "Cache-Control":"no-store",
    "Access-Control-Allow-Origin":"*",
    "Access-Control-Allow-Headers":"content-type, accept, mcp-protocol-version, authorization",
    "Access-Control-Allow-Methods":"POST, GET, DELETE, OPTIONS",
    "X-Content-Type-Options":"nosniff",
    ...extra
  };
}

function json(body: unknown, status=200, extra: Record<string,string> = {}) {
  return new Response(JSON.stringify(body), { status, headers: headers(extra) });
}

function rpcResult(id: unknown, result: unknown) {
  return json({ jsonrpc:"2.0", id, result }, 200, { "MCP-Protocol-Version":PROTOCOL_VERSION });
}

function rpcError(id: unknown, code: number, message: string) {
  return json({ jsonrpc:"2.0", id: id ?? null, error:{ code, message } }, 200, { "MCP-Protocol-Version":PROTOCOL_VERSION });
}

function ipFrom(req: Request) {
  return (req.headers.get("x-forwarded-for") || req.headers.get("cf-connecting-ip") || "unknown").split(",")[0].trim().slice(0,80);
}

async function rateLimit(req: Request) {
  const url=Deno.env.get("SUPABASE_URL");
  const key=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) return true;
  const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
  const {data,error}=await db.rpc("server_consume_powerfit_rate_limit",{
    p_bucket_key:`dastan-mcp:ip:${ipFrom(req)}`,
    p_limit:60,
    p_window_seconds:60
  });
  if (error) {
    console.error("MCP_RATE_LIMIT_ERROR", error.message);
    return false;
  }
  return Boolean(data?.allowed);
}

function language(args:any) {
  return args?.language === "en" ? "en" : "es";
}

function toolText(name:string,args:any) {
  const lang=language(args);
  if (name==="search_app_help") {
    const surface=["powerfit360","cps","web"].includes(args?.surface) ? args.surface : "web";
    const query=String(args?.query||"").trim().slice(0,500);
    if (query.length<2) return {error:"query must have at least 2 characters"};
    const hit=findKnowledgeAnswer(query,surface,lang);
    const text=hit?.reply || (lang==="en"
      ? "No exact help article matched. I can explain PowerFit360, CPS, memberships, AI generations, tomos, videos, assessments and progression."
      : "No encontré una respuesta exacta. Puedo explicar PowerFit360, CPS, mensualidades, generaciones IA, tomos, videos, evaluaciones y progresión.");
    return {text,structured:{matched:Boolean(hit),topic:hit?.id||null,surface,language:lang,answer:text}};
  }
  if (name==="get_powerfit_overview") {
    const text=lang==="en"
      ? "PowerFit360 is a gym and athlete management platform with QR attendance, profiles, memberships/payments, routines, evaluations, progress, notifications, workout builder and an AI workout generator. CPS is integrated as the combat-sports progression module."
      : "PowerFit360 es una plataforma de gestión para gimnasio y deportistas con asistencia QR, fichas, mensualidades/pagos, rutinas, evaluaciones, progreso, notificaciones, constructor de entrenamientos y Generador IA. CPS está integrado como módulo de progresión para deportes de combate.";
    return {text,structured:{answer:text}};
  }
  if (name==="get_cps_overview") {
    const text=lang==="en"
      ? "CPS means Combat Performance System. It covers Boxing, Kickboxing and K1, has 15 tomos, uses Boxing Levels rather than colored belts for boxing, and grade/belt progression for Kickboxing."
      : "CPS significa Combat Performance System. Incluye Boxeo, Kickboxing y K1, tiene 15 tomos, usa Niveles de Boxeo en vez de cinturones por color para boxeo y progresión por grados/cinturones en Kickboxing.";
    return {text,structured:{answer:text}};
  }
  if (name==="get_ai_generation_policy") {
    const text=lang==="en"
      ? "Each posted monthly membership payment grants 4 AI workout generations per paid month. A successfully generated and saved workout consumes 1 generation. If the external AI provider is unavailable, PowerFit can use its internal fallback planning engine."
      : "Cada mensualidad registrada como pagada acredita 4 generaciones IA por cada mes pagado. Una planificación generada y guardada correctamente consume 1 generación. Si el proveedor IA externo no está disponible, PowerFit utiliza su motor interno de contingencia.";
    return {text,structured:{answer:text}};
  }
  if (name==="get_cps_evaluation_flow") {
    const text=lang==="en"
      ? "A student opens the authorized tomo and technique card, uploads the required video, receives coach approval or correction, completes the live assessment when eligible, and then proceeds to tomo-test and promotion requirements."
      : "El alumno abre el tomo autorizado y su tarjeta técnica, sube el video requerido, recibe aprobación o corrección del coach, realiza la evaluación presencial cuando corresponde y luego avanza a la prueba de tomo y requisitos de promoción.";
    return {text,structured:{answer:text}};
  }
  if (name==="get_security_overview") {
    const text=lang==="en"
      ? "PowerFit/CPS use Supabase RLS, private storage, server-side sensitive operations, rate limiting, restricted CORS, security headers, secret scanning, dependency auditing, CodeQL and role-based authorization. Private API keys are not exposed in browser code."
      : "PowerFit/CPS usan RLS de Supabase, storage privado, operaciones sensibles server-side, rate limiting, CORS restringido, headers de seguridad, escaneo de secretos, auditoría de dependencias, CodeQL y autorización por rol. Las claves API privadas no se exponen en el navegador.";
    return {text,structured:{answer:text}};
  }
  return null;
}

Deno.serve(async (req:Request)=>{
  if (req.method==="OPTIONS") return new Response(null,{status:204,headers:headers()});
  if (req.method==="GET") {
    return json({name:"powerfit-cps-dastan",protocol:"MCP Streamable HTTP",version:"1.0.0",privacy:"public-read-only"},200);
  }
  if (req.method==="DELETE") return new Response(null,{status:204,headers:headers()});
  if (req.method!=="POST") return json({error:"METHOD_NOT_ALLOWED"},405);

  if (!(await rateLimit(req))) return json({error:"RATE_LIMITED"},429,{"Retry-After":"60"});

  const len=Number(req.headers.get("content-length")||"0");
  if (len>65536) return json({error:"PAYLOAD_TOO_LARGE"},413);

  let msg:any;
  try { msg=await req.json(); } catch { return rpcError(null,-32700,"Parse error"); }
  if (!msg || msg.jsonrpc!=="2.0" || typeof msg.method!=="string") return rpcError(msg?.id,-32600,"Invalid Request");

  const id=msg.id;
  const notification=id===undefined || id===null;

  if (msg.method==="initialize") {
    const requested=String(msg.params?.protocolVersion||"");
    return rpcResult(id,{
      protocolVersion: requested || PROTOCOL_VERSION,
      capabilities:{ tools:{ listChanged:false } },
      serverInfo,
      instructions:"Public read-only help for PowerFit360 and CPS. No private student data is available from this endpoint."
    });
  }
  if (msg.method==="notifications/initialized" || msg.method==="notifications/cancelled") {
    return new Response(null,{status:202,headers:headers({"MCP-Protocol-Version":PROTOCOL_VERSION})});
  }
  if (msg.method==="ping") return rpcResult(id,{});
  if (msg.method==="tools/list") return rpcResult(id,{tools});
  if (msg.method==="tools/call") {
    const name=String(msg.params?.name||"");
    const args=msg.params?.arguments||{};
    const output=toolText(name,args);
    if (!output) return rpcError(id,-32602,`Unknown tool: ${name}`);
    if ((output as any).error) {
      return rpcResult(id,{content:[{type:"text",text:(output as any).error}],isError:true});
    }
    return rpcResult(id,{
      content:[{type:"text",text:(output as any).text}],
      structuredContent:(output as any).structured
    });
  }

  if (notification) return new Response(null,{status:202,headers:headers()});
  return rpcError(id,-32601,"Method not found");
});
