import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { conversations, messages, users, bookings, posadas } from '@/lib/db/schema'
import { auth } from '@/auth'
import { eq, or, desc } from 'drizzle-orm'

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = parseInt((session.user as any).id)
  const role = (session.user as any).role
  const db = getDb()

  // Admins see all support conversations; others see their own
  let rows
  if (role === 'admin') {
    rows = await db.select().from(conversations).orderBy(desc(conversations.lastMessageAt))
  } else {
    rows = await db.select().from(conversations)
      .where(or(eq(conversations.userId, userId), eq(conversations.hostId, userId)))
      .orderBy(desc(conversations.lastMessageAt))
  }

  // Enrich with last message + unread count + participant names
  const enriched = await Promise.all(rows.map(async (conv) => {
    const [lastMsg] = await db.select().from(messages)
      .where(eq(messages.conversationId, conv.id))
      .orderBy(desc(messages.createdAt))
      .limit(1)

    const unread = (await db.select().from(messages)
      .where(eq(messages.conversationId, conv.id))).filter(
        m => !m.readAt && m.senderId !== userId
      ).length

    // Get participant names
    const [user1] = await db.select({ name: users.name }).from(users).where(eq(users.id, conv.userId))
    const host = conv.hostId
      ? (await db.select({ name: users.name }).from(users).where(eq(users.id, conv.hostId)))[0]
      : null

    // Get booking/posada info for booking conversations
    let posadaNombre: string | null = null
    if (conv.bookingId) {
      const [bk] = await db.select({ posadaId: bookings.posadaId }).from(bookings).where(eq(bookings.id, conv.bookingId!))
      if (bk) {
        const [pos] = await db.select({ nombre: posadas.nombre }).from(posadas).where(eq(posadas.id, bk.posadaId))
        posadaNombre = pos?.nombre ?? null
      }
    }

    return {
      ...conv,
      lastMessage: lastMsg ?? null,
      unread,
      userName: user1?.name ?? 'Usuario',
      hostName: host?.name ?? null,
      posadaNombre,
    }
  }))

  return NextResponse.json(enriched)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = parseInt((session.user as any).id)
  const { type, bookingId, hostId, subject, body } = await req.json()

  if (!type || !subject || !body) {
    return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
  }

  const db = getDb()

  // For booking conversations, verify the booking belongs to this user or their posada
  if (type === 'booking' && bookingId) {
    const [bk] = await db.select().from(bookings).where(eq(bookings.id, bookingId))
    if (!bk) return NextResponse.json({ error: 'Reserva no encontrada' }, { status: 404 })
  }

  const [conv] = await db.insert(conversations).values({
    type,
    bookingId: bookingId ?? null,
    userId,
    hostId: hostId ?? null,
    subject,
    lastMessageAt: new Date(),
  }).returning()

  // Insert the first message
  const userName = session.user.name ?? 'Usuario'
  const userRole = (session.user as any).role ?? 'traveler'
  await db.insert(messages).values({
    conversationId: conv.id,
    senderId: userId,
    senderName: userName,
    senderRole: userRole,
    body,
  })

  return NextResponse.json(conv, { status: 201 })
}
