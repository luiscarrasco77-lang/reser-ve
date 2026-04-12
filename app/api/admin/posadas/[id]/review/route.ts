import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { posadas, users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { auth } from '@/auth'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user || (session.user as any).role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params
  const { action, notes } = await req.json() // action: 'approve' | 'reject'

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

  // TODO: send email notification to host (integrate Resend when ready)

  return NextResponse.json({ ok: true, status: newStatus, posada: updated })
}
