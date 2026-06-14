import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { favorites, posadas } from '@/lib/db/schema'
import { eq, and, inArray } from 'drizzle-orm'
import { auth } from '@/auth'

// GET → posadas favoritas del usuario (enriquecidas). POST → agregar. DELETE → quitar.
export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = parseInt((session.user as any).id)

  try {
    const db = getDb()
    const favs = await db.select().from(favorites).where(eq(favorites.userId, userId))
    const ids = favs.map(f => f.posadaId)
    if (ids.length === 0) return NextResponse.json({ ids: [], slugs: [], posadas: [] })

    const rows = await db.select().from(posadas).where(inArray(posadas.id, ids))
    return NextResponse.json({
      ids,
      slugs: rows.map(p => p.slug),
      posadas: rows.map(p => ({
        id: p.id, slug: p.slug, nombre: p.nombre, destino: p.destino, tipo: p.tipo,
        precio: p.precio, rating: p.rating, reviews: p.reviews,
        imgs: p.imgs as string[] ?? [], status: p.status,
      })),
    })
  } catch {
    // Tabla aún no creada (falta db:push): degradar sin romper la UI.
    return NextResponse.json({ ids: [], slugs: [], posadas: [] })
  }
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = parseInt((session.user as any).id)
  const { posadaId } = await req.json()
  if (!posadaId) return NextResponse.json({ error: 'posadaId requerido' }, { status: 400 })

  try {
    const db = getDb()
    const existing = await db.select().from(favorites)
      .where(and(eq(favorites.userId, userId), eq(favorites.posadaId, posadaId)))
    if (existing.length === 0) {
      await db.insert(favorites).values({ userId, posadaId })
    }
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'No disponible' }, { status: 503 })
  }
}

export async function DELETE(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = parseInt((session.user as any).id)
  const { posadaId } = await req.json()
  if (!posadaId) return NextResponse.json({ error: 'posadaId requerido' }, { status: 400 })

  try {
    const db = getDb()
    await db.delete(favorites).where(and(eq(favorites.userId, userId), eq(favorites.posadaId, posadaId)))
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'No disponible' }, { status: 503 })
  }
}
