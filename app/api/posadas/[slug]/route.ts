import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { posadas, reviews } from '@/lib/db/schema'
import { eq, and, desc } from 'drizzle-orm'
import { auth } from '@/auth'
import { parsePosadaInput } from '@/lib/posada-input'

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
  if (!posada) {
    // Posada curada que aún no está sembrada en la DB: servir desde lib/data.
    const { getPosada, posadas: posadasData } = await import('@/lib/data')
    const p = getPosada(slug)
    if (p) {
      return NextResponse.json({
        ...p,
        id: 100000 + posadasData.findIndex(x => x.slug === slug),
        hostNombre: p.host.nombre, hostDesde: p.host.desde, hostIdiomas: p.host.idiomas,
        status: 'active',
      })
    }
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  // Public can only see active posadas. The owner and admins can preview any status.
  if (posada.status !== 'active') {
    const session = await auth()
    const userId = session?.user ? parseInt((session.user as any).id) : null
    const role = session?.user ? (session.user as any).role : null
    if (posada.hostId !== userId && role !== 'admin') {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
  }

  // Include published reviews so the detail page can render them.
  const rows = await db.select().from(reviews).where(eq(reviews.posadaId, posada.id)).orderBy(desc(reviews.createdAt))
  const reseñas = rows.map(r => ({ autor: r.authorName, pais: r.authorCountry ?? '', rating: r.rating, texto: r.texto }))

  return NextResponse.json({ ...posada, reseñas })
}

// PUT/PATCH comparten reglas: solo el dueño (o un admin), campos en lista blanca y validados.
async function update(req: NextRequest, slug: string) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = parseInt((session.user as any).id)
  const role = (session.user as any).role
  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 })
  const db = getDb()

  const [posada] = await db.select().from(posadas).where(eq(posadas.slug, slug))
  if (!posada) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (posada.hostId !== userId && role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // Pausar / reactivar. Reactivar (o reenviar una rechazada) vuelve a pasar por revisión.
  if (body.action === 'pause') {
    if (posada.status !== 'active' && posada.status !== 'pending_review') {
      return NextResponse.json({ error: 'Solo puedes pausar una posada publicada o en revisión' }, { status: 400 })
    }
    const [updated] = await db.update(posadas).set({ status: 'suspended', updatedAt: new Date() }).where(eq(posadas.id, posada.id)).returning()
    return NextResponse.json(updated)
  }
  if (body.action === 'resubmit') {
    if (!['rejected', 'draft', 'suspended'].includes(posada.status)) {
      return NextResponse.json({ error: 'Solo puedes reenviar posadas rechazadas, en borrador o pausadas' }, { status: 400 })
    }
    const [updated] = await db.update(posadas)
      .set({ status: 'pending_review', reviewNotes: null, updatedAt: new Date() })
      .where(eq(posadas.id, posada.id)).returning()
    return NextResponse.json(updated)
  }

  const parsed = parsePosadaInput(body, true)
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 })
  const [updated] = await db.update(posadas).set({ ...parsed.data, updatedAt: new Date() } as any)
    .where(eq(posadas.id, posada.id)).returning()
  return NextResponse.json(updated)
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
