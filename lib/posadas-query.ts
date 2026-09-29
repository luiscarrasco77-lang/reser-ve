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

// Devuelve posadas activas que cumplen los filtros.
// Siempre incluye el catálogo curado (lib/data) para garantizar variedad, y
// además las posadas reales de la base de datos si está disponible. Nunca lanza.
export async function queryPosadas(opts: {
  destino?: string; precioMax?: number; huespedes?: number; texto?: string
} = {}): Promise<PosadaLite[]> {
  const { posadas } = await import('./data')
  const bySlug = new Map<string, PosadaLite>()
  for (const p of posadas) bySlug.set(p.slug, toLite(p))

  // Añade/actualiza con posadas reales activas de la DB (sin romper si falla).
  if (process.env.DATABASE_URL) {
    try {
      const db = getDb()
      const rows = await db.select().from(posadasTable).where(eq(posadasTable.status, 'active'))
      for (const r of rows) bySlug.set(r.slug, toLite(r))
    } catch {
      // DB no disponible o esquema desactualizado: seguimos con el catálogo curado.
    }
  }

  const base = [...bySlug.values()]

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
// Ante cualquier error o sin DB, asume disponible para no bloquear al concierge.
export async function isAvailable(slug: string, checkIn: string, checkOut: string): Promise<boolean> {
  if (!process.env.DATABASE_URL) return true
  try {
    const db = getDb()
    const [posada] = await db.select({ id: posadasTable.id }).from(posadasTable).where(eq(posadasTable.slug, slug))
    if (!posada) return true // posada curada que no está en la DB: se considera disponible
    const rows = await db.select({ checkIn: bookings.checkIn, checkOut: bookings.checkOut })
      .from(bookings)
      .where(and(eq(bookings.posadaId, posada.id), inArray(bookings.status, ['pending', 'confirmed'])))
    return !rows.some(r => checkIn < r.checkOut && checkOut > r.checkIn)
  } catch {
    return true
  }
}
