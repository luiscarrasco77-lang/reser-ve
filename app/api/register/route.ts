import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import bcrypt from 'bcryptjs'
import { emailWelcome } from '@/lib/email'

export async function POST(req: NextRequest) {
  const { name, email, password, role = 'traveler' } = await req.json()
  if (!name || !email || !password) return NextResponse.json({ error: 'Faltan campos' }, { status: 400 })

  const db = getDb()
  const [existing] = await db.select().from(users).where(eq(users.email, email))
  if (existing) return NextResponse.json({ error: 'Email ya registrado' }, { status: 400 })

  const passwordHash = await bcrypt.hash(password, 12)
  const [user] = await db.insert(users).values({ name, email, passwordHash, role }).returning()

  // Fire-and-forget welcome email
  emailWelcome({ email: user.email, name: user.name, role: user.role }).catch(() => {})

  return NextResponse.json({ id: user.id, name: user.name, email: user.email, role: user.role }, { status: 201 })
}
