import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { conversations, messages, posadas } from '@/lib/db/schema'
import { and, eq } from 'drizzle-orm'
import { auth } from '@/auth'
import { emailNewMessage } from '@/lib/email'
import { users } from '@/lib/db/schema'

// Abre (o reutiliza) una conversación entre el viajero y el posadero de una posada.
// Permite "Contactar al posadero" desde la ficha o desde una reserva.
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Inicia sesión para contactar al posadero' }, { status: 401 })

  const userId = parseInt((session.user as any).id)
  const userName = session.user.name ?? 'Viajero'
  const userRole = (session.user as any).role
  const { posadaId, bookingId, message } = await req.json()
  if (!posadaId) return NextResponse.json({ error: 'posadaId requerido' }, { status: 400 })

  const db = getDb()
  const [posada] = await db.select().from(posadas).where(eq(posadas.id, posadaId))
  if (!posada) return NextResponse.json({ error: 'Posada no encontrada' }, { status: 404 })
  if (!posada.hostId) return NextResponse.json({ error: 'Esta posada aún no tiene un posadero asignado' }, { status: 400 })
  if (posada.hostId === userId) return NextResponse.json({ error: 'No puedes contactarte a ti mismo' }, { status: 400 })

  const subject = posada.nombre

  // Reutiliza una conversación existente para (viajero, posadero, posada) si la hay.
  const existing = await db.select().from(conversations).where(
    and(
      eq(conversations.type, 'booking'),
      eq(conversations.userId, userId),
      eq(conversations.hostId, posada.hostId),
      eq(conversations.subject, subject),
    ),
  )

  let conv = existing[0]
  if (!conv) {
    ;[conv] = await db.insert(conversations).values({
      type: 'booking',
      userId,
      hostId: posada.hostId,
      bookingId: bookingId ?? null,
      subject,
      lastMessageAt: new Date(),
    }).returning()
  }

  // Inserta el mensaje inicial (si se envió).
  if (message?.trim()) {
    await db.insert(messages).values({
      conversationId: conv.id, senderId: userId, senderName: userName, senderRole: userRole, body: message.trim(),
    })
    await db.update(conversations).set({ lastMessageAt: new Date() }).where(eq(conversations.id, conv.id))

    // Notifica al posadero (fire-and-forget).
    db.select({ email: users.email, name: users.name }).from(users).where(eq(users.id, posada.hostId))
      .then(([host]) => {
        if (host) emailNewMessage({ recipientEmail: host.email, recipientName: host.name, senderName: userName, subject, body: message.trim(), conversationId: conv.id })
      }).catch(() => {})
  }

  return NextResponse.json({ id: conv.id }, { status: 201 })
}
