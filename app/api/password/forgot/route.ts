import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { users, passwordResets } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { randomBytes } from 'crypto'
import { emailPasswordReset } from '@/lib/email'
import { SITE_URL } from '@/lib/constants'

// Solicita un enlace de restablecimiento de contraseña.
// Siempre responde OK (no revela si el email existe).
export async function POST(req: NextRequest) {
  const { email } = await req.json()
  const clean = String(email ?? '').trim().toLowerCase()
  const ok = NextResponse.json({ ok: true })
  if (!clean) return ok

  try {
    const db = getDb()
    const [user] = await db.select().from(users).where(eq(users.email, clean))
    if (user) {
      const token = randomBytes(32).toString('hex')
      const expires = new Date(Date.now() + 60 * 60 * 1000) // 1 hora
      // Limpia tokens previos de ese email y crea uno nuevo.
      await db.delete(passwordResets).where(eq(passwordResets.email, clean))
      await db.insert(passwordResets).values({ email: clean, token, expires })
      const resetUrl = `${SITE_URL}/restablecer?token=${token}`
      // Fire-and-forget: no bloquea la respuesta.
      emailPasswordReset({ email: clean, name: user.name, resetUrl }).catch(() => {})
    }
  } catch {
    // No revelamos errores internos al cliente.
  }
  return ok
}
