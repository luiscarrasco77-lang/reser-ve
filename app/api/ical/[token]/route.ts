import { NextRequest } from 'next/server'
import { eq } from 'drizzle-orm'
import { getDb } from '@/lib/db'
import { posadas } from '@/lib/db/schema'
import { buildIcal } from '@/lib/availability'

// Enlace iCal de exportación de una posada (para Booking, Airbnb, Google Calendar…).
// El token es secreto y solo lo ve el posadero en su calendario. Solo expone fechas ocupadas.
export async function GET(_: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const token = (await params).token.replace(/\.ics$/, '')
  if (!/^[a-f0-9]{36}$/.test(token)) return new Response('Not found', { status: 404 })
  const [p] = await getDb().select({ id: posadas.id, nombre: posadas.nombre }).from(posadas).where(eq(posadas.icalToken, token))
  if (!p) return new Response('Not found', { status: 404 })
  return new Response(await buildIcal(p.id, p.nombre), {
    headers: { 'Content-Type': 'text/calendar; charset=utf-8', 'Cache-Control': 'no-store', 'Content-Disposition': 'inline; filename="reser-ve.ics"' },
  })
}
