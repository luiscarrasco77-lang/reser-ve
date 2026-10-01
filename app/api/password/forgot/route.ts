import { NextRequest, NextResponse } from 'next/server'
import { rateLimit } from '@/lib/http'
import { getDb } from '@/lib/db'
import { users, passwordResets } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { randomBytes } from 'crypto'
import { emailPasswordReset } from '@/lib/email'
import { SITE_URL } from '@/lib/constants'

// Solicita un enlace para restablecer la contraseña.
export async function POST(req: NextRequest) {
  const limited = rateLimit(req, 'forgot', 6, 15 * 60_000)
  if (limited) return limited
  const { email } = await req.json().catch(() => ({}))
  const clean = String(email ?? '').trim().toLowerCase()
  if (!clean) return NextResponse.json({ error: 'Escribe tu correo' }, { status: 400 })

  const db = getDb()
  const [user] = await db.select().from(users).where(eq(users.email, clean))
  // Las cuentas sin contraseña (p. ej. la de sistema de Vera) no se pueden restablecer.
  if (!user || !user.passwordHash) {
    return NextResponse.json({ error: 'No hay ninguna cuenta registrada con ese correo.' }, { status: 404 })
  }

  const token = randomBytes(32).toString('hex')
  const expires = new Date(Date.now() + 60 * 60 * 1000) // 1 hora
  await db.delete(passwordResets).where(eq(passwordResets.email, clean))
  await db.insert(passwordResets).values({ email: clean, token, expires })

  // Se espera el envío: así el correo sale al instante y sabemos si falló.
  const sent = await emailPasswordReset({ email: clean, name: user.name, resetUrl: `${SITE_URL}/restablecer?token=${token}` })
  if (!sent) {
    return NextResponse.json({ error: 'No pudimos enviar el correo. Intenta de nuevo en unos minutos.' }, { status: 502 })
  }
  return NextResponse.json({ ok: true })
}
