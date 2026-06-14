import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import bcrypt from 'bcryptjs'
import { emailWelcome } from '@/lib/email'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(req: NextRequest) {
  const { name, email, password, role } = await req.json()
  if (!name || !email || !password) return NextResponse.json({ error: 'Faltan campos' }, { status: 400 })

  // Never trust the client for privilege: only traveler/host can self-register.
  // Admins are promoted server-side via scripts/make-admin.ts.
  const safeRole = role === 'host' ? 'host' : 'traveler'

  const cleanName = String(name).trim()
  const cleanEmail = String(email).trim().toLowerCase()
  if (!EMAIL_RE.test(cleanEmail)) return NextResponse.json({ error: 'Email inválido' }, { status: 400 })
  if (String(password).length < 8) return NextResponse.json({ error: 'La contraseña debe tener al menos 8 caracteres' }, { status: 400 })

  const db = getDb()
  const [existing] = await db.select().from(users).where(eq(users.email, cleanEmail))
  if (existing) return NextResponse.json({ error: 'Email ya registrado' }, { status: 400 })

  const passwordHash = await bcrypt.hash(password, 12)
  const [user] = await db.insert(users).values({ name: cleanName, email: cleanEmail, passwordHash, role: safeRole }).returning()

  // Fire-and-forget welcome email
  emailWelcome({ email: user.email, name: user.name, role: user.role }).catch(() => {})

  return NextResponse.json({ id: user.id, name: user.name, email: user.email, role: user.role }, { status: 201 })
}
