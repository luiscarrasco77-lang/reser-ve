import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'node:crypto'
import { and, eq, gte, isNull } from 'drizzle-orm'
import { auth } from '@/auth'
import { getDb } from '@/lib/db'
import { calendarBlocks, calendarFeeds, posadas } from '@/lib/db/schema'
import { addDays, getOccupancy, syncFeed } from '@/lib/availability'
import { getOwnedPosada } from '@/lib/host-auth'
import { SITE_URL } from '@/lib/constants'

// Calendario del posadero: ocupación por noche de un mes, ocupación externa y calendarios conectados.
// GET ?posada=<slug>&month=YYYY-MM
export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const db = getDb()
  const userId = parseInt((session.user as any).id)
  const role = (session.user as any).role

  // Posadas que puede gestionar (para el selector).
  // Los admins ven todas las posadas (primero las reales); el posadero, solo las suyas.
  const cols = { slug: posadas.slug, nombre: posadas.nombre, status: posadas.status, isDemo: posadas.isDemo }
  const mine = role === 'admin'
    ? (await db.select(cols).from(posadas)).sort((a, b) => Number(a.isDemo) - Number(b.isDemo) || a.nombre.localeCompare(b.nombre))
    : await db.select(cols).from(posadas).where(eq(posadas.hostId, userId))
  if (mine.length === 0) return NextResponse.json({ posadas: [], posada: null })

  const p = await getOwnedPosada(req.nextUrl.searchParams.get('posada') || mine[0].slug)
  if (!p) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const month = /^\d{4}-\d{2}$/.test(req.nextUrl.searchParams.get('month') ?? '') ? req.nextUrl.searchParams.get('month')! : new Date().toISOString().slice(0, 7)
  const from = `${month}-01`
  const to = addDays(addDays(from, 31).slice(0, 7) + '-01', 0)

  // Si un calendario externo no se sincroniza hace más de 30 min, se actualiza al abrir.
  const feeds = await db.select().from(calendarFeeds).where(eq(calendarFeeds.posadaId, p.id))
  const stale = feeds.filter(f => !f.lastSyncAt || Date.now() - f.lastSyncAt.getTime() > 30 * 60_000)
  if (stale.length) await Promise.all(stale.map(f => syncFeed(f.id)))

  const { items, used } = await getOccupancy({ id: p.id, habitaciones: p.habitaciones, capacidad: p.capacidad }, from, to)
  const days: { date: string; used: number }[] = []
  for (let d = from; d < to; d = addDays(d, 1)) days.push({ date: d, used: used.get(d) ?? 0 })

  // Ocupación manual próxima (para la lista editable).
  const today = new Date().toISOString().slice(0, 10)
  const manual = await db.select().from(calendarBlocks)
    .where(and(eq(calendarBlocks.posadaId, p.id), isNull(calendarBlocks.feedId), gte(calendarBlocks.endDate, today)))

  // Token del enlace de exportación (se crea la primera vez).
  let token = p.icalToken
  if (!token) {
    token = randomBytes(18).toString('hex')
    await db.update(posadas).set({ icalToken: token }).where(eq(posadas.id, p.id))
  }

  return NextResponse.json({
    posadas: mine,
    posada: { slug: p.slug, nombre: p.nombre, habitaciones: p.habitaciones, isDemo: p.isDemo },
    isAdmin: role === 'admin',
    month, days, items,
    manual: manual.sort((a, b) => a.startDate.localeCompare(b.startDate)),
    feeds: (await db.select().from(calendarFeeds).where(eq(calendarFeeds.posadaId, p.id))).map(f => ({ id: f.id, name: f.name, source: f.source, url: f.url, rooms: f.rooms, lastSyncAt: f.lastSyncAt, lastStatus: f.lastStatus })),
    exportUrl: `${SITE_URL}/api/ical/${token}`,
  })
}
