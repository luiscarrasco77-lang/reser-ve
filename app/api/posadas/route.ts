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
  const results = await db.select().from(posadas).where(eq(posadas.status, 'active'))

  // Filter in JS (flexible, good enough for current scale)
  return NextResponse.json(results.filter(p => {
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
    status: 'draft',
  }).returning()

  return NextResponse.json(created, { status: 201 })
}
