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
:root{color-scheme:dark;--bg:#08090c;--panel:#17191f;--line:#343947;--gold:#ffc400;--text:#f7f7fb;--muted:#b7bdca;--green:#19c463;--red:#ef233c}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--text);font-family:Arial,Helvetica,sans-serif}main{max-width:820px;margin:0 auto;padding:18px 14px 40px}.brand{font-weight:900;color:var(--gold);font-size:22px}.muted{color:var(--muted);font-size:13px;line-height:1.5}.card{margin-top:14px;background:var(--panel);border:1px solid var(--line);border-radius:16px;padding:16px}.file{font-weight:900;word-break:break-word;margin-bottom:10px}.status{margin:14px 0;padding:14px;border-radius:12px;background:#0d0f14;border:1px solid var(--line);font-weight:900;color:var(--gold);line-height:1.5}.actions{display:grid;gap:10px}.btn{width:100%;border:0;border-radius:12px;padding:15px 16px;font-weight:900;font-size:16px;cursor:pointer}.primary{background:var(--gold);color:#111}.secondary{background:#252936;color:#fff;border:1px solid var(--line)}.error{color:#ffd4da;border-color:var(--red)}pre{white-space:pre-wrap;word-break:break-word;line-height:1.5;background:#0d0f14;border:1px solid var(--line);border-radius:12px;padding:14px;font-family:Arial,Helvetica,sans-serif;font-size:14px;margin-top:14px}
</style>
</head>
<body>
<main>
  <div class="brand">PowerFit 360 CPS</div>
  <div class="muted">Descarga segura del tomo</div>
  <section class="card">
    <div class="file">${esc(filename)}</div>
    <div class="muted">PowerFit creará un archivo real en almacenamiento privado y abrirá una URL segura de descarga en esta misma pestaña.</div>
    <div id="status" class="status">Preparando descarga real...</div>
    <div class="actions">
      <button id="retryBtn" class="btn primary">REINTENTAR DESCARGA REAL</button>
      <button id="backBtn" class="btn secondary">VOLVER A CPS</button>
    </div>
    <pre>${esc(content)}</pre>
  </section>
</main>
<script type="module">
import{createClient}from"https://esm.sh/@supabase/supabase-js@2.105.4";
const supabase=createClient("https://sabsmurhriohwmczaktn.supabase.co","sb_publishable_tj-oblYhYqN5sKWFrrxe1g_NzimyN0p");
const filename=${JSON.stringify(filename)};
const content=${JSON.stringify(content)};
const statusEl=document.getElementById('status');
const retryBtn=document.getElementById('retryBtn');
let busy=false;

function setStatus(text,isError=false){statusEl.textContent=text;statusEl.classList.toggle('error',isError);}

async function startRealDownload(){
  if(busy)return;
  busy=true;retryBtn.disabled=true;
  try{
    setStatus('1/4 Verificando sesión segura...');
    const{data:userData,error:userError}=await supabase.auth.getUser();
    if(userError||!userData.user)throw new Error('SESSION_REQUIRED');

    const path=userData.user.id+'/downloads/'+filename;
    setStatus('2/4 Creando archivo privado en PowerFit...');
    const blob=new Blob([content],{type:'text/plain'});
    const{error:uploadError}=await supabase.storage.from('cps-tomo-downloads').upload(path,blob,{contentType:'text/plain',cacheControl:'60',upsert:true});
    if(uploadError)throw uploadError;

    setStatus('3/4 Generando enlace HTTPS temporal...');
    const{data:signed,error:signedError}=await supabase.storage.from('cps-tomo-downloads').createSignedUrl(path,300);
    if(signedError||!signed?.signedUrl)throw signedError||new Error('SIGNED_URL_FAILED');

    const joiner=signed.signedUrl.includes('?')?'&':'?';
    const downloadUrl=signed.signedUrl+joiner+'download='+encodeURIComponent(filename);
    setStatus('4/4 Descarga enviada al navegador. Abriendo archivo real...');
    setTimeout(()=>location.replace(downloadUrl),250);
  }catch(error){
    const message=String(error?.message||error||'');
    if(message.includes('SESSION_REQUIRED'))setStatus('No encontré tu sesión de PowerFit. Vuelve a CPS, inicia sesión y reintenta.',true);
    else setStatus('No se pudo generar la descarga real: '+message,true);
    busy=false;retryBtn.disabled=false;
  }
}

retryBtn.addEventListener('click',startRealDownload);
document.getElementById('backBtn').addEventListener('click',()=>{location.href='/cps.html';});
startRealDownload();
</script>
</body>
</html>`;

  res.statusCode = 200;
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "no-referrer");
  return res.end(html);
}
