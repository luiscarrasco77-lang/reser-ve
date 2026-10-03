import { eq } from 'drizzle-orm'
import { auth } from '@/auth'
import { getDb } from './db'
import { posadas } from './db/schema'

// Devuelve la posada si el usuario actual es su dueño (o admin); si no, null.
export async function getOwnedPosada(slug: unknown) {
  const session = await auth()
  if (!session?.user || typeof slug !== 'string' || !slug) return null
  const userId = parseInt((session.user as any).id)
  const role = (session.user as any).role
  const [p] = await getDb().select().from(posadas).where(eq(posadas.slug, slug))
  if (!p || (p.hostId !== userId && role !== 'admin')) return null
  return p
}
