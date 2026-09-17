export const TRAINING_SESSION_STATUS = Object.freeze(['PLANNED','IN_PROGRESS','COMPLETED','SKIPPED']);
export const SESSION_INTENSITY_SCALE = Object.freeze({ MIN: 1, MAX: 10 });

export function calculateSessionLoad({ durationMinutes, srpe }) {
  const duration = Number(durationMinutes);
  const intensity = Number(srpe);
  if (!Number.isFinite(duration) || duration < 0) throw new Error('Invalid durationMinutes');
  if (!Number.isFinite(intensity) || intensity < 1 || intensity > 10) throw new Error('Invalid sRPE');
  return Math.round(duration * intensity);
}

export function completionPercent({ completed, total }) {
  const done = Number(completed);
  const count = Number(total);
  if (!Number.isFinite(done) || !Number.isFinite(count) || count <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((done / count) * 100)));
}
