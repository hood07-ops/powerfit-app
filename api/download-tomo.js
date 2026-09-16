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
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--text);font-family:Arial,Helvetica,sans-serif}main{max-width:820px;margin:0 auto;padding:18px 14px 40px}.top{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:14px}.brand{font-weight:900;color:var(--gold);font-size:22px}.muted{color:var(--muted);font-size:13px;line-height:1.5}.card{background:var(--panel);border:1px solid var(--line);border-radius:16px;padding:16px}.file{font-weight:900;word-break:break-word;margin-bottom:12px}.path{margin-top:10px;padding:12px;border-radius:12px;background:#0d0f14;border:1px solid var(--line);font-size:13px;line-height:1.5}.path strong{color:var(--gold)}.actions{display:grid;gap:10px;margin:14px 0}.btn{display:block;width:100%;border:0;border-radius:12px;padding:15px 16px;text-align:center;text-decoration:none;font-weight:900;font-size:16px;cursor:pointer}.primary{background:var(--gold);color:#111}.secondary{background:#252936;color:#fff;border:1px solid var(--line)}.success{background:var(--green);color:#06120a}pre{white-space:pre-wrap;word-break:break-word;line-height:1.5;background:#0d0f14;border:1px solid var(--line);border-radius:12px;padding:14px;max-height:none;overflow:auto;font-family:Arial,Helvetica,sans-serif;font-size:14px}#status{min-height:24px;margin-top:8px;font-weight:900;color:var(--gold)}
</style>
</head>
<body>
<main>
  <div class="top"><div><div class="brand">PowerFit 360 CPS</div><div class="muted">Documento seguro del tomo</div></div></div>
  <section class="card">
    <div class="file">${esc(filename)}</div>
    <div class="muted">El documento se abrió en esta misma pestaña. Puedes guardarlo o compartirlo usando Android.</div>
    <div class="path"><strong>Ruta habitual en Android/Huawei:</strong><br>Almacenamiento interno → Download / Descargas → ${esc(filename)}<br><span class="muted">La ubicación exacta la decide Android o el navegador. PowerFit no puede leer ni forzar una carpeta privada del teléfono.</span></div>
    <div class="actions">
      <button id="saveBtn" class="btn primary">GUARDAR EN EL DISPOSITIVO</button>
      <button id="shareBtn" class="btn success">COMPARTIR / GUARDAR CON ANDROID</button>
      <button id="backBtn" class="btn secondary">VOLVER A CPS</button>
    </div>
    <div id="status">Archivo listo para guardar.</div>
    <pre id="doc">${esc(content)}</pre>
  </section>
</main>
<script>
const filename=${JSON.stringify(filename)};
const content=${JSON.stringify(content)};
const status=document.getElementById('status');
const saveBtn=document.getElementById('saveBtn');
function makeFile(){return new File([content],filename,{type:'text/plain;charset=utf-8'});}
function makeBlobUrl(){return URL.createObjectURL(new Blob([content],{type:'text/plain;charset=utf-8'}));}
async function saveWithPicker(){
  if(typeof window.showSaveFilePicker!=='function')return false;
  const handle=await window.showSaveFilePicker({
    suggestedName:filename,
    types:[{description:'Documento de texto CPS',accept:{'text/plain':['.txt']}}]
  });
  const writable=await handle.createWritable();
  await writable.write(content);
  await writable.close();
  return true;
}
saveBtn.addEventListener('click',async()=>{
  saveBtn.disabled=true;
  status.textContent='Preparando archivo...';
  try{
    status.textContent='Guardando...';
    try{
      const saved=await saveWithPicker();
      if(saved){status.textContent='Archivo guardado. Android te permitió elegir la ubicación.';return;}
    }catch(pickerError){
      if(pickerError && pickerError.name==='AbortError'){status.textContent='Guardado cancelado.';return;}
    }
    const url=makeBlobUrl();
    const a=document.createElement('a');
    a.href=url;a.download=filename;a.rel='noopener';
    document.body.appendChild(a);a.click();a.remove();
    status.textContent='Solicitud de descarga enviada. Revisa Descargas / Download.';
    setTimeout(()=>URL.revokeObjectURL(url),60000);
  }catch(e){
    status.textContent='Tu navegador bloqueó el guardado directo. Usa COMPARTIR / GUARDAR CON ANDROID.';
  }finally{
    saveBtn.disabled=false;
  }
});
document.getElementById('shareBtn').addEventListener('click',async()=>{
  status.textContent='Abriendo opciones de Android...';
  try{
    const file=makeFile();
    if(navigator.canShare && navigator.canShare({files:[file]}) && navigator.share){
      await navigator.share({files:[file],title:filename,text:'Documento CPS PowerFit 360'});
      status.textContent='Archivo enviado al selector de Android. Elige Archivos/Files o la carpeta donde quieras guardarlo.';
      return;
    }
    status.textContent='Este navegador no permite compartir archivos. Usa GUARDAR EN EL DISPOSITIVO.';
  }catch(e){
    if(e && e.name==='AbortError')status.textContent='Acción cancelada.';
    else status.textContent='No se pudo abrir el selector de Android.';
  }
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
