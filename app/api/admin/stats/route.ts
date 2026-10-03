import { HOST_COMMISSION_RATE } from '@/lib/constants'
import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { users, posadas, bookings, calendarBlocks } from '@/lib/db/schema'
import { auth } from '@/auth'
import { count, sum, eq, inArray, and } from 'drizzle-orm'

export async function GET() {
  const session = await auth()
  if (!session?.user || (session.user as any).role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const db = getDb()
  const [
    [{ total: totalUsers }],
    [{ total: totalPosadas }],
    [{ total: totalBookings }],
    [{ total: pendingReview }],
    [{ total: pendingBookings }],
    [{ revenue }],
  ] = await Promise.all([
    db.select({ total: count() }).from(users),
    db.select({ total: count() }).from(posadas),
    db.select({ total: count() }).from(bookings),
    db.select({ total: count() }).from(posadas).where(eq(posadas.status, 'pending_review')),
    db.select({ total: count() }).from(bookings).where(eq(bookings.status, 'pending')),
    db.select({ revenue: sum(bookings.totalPrice) }).from(bookings)
      .where(inArray(bookings.status, ['confirmed', 'completed'])),
  ])

  // Canales de reserva de las posadas reales: lo que anotan o sincronizan en su calendario
  // (WhatsApp, Booking, Airbnb…) frente a las reservas de RESER-VE.
  const realIds = (await db.select({ id: posadas.id }).from(posadas).where(eq(posadas.isDemo, false))).map(p => p.id)
  const nightsOf = (a: string, b: string) => Math.max(0, Math.round((Date.parse(b) - Date.parse(a)) / 86_400_000))
  const chan = new Map<string, { reservas: number; noches: number }>()
  const add = (k: string, n: number) => { const c = chan.get(k) ?? { reservas: 0, noches: 0 }; c.reservas++; c.noches += n; chan.set(k, c) }
  if (realIds.length) {
    for (const b of await db.select().from(calendarBlocks).where(inArray(calendarBlocks.posadaId, realIds))) {
      if (b.source !== 'cerrado') add(b.source, nightsOf(b.startDate, b.endDate) * b.rooms)
    }
    for (const b of await db.select().from(bookings).where(and(inArray(bookings.posadaId, realIds), inArray(bookings.status, ['confirmed', 'completed'])))) {
      add('reserve', b.nights)
    }
  }
  const channels = [...chan.entries()].map(([source, v]) => ({ source, ...v })).sort((a, b) => b.noches - a.noches)

  return NextResponse.json({ channels, totalUsers, totalPosadas, totalBookings, pendingReview, pendingBookings, revenue: Number(revenue ?? 0), commission: Math.round(Number(revenue ?? 0) * HOST_COMMISSION_RATE) })
}
