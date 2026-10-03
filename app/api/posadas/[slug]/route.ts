import { NextRequest, NextResponse, after } from 'next/server'
import { readJson } from '@/lib/http'
import { getDb } from '@/lib/db'
import { posadas, users } from '@/lib/db/schema'
import { emailAdminPosadaPending, emailAdminPosadaEdited } from '@/lib/email'
import { restoreDemoOf } from '@/lib/demo'
import { eq, and, desc } from 'drizzle-orm'
import { auth } from '@/auth'
import { parsePosadaInput } from '@/lib/posada-input'
import { verifiedReviewsFor } from '@/lib/reviews'

export async function GET(_: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  // Fallback to curated data when there is no database connected.
  if (!process.env.DATABASE_URL) {
    const { getPosada, posadas: posadasData } = await import('@/lib/data')
    const p = getPosada(slug)
    if (!p) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({
      ...p,
      id: posadasData.findIndex(x => x.slug === slug) + 1,
      hostNombre: p.host.nombre, hostDesde: p.host.desde, hostIdiomas: p.host.idiomas,
      status: 'active',
    })
  }

  const db = getDb()
  const [posada] = await db.select().from(posadas).where(eq(posadas.slug, slug))
  if (!posada) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Public can only see active posadas. The owner and admins can preview any status.
  const session = posada.status !== 'active' ? await auth() : null
  if (posada.status !== 'active') {
    const userId = session?.user ? parseInt((session.user as any).id) : null
    const role = session?.user ? (session.user as any).role : null
    if (posada.hostId !== userId && role !== 'admin') {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
  }

  // Include published reviews so the detail page can render them.
  const rows = (await verifiedReviewsFor(posada.id)).sort((x, y) => +y.createdAt - +x.createdAt)
  const reseñas = rows.map(r => ({ autor: r.authorName, pais: r.authorCountry ?? '', rating: r.rating, texto: r.texto }))

  // Las notas internas de revisión solo las ven el dueño y los admins.
  const { reviewNotes, hostId, ...pub } = posada
  const privileged = !!session
  return NextResponse.json({ ...pub, ...(privileged ? { reviewNotes } : {}), reseñas })
}

// PUT/PATCH comparten reglas: solo el dueño (o un admin), campos en lista blanca y validados.
async function update(req: NextRequest, slug: string) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = parseInt((session.user as any).id)
  const role = (session.user as any).role
  const body = await readJson(req)
  if (Object.keys(body).length === 0) return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 })
  const db = getDb()

  const [posada] = await db.select().from(posadas).where(eq(posadas.slug, slug))
  if (!posada) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (posada.hostId !== userId && role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // Pausar / reactivar. Reactivar (o reenviar una rechazada) vuelve a pasar por revisión.
  if (body.action === 'pause') {
    if (posada.status !== 'active' && posada.status !== 'pending_review') {
      return NextResponse.json({ error: 'Solo puedes pausar una posada publicada o en revisión' }, { status: 400 })
    }
    const [updated] = await db.update(posadas).set({ status: 'suspended', reviewNotes: 'Pausada por el posadero.', updatedAt: new Date() }).where(eq(posadas.id, posada.id)).returning()
    after(() => restoreDemoOf(posada.id))
    return NextResponse.json(updated)
  }
  if (body.action === 'resubmit') {
    if (!['rejected', 'draft', 'suspended'].includes(posada.status)) {
      return NextResponse.json({ error: 'Solo puedes reenviar posadas rechazadas, en borrador o pausadas' }, { status: 400 })
    }
    const [updated] = await db.update(posadas)
      .set({ status: 'pending_review', reviewNotes: null, updatedAt: new Date() })
      .where(eq(posadas.id, posada.id)).returning()
    after(() => notifyAdmins(posada.id, 'pending'))
    return NextResponse.json(updated)
  }
  if (body.action !== undefined) return NextResponse.json({ error: 'Acción inválida' }, { status: 400 })

  const parsed = parsePosadaInput(body, true)
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 })
  const [updated] = await db.update(posadas).set({ ...parsed.data, updatedAt: new Date() } as any)
    .where(eq(posadas.id, posada.id)).returning()
  // Una posada publicada que se edita queda visible, pero los admins reciben aviso para revisarla.
  if (posada.status === 'active' && role !== 'admin') {
    const changed = Object.keys(parsed.data).filter(k => JSON.stringify((posada as any)[k]) !== JSON.stringify(parsed.data[k]))
    if (changed.length) after(() => notifyAdmins(posada.id, 'edited', changed))
  }
  return NextResponse.json(updated)
}

async function notifyAdmins(posadaId: number, kind: 'pending' | 'edited', changed: string[] = []) {
  const db = getDb()
  const [p] = await db.select().from(posadas).where(eq(posadas.id, posadaId))
  if (!p) return
  const [host] = p.hostId ? await db.select({ name: users.name, email: users.email }).from(users).where(eq(users.id, p.hostId)) : []
  const to = (await db.select({ email: users.email }).from(users).where(eq(users.role, 'admin'))).map(a => a.email)
  const base = { to, nombre: p.nombre, destino: p.destino, precio: p.precio, hostName: host?.name ?? 'Posadero', hostEmail: host?.email ?? '' }
  if (kind === 'pending') await emailAdminPosadaPending(base)
  else await emailAdminPosadaEdited({ ...base, slug: p.slug, changed })
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  return update(req, (await params).slug)
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  return update(req, (await params).slug)
}

// "Eliminar" = pausar (se conserva el historial de reservas).
export async function DELETE(_: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { slug } = await params
  const db = getDb()
  const [updated] = await db.update(posadas).set({ status: 'suspended', updatedAt: new Date() })
    .where(and(eq(posadas.slug, slug), eq(posadas.hostId, parseInt((session.user as any).id))))
    .returning({ id: posadas.id })
  if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ ok: true })
}
