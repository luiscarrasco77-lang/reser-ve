import { NextRequest, NextResponse, after } from 'next/server'
import { isRangeAvailable, roomsForGuests } from '@/lib/availability'
import { hasContactInfo } from '@/lib/posada-input'
import { parseId, readJson } from '@/lib/http'
import { getDb } from '@/lib/db'
import { bookings, posadas, users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { auth } from '@/auth'
import { emailGuestBookingConfirmed, emailGuestBookingCancelled, emailHostGuestCancelled } from '@/lib/email'

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const bookingId = parseId(id)
  if (!bookingId) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const db = getDb()
  const [booking] = await db.select().from(bookings).where(eq(bookings.id, bookingId))
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

// Transiciones permitidas por rol. El posadero confirma/rechaza solicitudes y puede cancelar
// una confirmada; el viajero solo cancela su solicitud pendiente; "completed" lo pone el cron.
const HOST_TRANSITIONS: Record<string, string[]> = { pending: ['confirmed', 'cancelled'], confirmed: ['cancelled'] }
// El admin además puede marcar como completada una confirmada. Nunca se reactiva una cancelada.
const ADMIN_TRANSITIONS: Record<string, string[]> = { pending: ['confirmed', 'cancelled'], confirmed: ['cancelled', 'completed'] }

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const bookingId = parseId(id)
  if (!bookingId) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const body = await readJson(req)
  if (Object.keys(body).length === 0) return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 })
  const status = String(body.status ?? '')
  const hostNotes = typeof body.hostNotes === 'string' ? body.hostNotes.trim().slice(0, 1000) || null : null
  if (hostNotes && hasContactInfo(hostNotes)) {
    return NextResponse.json({ error: 'No incluyas teléfonos, correos ni enlaces: los datos de pago y contacto se envían por el chat de RESER-VE.' }, { status: 400 })
  }
  const userId = parseInt((session.user as any).id)
  const role = (session.user as any).role

  const db = getDb()
  const [booking] = await db.select().from(bookings).where(eq(bookings.id, bookingId))
  if (!booking) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const [posada] = await db.select({ hostId: posadas.hostId, nombre: posadas.nombre }).from(posadas).where(eq(posadas.id, booking.posadaId))

  const isHost = !!posada && posada.hostId === userId
  const isGuest = booking.guestId === userId
  let allowed = false
  let actor: 'host' | 'guest' | 'admin' = 'admin'
  if (role === 'admin') {
    allowed = (ADMIN_TRANSITIONS[booking.status] ?? []).includes(status)
      && !(status === 'completed' && booking.checkOut > new Date().toISOString().slice(0, 10))
  } else if (isHost) {
    actor = 'host'
    allowed = (HOST_TRANSITIONS[booking.status] ?? []).includes(status)
  } else if (isGuest) {
    actor = 'guest'
    allowed = booking.status === 'pending' && status === 'cancelled'
  } else {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  if (!allowed) {
    return NextResponse.json({ error: `No se puede pasar una reserva de "${booking.status}" a "${status}"` }, { status: 400 })
  }

  // Al confirmar, comprueba que sigan quedando habitaciones (p. ej. si entró una reserva por WhatsApp o Booking).
  if (status === 'confirmed') {
    const [p] = await db.select({ id: posadas.id, habitaciones: posadas.habitaciones, capacidad: posadas.capacidad }).from(posadas).where(eq(posadas.id, booking.posadaId))
    if (p && !(await isRangeAvailable(p, booking.checkIn, booking.checkOut, roomsForGuests(p, booking.guestCount), booking.id))) {
      return NextResponse.json({ error: 'No quedan habitaciones libres en esas fechas según tu calendario. Revisa tu calendario antes de confirmar.' }, { status: 409 })
    }
  }

  const [updated] = await db.update(bookings)
    .set({ status: status as any, hostNotes: actor === 'guest' ? booking.hostNotes : (hostNotes ?? booking.hostNotes), updatedAt: new Date() })
    .where(eq(bookings.id, bookingId))
    .returning()

  // Correos tras responder.
  after(async () => {
    if (!posada) return
    const [guest] = await db.select({ email: users.email, name: users.name }).from(users).where(eq(users.id, booking.guestId))
    if (!guest) return
    if (status === 'confirmed') {
      await emailGuestBookingConfirmed({
        guestEmail: guest.email, guestName: guest.name,
        posadaNombre: posada.nombre, bookingCode: booking.bookingCode,
        checkIn: booking.checkIn, checkOut: booking.checkOut,
        nights: booking.nights, totalPrice: booking.totalPrice,
        paymentMethod: booking.paymentMethod, hostNotes,
      })
    } else if (status === 'cancelled' && actor === 'guest') {
      if (!posada.hostId) return
      const [host] = await db.select({ email: users.email, name: users.name }).from(users).where(eq(users.id, posada.hostId))
      if (host) await emailHostGuestCancelled({
        hostEmail: host.email, hostName: host.name, guestName: guest.name,
        posadaNombre: posada.nombre, bookingCode: booking.bookingCode,
        checkIn: booking.checkIn, checkOut: booking.checkOut,
      })
    } else if (status === 'cancelled') {
      await emailGuestBookingCancelled({
        guestEmail: guest.email, guestName: guest.name,
        posadaNombre: posada.nombre, bookingCode: booking.bookingCode,
        reason: hostNotes, wasConfirmed: booking.status === 'confirmed',
      })
    }
  })

  return NextResponse.json(updated)
}
