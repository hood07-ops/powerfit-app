import { normalizeConsultantProfile } from './adaptivePlanning.js'

// Explicitly ephemeral: no localStorage, cookies, backend writes or cross-tab sync.
export function createConsultationMemory() {
  const entries = new Map()
  const listeners = new Map()
  function read(key) {
    if (!entries.has(key)) entries.set(key, Object.freeze({ profile: Object.freeze(normalizeConsultantProfile()), records: Object.freeze([]) }))
    return entries.get(key)
  }
  function emit(key, next) {
    entries.set(key, Object.freeze(next))
    listeners.get(key)?.forEach((callback) => callback())
    return next
  }
  return {
    read,
    subscribe(key, callback) {
      if (!listeners.has(key)) listeners.set(key, new Set())
      listeners.get(key).add(callback)
      return () => { listeners.get(key)?.delete(callback) }
    },
    update(key, patch) {
      const current = read(key)
      // A subsequent goal/equipment edit cannot dismiss an existing review flag.
      const profile = normalizeConsultantProfile({ ...current.profile, ...patch, needsReview: current.profile.needsReview || patch.needsReview === true })
      return emit(key, { ...current, profile: Object.freeze(profile) })
    },
    addRecord(key, record) {
      if (record?.status !== 'completed' || !Number.isFinite(record.durationMinutes) || record.durationMinutes <= 0 || record.durationMinutes > 300 || !Number.isFinite(record.srpe) || record.srpe < 1 || record.srpe > 10) throw new Error('Registro incompleto o fuera de rango.')
      const current = read(key)
      const safeRecord = Object.freeze({ status: 'completed', durationMinutes: record.durationMinutes, srpe: record.srpe, reportedConcern: record.reportedConcern === true })
      return emit(key, { profile: Object.freeze({ ...current.profile, needsReview: current.profile.needsReview || safeRecord.reportedConcern }), records: Object.freeze([...current.records.slice(-29), safeRecord]) })
    },
    // Ending a consultation clears it; it never means a human approved a plan.
    reset(key) {
      return emit(key, { profile: Object.freeze(normalizeConsultantProfile()), records: Object.freeze([]) })
    },
  }
}
