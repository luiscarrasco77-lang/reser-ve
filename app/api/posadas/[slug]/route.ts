import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { posadas, reviews } from '@/lib/db/schema'
import { eq, and, desc } from 'drizzle-orm'
import { auth } from '@/auth'

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

const EDITABLE_FIELDS = ['nombre', 'descripcion', 'precio', 'habitaciones', 'capacidad',
  'tags', 'servicios', 'metodoPago', 'imgs', 'politicas', 'tipo', 'destino', 'destinoSlug', 'lat', 'lng']

export async function PUT(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { slug } = await params
  const body = await req.json()
  const db = getDb()

  // Whitelist: nunca dejar que el host cambie status, hostId, rating, etc.
  const updates: Record<string, any> = { updatedAt: new Date() }
  for (const key of EDITABLE_FIELDS) {
    if (body[key] !== undefined) updates[key] = body[key]
  }

  const [updated] = await db.update(posadas).set(updates)
    .where(and(eq(posadas.slug, slug), eq(posadas.hostId, parseInt((session.user as any).id))))
    .returning()
  if (!updated) return NextResponse.json({ error: 'Not found or forbidden' }, { status: 404 })
  return NextResponse.json(updated)
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { slug } = await params
  const userId = parseInt((session.user as any).id)
  const role = (session.user as any).role
  const body = await req.json()
  const db = getDb()

  const [posada] = await db.select().from(posadas).where(eq(posadas.slug, slug))
  if (!posada) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (posada.hostId !== userId && role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  if (body.action === 'resubmit') {
    if (posada.status !== 'rejected' && posada.status !== 'draft') {
      return NextResponse.json({ error: 'Solo puedes reenviar posadas rechazadas o en borrador' }, { status: 400 })
    }
    const [updated] = await db.update(posadas)
      .set({ status: 'pending_review', reviewNotes: null, updatedAt: new Date() })
      .where(eq(posadas.slug, slug))
      .returning()
    return NextResponse.json(updated)
  }

  const allowed = ['nombre', 'descripcion', 'precio', 'habitaciones', 'capacidad',
    'tags', 'servicios', 'metodoPago', 'imgs', 'politicas', 'tipo']
  const updates: Record<string, any> = { updatedAt: new Date() }
  for (const key of allowed) {
    if (body[key] !== undefined) updates[key] = body[key]
  }
  const [updated] = await db.update(posadas).set(updates).where(eq(posadas.slug, slug)).returning()
  return NextResponse.json(updated)
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { slug } = await params
  const db = getDb()
  await db.update(posadas).set({ status: 'suspended' })
    .where(and(eq(posadas.slug, slug), eq(posadas.hostId, parseInt((session.user as any).id))))
  return NextResponse.json({ ok: true })
}
