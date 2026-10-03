import { and, eq, gt, inArray, lt } from 'drizzle-orm'
import { getDb } from './db'
import { bookings, calendarBlocks, calendarFeeds, posadas } from './db/schema'

// ─── Disponibilidad por habitaciones ───────────────────────────────────────────
// Cada noche se cuentan las habitaciones ocupadas (reservas de RESER-VE + ocupación
// anotada a mano o importada de Booking/Airbnb) contra el total de la posada.
// Las fechas son strings YYYY-MM-DD; un rango [inicio, salida) cubre las noches.

export type PosadaRooms = { id: number; habitaciones: number; capacidad: number }

// Habitaciones que ocupa una reserva según el nº de huéspedes.
export function roomsForGuests(p: Pick<PosadaRooms, 'habitaciones' | 'capacidad'>, guests: number): number {
  const perRoom = Math.max(1, Math.ceil(p.capacidad / Math.max(1, p.habitaciones)))
  return Math.min(Math.max(1, p.habitaciones), Math.max(1, Math.ceil(guests / perRoom)))
}

export function addDays(date: string, n: number): string {
  const d = new Date(date + 'T00:00:00Z')
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}

function nights(start: string, end: string): string[] {
  const out: string[] = []
  for (let d = start; d < end && out.length < 800; d = addDays(d, 1)) out.push(d)
  return out
}

export type OccupancyItem = {
  kind: 'booking' | 'block'
  id: number
  start: string
  end: string
  rooms: number
  label: string
  source: string
  status?: string
}

// Ocupación de una posada entre [from, to): items y habitaciones usadas por noche.
export async function getOccupancy(p: PosadaRooms, from: string, to: string, excludeBookingId?: number) {
  const db = getDb()
  const [bk, bl] = await Promise.all([
    db.select().from(bookings).where(and(
      eq(bookings.posadaId, p.id), inArray(bookings.status, ['pending', 'confirmed']),
      lt(bookings.checkIn, to), gt(bookings.checkOut, from),
    )),
    db.select().from(calendarBlocks).where(and(
      eq(calendarBlocks.posadaId, p.id), lt(calendarBlocks.startDate, to), gt(calendarBlocks.endDate, from),
    )),
  ])
  const items: OccupancyItem[] = [
    ...bk.filter(b => b.id !== excludeBookingId).map(b => ({
      kind: 'booking' as const, id: b.id, start: b.checkIn, end: b.checkOut,
      rooms: roomsForGuests(p, b.guestCount), label: b.bookingCode, source: 'reserve', status: b.status,
    })),
    ...bl.map(b => ({
      kind: 'block' as const, id: b.id, start: b.startDate, end: b.endDate,
      rooms: b.rooms, label: b.note ?? '', source: b.source,
    })),
  ]
  const used = new Map<string, number>()
  for (const it of items) {
    for (const d of nights(it.start < from ? from : it.start, it.end > to ? to : it.end)) {
      used.set(d, (used.get(d) ?? 0) + it.rooms)
    }
  }
  return { items, used }
}

// ¿Caben `roomsNeeded` habitaciones todas las noches de [checkIn, checkOut)?
export async function isRangeAvailable(p: PosadaRooms, checkIn: string, checkOut: string, roomsNeeded: number, excludeBookingId?: number) {
  const { used } = await getOccupancy(p, checkIn, checkOut, excludeBookingId)
  return nights(checkIn, checkOut).every(d => (used.get(d) ?? 0) + roomsNeeded <= p.habitaciones)
}

// Noches completamente llenas (para el calendario público), como rangos de 1 noche agrupados.
export async function fullRanges(p: PosadaRooms, from: string, to: string) {
  const { used } = await getOccupancy(p, from, to)
  const full = [...used.entries()].filter(([, n]) => n >= p.habitaciones).map(([d]) => d).sort()
  const ranges: { checkIn: string; checkOut: string }[] = []
  for (const d of full) {
    const last = ranges[ranges.length - 1]
    if (last && last.checkOut === d) last.checkOut = addDays(d, 1)
    else ranges.push({ checkIn: d, checkOut: addDays(d, 1) })
  }
  return ranges
}

// ─── iCal ──────────────────────────────────────────────────────────────────────

type IcalEvent = { uid: string; start: string; end: string; summary: string }

function icalDate(v: string): string | null {
  const m = v.match(/(\d{4})(\d{2})(\d{2})/)
  return m ? `${m[1]}-${m[2]}-${m[3]}` : null
}

// Parser mínimo de iCalendar (lo que exportan Booking, Airbnb, Vrbo y Google Calendar).
export function parseIcal(text: string): IcalEvent[] {
  const lines = text.replace(/\r\n[ \t]/g, '').replace(/\n[ \t]/g, '').split(/\r?\n/)
  const events: IcalEvent[] = []
  let cur: Partial<IcalEvent> | null = null
  for (const line of lines) {
    if (line === 'BEGIN:VEVENT') cur = {}
    else if (line === 'END:VEVENT') {
      if (cur?.start) {
        const end = cur.end && cur.end > cur.start ? cur.end : addDays(cur.start, 1)
        events.push({ uid: cur.uid ?? `${cur.start}-${end}`, start: cur.start, end, summary: cur.summary ?? '' })
      }
      cur = null
    } else if (cur) {
      const i = line.indexOf(':')
      if (i < 0) continue
      const key = line.slice(0, i).split(';')[0].toUpperCase()
      const val = line.slice(i + 1)
      if (key === 'DTSTART') cur.start = icalDate(val) ?? undefined
      else if (key === 'DTEND') cur.end = icalDate(val) ?? undefined
      else if (key === 'UID') cur.uid = val.slice(0, 200)
      else if (key === 'SUMMARY') cur.summary = val.slice(0, 120)
    }
  }
  return events
}

