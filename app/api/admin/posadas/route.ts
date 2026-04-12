import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { posadas, users } from '@/lib/db/schema'
import { auth } from '@/auth'
import { eq, desc } from 'drizzle-orm'

export async function GET() {
  const session = await auth()
  if (!session?.user || (session.user as any).role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const db = getDb()
  const rows = await db.select().from(posadas).orderBy(desc(posadas.createdAt))
  const hostIds = [...new Set(rows.map(p => p.hostId).filter(Boolean))] as number[]
  const hosts = hostIds.length
    ? await db.select({ id: users.id, name: users.name, email: users.email }).from(users)
    : []
  const hm = Object.fromEntries(hosts.map(h => [h.id, h]))
  return NextResponse.json(rows.map(p => ({
    ...p,
    hostName:  p.hostId ? (hm[p.hostId]?.name  ?? '') : '',
    hostEmail: p.hostId ? (hm[p.hostId]?.email ?? '') : '',
  })))
}
