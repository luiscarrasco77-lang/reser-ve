import { NextRequest, NextResponse, after } from 'next/server'
import { getDb } from '@/lib/db'
import { posadas, users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { auth } from '@/auth'
import { emailHostPosadaApproved, emailHostPosadaRejected } from '@/lib/email'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user || (session.user as any).role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params
  const { action, notes } = await req.json()

  if (action !== 'approve' && action !== 'reject') {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  }

  const db = getDb()
  const newStatus = action === 'approve' ? 'active' : 'rejected'

  const [updated] = await db.update(posadas)
    .set({ status: newStatus, reviewNotes: notes ?? null, updatedAt: new Date() })
    .where(eq(posadas.id, parseInt(id)))
    .returning()

  if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Send email to host (fire-and-forget)
  if (updated.hostId) {
    const hostId = updated.hostId
    after(async () => {
      const [host] = await db.select({ email: users.email, name: users.name }).from(users).where(eq(users.id, hostId))
      if (!host) return
      if (action === 'approve') {
        await emailHostPosadaApproved({ hostEmail: host.email, hostName: host.name, posadaNombre: updated.nombre, slug: updated.slug })
      } else {
        await emailHostPosadaRejected({ hostEmail: host.email, hostName: host.name, posadaNombre: updated.nombre, notes: notes ?? 'Revisa los requisitos de RESER-VE.' })
      }
    })
  }

  return NextResponse.json({ ok: true, status: newStatus, posada: updated })
}
