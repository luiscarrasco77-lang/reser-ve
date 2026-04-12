import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { posadas } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { auth } from '@/auth'
import { normalizeStr } from '@/lib/search'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const destino = searchParams.get('destino') || ''
  const precioMax = parseInt(searchParams.get('precioMax') || '999')
  const metodoPago = searchParams.get('metodoPago') || ''

  // Fallback to hardcoded data if no DATABASE_URL
  if (!process.env.DATABASE_URL) {
    const { posadas: posadasData } = await import('@/lib/data')
    return NextResponse.json(posadasData.filter(p => {
      if (p.precio > precioMax) return false
      if (destino && !normalizeStr(p.destino).includes(normalizeStr(destino)) && !normalizeStr(p.destinoSlug).includes(normalizeStr(destino))) return false
      if (metodoPago && !p.metodoPago.some((m: string) => normalizeStr(m).includes(normalizeStr(metodoPago)))) return false
      return true
    }))
  }

  const db = getDb()
  const rows = await db.select().from(posadas).where(eq(posadas.status, 'active'))

  // Map DB rows to Posada shape expected by the UI (nested host, reseñas=[])
  const mapped = rows.map(p => ({
    slug: p.slug,
    nombre: p.nombre,
    destino: p.destino,
    destinoSlug: p.destinoSlug,
    tipo: p.tipo,
    precio: p.precio,
    habitaciones: p.habitaciones,
    capacidad: p.capacidad,
    rating: p.rating ?? 5,
    reviews: p.reviews ?? 0,
    descripcion: p.descripcion,
    tags: p.tags as string[] ?? [],
    servicios: p.servicios as string[] ?? [],
    politicas: p.politicas as string[] ?? [],
    imgs: p.imgs as string[] ?? [],
    lat: p.lat,
    lng: p.lng,
    metodoPago: p.metodoPago as string[] ?? [],
    host: { nombre: p.hostNombre ?? '', desde: p.hostDesde ?? '', idiomas: p.hostIdiomas as string[] ?? [] },
    reseñas: [],
  }))

  // Filter in JS (flexible, good enough for current scale)
  return NextResponse.json(mapped.filter(p => {
    if (p.precio > precioMax) return false
    if (destino && !normalizeStr(p.destino).includes(normalizeStr(destino)) && !normalizeStr(p.destinoSlug).includes(normalizeStr(destino))) return false
    if (metodoPago && !p.metodoPago.some((m: string) => normalizeStr(m).includes(normalizeStr(metodoPago)))) return false
    return true
  }))
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const slug = body.nombre.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now().toString(36)

  const db = getDb()
  const [created] = await db.insert(posadas).values({
    ...body,
    slug,
    hostId: parseInt((session.user as any).id),
    status: 'pending_review',
  }).returning()

  return NextResponse.json(created, { status: 201 })
}
