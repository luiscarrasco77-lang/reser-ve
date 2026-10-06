import { NextRequest, NextResponse } from 'next/server'
import { parseId } from '@/lib/http'
import { getDb } from '@/lib/db'
import { conversations, messages, users, bookings, posadas } from '@/lib/db/schema'
import { auth } from '@/auth'
import { eq, asc } from 'drizzle-orm'

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const userId = parseInt((session.user as any).id)
  const role = (session.user as any).role
  const db = getDb()

  const convId = parseId(id)
  if (!convId) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const [conv] = await db.select().from(conversations).where(eq(conversations.id, convId))
  if (!conv) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Access check: participant or admin
  const isParticipant = conv.userId === userId || conv.hostId === userId
  if (!isParticipant && role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const msgs = await db.select().from(messages)
    .where(eq(messages.conversationId, conv.id))
    .orderBy(asc(messages.createdAt))

  // Marca como leídos (solo si quien lee es participante: un admin revisando no los marca).
  const unread = isParticipant ? msgs.filter(m => !m.readAt && m.senderId !== userId) : []
  if (unread.length > 0) {
    await Promise.all(unread.map(m =>
      db.update(messages).set({ readAt: new Date() }).where(eq(messages.id, m.id))
    ))
  }

  // Nombre de la posada de la reserva asociada (para "Relacionado con").
  let posadaNombre: string | null = null
  if (conv.bookingId) {
    const [row] = await db.select({ nombre: posadas.nombre }).from(bookings)
      .innerJoin(posadas, eq(posadas.id, bookings.posadaId)).where(eq(bookings.id, conv.bookingId))
    posadaNombre = row?.nombre ?? null
  }
  // Para el admin: ficha de quién abrió la conversación (y del posadero si es un chat de reserva).
  let context = null
  if (role === 'admin') {
    const person = async (id: number | null) => {
      if (!id) return null
      const [u] = await db.select({ id: users.id, name: users.name, email: users.email, role: users.role, createdAt: users.createdAt }).from(users).where(eq(users.id, id))
      if (!u) return null
      const bks = await db.select({ code: bookings.bookingCode, status: bookings.status, checkIn: bookings.checkIn }).from(bookings).where(eq(bookings.guestId, id))
      const hosted = await db.select({ nombre: posadas.nombre }).from(posadas).where(eq(posadas.hostId, id))
      return { ...u, bookings: bks.length, activeBookings: bks.filter(b => b.status === 'pending' || b.status === 'confirmed').map(b => `${b.code} (${b.checkIn})`), posadas: hosted.map(h => h.nombre) }
    }
    context = { user: await person(conv.userId), host: await person(conv.hostId) }
  }
  return NextResponse.json({ ...conv, posadaNombre, context, viewerIsAdmin: role === 'admin', messages: msgs })
}
