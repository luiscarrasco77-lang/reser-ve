import { NextRequest, NextResponse, after } from 'next/server'
import { parseId, readJson, rateLimit } from '@/lib/http'
import { getDb } from '@/lib/db'
import { conversations, messages, users } from '@/lib/db/schema'
import { auth } from '@/auth'
import { eq } from 'drizzle-orm'
import { emailNewMessage } from '@/lib/email'
import { generateVeraReply } from '@/lib/vera'
import { moderateMessage } from '@/lib/moderation'
import { MAX_MESSAGE } from '@/lib/constants'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const limited = rateLimit(req, 'msg', 60, 60 * 60_000)
  if (limited) return limited
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const userId = parseInt((session.user as any).id)
  const role = (session.user as any).role
  const { body } = await readJson(req)

  if (typeof body !== 'string' || !body.trim()) return NextResponse.json({ error: 'Mensaje vacío' }, { status: 400 })
  if (body.length > MAX_MESSAGE) return NextResponse.json({ error: `El mensaje no puede superar ${MAX_MESSAGE} caracteres` }, { status: 400 })
  const convId = parseId(id)
  if (!convId) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const db = getDb()

  const [conv] = await db.select().from(conversations).where(eq(conversations.id, convId))
  if (!conv) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const isParticipant = conv.userId === userId || conv.hostId === userId
  if (!isParticipant && role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const senderName = session.user.name ?? 'Usuario'

  const [msg] = await db.insert(messages).values({
    conversationId: conv.id,
    senderId: userId,
    senderName,
    senderRole: role,
    body: body.trim(),
  }).returning()

  // El agente moderador revisa los chats viajero ↔ posadero (no los de soporte ni del equipo).
  if (conv.type === 'booking' && role !== 'admin') after(() => moderateMessage(msg.id))

  // Update lastMessageAt on conversation
  await db.update(conversations).set({ lastMessageAt: new Date() }).where(eq(conversations.id, conv.id))

  // En tickets de soporte, Vera (IA) intenta responder al usuario.
  // No actúa si un admin humano ya tomó el caso (lógica en generateVeraReply).
  if (conv.type === 'support' && role !== 'admin') {
    await generateVeraReply(conv.id)
  }

  // Notify the other participant (fire-and-forget)
  const recipientId = conv.userId === userId ? conv.hostId : conv.userId
  if (recipientId) {
    after(async () => {
      const [recipient] = await db.select({ email: users.email, name: users.name }).from(users).where(eq(users.id, recipientId))
      if (recipient) {
        await emailNewMessage({
          recipientEmail: recipient.email,
          recipientName: recipient.name,
          senderName,
          subject: conv.subject,
          body: body.trim(),
          conversationId: conv.id,
        })
      }
    })
  } else if (role !== 'admin') {
    // Ticket de soporte: avisa a los admins.
    after(async () => {
      const admins = await db.select({ email: users.email, name: users.name }).from(users).where(eq(users.role, 'admin'))
      await Promise.all(admins.map(a => emailNewMessage({
        recipientEmail: a.email, recipientName: a.name, senderName,
        subject: `[Soporte] ${conv.subject}`, body: body.trim(), conversationId: conv.id,
      })))
    })
  }

  return NextResponse.json(msg, { status: 201 })
}
