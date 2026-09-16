function esc(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

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

  const html = `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>${esc(filename)} · PowerFit</title>
<style>
:root{color-scheme:dark;--bg:#08090c;--panel:#17191f;--line:#343947;--gold:#ffc400;--text:#f7f7fb;--muted:#b7bdca;--green:#19c463}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--text);font-family:Arial,Helvetica,sans-serif}main{max-width:820px;margin:0 auto;padding:18px 14px 40px}.top{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:14px}.brand{font-weight:900;color:var(--gold);font-size:22px}.muted{color:var(--muted);font-size:13px;line-height:1.5}.card{background:var(--panel);border:1px solid var(--line);border-radius:16px;padding:16px}.file{font-weight:900;word-break:break-word;margin-bottom:12px}.actions{display:grid;gap:10px;margin:14px 0}.btn{display:block;width:100%;border:0;border-radius:12px;padding:15px 16px;text-align:center;text-decoration:none;font-weight:900;font-size:16px;cursor:pointer}.primary{background:var(--gold);color:#111}.secondary{background:#252936;color:#fff;border:1px solid var(--line)}.success{background:var(--green);color:#06120a}pre{white-space:pre-wrap;word-break:break-word;line-height:1.5;background:#0d0f14;border:1px solid var(--line);border-radius:12px;padding:14px;max-height:none;overflow:auto;font-family:Arial,Helvetica,sans-serif;font-size:14px}#status{min-height:22px;margin-top:8px;font-weight:800;color:var(--gold)}
</style>
</head>
<body>
<main>
  <div class="top"><div><div class="brand">PowerFit 360 CPS</div><div class="muted">Documento seguro del tomo</div></div></div>
  <section class="card">
    <div class="file">${esc(filename)}</div>
    <div class="muted">El documento se abrió en esta misma pestaña. Puedes guardarlo o compartirlo usando Android.</div>
    <div class="actions">
      <button id="saveBtn" class="btn primary">GUARDAR EN EL DISPOSITIVO</button>
      <button id="shareBtn" class="btn success">COMPARTIR / GUARDAR CON ANDROID</button>
      <button id="backBtn" class="btn secondary">VOLVER A CPS</button>
    </div>
    <div id="status"></div>
    <pre id="doc">${esc(content)}</pre>
  </section>
</main>
<script>
const filename=${JSON.stringify(filename)};
const content=${JSON.stringify(content)};
const status=document.getElementById('status');
function makeFile(){return new File([content],filename,{type:'text/plain;charset=utf-8'});}
function makeBlobUrl(){return URL.createObjectURL(new Blob([content],{type:'text/plain;charset=utf-8'}));}
document.getElementById('saveBtn').addEventListener('click',()=>{
  try{
    const url=makeBlobUrl();
    const a=document.createElement('a');
    a.href=url;a.download=filename;a.rel='noopener';
    document.body.appendChild(a);a.click();a.remove();
    status.textContent='Solicitud de guardado enviada a Android.';
    setTimeout(()=>URL.revokeObjectURL(url),60000);
  }catch(e){status.textContent='Tu navegador bloqueó el guardado directo. Usa el botón verde.';}
});
document.getElementById('shareBtn').addEventListener('click',async()=>{
  try{
    const file=makeFile();
    if(navigator.canShare && navigator.canShare({files:[file]}) && navigator.share){
      await navigator.share({files:[file],title:filename,text:'Documento CPS PowerFit 360'});
      status.textContent='Selector de Android abierto.';
      return;
    }
    status.textContent='Este navegador no permite compartir archivos. Mantén presionado el texto o usa el menú del navegador para guardar.';
  }catch(e){if(e && e.name!=='AbortError')status.textContent='No se pudo abrir el selector de Android.';}
});
document.getElementById('backBtn').addEventListener('click',()=>{location.href='/cps.html';});
</script>
</body>
</html>`;

  res.statusCode = 200;
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "same-origin");
  return res.end(html);
}
