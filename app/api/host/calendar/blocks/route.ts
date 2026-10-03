import { NextRequest, NextResponse } from 'next/server'
import { and, eq, isNull } from 'drizzle-orm'
import { getDb } from '@/lib/db'
import { calendarBlocks } from '@/lib/db/schema'
import { getOwnedPosada } from '@/lib/host-auth'
import { parseId, readJson } from '@/lib/http'

const SOURCES = ['whatsapp', 'telefono', 'booking', 'airbnb', 'otro', 'cerrado']
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

// Anotar ocupación externa: { posada, start, end, rooms, source, note }
export async function POST(req: NextRequest) {
  const body = await readJson(req)
  const p = await getOwnedPosada(body.posada)
  if (!p) return NextResponse.json({ error: 'No encontrada' }, { status: 404 })
  const start = String(body.start ?? ''), end = String(body.end ?? '')
  if (!DATE_RE.test(start) || !DATE_RE.test(end) || end <= start) {
    return NextResponse.json({ error: 'Revisa las fechas: la salida debe ser posterior a la llegada' }, { status: 400 })
  }
  const nights = (Date.parse(end) - Date.parse(start)) / 86_400_000
  if (!(nights >= 1 && nights <= 366)) return NextResponse.json({ error: 'El rango debe ser de 1 a 366 noches' }, { status: 400 })
  const source = SOURCES.includes(body.source) ? body.source : 'otro'
  // "Cerrado" bloquea todas las habitaciones (vacaciones, mantenimiento…).
  const rooms = source === 'cerrado' ? p.habitaciones : Math.min(p.habitaciones, Math.max(1, parseInt(body.rooms) || 1))
  const note = typeof body.note === 'string' ? body.note.trim().slice(0, 120) || null : null
  const [row] = await getDb().insert(calendarBlocks).values({ posadaId: p.id, startDate: start, endDate: end, rooms, source, note }).returning()
  return NextResponse.json(row, { status: 201 })
}

// Borrar una ocupación anotada a mano: ?id=&posada=
export async function DELETE(req: NextRequest) {
  const p = await getOwnedPosada(req.nextUrl.searchParams.get('posada'))
  const id = parseId(req.nextUrl.searchParams.get('id'))
  if (!p || !id) return NextResponse.json({ error: 'No encontrada' }, { status: 404 })
  const rows = await getDb().delete(calendarBlocks)
    .where(and(eq(calendarBlocks.id, id), eq(calendarBlocks.posadaId, p.id), isNull(calendarBlocks.feedId)))
    .returning({ id: calendarBlocks.id })
  if (!rows.length) return NextResponse.json({ error: 'No encontrada' }, { status: 404 })
  return NextResponse.json({ ok: true })
}
