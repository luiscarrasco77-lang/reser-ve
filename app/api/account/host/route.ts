import { NextResponse } from 'next/server'
import { and, eq } from 'drizzle-orm'
import { auth } from '@/auth'
import { getDb } from '@/lib/db'
import { users } from '@/lib/db/schema'

// Activa el modo posadero en una cuenta de viajero (misma cuenta para viajar y publicar,
// como en Airbnb). Al activarlo, el usuario acepta las condiciones para posaderos.
export async function POST() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = parseInt((session.user as any).id)
  await getDb().update(users).set({ role: 'host' }).where(and(eq(users.id, userId), eq(users.role, 'traveler')))
  return NextResponse.json({ ok: true })
}
