import { drizzle } from 'drizzle-orm/neon-http'
import { neon } from '@neondatabase/serverless'
import { eq, inArray } from 'drizzle-orm'
import * as schema from '../lib/db/schema'
import { posadas as posadasData } from '../lib/data'

// Seed SEGURO para PRODUCCIÓN:
//  - Idempotente (upsert por slug), no borra nada.
//  - NO crea cuentas demo con contraseñas conocidas.
//  - Asigna las posadas curadas a un host/admin YA existente.
//  - Crea la tabla `favorites` si falta.
//  - Siembra reseñas solo para posadas que aún no tienen.
const sql = neon(process.env.DATABASE_URL!)
const db = drizzle(sql, { schema })

async function main() {
  console.log('→ Asegurando tabla favorites...')
  await sql`CREATE TABLE IF NOT EXISTS favorites (
    id serial PRIMARY KEY,
    user_id integer NOT NULL REFERENCES users(id),
    posada_id integer NOT NULL REFERENCES posadas(id),
    created_at timestamp DEFAULT now() NOT NULL
  )`

  // Dueño de las posadas curadas: primer host, o admin, o cualquier usuario.
  const [owner] =
    (await db.select().from(schema.users).where(eq(schema.users.role, 'host')).limit(1)) ||
    []
  const ownerRow = owner
    ?? (await db.select().from(schema.users).where(eq(schema.users.role, 'admin')).limit(1))[0]
    ?? (await db.select().from(schema.users).limit(1))[0]
  if (!ownerRow) throw new Error('No hay ningún usuario en la DB para asignar como host.')
  console.log(`→ Posadas asignadas a: ${ownerRow.name} (${ownerRow.email})`)

  console.log(`→ Sembrando ${posadasData.length} posadas curadas (upsert)...`)
  for (const p of posadasData) {
    const [row] = await db.insert(schema.posadas).values({
      slug: p.slug, hostId: ownerRow.id, nombre: p.nombre, destino: p.destino, destinoSlug: p.destinoSlug,
      tipo: p.tipo, precio: p.precio, habitaciones: p.habitaciones, capacidad: p.capacidad ?? p.habitaciones * 2,
      rating: p.rating, reviews: p.reviews, descripcion: p.descripcion, tags: p.tags, servicios: p.servicios,
      politicas: p.politicas, imgs: p.imgs, lat: p.lat, lng: p.lng, metodoPago: p.metodoPago,
      hostNombre: p.host.nombre, hostDesde: p.host.desde, hostIdiomas: p.host.idiomas, status: 'active',
    }).onConflictDoUpdate({
      target: schema.posadas.slug,
      set: {
        nombre: p.nombre, destino: p.destino, destinoSlug: p.destinoSlug, tipo: p.tipo, precio: p.precio,
        habitaciones: p.habitaciones, capacidad: p.capacidad ?? p.habitaciones * 2, descripcion: p.descripcion,
        tags: p.tags, servicios: p.servicios, politicas: p.politicas, imgs: p.imgs, lat: p.lat, lng: p.lng,
        metodoPago: p.metodoPago, hostNombre: p.host.nombre, hostDesde: p.host.desde, hostIdiomas: p.host.idiomas,
        status: 'active', updatedAt: new Date(),
      },
    }).returning()

    // Reseñas: solo si la posada no tiene ninguna aún.
    const existing = await db.select().from(schema.reviews).where(eq(schema.reviews.posadaId, row.id))
    if (existing.length === 0 && p.reseñas.length > 0) {
      for (const r of p.reseñas) {
        await db.insert(schema.reviews).values({
          posadaId: row.id, authorId: ownerRow.id, authorName: r.autor,
          authorCountry: r.pais, rating: r.rating, texto: r.texto,
        })
      }
    }
  }

  // Toda posada debe tener un posadero (para poder contactarlo). Rellena los nulos
  // sin tocar los hosts reales ya asignados.
  await sql`UPDATE posadas SET host_id = ${ownerRow.id} WHERE host_id IS NULL`

  const total = await db.select({ slug: schema.posadas.slug }).from(schema.posadas).where(eq(schema.posadas.status, 'active'))
  console.log(`✓ Listo. Posadas activas en prod: ${total.length}`)
  process.exit(0)
}

main().catch(e => { console.error(e); process.exit(1) })
