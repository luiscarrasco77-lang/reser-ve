import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { conversations, messages, users } from '@/lib/db/schema'
import { auth } from '@/auth'
import { eq } from 'drizzle-orm'
import { emailNewMessage } from '@/lib/email'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const userId = parseInt((session.user as any).id)
  const role = (session.user as any).role
  const { body } = await req.json()

  if (!body?.trim()) return NextResponse.json({ error: 'Mensaje vacío' }, { status: 400 })

  const db = getDb()

  const [conv] = await db.select().from(conversations).where(eq(conversations.id, parseInt(id)))
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

  // Update lastMessageAt on conversation
  await db.update(conversations).set({ lastMessageAt: new Date() }).where(eq(conversations.id, conv.id))

  // Notify the other participant (fire-and-forget)
  const recipientId = conv.userId === userId ? conv.hostId : conv.userId
  if (recipientId) {
    db.select({ email: users.email, name: users.name }).from(users).where(eq(users.id, recipientId))
      .then(([recipient]) => {
        if (recipient) {
          emailNewMessage({
            recipientEmail: recipient.email,
            recipientName: recipient.name,
            senderName,
            subject: conv.subject,
            body: body.trim(),
            conversationId: conv.id,
          })
        }
      }).catch(() => {})
  } else if (role !== 'admin') {
    // Support conversation — notify all admins (just send to the platform email as fallback)
    // In production you'd query users where role = 'admin'
  }

  return NextResponse.json(msg, { status: 201 })
}
