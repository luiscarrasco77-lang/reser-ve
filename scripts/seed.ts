import { drizzle } from 'drizzle-orm/neon-http'
import { neon } from '@neondatabase/serverless'
import * as schema from '../lib/db/schema'
import { posadas as posadasData } from '../lib/data'
// env loaded externally via dotenv-cli

const sql = neon(process.env.DATABASE_URL!)
const db = drizzle(sql, { schema })

async function main() {
  console.log('Seeding posadas...')
  for (const p of posadasData) {
    await db.insert(schema.posadas).values({
      slug: p.slug,
      nombre: p.nombre,
      destino: p.destino,
      destinoSlug: p.destinoSlug,
      tipo: p.tipo,
      precio: p.precio,
      habitaciones: p.habitaciones,
      capacidad: p.habitaciones * 2,
      rating: p.rating,
      reviews: p.reviews,
      descripcion: p.descripcion,
      tags: p.tags,
      servicios: p.servicios,
      politicas: p.politicas,
      imgs: p.imgs,
      lat: p.lat,
      lng: p.lng,
      metodoPago: p.metodoPago,
      hostNombre: p.host.nombre,
      hostDesde: p.host.desde,
      hostIdiomas: p.host.idiomas,
      status: 'active',
    }).onConflictDoNothing()
  }
  console.log('Done!')
  process.exit(0)
}

main().catch(e => { console.error(e); process.exit(1) })
