import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { reviews, bookings, posadas, users } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { auth } from '@/auth'

// Crea una reseña. Solo un huésped con una reserva confirmada/completada en esa
// posada puede reseñar, y solo una vez. Recalcula el rating de la posada.
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Inicia sesión para reseñar' }, { status: 401 })

  const userId = parseInt((session.user as any).id)
  const { posadaId, rating, texto } = await req.json()

  const r = Math.round(Number(rating))
  if (!posadaId || !(r >= 1 && r <= 5) || !texto?.trim()) {
    return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 })
  }

  const db = getDb()

  // Debe existir una reserva del usuario en esa posada (confirmada o completada).
  const userBookings = await db.select().from(bookings)
    .where(and(eq(bookings.guestId, userId), eq(bookings.posadaId, posadaId)))
  const elegible = userBookings.some(b => b.status === 'confirmed' || b.status === 'completed')
  if (!elegible) {
    return NextResponse.json({ error: 'Solo puedes reseñar posadas donde te hospedaste' }, { status: 403 })
  }

  // Una reseña por usuario y posada.
  const existing = await db.select().from(reviews)
    .where(and(eq(reviews.authorId, userId), eq(reviews.posadaId, posadaId)))
  if (existing.length > 0) {
    return NextResponse.json({ error: 'Ya dejaste una reseña para esta posada' }, { status: 409 })
  }

  const [me] = await db.select({ name: users.name, country: users.country }).from(users).where(eq(users.id, userId))

  const [review] = await db.insert(reviews).values({
    posadaId,
    authorId: userId,
    authorName: me?.name ?? session.user.name ?? 'Viajero',
    authorCountry: me?.country ?? null,
    rating: r,
    texto: texto.trim(),
  }).returning()

  // Recalcular rating y conteo de la posada.
  const all = await db.select({ rating: reviews.rating }).from(reviews).where(eq(reviews.posadaId, posadaId))
  const avg = all.reduce((s, x) => s + x.rating, 0) / all.length
  await db.update(posadas)
    .set({ rating: Math.round(avg * 10) / 10, reviews: all.length, updatedAt: new Date() })
    .where(eq(posadas.id, posadaId))

  return NextResponse.json(review, { status: 201 })
}
