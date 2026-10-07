import { NextRequest, NextResponse, after } from 'next/server'
import { isRangeAvailable, roomsForGuests, syncStaleFeeds } from '@/lib/availability'
import { parseId, readJson } from '@/lib/http'
import { BOOKINGS_OPEN, PRIVATE_PHASE_MSG } from '@/lib/constants'
import { getDb } from '@/lib/db'
import { bookings, posadas, users } from '@/lib/db/schema'
import { eq, inArray } from 'drizzle-orm'
import { auth } from '@/auth'
import { emailHostNewBooking, emailGuestBookingReceived } from '@/lib/email'

type BookingRow = typeof bookings.$inferSelect

// ?as=guest: las reservas que hizo el usuario como viajero (un posadero también puede viajar).
export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = parseInt((session.user as any).id)
  const role = (session.user as any).role

  const db = getDb()
  let results: BookingRow[]

  let rows: BookingRow[]

  const asGuest = new URL(req.url).searchParams.get('as') === 'guest'
  if (role === 'host' && !asGuest) {
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
    ? await db.select({ id: posadas.id, nombre: posadas.nombre, slug: posadas.slug, imgs: posadas.imgs, mensajeConfirmacion: posadas.mensajeConfirmacion, hostId: posadas.hostId })
        .from(posadas).where(inArray(posadas.id, posadaIds))
    : []
  const posadaMap = Object.fromEntries(posadaInfo.map(p => [p.id, p]))

  // Enrich with guest name + email (for host view)
  const guestIds = [...new Set(rows.map(b => b.guestId))]
  const guestInfo = guestIds.length > 0
    ? await db.select({ id: users.id, name: users.name, email: users.email })
        .from(users).where(inArray(users.id, guestIds))
    : []
  const guestMap = Object.fromEntries(guestInfo.map(u => [u.id, u]))

  const enriched = rows.map(b => ({
    ...b,
    posadaNombre: posadaMap[b.posadaId]?.nombre ?? `Posada #${b.posadaId}`,
    posadaSlug: posadaMap[b.posadaId]?.slug ?? '',
    posadaImg: ((posadaMap[b.posadaId]?.imgs ?? []) as string[])[0] ?? '',
    // Plantilla del mensaje al confirmar: solo para el dueño de la posada (o un admin).
    confirmTemplate: (posadaMap[b.posadaId]?.hostId === userId || role === 'admin') ? posadaMap[b.posadaId]?.mensajeConfirmacion ?? null : undefined,
    guestName: guestMap[b.guestId]?.name ?? `Huésped #${b.guestId}`,
    // El email del huésped solo lo ve el propio huésped o un admin (el posadero usa el chat).
    guestEmail: role === 'admin' || b.guestId === userId ? guestMap[b.guestId]?.email ?? '' : '',
  }))

  return NextResponse.json(enriched)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Inicia sesión para reservar' }, { status: 401 })

  if (!BOOKINGS_OPEN && (session.user as any).role !== 'admin') {
    return NextResponse.json({ error: PRIVATE_PHASE_MSG }, { status: 403 })
  }
  const body = await readJson(req)
  if (Object.keys(body).length === 0) return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 })
  const { checkIn, checkOut, guestCount } = body
  const posadaId = parseId(body.posadaId)
  const paymentMethod = typeof body.paymentMethod === 'string' ? body.paymentMethod.slice(0, 40) : null
  const notes = typeof body.notes === 'string' ? body.notes.trim().slice(0, 1000) || null : null

  // ── Validate dates server-side (never trust the client) ──
  const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
  if (!posadaId || !DATE_RE.test(String(checkIn ?? '')) || !DATE_RE.test(String(checkOut ?? ''))) {
    return NextResponse.json({ error: 'Fechas inválidas' }, { status: 400 })
  }
  const inD = new Date(checkIn + 'T00:00:00')
  const outD = new Date(checkOut + 'T00:00:00')
  const today = new Date(); today.setHours(0, 0, 0, 0)
  if (isNaN(inD.getTime()) || isNaN(outD.getTime())) {
    return NextResponse.json({ error: 'Fechas inválidas' }, { status: 400 })
  }
  if (inD < today) return NextResponse.json({ error: 'La llegada no puede ser en el pasado' }, { status: 400 })
  // La fecha debe existir tal cual (rechaza 2026-11-31) y en un rango razonable.
  const sameDay = (d: Date, s: string) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` === s
  if (!sameDay(inD, String(checkIn)) || !sameDay(outD, String(checkOut))) return NextResponse.json({ error: 'Fechas inválidas' }, { status: 400 })
  const nights = Math.round((outD.getTime() - inD.getTime()) / 86_400_000)
  if (nights < 1) return NextResponse.json({ error: 'La salida debe ser posterior a la llegada' }, { status: 400 })
  if (nights > 30) return NextResponse.json({ error: 'La estadía máxima es de 30 noches' }, { status: 400 })
  if (inD.getTime() - today.getTime() > 548 * 86_400_000) return NextResponse.json({ error: 'Solo se puede reservar hasta 18 meses por adelantado' }, { status: 400 })

  const db = getDb()

  // Verify posada is active + get host info for email
  const [posada] = await db.select().from(posadas).where(eq(posadas.id, posadaId))
  if (!posada || posada.status !== 'active' || (posada.isDemo && (session.user as any).role !== 'admin')) {
    return NextResponse.json({ error: 'Posada no disponible' }, { status: 400 })
  }
  if (posada.hostId === parseInt((session.user as any).id) && (session.user as any).role !== 'admin') {
    return NextResponse.json({ error: 'No puedes reservar tu propia posada' }, { status: 400 })
  }

  // Capacity check
  const guests = Math.max(1, parseInt(guestCount) || 1)
  if (guests > posada.capacidad) {
    return NextResponse.json({ error: `Esta posada admite hasta ${posada.capacidad} huéspedes` }, { status: 400 })
  }

  // Disponibilidad por habitaciones: reservas de RESER-VE + ocupación externa (WhatsApp, Booking, Airbnb…).
  await syncStaleFeeds(posada.id).catch(() => {})
  const available = await isRangeAvailable(posada, String(checkIn), String(checkOut), roomsForGuests(posada, guests))
  if (!available) {
    return NextResponse.json({ error: 'Esas fechas ya no están disponibles' }, { status: 409 })
  }

  // Recompute price on the server (10% service fee) — never trust the client total
  // El viajero paga solo noches × precio. La comisión la asume la posada (no se cobra al cliente).
  const totalPrice = nights * posada.precio

  const year = new Date().getFullYear()
  // Código legible y con margen amplio para evitar colisiones (6 caracteres alfanuméricos).
  const bookingCode = `RV-${year}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`

  const [booking] = await db.insert(bookings).values({
    bookingCode, posadaId, checkIn, checkOut, nights, totalPrice,
    paymentMethod, guestCount: guests, notes,
    guestId: parseInt((session.user as any).id),
    status: 'pending',
  }).returning()

  // Send emails (fire-and-forget — don't block the response)
  const guestName = session.user.name ?? 'Viajero'
  const guestEmail = session.user.email!

  // Correos tras responder: after() mantiene viva la función hasta que salen.
  after(async () => {
    const host = posada.hostId
      ? (await db.select({ email: users.email, name: users.name }).from(users).where(eq(users.id, posada.hostId)))[0]
      : null
    await Promise.all([
      emailGuestBookingReceived({ guestEmail, guestName, posadaNombre: posada.nombre, bookingCode, checkIn, checkOut, nights, totalPrice, paymentMethod }),
      host ? emailHostNewBooking({ hostEmail: host.email, hostName: host.name, guestName, guestEmail, posadaNombre: posada.nombre, bookingCode, checkIn, checkOut, nights, totalPrice, paymentMethod, guestCount: guests, notes }) : null,
    ])
  })

  return NextResponse.json({ ...booking, posadaNombre: posada.nombre }, { status: 201 })
}
