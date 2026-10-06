import { NextRequest, NextResponse } from 'next/server'
import { desc, eq, inArray } from 'drizzle-orm'
import { auth } from '@/auth'
import { getDb } from '@/lib/db'
import { moderationFlags, posadas, users } from '@/lib/db/schema'
import { parseId, readJson } from '@/lib/http'

async function isAdmin() {
  const s = await auth()
  return s?.user && (s.user as any).role === 'admin'
}

// Alertas de moderación (IA y reportes de precio).
export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const db = getDb()
  const rows = await db.select().from(moderationFlags).orderBy(desc(moderationFlags.createdAt)).limit(200)
  const uids = [...new Set(rows.map(r => r.userId).filter(Boolean))] as number[]
  const pids = [...new Set(rows.map(r => r.posadaId).filter(Boolean))] as number[]
  const us = uids.length ? await db.select({ id: users.id, name: users.name, role: users.role }).from(users).where(inArray(users.id, uids)) : []
  const ps = pids.length ? await db.select({ id: posadas.id, nombre: posadas.nombre, slug: posadas.slug }).from(posadas).where(inArray(posadas.id, pids)) : []
  return NextResponse.json(rows.map(r => ({
    ...r,
    userName: us.find(u => u.id === r.userId)?.name ?? null,
    userRole: us.find(u => u.id === r.userId)?.role ?? null,
    posada: ps.find(p => p.id === r.posadaId) ?? null,
  })))
}

// Marcar como revisada o descartada: { id, status }
export async function PATCH(req: NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const body = await readJson(req)
  const id = parseId(body.id)
  if (!id || !['abierta', 'revisada', 'descartada'].includes(body.status)) return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 })
  const rows = await getDb().update(moderationFlags).set({ status: body.status }).where(eq(moderationFlags.id, id)).returning({ id: moderationFlags.id })
  if (!rows.length) return NextResponse.json({ error: 'No encontrada' }, { status: 404 })
  return NextResponse.json({ ok: true })
}
