export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "METHOD_NOT_ALLOWED" });
  }

  const body = req.body || {};
  const filename = String(body.filename || "CPS_Tomo_Estudio.txt")
    .replace(/[^a-zA-Z0-9._-]+/g, "_")
    .slice(0, 120);
  const content = String(body.content || "");

  if (!content) {
    return res.status(400).json({ error: "EMPTY_CONTENT" });
  }

  const payload = Buffer.from(content, "utf8");
  const base64 = payload.toString("base64");
  const dataUrl = `data:text/plain;charset=utf-8;base64,${base64}`;
  const safeFilename = filename.replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[char]);

  const html = `<!doctype html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover" />
  <title>Descargar tomo CPS</title>
  <style>
    :root{color-scheme:dark;--bg:#08090c;--panel:#17191f;--line:#3a3f4f;--gold:#ffc400;--text:#f7f7fb;--muted:#b7bdca;--green:#19c463}
    *{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--text);font-family:Arial,Helvetica,sans-serif;min-height:100vh;display:grid;place-items:center;padding:20px}.card{width:min(560px,100%);background:var(--panel);border:1px solid var(--line);border-radius:24px;padding:24px;box-shadow:0 22px 70px #0008}.brand{font-size:14px;color:var(--gold);font-weight:900;letter-spacing:.08em;text-transform:uppercase}.title{font-size:30px;font-weight:900;margin:8px 0 4px}.file{margin:16px 0;padding:14px;border-radius:14px;background:#0d0f14;border:1px solid var(--line);word-break:break-word}.hint{color:var(--muted);line-height:1.5}.actions{display:grid;gap:12px;margin-top:22px}a{display:block;text-align:center;text-decoration:none;border-radius:16px;padding:16px;font-size:17px;font-weight:900}.download{background:var(--gold);color:#111}.open{background:#20232c;color:white;border:1px solid var(--line)}.ok{margin-top:18px;color:var(--green);font-size:13px;font-weight:800}.back{margin-top:18px;text-align:center}.back a{display:inline;color:var(--gold);padding:8px;font-size:14px}
  </style>
</head>
<body>
  <main class="card">
    <div class="brand">PowerFit 360 · CPS</div>
    <div class="title">Tu tomo está listo</div>
    <p class="hint">Android bloqueó la descarga automática anterior. Ahora toca el botón para autorizar la descarga directamente.</p>
    <div class="file">${safeFilename}</div>
    <div class="actions">
      <a class="download" href="${dataUrl}" download="${safeFilename}">DESCARGAR ARCHIVO</a>
      <a class="open" href="${dataUrl}">ABRIR ARCHIVO</a>
    </div>
    <div class="ok">El archivo se genera dentro de esta sesión y no queda publicado en internet.</div>
    <div class="back"><a href="/cps.html">← Volver a CPS</a></div>
  </main>
</body>
</html>`;

  res.statusCode = 200;
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Content-Security-Policy", "default-src 'none'; style-src 'unsafe-inline'; img-src data:; font-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'");
  return res.end(html);
}
