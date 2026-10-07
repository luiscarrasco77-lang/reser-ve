import { and, eq } from 'drizzle-orm'
import { getDb } from '@/lib/db'
import { conversations } from '@/lib/db/schema'

// Devuelve el chat de una reserva (huésped ↔ posadero) y lo crea si aún no existe.
export async function ensureBookingConversation(b: { id: number; guestId: number; bookingCode: string }, p: { hostId: number; nombre: string }) {
  const db = getDb()
  const [existing] = await db.select({ id: conversations.id }).from(conversations).where(and(
    eq(conversations.type, 'booking'), eq(conversations.userId, b.guestId), eq(conversations.hostId, p.hostId), eq(conversations.bookingId, b.id),
  ))
  if (existing) return { id: existing.id, created: false }
  const [conv] = await db.insert(conversations).values({
    type: 'booking', userId: b.guestId, hostId: p.hostId, bookingId: b.id,
    subject: `${p.nombre} · ${b.bookingCode}`, lastMessageAt: new Date(),
  }).returning({ id: conversations.id })
  return { id: conv.id, created: true }
}
