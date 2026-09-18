export const CHAT_SURFACES = Object.freeze({
  POWERFIT: 'powerfit360',
  CPS: 'cps',
  WEB: 'web',
})

export const CHAT_LIMITS = Object.freeze({
  maxMessageChars: 2000,
  maxHistoryItems: 8,
})

export function normalizeChatHistory(history = []) {
  return history
    .slice(-CHAT_LIMITS.maxHistoryItems)
    .map((item) => ({
      role: item?.role === 'assistant' ? 'assistant' : 'user',
      content: String(item?.content || '').slice(0, 1500),
    }))
    .filter((item) => item.content)
}

export function buildChatPayload({ message, surface = CHAT_SURFACES.WEB, locale = 'es', history = [], alumnoId = null }) {
  return {
    message: String(message || '').trim().slice(0, CHAT_LIMITS.maxMessageChars),
    surface,
    locale: String(locale || 'es').toLowerCase().startsWith('en') ? 'en' : 'es',
    history: normalizeChatHistory(history),
    ...(alumnoId ? { alumno_id: Number(alumnoId) } : {}),
  }
}

export * from './chatgpt-tools.js'
