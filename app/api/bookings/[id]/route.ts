import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { bookings, posadas, users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { auth } from '@/auth'
import { emailGuestBookingConfirmed, emailGuestBookingCancelled } from '@/lib/email'

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const db = getDb()
  const [booking] = await db.select().from(bookings).where(eq(bookings.id, parseInt(id)))
  if (!booking) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(booking)
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const { status, hostNotes } = await req.json()
  const userId = parseInt((session.user as any).id)
  const role = (session.user as any).role

  const db = getDb()

  // Hosts can only update bookings for their own posadas
  const [booking] = await db.select().from(bookings).where(eq(bookings.id, parseInt(id)))
  if (!booking) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (role === 'host') {
    const [posada] = await db.select({ hostId: posadas.hostId }).from(posadas).where(eq(posadas.id, booking.posadaId))
    if (!posada || posada.hostId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  } else if (role !== 'admin') {
    // Travelers can only cancel their own pending bookings
    if (booking.guestId !== userId || status !== 'cancelled') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  }

  const [updated] = await db.update(bookings)
    .set({ status, hostNotes: hostNotes ?? booking.hostNotes, updatedAt: new Date() })
    .where(eq(bookings.id, parseInt(id)))
    .returning()

  // Send email notifications (fire-and-forget)
  if (status === 'confirmed' || status === 'cancelled') {
    Promise.all([
      db.select({ email: users.email, name: users.name }).from(users).where(eq(users.id, booking.guestId)).then(r => r[0]),
      db.select({ nombre: posadas.nombre }).from(posadas).where(eq(posadas.id, booking.posadaId)).then(r => r[0]),
    ]).then(([guest, posada]) => {
      if (!guest || !posada) return
      if (status === 'confirmed') {
        emailGuestBookingConfirmed({
          guestEmail: guest.email, guestName: guest.name,
          posadaNombre: posada.nombre, bookingCode: booking.bookingCode,
          checkIn: booking.checkIn, checkOut: booking.checkOut,
          nights: booking.nights, totalPrice: booking.totalPrice,
          paymentMethod: booking.paymentMethod, hostNotes: hostNotes ?? null,
        })
      } else {
        emailGuestBookingCancelled({
          guestEmail: guest.email, guestName: guest.name,
          posadaNombre: posada.nombre, bookingCode: booking.bookingCode,
          reason: hostNotes ?? null,
        })
      }
    }).catch(() => {})
  }

  return NextResponse.json(updated)
}
