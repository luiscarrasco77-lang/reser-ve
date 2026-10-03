import { getDb } from './db'
import { posadas as posadasTable, bookings } from './db/schema'
import { eq, and, inArray } from 'drizzle-orm'
import { normalizeStr } from './search'
import { isRangeAvailable } from './availability'

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
  // Con base de datos, solo las posadas activas de la BD (lo que el admin aprueba o suspende).
  // Sin BD (desarrollo), el catálogo curado de lib/data.
  const bySlug = new Map<string, PosadaLite>()
  let fromDb = false
  if (process.env.DATABASE_URL) {
    try {
      const rows = await getDb().select().from(posadasTable).where(eq(posadasTable.status, 'active'))
      for (const r of rows) bySlug.set(r.slug, toLite(r))
      fromDb = true
    } catch {
      // BD no disponible: catálogo curado.
    }
  }
  if (!fromDb) {
    const { posadas } = await import('./data')
    for (const p of posadas) bySlug.set(p.slug, toLite(p))
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
    const [p] = await db.select({ id: posadasTable.id, habitaciones: posadasTable.habitaciones, capacidad: posadasTable.capacidad }).from(posadasTable).where(eq(posadasTable.slug, slug))
    if (!p) return true
    return await isRangeAvailable(p, checkIn, checkOut, 1)
  } catch {
    return true
  }
}
