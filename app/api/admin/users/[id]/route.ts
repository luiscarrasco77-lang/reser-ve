import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { auth } from '@/auth'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user || (session.user as any).role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const { id } = await params
  const targetId = Number(id)
  if (!Number.isInteger(targetId)) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
  const { role } = await req.json().catch(() => ({}))
  if (!['traveler', 'host', 'admin'].includes(role)) {
    return NextResponse.json({ error: 'Rol inválido' }, { status: 400 })
  }
  if (targetId === parseInt((session.user as any).id) && role !== 'admin') {
    return NextResponse.json({ error: 'No puedes quitarte a ti mismo el rol de admin. Pídeselo a otro admin.' }, { status: 400 })
  }
  const db = getDb()
  const [updated] = await db.update(users).set({ role }).where(eq(users.id, targetId))
    .returning({ id: users.id, name: users.name, email: users.email, role: users.role })
  if (!updated) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
  return NextResponse.json(updated)
}
