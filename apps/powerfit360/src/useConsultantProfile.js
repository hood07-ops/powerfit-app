import { useSyncExternalStore } from 'react'
import { createConsultationMemory } from '@powerfit/training-engine'

const memory = createConsultationMemory()
export function consultantScope(student, viewerId = null) {
  return JSON.stringify([viewerId, student?.gimnasio_id || null, student?.user_id || null, student?.id || 'public'])
}

export function useConsultantProfile(student, viewerId = null) {
  const key = consultantScope(student, viewerId)
  const state = useSyncExternalStore(
    (callback) => memory.subscribe(key, callback),
    () => memory.read(key),
  )
  return {
    ...state,
    updateProfile: (patch) => memory.update(key, patch),
    addRecord: (record) => memory.addRecord(key, record),
    resetConsultation: () => memory.reset(key),
  }
}
