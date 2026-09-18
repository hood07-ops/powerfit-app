import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const TEXT_EXT = new Set(['.js','.jsx','.ts','.tsx','.mjs','.cjs','.json','.html','.md','.yml','.yaml','.env']);
const SKIP = new Set(['node_modules','.git','dist','dist-ssr','android','build','.vercel']);
const forbidden = [
  /SUPABASE_SERVICE_ROLE_KEY\s*=/i,
  /SUPABASE_SECRET_KEYS\s*=/i,
  /OPENAI_API_KEY\s*=/i,
  /MP_ACCESS_TOKEN\s*=/i,
  /VERCEL_TOKEN\s*=/i,
  /-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  /\bsk-[A-Za-z0-9_-]{20,}\b/,
  /\bsb_secret_[A-Za-z0-9_-]{20,}\b/,
];

const clientRoots = [
  path.join(ROOT,'apps','powerfit360'),
  path.join(ROOT,'apps','cps'),
];

let failed = false;
const findings = [];

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const entry of fs.readdirSync(dir, {withFileTypes:true})) {
    if (SKIP.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out;
}

for (const base of clientRoots) {
  for (const file of walk(base)) {
    const ext = path.extname(file);
    if (!TEXT_EXT.has(ext) && !path.basename(file).startsWith('.env')) continue;
    const text = fs.readFileSync(file,'utf8');
    for (const rx of forbidden) {
      if (rx.test(text)) {
        findings.push({file:path.relative(ROOT,file), rule:String(rx)});
        failed = true;
      }
    }
  }
}

const trackedEnvFiles = walk(ROOT).filter(f => path.basename(f).startsWith('.env'));
for (const file of trackedEnvFiles) {
  const rel = path.relative(ROOT,file);
  if (rel.includes('node_modules')) continue;
  const text = fs.readFileSync(file,'utf8');
  for (const line of text.split(/\r?\n/)) {
    const m=line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (!m) continue;
    const [,name,value]=m;
    const allowed =
      name.startsWith('VITE_') &&
      !/SERVICE_ROLE|SECRET|OPENAI|MP_ACCESS|VERCEL_TOKEN/i.test(name);
    if (!allowed && value.trim()) {
      findings.push({file:rel, rule:`unexpected env variable ${name}`});
      failed = true;
    }
  }
}

if (findings.length) {
  console.error('Security check failed:');
  for (const f of findings) console.error(`- ${f.file}: ${f.rule}`);
}

if (failed) process.exit(1);
console.log('Security check passed: no private server credentials detected in client files.');
