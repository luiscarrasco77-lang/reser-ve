import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { posadas } from '@/lib/db/schema'
import { auth } from '@/auth'
import { eq } from 'drizzle-orm'

// PATCH /api/posadas/[id] — host can resubmit rejected posada or update draft
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const userId = parseInt((session.user as any).id)
  const role = (session.user as any).role
  const body = await req.json()

  const db = getDb()
  const [posada] = await db.select().from(posadas).where(eq(posadas.id, parseInt(id)))
  if (!posada) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Only the owner or admin can update
  if (posada.hostId !== userId && role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // If resubmitting: only allowed from rejected or draft
  if (body.action === 'resubmit') {
    if (posada.status !== 'rejected' && posada.status !== 'draft') {
      return NextResponse.json({ error: 'Solo puedes reenviar posadas rechazadas o en borrador' }, { status: 400 })
    }
    const [updated] = await db.update(posadas)
      .set({ status: 'pending_review', reviewNotes: null, updatedAt: new Date() })
      .where(eq(posadas.id, parseInt(id)))
      .returning()
    return NextResponse.json(updated)
  }

  // Generic update (fields passed in body)
  const allowed = ['nombre', 'descripcion', 'precio', 'habitaciones', 'capacidad',
    'tags', 'servicios', 'metodoPago', 'imgs', 'politicas', 'tipo']
  const updates: Record<string, any> = { updatedAt: new Date() }
  for (const key of allowed) {
    if (body[key] !== undefined) updates[key] = body[key]
  }

  const [updated] = await db.update(posadas).set(updates).where(eq(posadas.id, parseInt(id))).returning()
  return NextResponse.json(updated)
}
