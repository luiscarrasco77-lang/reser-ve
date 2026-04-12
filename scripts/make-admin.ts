import { getDb } from '../lib/db'
import { users } from '../lib/db/schema'
import { eq } from 'drizzle-orm'

async function main() {
  const email = process.argv[2]
  if (!email) { console.error('Uso: npx tsx scripts/make-admin.ts tu@email.com'); process.exit(1) }

  const db = getDb()
  const [user] = await db.update(users).set({ role: 'admin' }).where(eq(users.email, email)).returning()
  if (!user) { console.error('Usuario no encontrado:', email); process.exit(1) }
  console.log(`✓ ${user.name} (${user.email}) ahora es admin`)
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1) })
