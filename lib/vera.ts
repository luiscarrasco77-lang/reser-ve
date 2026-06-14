import { generateText, type ModelMessage } from 'ai'
import { eq, asc } from 'drizzle-orm'
import { getDb } from './db'
import { conversations, messages, users } from './db/schema'
import { SUPPORT_SYSTEM_PROMPT } from './support-kb'

const MODEL = 'anthropic/claude-haiku-4.5'
const VERA_EMAIL = 'vera@reser-ve.app'
const VERA_NAME = 'Vera · Asistente RESER-VE'

// Usuario "bot" que firma las respuestas de la IA dentro de /mensajes.
async function getVeraUserId(): Promise<number> {
  const db = getDb()
  const [existing] = await db.select().from(users).where(eq(users.email, VERA_EMAIL))
  if (existing) return existing.id
  const [created] = await db.insert(users).values({
    name: VERA_NAME, email: VERA_EMAIL, role: 'admin',
  }).returning()
  return created.id
}

/**
 * Genera y guarda una respuesta de Vera en un hilo de soporte.
 * - Solo actúa en conversaciones tipo "support".
 * - No responde si un admin HUMANO ya tomó el caso (no habla por encima de un humano).
 * - Si no puede resolver, escala con un mensaje claro (el ticket ya es visible para admins).
 * Falla en silencio (p.ej. sin AI_GATEWAY_API_KEY) para que un humano atienda.
 */
export async function generateVeraReply(conversationId: number): Promise<void> {
  try {
    const db = getDb()
    const [conv] = await db.select().from(conversations).where(eq(conversations.id, conversationId))
    if (!conv || conv.type !== 'support') return

    const veraId = await getVeraUserId()

    const history = await db.select().from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(asc(messages.createdAt))

    // Si un admin humano (distinto de Vera) ya respondió, Vera se retira.
    const humanTookOver = history.some(m => m.senderRole === 'admin' && m.senderId !== veraId)
    if (humanTookOver) return

    const modelMessages: ModelMessage[] = history.map(m => ({
      role: m.senderId === veraId ? 'assistant' : 'user',
      content: m.body,
    }))
    if (modelMessages.length === 0) return

    const system = SUPPORT_SYSTEM_PROMPT + `

# Estás dentro de un ticket de soporte (no el widget)
Responde como en un chat de ayuda. Sé concreta y resuelve si puedes.
Si el caso NO se puede resolver solo con información general (problema con un pago/reserva específica, queja, datos de una posada que no tienes, o el usuario pide una persona), responde brevemente reconociendo el caso y di EXACTAMENTE que has dejado el ticket para que un agente humano del equipo RESER-VE lo atienda pronto. No inventes soluciones.`

    const { text } = await generateText({
      model: MODEL,
      system,
      messages: modelMessages,
    })

    if (!text?.trim()) return

    await db.insert(messages).values({
      conversationId,
      senderId: veraId,
      senderName: VERA_NAME,
      senderRole: 'admin',
      body: text.trim(),
    })
    await db.update(conversations).set({ lastMessageAt: new Date() }).where(eq(conversations.id, conversationId))
  } catch {
    // Silencio: si la IA no está disponible, el ticket queda para un admin humano.
  }
}
