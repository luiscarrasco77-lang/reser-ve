// Copia el worker de MapLibre a /public para servirlo como archivo estático.
// (El empaquetador de Next no resuelve bien la URL del worker de MapLibre.)
import { mkdirSync, copyFileSync, existsSync } from 'node:fs'
const src = 'node_modules/maplibre-gl/dist'
const dest = 'public/maplibre'
if (existsSync(src)) {
  mkdirSync(dest, { recursive: true })
  for (const f of ['maplibre-gl-worker.mjs', 'maplibre-gl-shared.mjs']) copyFileSync(`${src}/${f}`, `${dest}/${f}`)
  console.log('maplibre worker copiado a public/maplibre')
}
