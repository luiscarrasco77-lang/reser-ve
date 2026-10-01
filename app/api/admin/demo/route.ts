import { NextRequest, NextResponse } from 'next/server'
import { and, eq, count } from 'drizzle-orm'
import { auth } from '@/auth'
import { getDb } from '@/lib/db'
import { posadas } from '@/lib/db/schema'
import { setDemosVisible } from '@/lib/demo'

async function isAdmin() {
  const session = await auth()
  return session?.user && (session.user as any).role === 'admin'
}

// Resumen: demos visibles vs. posadas reales activas.
export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const db = getDb()
  const [[demoActive], [demoRetired], [realActive]] = await Promise.all([
    db.select({ n: count() }).from(posadas).where(and(eq(posadas.isDemo, true), eq(posadas.status, 'active'))),
    db.select({ n: count() }).from(posadas).where(and(eq(posadas.isDemo, true), eq(posadas.status, 'suspended'))),
    db.select({ n: count() }).from(posadas).where(and(eq(posadas.isDemo, false), eq(posadas.status, 'active'))),
  ])
  return NextResponse.json({ demoActive: demoActive.n, demoRetired: demoRetired.n, realActive: realActive.n })
}

// { action: 'hide' | 'show', destinoSlug? } — retira o restaura demos (reversible).
export async function POST(req: NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { action, destinoSlug } = await req.json().catch(() => ({}))
  if (action !== 'hide' && action !== 'show') return NextResponse.json({ error: 'Acción inválida' }, { status: 400 })
  const n = await setDemosVisible(action === 'show', typeof destinoSlug === 'string' ? destinoSlug : undefined)
  return NextResponse.json({ ok: true, changed: n })
}
