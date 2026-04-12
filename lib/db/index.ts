import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import * as schema from './schema'

// Lazy initialization — avoids build-time crash when DATABASE_URL is not set.
// WARNING: Do NOT wrap in a JS Proxy — @auth/drizzle-adapter inspects the adapter
// object (method existence, property iteration) and a Proxy breaks those checks,
// causing silent hangs in auth requests. Use getDb() directly.

function createDb() {
  const sql = neon(process.env.DATABASE_URL!)
  return drizzle(sql, { schema })
}

let _db: ReturnType<typeof createDb> | null = null

export function getDb() {
  if (!_db) _db = createDb()
  return _db
}

export type DB = ReturnType<typeof createDb>
