export const CPS_VIDEO_BUCKET = 'cps-technique-videos';

export const VIDEO_ACCEPTED_MIME_TYPES = Object.freeze([
  'video/mp4',
  'video/quicktime',
  'video/webm',
]);

export const DEFAULT_MAX_VIDEO_BYTES = 250 * 1024 * 1024;

export function buildTechniqueVideoPath({ alumnoId, routeCode, cardId, attemptNo, extension = 'mp4' }) {
  const cleanRoute = String(routeCode || '').trim().toUpperCase();
  const cleanExt = String(extension || 'mp4').replace(/[^a-z0-9]/gi, '').toLowerCase() || 'mp4';
  const ids = [alumnoId, cardId, attemptNo].map(Number);

  if (!cleanRoute || ids.some((value) => !Number.isInteger(value) || value <= 0)) {
    throw new Error('alumnoId, routeCode, cardId and attemptNo are required');
  }

  return `${ids[0]}/${cleanRoute}/${ids[1]}/attempt-${ids[2]}.${cleanExt}`;
}

export function validateTechniqueVideoFile(fileLike, { maxBytes = DEFAULT_MAX_VIDEO_BYTES } = {}) {
  if (!fileLike) return { ok: false, reason: 'VIDEO_FILE_REQUIRED' };
  const type = String(fileLike.type || '').toLowerCase();
  const size = Number(fileLike.size || 0);

  if (!VIDEO_ACCEPTED_MIME_TYPES.includes(type)) {
    return { ok: false, reason: 'VIDEO_TYPE_NOT_ALLOWED' };
  }
  if (!Number.isFinite(size) || size <= 0) {
    return { ok: false, reason: 'VIDEO_FILE_EMPTY' };
  }
  if (size > maxBytes) {
    return { ok: false, reason: 'VIDEO_FILE_TOO_LARGE' };
  }
  return { ok: true, reason: null };
}

export function nextAttemptNumber(submissions = []) {
  const attempts = submissions.map((item) => Number(item?.attempt_no || 0)).filter(Number.isFinite);
  return Math.max(0, ...attempts) + 1;
}
