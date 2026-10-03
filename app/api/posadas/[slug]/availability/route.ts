import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { posadas } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { fullRanges, addDays } from '@/lib/availability'

// Devuelve las noches sin habitaciones libres para que el formulario de reserva las marque.
// Público: solo expone fechas, ninguna información sensible.
export async function GET(_: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  if (!process.env.DATABASE_URL) return NextResponse.json({ ranges: [] })

  const db = getDb()
  const [posada] = await db.select({ id: posadas.id, habitaciones: posadas.habitaciones, capacidad: posadas.capacidad }).from(posadas).where(eq(posadas.slug, slug))
  if (!posada) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Solo noches sin ninguna habitación libre (no expone reservas ni nombres).
  const today = new Date().toISOString().slice(0, 10)
  const ranges = await fullRanges(posada, today, addDays(today, 548))
  return NextResponse.json({ ranges })
}
