import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { bookings } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

// Cron de ciclo de vida de reservas (configurado en vercel.json):
//  1. Cancela solicitudes "pendientes" sin respuesta en >24h.
//  2. Marca como "completadas" las confirmadas cuyo check-out ya pasó.
// Protegido con CRON_SECRET (Vercel envía Authorization: Bearer <CRON_SECRET>).
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (secret && req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (!process.env.DATABASE_URL) return NextResponse.json({ ok: true, skipped: 'no-db' })

  const db = getDb()
  const now = Date.now()
  const today = new Date().toISOString().slice(0, 10) // YYYY-MM-DD

  const all = await db.select().from(bookings)

  let expired = 0
  let completed = 0

  for (const b of all) {
    // 1. Pendiente por más de 24h → cancelada
    if (b.status === 'pending' && now - new Date(b.createdAt).getTime() > 24 * 60 * 60 * 1000) {
      await db.update(bookings)
        .set({ status: 'cancelled', hostNotes: 'Cancelada automáticamente: el posadero no respondió en 24h.', updatedAt: new Date() })
        .where(eq(bookings.id, b.id))
      expired++
      continue
    }
    // 2. Confirmada y ya pasó el check-out → completada
    if (b.status === 'confirmed' && b.checkOut < today) {
      await db.update(bookings)
        .set({ status: 'completed', updatedAt: new Date() })
        .where(eq(bookings.id, b.id))
      completed++
    }
  }

  return NextResponse.json({ ok: true, expired, completed })
}
