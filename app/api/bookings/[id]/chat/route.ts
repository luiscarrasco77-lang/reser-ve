import { NextRequest, NextResponse } from 'next/server'
import { and, eq } from 'drizzle-orm'
import { auth } from '@/auth'
import { getDb } from '@/lib/db'
import { bookings, conversations, posadas } from '@/lib/db/schema'
import { parseId } from '@/lib/http'

// Abre (o crea) el chat de una reserva. Lo pueden usar el huésped, el posadero o un admin.
// Así el posadero puede escribir primero (p. ej. para enviar sus datos de pago).
export async function POST(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const bookingId = parseId((await params).id)
  if (!bookingId) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const userId = parseInt((session.user as any).id)
  const role = (session.user as any).role

  const db = getDb()
  const [b] = await db.select().from(bookings).where(eq(bookings.id, bookingId))
  if (!b) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const [p] = await db.select({ hostId: posadas.hostId, nombre: posadas.nombre }).from(posadas).where(eq(posadas.id, b.posadaId))
  if (!p?.hostId) return NextResponse.json({ error: 'Esta posada no tiene posadero asignado' }, { status: 400 })
  if (b.guestId !== userId && p.hostId !== userId && role !== 'admin') return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const [existing] = await db.select({ id: conversations.id }).from(conversations).where(and(
    eq(conversations.type, 'booking'), eq(conversations.userId, b.guestId), eq(conversations.hostId, p.hostId), eq(conversations.bookingId, b.id),
  ))
  if (existing) return NextResponse.json({ id: existing.id })
  const [conv] = await db.insert(conversations).values({
    type: 'booking', userId: b.guestId, hostId: p.hostId, bookingId: b.id,
    subject: `${p.nombre} · ${b.bookingCode}`, lastMessageAt: new Date(),
  }).returning({ id: conversations.id })
  return NextResponse.json({ id: conv.id }, { status: 201 })
}
