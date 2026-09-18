import { useMemo, useState } from 'react'
import { buildChatPayload, CHAT_SURFACES } from '@powerfit/ai-chat'
import { supabase } from '../supabase'

export default function ChatWidget({ student, idioma = 'es' }) {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [messages, setMessages] = useState(() => [
    {
      role: 'assistant',
      content:
        idioma === 'en'
          ? 'Hi. I can help with PowerFit360, CPS, training plans, videos, evaluations and memberships.'
          : 'Hola. Puedo ayudarte con PowerFit360, CPS, planificaciones, videos, evaluaciones y mensualidades.',
    },
  ])

  const title = useMemo(
    () => (idioma === 'en' ? 'PowerFit Assistant' : 'Asistente PowerFit'),
    [idioma],
  )

  const suggestions = idioma === 'en'
    ? ['How many AI generations do I have?', 'How do I generate a workout?', 'Where do I upload a CPS video?', 'How do I advance in CPS?']
    : ['¿Cuántas generaciones IA tengo?', '¿Cómo genero una planificación?', '¿Dónde subo un video CPS?', '¿Cómo avanzo en CPS?']

  async function openChatGPT() {
    const transcript = messages
      .slice(-8)
      .map((item) => `${item.role === 'assistant' ? 'Dastan' : 'Usuario'}: ${item.content}`)
      .join('\n')
    const context = [
      'Quiero continuar esta conversación en ChatGPT con Dastan.',
      'Contexto: estoy usando PowerFit360 / CPS.',
      student?.id ? `Alumno ID interno: ${student.id}` : 'Usuario público/no autenticado.',
      'Conversación reciente:',
      transcript,
      'Continúa ayudándome desde este punto y no asumas que puedes ejecutar acciones en la app salvo que una herramienta conectada lo permita.',
    ].join('\n\n')

    try {
      await navigator.clipboard.writeText(context)
    } catch {
      // If clipboard is unavailable, ChatGPT still opens and the user can continue manually.
    }
    window.open('https://chatgpt.com/', '_blank', 'noopener,noreferrer')
  }

  async function sendText(messageText) {
    const message = String(messageText || '').trim()
    if (!message || sending) return

    const nextMessages = [...messages, { role: 'user', content: message }]
    setMessages(nextMessages)
    setInput('')
    setSending(true)

    try {
      const { data, error } = await supabase.functions.invoke('powerfit-chat', {
        body: buildChatPayload({
          message,
          surface: CHAT_SURFACES.POWERFIT,
          locale: idioma,
          history: messages,
          alumnoId: student?.id || null,
        }),
      })

      if (error) throw error

      setMessages((current) => [
        ...current,
        {
          role: 'assistant',
          content:
            data?.reply ||
            (idioma === 'en'
              ? 'I could not prepare a response.'
              : 'No pude preparar una respuesta.'),
        },
      ])
    } catch {
      setMessages((current) => [
        ...current,
        {
          role: 'assistant',
          content:
            idioma === 'en'
              ? 'The assistant is temporarily unavailable. You can still use the rest of the app normally.'
              : 'El asistente está temporalmente no disponible. El resto de la app sigue funcionando con normalidad.',
        },
      ])
    } finally {
      setSending(false)
    }
  }

  async function send() {
    await sendText(input)
  }

  return (
    <>
      {open && (
        <section className="fixed bottom-24 right-3 sm:right-5 z-[80] w-[calc(100vw-24px)] sm:w-[380px] h-[min(68vh,620px)] bg-zinc-950 border border-red-600/70 rounded-3xl shadow-2xl shadow-black/60 flex flex-col overflow-hidden">
          <header className="px-4 py-3 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between gap-3">
            <div>
              <p className="font-black text-white">{title}</p>
              <p className="text-xs text-zinc-400">
                {student?.nombre
                  ? student.nombre
                  : idioma === 'en'
                    ? 'General help'
                    : 'Ayuda general'}
              </p>
            </div>
            <button
              type="button"
              aria-label={idioma === 'en' ? 'Close assistant' : 'Cerrar asistente'}
              onClick={() => setOpen(false)}
              className="w-9 h-9 rounded-full bg-zinc-800 hover:bg-zinc-700 font-black"
            >
              ×
            </button>
          </header>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((item, index) => (
              <div
                key={index}
                className={
                  item.role === 'user'
                    ? 'ml-10 rounded-2xl rounded-br-md bg-red-600 px-4 py-3 text-sm text-white'
                    : 'mr-8 rounded-2xl rounded-bl-md bg-zinc-800 px-4 py-3 text-sm text-zinc-100'
                }
              >
                {item.content}
              </div>
            ))}
            {sending && (
              <div className="mr-8 rounded-2xl bg-zinc-800 px-4 py-3 text-sm text-zinc-400">
                {idioma === 'en' ? 'Thinking…' : 'Pensando…'}
              </div>
            )}
          </div>

          <div className="px-3 pt-2 border-t border-zinc-800 bg-black">
            <div className="flex gap-2 overflow-x-auto pb-2">
              {suggestions.map((question) => (
                <button
                  key={question}
                  type="button"
                  onClick={() => sendText(question)}
                  disabled={sending}
                  className="shrink-0 rounded-full border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs text-zinc-200 hover:border-red-500 disabled:opacity-40"
                >
                  {question}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={openChatGPT}
              className="mb-2 w-full rounded-2xl border border-green-600/70 bg-green-950/40 px-3 py-2 text-sm font-black text-green-300 hover:bg-green-900/50"
            >
              {idioma === 'en' ? 'Continue with Dastan in ChatGPT' : 'Continuar con Dastan en ChatGPT'}
            </button>
          </div>

          <form
            className="p-3 bg-black flex gap-2"
            onSubmit={(event) => {
              event.preventDefault()
              send()
            }}
          >
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              maxLength={2000}
              placeholder={idioma === 'en' ? 'Ask something…' : 'Pregunta algo…'}
              className="min-w-0 flex-1 rounded-2xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm outline-none focus:border-red-500"
            />
            <button
              type="submit"
              disabled={!input.trim() || sending}
              className="rounded-2xl bg-red-600 px-4 py-3 font-black disabled:opacity-40"
            >
              {idioma === 'en' ? 'Send' : 'Enviar'}
            </button>
          </form>
        </section>
      )}

      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="fixed bottom-14 right-3 sm:right-5 z-[80] rounded-full bg-red-600 hover:bg-red-700 border border-red-400 px-5 py-3 font-black shadow-xl shadow-black/50"
      >
        {open ? '×' : idioma === 'en' ? 'Chat' : 'Chat'}
      </button>
    </>
  )
}
