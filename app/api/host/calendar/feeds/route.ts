import { NextRequest, NextResponse } from 'next/server'
import { and, eq } from 'drizzle-orm'
import { getDb } from '@/lib/db'
import { calendarBlocks, calendarFeeds } from '@/lib/db/schema'
import { getOwnedPosada } from '@/lib/host-auth'
import { parseId, readJson, rateLimit } from '@/lib/http'
import { isSafeFeedUrl, syncFeed } from '@/lib/availability'
import { FEED_CHANNELS, channel } from '@/lib/channels'

// Conectar un calendario externo: { posada, name, url, rooms } — o sincronizar: { posada, action:'sync' }
export async function POST(req: NextRequest) {
  const limited = rateLimit(req, 'feeds', 40, 60 * 60_000)
  if (limited) return limited
  const body = await readJson(req)
  const p = await getOwnedPosada(body.posada)
  if (!p) return NextResponse.json({ error: 'No encontrada' }, { status: 404 })
  const db = getDb()

  if (body.action === 'sync') {
    const feeds = await db.select({ id: calendarFeeds.id }).from(calendarFeeds).where(eq(calendarFeeds.posadaId, p.id))
    const results = await Promise.all(feeds.map(f => syncFeed(f.id)))
    return NextResponse.json({ ok: true, results })
  }

  const url = String(body.url ?? '').trim()
  if (!isSafeFeedUrl(url)) return NextResponse.json({ error: 'Pega el enlace iCal completo (empieza por https://)' }, { status: 400 })
  const existing = await db.select({ id: calendarFeeds.id }).from(calendarFeeds).where(eq(calendarFeeds.posadaId, p.id))
  if (existing.length >= 10) return NextResponse.json({ error: 'Máximo 10 calendarios conectados' }, { status: 400 })
  const source = FEED_CHANNELS.includes(body.source) ? body.source : 'otro'
  const name = String(body.name ?? '').trim().slice(0, 40) || channel(source).label
  const rooms = Math.min(p.habitaciones, Math.max(1, parseInt(body.rooms) || 1))
  const [feed] = await db.insert(calendarFeeds).values({ posadaId: p.id, name, source, url, rooms }).returning()
  const result = await syncFeed(feed.id)
  if (!result.ok) {
    await db.delete(calendarFeeds).where(eq(calendarFeeds.id, feed.id))
    return NextResponse.json({ error: `No pudimos leer ese calendario: ${result.error}` }, { status: 400 })
  }
  return NextResponse.json({ ok: true, id: feed.id, count: result.count }, { status: 201 })
}

// Desconectar: ?id=&posada=
export async function DELETE(req: NextRequest) {
  const p = await getOwnedPosada(req.nextUrl.searchParams.get('posada'))
  const id = parseId(req.nextUrl.searchParams.get('id'))
  if (!p || !id) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
  const db = getDb()
  const [feed] = await db.select().from(calendarFeeds).where(and(eq(calendarFeeds.id, id), eq(calendarFeeds.posadaId, p.id)))
  if (!feed) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
  await db.delete(calendarBlocks).where(eq(calendarBlocks.feedId, feed.id))
  await db.delete(calendarFeeds).where(eq(calendarFeeds.id, feed.id))
  return NextResponse.json({ ok: true })
}
