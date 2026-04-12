import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { bookings, posadas, users } from '@/lib/db/schema'
import { auth } from '@/auth'
import { eq, desc } from 'drizzle-orm'

export async function GET() {
  const session = await auth()
  if (!session?.user || (session.user as any).role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const db = getDb()
  const rows = await db.select().from(bookings).orderBy(desc(bookings.createdAt)).limit(200)

  const posadaIds = [...new Set(rows.map(b => b.posadaId))]
  const guestIds  = [...new Set(rows.map(b => b.guestId))]

  const [posadaList, guestList] = await Promise.all([
    posadaIds.length ? db.select({ id: posadas.id, nombre: posadas.nombre, slug: posadas.slug }).from(posadas) : Promise.resolve([]),
    guestIds.length  ? db.select({ id: users.id, name: users.name, email: users.email }).from(users)           : Promise.resolve([]),
  ])

  const pm = Object.fromEntries(posadaList.map(p => [p.id, p]))
  const gm = Object.fromEntries(guestList.map(u => [u.id, u]))

  return NextResponse.json(rows.map(b => ({
    ...b,
    posadaNombre: pm[b.posadaId]?.nombre ?? `#${b.posadaId}`,
    posadaSlug:   pm[b.posadaId]?.slug   ?? '',
    guestName:    gm[b.guestId]?.name    ?? `#${b.guestId}`,
    guestEmail:   gm[b.guestId]?.email   ?? '',
  })))
}
