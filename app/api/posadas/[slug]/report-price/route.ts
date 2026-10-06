import { NextRequest, NextResponse, after } from 'next/server'
import { eq } from 'drizzle-orm'
import { auth } from '@/auth'
import { getDb } from '@/lib/db'
import { posadas } from '@/lib/db/schema'
import { rateLimit, readJson } from '@/lib/http'
import { reportPrice } from '@/lib/moderation'

// Un viajero avisa de que vio esta posada más barata en otro canal (paridad de precios).
export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const limited = rateLimit(req, 'report-price', 5, 60 * 60_000)
  if (limited) return limited
  const { slug } = await params
  const [p] = await getDb().select({ id: posadas.id, status: posadas.status }).from(posadas).where(eq(posadas.slug, slug))
  if (!p || p.status !== 'active') return NextResponse.json({ error: 'No encontrada' }, { status: 404 })
  const b = await readJson(req)
  const s = (v: unknown, n: number) => (typeof v === 'string' ? v.trim().slice(0, n) : '')
  const canal = s(b.canal, 40), precio = s(b.precio, 40), enlace = s(b.enlace, 300), nota = s(b.nota, 300)
  if (!canal && !enlace) return NextResponse.json({ error: 'Dinos dónde la viste' }, { status: 400 })
  const session = await auth()
  after(() => reportPrice({ posadaId: p.id, userId: session?.user ? parseInt((session.user as any).id) : null, canal, precio, enlace, nota }).then(() => {}))
  return NextResponse.json({ ok: true }, { status: 201 })
}
