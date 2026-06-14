import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { posadas } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

// Estadísticas públicas reales para la página de inicio (posadas activas, destinos,
// rating promedio). Fallback a datos curados cuando no hay base de datos.
export async function GET() {
  if (!process.env.DATABASE_URL) {
    const { posadas: data, destinos } = await import('@/lib/data')
    const avg = data.reduce((s, p) => s + p.rating, 0) / (data.length || 1)
    return NextResponse.json({
      posadas: data.length,
      destinos: destinos.length,
      reviews: data.reduce((s, p) => s + p.reviews, 0),
      ratingPromedio: Math.round(avg * 10) / 10,
    })
  }

  const db = getDb()
  const rows = await db.select({ destinoSlug: posadas.destinoSlug, rating: posadas.rating, reviews: posadas.reviews })
    .from(posadas).where(eq(posadas.status, 'active'))

  const destinos = new Set(rows.map(r => r.destinoSlug)).size
  const avg = rows.length ? rows.reduce((s, r) => s + (r.rating ?? 0), 0) / rows.length : 0
  return NextResponse.json({
    posadas: rows.length,
    destinos,
    reviews: rows.reduce((s, r) => s + (r.reviews ?? 0), 0),
    ratingPromedio: Math.round(avg * 10) / 10,
  })
}
