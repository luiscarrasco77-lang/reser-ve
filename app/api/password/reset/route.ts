import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { users, passwordResets } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import bcrypt from 'bcryptjs'

// Fija una nueva contraseña usando el token del correo.
export async function POST(req: NextRequest) {
  const { token, password } = await req.json()
  if (!token || typeof token !== 'string') {
    return NextResponse.json({ error: 'Enlace inválido' }, { status: 400 })
  }
  if (String(password ?? '').length < 8) {
    return NextResponse.json({ error: 'La contraseña debe tener al menos 8 caracteres' }, { status: 400 })
  }

  const db = getDb()
  const [reset] = await db.select().from(passwordResets).where(eq(passwordResets.token, token))
  if (!reset) {
    return NextResponse.json({ error: 'Enlace inválido o ya usado' }, { status: 400 })
  }
  if (new Date(reset.expires).getTime() < Date.now()) {
    await db.delete(passwordResets).where(eq(passwordResets.token, token))
    return NextResponse.json({ error: 'El enlace venció. Solicita uno nuevo.' }, { status: 400 })
  }

  const passwordHash = await bcrypt.hash(password, 12)
  await db.update(users).set({ passwordHash }).where(eq(users.email, reset.email))
  // Token de un solo uso.
  await db.delete(passwordResets).where(eq(passwordResets.token, token))

  return NextResponse.json({ ok: true })
}
