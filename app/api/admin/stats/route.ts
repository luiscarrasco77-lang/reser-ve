import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { users, posadas, bookings } from '@/lib/db/schema'
import { auth } from '@/auth'
import { count, sum, eq, inArray } from 'drizzle-orm'

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

  return NextResponse.json({ totalUsers, totalPosadas, totalBookings, pendingReview, pendingBookings, revenue: revenue ?? 0 })
}
