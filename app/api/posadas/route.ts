import { NextRequest, NextResponse, after } from 'next/server'
import { getDb } from '@/lib/db'
import { posadas, users } from '@/lib/db/schema'
import { emailAdminPosadaPending, emailHostPosadaReceived } from '@/lib/email'
import { parsePosadaInput } from '@/lib/posada-input'
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
      rating: p.rating ?? 0,
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

  const body = await req.json().catch(() => null)
  const parsed = parsePosadaInput(body)
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 })
  const input = parsed.data as any
  const nombre: string = input.nombre
  const precio: number = input.precio
  const slug = nombre.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now().toString(36)
  const hostId = parseInt((session.user as any).id)

  const db = getDb()
  // Lista blanca: el posadero no puede fijar rating, reseñas, estado, etc.
  const [created] = await db.insert(posadas).values({
    ...input,
    slug, hostId,
    hostNombre: session.user.name ?? null,
    status: 'pending_review',
  }).returning()

  // Avisa a los admins para que la revisen.
  after(async () => {
    if (session.user?.email) await emailHostPosadaReceived({ hostEmail: session.user.email, hostName: session.user.name ?? 'Posadero', posadaNombre: nombre })
    const admins = await db.select({ email: users.email }).from(users).where(eq(users.role, 'admin'))
    await emailAdminPosadaPending({
      to: admins.map(a => a.email), nombre, destino: created.destino, precio,
      hostName: session.user?.name ?? 'Posadero', hostEmail: session.user?.email ?? '',
    })
  })

  return NextResponse.json(created, { status: 201 })
}