// Solo URLs https públicas (evita que el servidor consulte direcciones internas).
export function isSafeFeedUrl(raw: string): boolean {
  try {
    const u = new URL(raw)
    if (u.protocol !== 'https:') return false
    const h = u.hostname.toLowerCase()
    if (h === 'localhost' || h.endsWith('.local') || h.endsWith('.internal')) return false
    if (/^[\d.]+$/.test(h) || h.includes(':')) return false // IPs literales
    return true
  } catch { return false }
}

// Descarga un calendario externo y reemplaza sus bloqueos por los actuales.
export async function syncFeed(feedId: number): Promise<{ ok: boolean; count: number; error?: string }> {
  const db = getDb()
  const [feed] = await db.select().from(calendarFeeds).where(eq(calendarFeeds.id, feedId))
  if (!feed) return { ok: false, count: 0, error: 'No existe' }
  let status = ''
  let count = 0
  try {
    if (!isSafeFeedUrl(feed.url)) throw new Error('Enlace no válido')
    const res = await fetch(feed.url, { signal: AbortSignal.timeout(10_000), headers: { 'User-Agent': 'RESER-VE calendar sync (https://reser-ve.com)' } })
    if (!res.ok) throw new Error(`El calendario respondió ${res.status}`)
    const text = (await res.text()).slice(0, 2_000_000)
    if (!text.includes('BEGIN:VCALENDAR')) throw new Error('El enlace no es un calendario iCal')
    const today = new Date().toISOString().slice(0, 10)
    const limit = addDays(today, 730)
    const events = parseIcal(text).filter(e => e.end > today && e.start < limit)
    await db.delete(calendarBlocks).where(eq(calendarBlocks.feedId, feed.id))
    if (events.length) {
      await db.insert(calendarBlocks).values(events.map(e => ({
        posadaId: feed.posadaId, startDate: e.start, endDate: e.end, rooms: feed.rooms,
        source: 'ical', note: feed.name, feedId: feed.id, externalUid: e.uid,
      })))
    }
    count = events.length
    status = `OK · ${count} reserva${count === 1 ? '' : 's'}`
  } catch (e: any) {
    status = `Error: ${e?.name === 'TimeoutError' ? 'el calendario tardó demasiado' : e?.message ?? 'no se pudo leer'}`
  }
  await db.update(calendarFeeds).set({ lastSyncAt: new Date(), lastStatus: status }).where(eq(calendarFeeds.id, feed.id))
  return status.startsWith('OK') ? { ok: true, count } : { ok: false, count: 0, error: status.slice(7) }
}

// Sincroniza todos los calendarios externos (cron diario).
export async function syncAllFeeds() {
  const feeds = await getDb().select({ id: calendarFeeds.id }).from(calendarFeeds)
  let ok = 0
  for (const f of feeds) if ((await syncFeed(f.id)).ok) ok++
  return { total: feeds.length, ok }
}

// Calendario de la posada en formato iCal (para importar en Booking, Airbnb o Google Calendar).
export async function buildIcal(posadaId: number, nombre: string): Promise<string> {
  const today = new Date().toISOString().slice(0, 10)
  const p = (await getDb().select().from(posadas).where(eq(posadas.id, posadaId)))[0]
  const { items } = await getOccupancy({ id: posadaId, habitaciones: p?.habitaciones ?? 1, capacidad: p?.capacidad ?? 2 }, addDays(today, -30), addDays(today, 730))
  const fmt = (d: string) => d.replace(/-/g, '')
  const stamp = new Date().toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z'
  const esc = (s: string) => s.replace(/[\\;,]/g, m => '\\' + m).replace(/\n/g, ' ')
  const ev = items.map(it => [
    'BEGIN:VEVENT',
    `UID:${it.kind}-${it.id}@reser-ve.com`,
    `DTSTAMP:${stamp}`,
    `DTSTART;VALUE=DATE:${fmt(it.start)}`,
    `DTEND;VALUE=DATE:${fmt(it.end)}`,
    `SUMMARY:${esc(it.kind === 'booking' ? `RESER-VE ${it.label} (${it.rooms} hab.)` : `Ocupado (${it.rooms} hab.)`)}`,
    'END:VEVENT',
  ].join('\r\n'))
  return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//RESER-VE//Calendario//ES', 'CALSCALE:GREGORIAN', `X-WR-CALNAME:${esc(nombre)} · RESER-VE`, ...ev, 'END:VCALENDAR'].join('\r\n') + '\r\n'
}
