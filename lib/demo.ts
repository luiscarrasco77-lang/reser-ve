import { and, eq } from 'drizzle-orm'
import { getDb } from './db'
import { posadas } from './db/schema'

// Posadas de demostración: sirven para que la web no se vea vacía mientras entran
// posadas reales. Se "retiran" (status suspended + nota), nunca se borran: se pueden restaurar.
export const DEMO_RETIRED_NOTE = 'Demo retirada'

// Al aprobar una posada real se retira UNA demo del mismo destino (reemplazo 1 a 1).
export async function retireDemoFor(destinoSlug: string, realNombre: string) {
  const db = getDb()
  const [demo] = await db.select({ id: posadas.id, nombre: posadas.nombre }).from(posadas)
    .where(and(eq(posadas.isDemo, true), eq(posadas.status, 'active'), eq(posadas.destinoSlug, destinoSlug)))
    .limit(1)
  if (!demo) return null
  await db.update(posadas)
    .set({ status: 'suspended', reviewNotes: `${DEMO_RETIRED_NOTE}: reemplazada por ${realNombre}`, updatedAt: new Date() })
    .where(eq(posadas.id, demo.id))
  return demo
}

// Retira o restaura todas las demo (opcionalmente solo de un destino).
export async function setDemosVisible(visible: boolean, destinoSlug?: string) {
  const db = getDb()
  const where = and(
    eq(posadas.isDemo, true),
    eq(posadas.status, visible ? 'suspended' : 'active'),
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
