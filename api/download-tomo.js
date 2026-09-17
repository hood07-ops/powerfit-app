import { Buffer } from 'node:buffer';

const MAX_CONTENT_BYTES = 2 * 1024 * 1024;

function safeFilename(value) {
  const base = String(value || 'CPS_Tomo_Estudio.txt')
    .replace(/[^a-zA-Z0-9._-]+/g, '_')
    .replace(/^\.+/, '')
    .slice(0, 120);
  return base || 'CPS_Tomo_Estudio.txt';
}

async function readRawBody(req) {
  if (typeof req.body === 'string') return req.body;
  if (Buffer.isBuffer(req.body)) return req.body.toString('utf8');
  if (req.body && typeof req.body === 'object') return null;

  let raw = '';
  for await (const chunk of req) {
    raw += chunk.toString('utf8');
    if (Buffer.byteLength(raw, 'utf8') > MAX_CONTENT_BYTES + 64 * 1024) {
      throw new Error('PAYLOAD_TOO_LARGE');
    }
  }
  return raw;
}

function parseBodyObject(body) {
  if (!body || typeof body !== 'object' || Buffer.isBuffer(body)) return null;
  return {
    filename: body.filename,
    content: body.content,
  };
}

function parseRawBody(raw, contentType) {
  if (!raw) return { filename: null, content: null };

  if (String(contentType || '').includes('application/json')) {
    const parsed = JSON.parse(raw);
    return { filename: parsed?.filename, content: parsed?.content };
  }

  const params = new URLSearchParams(raw);
  return {
    filename: params.get('filename'),
    content: params.get('content'),
  };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'METHOD_NOT_ALLOWED' });
  }

  try {
    const objectBody = parseBodyObject(req.body);
    const raw = objectBody ? null : await readRawBody(req);
    const parsed = objectBody || parseRawBody(raw, req.headers['content-type']);
    const filename = safeFilename(parsed.filename);
    const content = String(parsed.content || '');

    if (!content.trim()) {
      return res.status(400).json({ error: 'EMPTY_CONTENT' });
    }

    if (Buffer.byteLength(content, 'utf8') > MAX_CONTENT_BYTES) {
      return res.status(413).json({ error: 'CONTENT_TOO_LARGE' });
    }

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Cache-Control', 'private, no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    return res.status(200).send(content);
  } catch (error) {
    const status = error?.message === 'PAYLOAD_TOO_LARGE' ? 413 : 400;
    return res.status(status).json({ error: error?.message || 'INVALID_REQUEST' });
  }
}
