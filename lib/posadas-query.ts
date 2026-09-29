import { getDb } from './db'
import { posadas as posadasTable, bookings } from './db/schema'
import { eq, and, inArray } from 'drizzle-orm'
import { normalizeStr } from './search'

export type PosadaLite = {
  slug: string; nombre: string; destino: string; destinoSlug: string; tipo: string
  precio: number; rating: number; reviews: number; capacidad: number
  tags: string[]; servicios: string[]; metodoPago: string[]; descripcion: string; img: string
}

function toLite(p: any): PosadaLite {
  return {
    slug: p.slug, nombre: p.nombre, destino: p.destino, destinoSlug: p.destinoSlug, tipo: p.tipo,
    precio: p.precio, rating: p.rating ?? 0, reviews: p.reviews ?? 0, capacidad: p.capacidad ?? 2,
    tags: (p.tags as string[]) ?? [], servicios: (p.servicios as string[]) ?? [],
    metodoPago: (p.metodoPago as string[]) ?? [],
    descripcion: p.descripcion ?? '',
    img: ((p.imgs as string[]) ?? [])[0] ?? '',
  }
}

// Devuelve posadas activas que cumplen los filtros. Usa DB o datos curados (fallback).
export async function queryPosadas(opts: {
  destino?: string; precioMax?: number; huespedes?: number; texto?: string
} = {}): Promise<PosadaLite[]> {
  let base: PosadaLite[]

  if (!process.env.DATABASE_URL) {
    const { posadas } = await import('./data')
    base = posadas.map(toLite)
  } else {
    const db = getDb()
    const rows = await db.select().from(posadasTable).where(eq(posadasTable.status, 'active'))
    base = rows.map(toLite)
  }

  const destN = opts.destino ? normalizeStr(opts.destino) : ''
  const txtN = opts.texto ? normalizeStr(opts.texto) : ''

  return base.filter(p => {
    if (opts.precioMax && p.precio > opts.precioMax) return false
    if (opts.huespedes && p.capacidad < opts.huespedes) return false
    if (destN && !normalizeStr(p.destino).includes(destN) && !normalizeStr(p.destinoSlug).includes(destN)) return false
    if (txtN) {
      const hay = normalizeStr(`${p.nombre} ${p.tipo} ${p.descripcion} ${p.tags.join(' ')} ${p.servicios.join(' ')} ${p.destino}`)
      if (!hay.includes(txtN)) return false
    }
    return true
  })
}

// ¿Está la posada libre en ese rango? (sin reservas pendientes/confirmadas que se solapen)
export async function isAvailable(slug: string, checkIn: string, checkOut: string): Promise<boolean> {
  if (!process.env.DATABASE_URL) return true
  const db = getDb()
  const [posada] = await db.select({ id: posadasTable.id }).from(posadasTable).where(eq(posadasTable.slug, slug))
  if (!posada) return false
  const rows = await db.select({ checkIn: bookings.checkIn, checkOut: bookings.checkOut })
    .from(bookings)
    .where(and(eq(bookings.posadaId, posada.id), inArray(bookings.status, ['pending', 'confirmed'])))
  return !rows.some(r => checkIn < r.checkOut && checkOut > r.checkIn)
}
