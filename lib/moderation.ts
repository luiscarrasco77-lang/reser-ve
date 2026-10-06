import { generateText, Output } from 'ai'
import { z } from 'zod'
import { asc, eq } from 'drizzle-orm'
import { getDb } from './db'
import { bookings, conversations, messages, moderationFlags, posadas, users } from './db/schema'
import { AI_MODEL } from './constants'
import { emailAdminModeration } from './email'

// ─── Agente moderador ─────────────────────────────────────────────────────────
// Revisa cada mensaje de los chats viajero ↔ posadero y avisa a los admins si detecta:
//  · intentos de llevar la reserva o el pago fuera de RESER-VE (desintermediación),
//  · ofertas de precio distintas al publicado (precios desleales / falta de paridad),
//  · conductas inapropiadas (acoso, insultos, estafa).
// No bloquea ni borra mensajes: solo crea una alerta para que un humano la revise.

const RULES = `Eres el moderador de RESER-VE, una plataforma de reservas de posadas en Venezuela.
Analizas UN mensaje de un chat entre un viajero y un posadero, con el contexto de la conversación.

Reglas de la plataforma:
- Toda reserva y su pago deben hacerse a través de RESER-VE. El posadero cobra al viajero directamente (Zelle, Pago Móvil, transferencia, efectivo) SOLO por reservas hechas en RESER-VE.
- Está PERMITIDO y es normal: compartir datos de pago (correo de Zelle, teléfono de Pago Móvil, cuenta bancaria) para la reserva hecha en RESER-VE; coordinar la llegada, indicaciones, horarios, desayuno, tours.
- Está PROHIBIDO: proponer reservar o pagar por fuera ("escríbeme al WhatsApp y te sale más barato", "la próxima reserva hazla directo conmigo", "cancela aquí y te la hago por Instagram"), compartir contacto para seguir la relación fuera de la plataforma sin relación con la reserva actual, ofrecer un precio distinto al publicado o descuentos que no están en RESER-VE (paridad de precios), pedir pagos extra no acordados.
- También es una falta: insultos, acoso, amenazas, contenido sexual, discriminación o intentos de estafa.

Si el mensaje no incumple nada, flag=false. Sé prudente: no marques mensajes normales de coordinación o de pago de la reserva actual.`

const Verdict = z.object({
  flag: z.boolean().describe('true si el mensaje incumple las reglas'),
  kind: z.enum(['fuera_de_plataforma', 'precio', 'conducta', 'ninguno']),
  severity: z.enum(['media', 'alta']).describe('alta: intento claro y explícito; media: sospechoso o ambiguo'),
  reason: z.string().describe('Explicación breve en español para el admin (máx. 2 frases)'),
})

export async function moderateMessage(messageId: number) {
  const db = getDb()
  const [msg] = await db.select().from(messages).where(eq(messages.id, messageId))
  if (!msg) return
  const [conv] = await db.select().from(conversations).where(eq(conversations.id, msg.conversationId))
  if (!conv || conv.type !== 'booking') return

  // Contexto: últimos mensajes, posada y precio publicado.
  const history = (await db.select().from(messages).where(eq(messages.conversationId, conv.id)).orderBy(asc(messages.createdAt)))
    .filter(m => m.id < msg.id).slice(-8)
  let posadaInfo = ''
  let posadaId: number | null = null
  if (conv.bookingId) {
    const [b] = await db.select({ posadaId: bookings.posadaId, total: bookings.totalPrice, nights: bookings.nights }).from(bookings).where(eq(bookings.id, conv.bookingId))
    if (b) {
      const [p] = await db.select({ nombre: posadas.nombre, precio: posadas.precio }).from(posadas).where(eq(posadas.id, b.posadaId))
      posadaId = b.posadaId
      if (p) posadaInfo = `Posada: ${p.nombre}. Precio publicado: $${p.precio}/noche. Reserva en RESER-VE: ${b.nights} noches, total $${b.total}.`
    }
  }
  const role = (r: string) => r === 'host' ? 'Posadero' : r === 'admin' ? 'Equipo RESER-VE' : 'Viajero'
  const prompt = `${posadaInfo}
Conversación previa:
${history.map(m => `${role(m.senderRole)}: ${m.body.slice(0, 500)}`).join('\n') || '(sin mensajes previos)'}

MENSAJE A EVALUAR (${role(msg.senderRole)}):
${msg.body.slice(0, 2000)}`

  try {
    const { output } = await generateText({ model: AI_MODEL, system: RULES, prompt, output: Output.object({ schema: Verdict }) })
    if (!output?.flag || output.kind === 'ninguno') return
    await db.insert(moderationFlags).values({
      kind: output.kind, severity: output.severity, reason: output.reason.slice(0, 500),
      excerpt: msg.body.slice(0, 500), conversationId: conv.id, messageId: msg.id, posadaId, userId: msg.senderId,
    })
    const admins = await db.select({ email: users.email }).from(users).where(eq(users.role, 'admin'))
    await emailAdminModeration({
      to: admins.map(a => a.email), kind: output.kind, severity: output.severity, reason: output.reason,
      excerpt: msg.body, who: `${msg.senderName} (${role(msg.senderRole).toLowerCase()})`, conversationId: conv.id,
    })
  } catch (e) {
    console.error('[moderacion] fallo al analizar', e)
  }
}
