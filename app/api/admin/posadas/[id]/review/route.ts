import { NextRequest, NextResponse, after } from 'next/server'
import { parseId, readJson } from '@/lib/http'
import { retireDemoFor, restoreDemoOf } from '@/lib/demo'
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
  const posadaId = parseId(id)
  if (!posadaId) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const { action, notes: rawNotes } = await readJson(req)
  const notes = typeof rawNotes === 'string' ? rawNotes.trim().slice(0, 2000) || null : null

  // approve: publica (desde revisión, rechazada, pausada o borrador) · reject: devuelve con notas
  // (solo desde revisión) · suspend: retira una publicada sin avisar al posadero por correo.
  const FROM: Record<string, string[]> = {
    approve: ['pending_review', 'rejected', 'suspended', 'draft'],
    reject: ['pending_review'],
    suspend: ['active', 'pending_review'],
  }
  if (typeof action !== 'string' || !Object.hasOwn(FROM, action)) return NextResponse.json({ error: 'Acción inválida' }, { status: 400 })
  if (action === 'reject' && !notes) return NextResponse.json({ error: 'Indica qué debe corregir el posadero' }, { status: 400 })

  const db = getDb()
  const [current] = await db.select({ status: posadas.status }).from(posadas).where(eq(posadas.id, posadaId))
  if (!current) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (!FROM[action].includes(current.status)) {
    return NextResponse.json({ error: `No se puede ${({ approve: 'aprobar', reject: 'rechazar', suspend: 'suspender' } as Record<string, string>)[action]} una posada en estado "${current.status}"` }, { status: 400 })
  }
  const newStatus = action === 'approve' ? 'active' : action === 'reject' ? 'rejected' : 'suspended'

  const [updated] = await db.update(posadas)
    .set({ status: newStatus, reviewNotes: notes, updatedAt: new Date() })
    .where(eq(posadas.id, posadaId))
    .returning()

  if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Send email to host (fire-and-forget)
  // Una posada real aprobada reemplaza a una demo del mismo destino.
  if (action === 'approve' && !updated.isDemo) {
    after(() => retireDemoFor(updated.id).then(() => {}))
  }
  if (action === 'suspend' && !updated.isDemo) {
    after(() => restoreDemoOf(updated.id))
  }

  if (updated.hostId && action !== 'suspend') {
    const hostId = updated.hostId
    after(async () => {
      const [host] = await db.select({ email: users.email, name: users.name }).from(users).where(eq(users.id, hostId))
      if (!host) return
      if (action === 'approve') {
        // Reactivar una suspendida no repite el correo de "publicada".
        if (current.status === 'suspended') return
        await emailHostPosadaApproved({ hostEmail: host.email, hostName: host.name, posadaNombre: updated.nombre, slug: updated.slug })
      } else {
        await emailHostPosadaRejected({ hostEmail: host.email, hostName: host.name, posadaNombre: updated.nombre, notes: notes ?? 'Revisa los requisitos de RESER-VE.' })
      }
    })
  }

  return NextResponse.json({ ok: true, status: newStatus, posada: updated })
}
