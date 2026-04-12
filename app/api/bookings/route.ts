import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { bookings, posadas, users } from '@/lib/db/schema'
import { eq, inArray } from 'drizzle-orm'
import { auth } from '@/auth'
import { emailHostNewBooking, emailGuestBookingReceived } from '@/lib/email'

type BookingRow = typeof bookings.$inferSelect

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = parseInt((session.user as any).id)
  const role = (session.user as any).role

  const db = getDb()
  let results: BookingRow[]

  let rows: BookingRow[]

  if (role === 'host') {
    const hostPosadas = await db.select({ id: posadas.id }).from(posadas).where(eq(posadas.hostId, userId))
    const posadaIds = hostPosadas.map(p => p.id)
    if (posadaIds.length === 0) {
      rows = []
    } else {
      const allBookings = await Promise.all(
        posadaIds.map(pid => db.select().from(bookings).where(eq(bookings.posadaId, pid)))
      )
      rows = allBookings.flat()
    }
  } else {
    rows = await db.select().from(bookings).where(eq(bookings.guestId, userId))
  }

  // Enrich with posada name + slug
  const posadaIds = [...new Set(rows.map(b => b.posadaId))]
  const posadaInfo = posadaIds.length > 0
    ? await db.select({ id: posadas.id, nombre: posadas.nombre, slug: posadas.slug, imgs: posadas.imgs })
        .from(posadas).where(inArray(posadas.id, posadaIds))
    : []
  const posadaMap = Object.fromEntries(posadaInfo.map(p => [p.id, p]))

  const enriched = rows.map(b => ({
    ...b,
    posadaNombre: posadaMap[b.posadaId]?.nombre ?? `Posada #${b.posadaId}`,
    posadaSlug: posadaMap[b.posadaId]?.slug ?? '',
    posadaImg: ((posadaMap[b.posadaId]?.imgs ?? []) as string[])[0] ?? '',
  }))

  return NextResponse.json(enriched)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Inicia sesión para reservar' }, { status: 401 })

  const { posadaId, checkIn, checkOut, nights, totalPrice, paymentMethod, guestCount, notes } = await req.json()

  const year = new Date().getFullYear()
  const rand = Math.floor(1000 + Math.random() * 9000)
  const bookingCode = `RV-${year}-${rand}`

  const db = getDb()

  // Verify posada is active + get host info for email
  const [posada] = await db.select().from(posadas).where(eq(posadas.id, posadaId))
  if (!posada || posada.status !== 'active') {
    return NextResponse.json({ error: 'Posada no disponible' }, { status: 400 })
  }

  const [booking] = await db.insert(bookings).values({
    bookingCode, posadaId, checkIn, checkOut, nights, totalPrice,
    paymentMethod, guestCount: guestCount || 1, notes,
    guestId: parseInt((session.user as any).id),
    status: 'pending',
  }).returning()

  // Send emails (fire-and-forget — don't block the response)
  const guestName = session.user.name ?? 'Viajero'
  const guestEmail = session.user.email!

  // Get host user for email
  Promise.all([
    posada.hostId
      ? db.select({ email: users.email, name: users.name }).from(users).where(eq(users.id, posada.hostId)).then(r => r[0])
      : Promise.resolve(null),
    emailGuestBookingReceived({ guestEmail, guestName, posadaNombre: posada.nombre, bookingCode, checkIn, checkOut, nights, totalPrice, paymentMethod }),
  ]).then(([host]) => {
    if (host) {
      emailHostNewBooking({ hostEmail: host.email, hostName: host.name, guestName, guestEmail, posadaNombre: posada.nombre, bookingCode, checkIn, checkOut, nights, totalPrice, paymentMethod, guestCount: guestCount || 1, notes })
    }
  }).catch(() => {}) // Email errors never break the booking

  return NextResponse.json({ ...booking, posadaNombre: posada.nombre }, { status: 201 })
}
