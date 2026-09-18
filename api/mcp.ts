import { createMcpHandler } from "mcp-handler";
import { z } from "zod";
import { findKnowledgeAnswer } from "../supabase/functions/powerfit-chat/knowledge.ts";

const handler = createMcpHandler((server) => {
  server.registerTool(
    "search_app_help",
    {
      title: "Search PowerFit and CPS help",
      description:
        "Search public help about PowerFit360 and Combat Performance System (CPS): payments, AI generations, routines, attendance, tomos, videos, assessments, progression, downloads, security and support. This tool never returns private student data.",
      inputSchema: z.object({
        query: z.string().min(2).max(500),
        surface: z.enum(["powerfit360", "cps", "web"]).default("web"),
        language: z.enum(["es", "en"]).default("es"),
      }),
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async ({ query, surface, language }) => {
      const hit = findKnowledgeAnswer(query, surface, language);
      const reply =
        hit?.reply ||
        (language === "en"
          ? "No exact help article matched. I can still explain PowerFit360, CPS, memberships, AI workout generations, tomos, video submissions, assessments and progression using the other public tools."
          : "No encontré una respuesta exacta en la ayuda. Aun así puedo explicar PowerFit360, CPS, mensualidades, generaciones IA, tomos, videos, evaluaciones y progresión usando las demás herramientas públicas.");

      return {
        content: [{ type: "text", text: reply }],
        structuredContent: {
          matched: Boolean(hit),
          topic: hit?.id || null,
          surface,
          language,
          answer: reply,
        },
      };
    },
  );

  server.registerTool(
    "get_powerfit_overview",
    {
      title: "PowerFit360 overview",
      description: "Return a public overview of PowerFit360 features. No authentication or private data.",
      inputSchema: z.object({ language: z.enum(["es", "en"]).default("es") }),
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    },
    async ({ language }) => {
      const text =
        language === "en"
          ? "PowerFit360 is a gym and athlete management platform with QR attendance, profiles, memberships/payments, routines, evaluations, progress, notifications, workout builder and an AI workout generator. Combat Performance System (CPS) is integrated as the combat-sports progression module."
          : "PowerFit360 es una plataforma de gestión para gimnasio y deportistas con asistencia QR, fichas, mensualidades/pagos, rutinas, evaluaciones, progreso, notificaciones, constructor de entrenamientos y Generador IA. Combat Performance System (CPS) está integrado como módulo de progresión para deportes de combate.";
      return { content: [{ type: "text", text }], structuredContent: { answer: text } };
    },
  );

  server.registerTool(
    "get_cps_overview",
    {
      title: "CPS overview",
      description: "Return public CPS structure and progression rules. No private student data.",
      inputSchema: z.object({ language: z.enum(["es", "en"]).default("es") }),
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    },
    async ({ language }) => {
      const text =
        language === "en"
          ? "CPS means Combat Performance System. It covers Boxing, Kickboxing and K1, has 15 tomos, uses Boxing Levels rather than colored belts for boxing, and grade/belt progression for Kickboxing. Progress can include technique cards, video review, live assessment, tomo tests and promotion approval."
          : "CPS significa Combat Performance System. Incluye Boxeo, Kickboxing y K1, tiene 15 tomos, usa Niveles de Boxeo en vez de cinturones por color para boxeo y progresión por grados/cinturones en Kickboxing. El avance puede incluir tarjetas técnicas, revisión de video, evaluación presencial, pruebas de tomo y aprobación de promoción.";
      return { content: [{ type: "text", text }], structuredContent: { answer: text } };
    },
  );

  server.registerTool(
    "get_ai_generation_policy",
    {
      title: "AI generation entitlement",
      description: "Return the current public rule for PowerFit AI workout generation credits.",
      inputSchema: z.object({ language: z.enum(["es", "en"]).default("es") }),
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    },
    async ({ language }) => {
      const text =
        language === "en"
          ? "Each posted monthly membership payment grants 4 AI workout generations per paid month. A successfully generated and saved workout consumes 1 generation. If the external AI provider is unavailable, PowerFit can use its internal fallback planning engine."
          : "Cada mensualidad registrada como pagada acredita 4 generaciones IA por cada mes pagado. Una planificación generada y guardada correctamente consume 1 generación. Si el proveedor IA externo no está disponible, PowerFit puede utilizar su motor interno de planificación de contingencia.";
      return { content: [{ type: "text", text }], structuredContent: { answer: text } };
    },
  );

  server.registerTool(
    "get_cps_evaluation_flow",
    {
      title: "CPS evaluation flow",
      description: "Explain the public CPS video, live assessment and tomo-test progression flow.",
      inputSchema: z.object({ language: z.enum(["es", "en"]).default("es") }),
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    },
    async ({ language }) => {
      const text =
        language === "en"
          ? "A student opens the authorized tomo and technique card, uploads a required technique video, receives coach review and either approval or correction, completes the live assessment when eligible, and then proceeds to the tomo test and promotion requirements defined for the route."
          : "El alumno abre el tomo autorizado y su tarjeta técnica, sube el video requerido, recibe revisión del coach con aprobación o corrección, realiza la evaluación presencial cuando corresponde y luego avanza a la prueba de tomo y requisitos de promoción definidos para su ruta.";
      return { content: [{ type: "text", text }], structuredContent: { answer: text } };
    },
  );

  server.registerTool(
    "get_security_overview",
    {
      title: "PowerFit/CPS security overview",
      description: "Return a public summary of security controls without revealing implementation secrets.",
      inputSchema: z.object({ language: z.enum(["es", "en"]).default("es") }),
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    },
    async ({ language }) => {
      const text =
        language === "en"
          ? "PowerFit/CPS use defense in depth including Supabase RLS, private storage, server-side sensitive operations, rate limiting, restricted CORS, CSP/security headers, secret scanning, dependency auditing, CodeQL and role-based authorization. Private API keys are not exposed in browser code."
          : "PowerFit/CPS usan defensa en profundidad con RLS de Supabase, storage privado, operaciones sensibles server-side, rate limiting, CORS restringido, CSP/headers de seguridad, escaneo de secretos, auditoría de dependencias, CodeQL y autorización por rol. Las claves API privadas no se exponen en el navegador.";
      return { content: [{ type: "text", text }], structuredContent: { answer: text } };
    },
  );
}, {
  serverInfo: {
    name: "powerfit-cps-dastan",
    version: "1.0.0",
  },
  instructions:
    "Use these tools only for public PowerFit360/CPS product help. Do not infer or claim private student data. Private account tools are not available in this public server. Prefer search_app_help for user questions and use overview tools for broad explanations.",
});

export { handler as GET, handler as POST, handler as DELETE };
