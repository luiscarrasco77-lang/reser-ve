import { NextRequest, NextResponse, after } from 'next/server'
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

  // Only the guest, the posada's host, or an admin may view a booking.
  const userId = parseInt((session.user as any).id)
  const role = (session.user as any).role
  const [posada] = await db.select({ hostId: posadas.hostId, nombre: posadas.nombre, slug: posadas.slug, imgs: posadas.imgs, precio: posadas.precio, destino: posadas.destino })
    .from(posadas).where(eq(posadas.id, booking.posadaId))
  if (role !== 'admin' && booking.guestId !== userId) {
    if (!posada || posada.hostId !== userId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
  }
  // Enriquecido para la página de confirmación (evita pasar datos por la URL).
  return NextResponse.json({
    ...booking,
    posadaNombre: posada?.nombre ?? '',
    posadaSlug: posada?.slug ?? '',
    posadaImg: ((posada?.imgs as string[]) ?? [])[0] ?? '',
    posadaDestino: posada?.destino ?? '',
    precioNoche: posada?.precio ?? 0,
  })
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
    after(async () => {
      const [guest] = await db.select({ email: users.email, name: users.name }).from(users).where(eq(users.id, booking.guestId))
      const [posada] = await db.select({ nombre: posadas.nombre }).from(posadas).where(eq(posadas.id, booking.posadaId))
      if (!guest || !posada) return
      if (status === 'confirmed') {
        await emailGuestBookingConfirmed({
          guestEmail: guest.email, guestName: guest.name,
          posadaNombre: posada.nombre, bookingCode: booking.bookingCode,
          checkIn: booking.checkIn, checkOut: booking.checkOut,
          nights: booking.nights, totalPrice: booking.totalPrice,
          paymentMethod: booking.paymentMethod, hostNotes: hostNotes ?? null,
        })
      } else {
        await emailGuestBookingCancelled({
          guestEmail: guest.email, guestName: guest.name,
          posadaNombre: posada.nombre, bookingCode: booking.bookingCode,
          reason: hostNotes ?? null,
        })
      }
    })
  }

  return NextResponse.json(updated)
}
