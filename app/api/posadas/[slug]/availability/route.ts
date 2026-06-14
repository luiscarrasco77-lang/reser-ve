import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { posadas, bookings } from '@/lib/db/schema'
import { eq, and, inArray } from 'drizzle-orm'

// Devuelve los rangos de fechas ya ocupados (reservas pendientes o confirmadas)
// para que el calendario de reserva los muestre como no disponibles.
// Público: solo expone fechas, ninguna información sensible.
export async function GET(_: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  if (!process.env.DATABASE_URL) return NextResponse.json({ ranges: [] })

  const db = getDb()
  const [posada] = await db.select({ id: posadas.id }).from(posadas).where(eq(posadas.slug, slug))
  if (!posada) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const rows = await db.select({ checkIn: bookings.checkIn, checkOut: bookings.checkOut, status: bookings.status })
    .from(bookings)
    .where(and(eq(bookings.posadaId, posada.id), inArray(bookings.status, ['pending', 'confirmed'])))

  const ranges = rows.map(r => ({ checkIn: r.checkIn, checkOut: r.checkOut }))
  return NextResponse.json({ ranges })
}
