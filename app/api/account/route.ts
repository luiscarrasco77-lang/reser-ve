import { NextRequest, NextResponse } from 'next/server'
import { and, eq, inArray, or } from 'drizzle-orm'
import bcrypt from 'bcryptjs'
import { auth } from '@/auth'
import { getDb } from '@/lib/db'
import { bookings, favorites, messages, passwordResets, posadas, reviews, users } from '@/lib/db/schema'
import { readJson, rateLimit } from '@/lib/http'

// Comprueba qué impide borrar la cuenta: reservas activas (como huésped o en sus posadas)
// y posadas publicadas o en revisión.
async function blockers(userId: number) {
  const db = getDb()
  const mine = await db.select({ id: posadas.id, nombre: posadas.nombre, status: posadas.status }).from(posadas).where(eq(posadas.hostId, userId))
  const activePosadas = mine.filter(p => p.status === 'active' || p.status === 'pending_review')
  const ids = mine.map(p => p.id)
  const active = await db.select({ id: bookings.id }).from(bookings).where(and(
    inArray(bookings.status, ['pending', 'confirmed']),
    ids.length ? or(eq(bookings.guestId, userId), inArray(bookings.posadaId, ids)) : eq(bookings.guestId, userId),
  ))
  return { activeBookings: active.length, activePosadas: activePosadas.map(p => p.nombre) }
}

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = parseInt((session.user as any).id)
  const [u] = await getDb().select({ name: users.name, email: users.email, role: users.role, createdAt: users.createdAt }).from(users).where(eq(users.id, userId))
  return NextResponse.json({ user: u, ...(await blockers(userId)) })
}

// Elimina la cuenta. Los datos personales se borran o anonimizan; el historial de reservas
// y mensajes se conserva sin datos personales (lo necesitan la otra parte y la contabilidad).
export async function DELETE(req: NextRequest) {
  const limited = rateLimit(req, 'delete-account', 5, 60 * 60_000)
  if (limited) return limited
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = parseInt((session.user as any).id)
  const role = (session.user as any).role
  const { password } = await readJson(req)
  const db = getDb()
  const [u] = await db.select().from(users).where(eq(users.id, userId))
  if (!u) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (typeof password !== 'string' || !u.passwordHash || !(await bcrypt.compare(password, u.passwordHash))) {
    return NextResponse.json({ error: 'La contraseña no es correcta' }, { status: 400 })
  }
  if (role === 'admin') {
    const admins = await db.select({ id: users.id }).from(users).where(eq(users.role, 'admin'))
    if (admins.length <= 1) return NextResponse.json({ error: 'Eres el único admin: nombra a otro admin antes de eliminar tu cuenta.' }, { status: 400 })
  }
  const b = await blockers(userId)
  if (b.activeBookings > 0 || b.activePosadas.length > 0) {
    return NextResponse.json({ error: 'Primero cancela tus reservas activas y pausa tus posadas.', ...b }, { status: 409 })
  }

  await db.delete(favorites).where(eq(favorites.userId, userId))
  await db.delete(passwordResets).where(eq(passwordResets.email, u.email))
  await db.update(posadas).set({ status: 'suspended', reviewNotes: 'Cuenta del posadero eliminada.', updatedAt: new Date() }).where(eq(posadas.hostId, userId))
  await db.update(messages).set({ senderName: 'Usuario eliminado' }).where(eq(messages.senderId, userId))
  await db.update(reviews).set({ authorName: 'Usuario eliminado', authorCountry: null }).where(eq(reviews.authorId, userId))
  await db.update(users).set({
    name: 'Usuario eliminado', email: `eliminado-${userId}-${Date.now()}@reserve.test`,
    passwordHash: null, phone: null, country: null, avatarUrl: null, role: 'traveler',
  }).where(eq(users.id, userId))
  return NextResponse.json({ ok: true })
}
