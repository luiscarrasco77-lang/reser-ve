import { getDb } from './db'
import { reviews, bookings, posadas } from './db/schema'
import { and, eq, inArray, sql } from 'drizzle-orm'

// Solo cuentan reseñas "verificadas": su autor tiene una reserva confirmada o completada
// en esa posada. Las reseñas de ejemplo (sin estadía real) nunca se muestran.
export const verifiedReviewFilter = sql`exists (
  select 1 from ${bookings} b
  where b.guest_id = ${reviews.authorId} and b.posada_id = ${reviews.posadaId}
    and b.status in ('confirmed', 'completed')
)`

export async function verifiedReviewsFor(posadaId: number) {
  return getDb().select().from(reviews)
    .where(and(eq(reviews.posadaId, posadaId), verifiedReviewFilter))
}

// Recalcula rating y nº de reseñas (verificadas) de una o varias posadas.
export async function recomputeRatings(posadaIds?: number[]) {
  const db = getDb()
  const ids = posadaIds ?? (await db.select({ id: posadas.id }).from(posadas)).map(p => p.id)
  if (ids.length === 0) return
  const rows = await db.select({ posadaId: reviews.posadaId, rating: reviews.rating }).from(reviews)
    .where(and(inArray(reviews.posadaId, ids), verifiedReviewFilter))
  for (const id of ids) {
    const mine = rows.filter(r => r.posadaId === id)
    const avg = mine.length ? Math.round(mine.reduce((s, r) => s + r.rating, 0) / mine.length * 10) / 10 : 0
    await db.update(posadas).set({ rating: avg, reviews: mine.length }).where(eq(posadas.id, id))
  }
}
