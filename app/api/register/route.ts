import { NextRequest, NextResponse, after } from 'next/server'
import { rateLimit, readJson } from '@/lib/http'
import { getDb } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import bcrypt from 'bcryptjs'
import { emailWelcome } from '@/lib/email'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(req: NextRequest) {
  const limited = rateLimit(req, 'register', 10, 60 * 60_000)
  if (limited) return limited
  const { name, email, password, role } = await readJson(req)
  if (typeof name !== 'string' || typeof email !== 'string' || typeof password !== 'string' || !name.trim() || !email || !password) return NextResponse.json({ error: 'Faltan campos' }, { status: 400 })

  // Never trust the client for privilege: only traveler/host can self-register.
  // Admins are promoted server-side via scripts/make-admin.ts.
  const safeRole = role === 'host' ? 'host' : 'traveler'

  const cleanName = name.trim().slice(0, 80)
  const cleanEmail = String(email).trim().toLowerCase()
  if (!EMAIL_RE.test(cleanEmail)) return NextResponse.json({ error: 'Email inválido' }, { status: 400 })
  if (password.length < 8 || password.length > 128) return NextResponse.json({ error: 'La contraseña debe tener entre 8 y 128 caracteres' }, { status: 400 })

  const db = getDb()
  const [existing] = await db.select().from(users).where(eq(users.email, cleanEmail))
  if (existing) return NextResponse.json({ error: 'Email ya registrado' }, { status: 400 })

  const passwordHash = await bcrypt.hash(password, 12)
  const [user] = await db.insert(users).values({ name: cleanName, email: cleanEmail, passwordHash, role: safeRole }).returning()

  // Correo de bienvenida tras responder (after mantiene viva la función hasta enviarlo).
  after(() => emailWelcome({ email: user.email, name: user.name, role: user.role }))

  return NextResponse.json({ id: user.id, name: user.name, email: user.email, role: user.role }, { status: 201 })
}
