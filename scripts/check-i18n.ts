// Comprueba que todos los textos t('…') tengan traducción al inglés.
// Uso: npx tsx scripts/check-i18n.ts
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { EN } from '../lib/i18n-en'

const roots = ['app', 'components', 'lib']
const files: string[] = []
const walk = (d: string) => {
  for (const f of readdirSync(d)) {
    const p = join(d, f)
    if (statSync(p).isDirectory()) walk(p)
    else if (/\.(tsx?|ts)$/.test(f) && !p.endsWith('i18n.ts')) files.push(p)
  }
}
roots.forEach(walk)

const missing = new Map<string, string[]>()
const re = /\bt\(\s*(['"`])((?:\\.|(?!\1).)*)\1/g
let total = 0
for (const f of files) {
  const src = readFileSync(f, 'utf8')
  for (const m of src.matchAll(re)) {
    if (m[1] === '`' && m[2].includes('${')) { console.warn(`⚠ plantilla dinámica en ${f}: ${m[2].slice(0, 60)}`); continue }
    const key = m[2].replace(/\\(['"`\\])/g, '$1').replace(/\\n/g, '\n')
    total++
    if (!(key in EN)) missing.set(key, [...(missing.get(key) ?? []), f])
  }
}
console.log(`${total} textos traducibles, ${Object.keys(EN).length} traducciones.`)
if (missing.size) {
  console.log(`\n❌ ${missing.size} sin traducir:`)
  for (const [k, fs] of missing) console.log(`  ${JSON.stringify(k)}  ← ${[...new Set(fs)].join(', ')}`)
  process.exit(1)
}
console.log('✅ Todo traducido.')
