import { and, eq } from 'drizzle-orm'
import { getDb } from './db'
import { posadas } from './db/schema'

// Posadas de demostración: sirven para que la web no se vea vacía mientras entran
// posadas reales. Se "retiran" (status suspended + nota), nunca se borran: se pueden restaurar.
export const DEMO_RETIRED_NOTE = 'Demo retirada'

// Al publicarse una posada real se retira UNA demo del mismo destino (reemplazo 1 a 1).
// Solo si esa posada aún no reemplaza a ninguna: re-aprobarla no retira más demos.
export async function retireDemoFor(realId: number) {
  const db = getDb()
  const [real] = await db.select().from(posadas).where(eq(posadas.id, realId))
  if (!real || real.isDemo || real.replacedDemoId) return null
  const [demo] = await db.select({ id: posadas.id }).from(posadas)
    .where(and(eq(posadas.isDemo, true), eq(posadas.status, 'active'), eq(posadas.destinoSlug, real.destinoSlug)))
    .limit(1)
  if (!demo) return null
  await db.update(posadas)
    .set({ status: 'suspended', reviewNotes: `${DEMO_RETIRED_NOTE}: reemplazada por ${real.nombre}`, updatedAt: new Date() })
    .where(eq(posadas.id, demo.id))
  await db.update(posadas).set({ replacedDemoId: demo.id }).where(eq(posadas.id, realId))
  return demo
}

// Si una posada real deja de estar publicada (pausa o suspensión), vuelve su demo.
export async function restoreDemoOf(realId: number) {
  const db = getDb()
  const [real] = await db.select({ replacedDemoId: posadas.replacedDemoId }).from(posadas).where(eq(posadas.id, realId))
  if (!real?.replacedDemoId) return
  await db.update(posadas).set({ status: 'active', reviewNotes: null, updatedAt: new Date() })
    .where(and(eq(posadas.id, real.replacedDemoId), eq(posadas.isDemo, true), eq(posadas.status, 'suspended')))
  await db.update(posadas).set({ replacedDemoId: null }).where(eq(posadas.id, realId))
}

// Retira o restaura demos (opcionalmente solo de un destino). "Restaurar" solo devuelve
// las retiradas con este botón: nunca las que ya reemplazó una posada real.
export async function setDemosVisible(visible: boolean, destinoSlug?: string) {
  const db = getDb()
  const where = and(
    eq(posadas.isDemo, true),
    visible ? and(eq(posadas.status, 'suspended'), eq(posadas.reviewNotes, DEMO_RETIRED_NOTE)) : eq(posadas.status, 'active'),
    ...(destinoSlug ? [eq(posadas.destinoSlug, destinoSlug)] : []),
  )
  const rows = await db.update(posadas)
    .set(visible
      ? { status: 'active', reviewNotes: null, updatedAt: new Date() }
      : { status: 'suspended', reviewNotes: DEMO_RETIRED_NOTE, updatedAt: new Date() })
    .where(where)
    .returning({ id: posadas.id })
  return rows.length
}
