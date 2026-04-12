import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { bookings, posadas } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { auth } from '@/auth'

type BookingRow = typeof bookings.$inferSelect

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = parseInt((session.user as any).id)
  const role = (session.user as any).role

  const db = getDb()
  let results: BookingRow[]

  if (role === 'host') {
    // Host sees bookings for their posadas
    const hostPosadas = await db.select({ id: posadas.id }).from(posadas).where(eq(posadas.hostId, userId))
    const posadaIds = hostPosadas.map(p => p.id)
    if (posadaIds.length === 0) {
      results = []
    } else {
      // Fetch bookings for all host posadas
      const allBookings = await Promise.all(
        posadaIds.map(pid => db.select().from(bookings).where(eq(bookings.posadaId, pid)))
      )
      results = allBookings.flat()
    }
  } else {
    results = await db.select().from(bookings).where(eq(bookings.guestId, userId))
  }

  return NextResponse.json(results)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Inicia sesión para reservar' }, { status: 401 })

  const { posadaId, checkIn, checkOut, nights, totalPrice, paymentMethod, guestCount, notes } = await req.json()

  const db = getDb()
  const [booking] = await db.insert(bookings).values({
    posadaId, checkIn, checkOut, nights, totalPrice,
    paymentMethod, guestCount: guestCount || 1, notes,
    guestId: parseInt((session.user as any).id),
    status: 'pending',
  }).returning()

  return NextResponse.json(booking, { status: 201 })
}
