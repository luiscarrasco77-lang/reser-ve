import { NextRequest, NextResponse, after } from 'next/server'
import { getDb } from '@/lib/db'
import { posadas, users } from '@/lib/db/schema'
import { emailAdminPosadaPending } from '@/lib/email'
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

  let rows: any[] = []
  try {
    const db = getDb()
    rows = await db.select().from(posadas).where(eq(posadas.status, 'active'))
  } catch {
    rows = []
  }

  // Map DB rows to Posada shape expected by the UI (nested host, reseñas=[])
  const bySlug = new Map<string, any>()
  for (const p of rows) {
    bySlug.set(p.slug, {
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
    })
  }

  // Include curated catalog (lib/data) for any slug not already in the DB, so the
  // full set shows in search without needing a re-seed.
  const { posadas: curated } = await import('@/lib/data')
  for (const p of curated) {
    if (!bySlug.has(p.slug)) {
      bySlug.set(p.slug, { ...p, reseñas: [] })
    }
  }

  const mapped = [...bySlug.values()]

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

  const role = (session.user as any).role
  if (role !== 'host' && role !== 'admin') return NextResponse.json({ error: 'Solo los posaderos pueden publicar posadas' }, { status: 403 })

  const body = await req.json()
  const nombre = String(body.nombre ?? '').trim()
  const precio = parseInt(body.precio)
  const lat = Number(body.lat), lng = Number(body.lng)
  if (!nombre || !body.destino || !body.destinoSlug || !String(body.descripcion ?? '').trim()) {
    return NextResponse.json({ error: 'Completa nombre, destino y descripción' }, { status: 400 })
  }
  if (!(precio > 0)) return NextResponse.json({ error: 'El precio por noche debe ser mayor a 0' }, { status: 400 })
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return NextResponse.json({ error: 'Ubicación inválida' }, { status: 400 })

  const arr = (v: unknown) => Array.isArray(v) ? v.map(String) : []
  const slug = nombre.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now().toString(36)
  const hostId = parseInt((session.user as any).id)

  const db = getDb()
  // Lista blanca: el posadero no puede fijar rating, reseñas, estado, etc.
  const [created] = await db.insert(posadas).values({
    slug, hostId, nombre,
    destino: String(body.destino), destinoSlug: String(body.destinoSlug),
    tipo: String(body.tipo || 'Posada'),
    precio,
    habitaciones: Math.max(1, parseInt(body.habitaciones) || 1),
    capacidad: Math.max(1, parseInt(body.capacidad) || 2),
    descripcion: String(body.descripcion).trim(),
    tags: arr(body.tags), servicios: arr(body.servicios), politicas: arr(body.politicas),
    imgs: arr(body.imgs), metodoPago: arr(body.metodoPago),
    lat, lng,
    hostNombre: session.user.name ?? null,
    status: 'pending_review',
  }).returning()

  // Avisa a los admins para que la revisen.
  after(async () => {
    const admins = await db.select({ email: users.email }).from(users).where(eq(users.role, 'admin'))
    await emailAdminPosadaPending({
      to: admins.map(a => a.email), nombre, destino: created.destino, precio,
      hostName: session.user?.name ?? 'Posadero', hostEmail: session.user?.email ?? '',
    })
  })

  return NextResponse.json(created, { status: 201 })
}
