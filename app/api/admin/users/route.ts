import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { auth } from '@/auth'
import { desc } from 'drizzle-orm'

export async function GET() {
  const session = await auth()
  if (!session?.user || (session.user as any).role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const db = getDb()
  const all = await db.select({
    id: users.id, name: users.name, email: users.email,
    role: users.role, country: users.country, createdAt: users.createdAt,
  }).from(users).orderBy(desc(users.createdAt))
  return NextResponse.json(all)
}
