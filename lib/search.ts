import type { Posada } from './data'
import { venezuelaLocations, type VELocation } from './locations-ve'

// ─── Haversine distance (km) ────────────────────────────────────────────────
export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

// ─── String normalisation ────────────────────────────────────────────────────
export function normalizeStr(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
}

// ─── Fuzzy score: 0 = no match, higher = better ─────────────────────────────
export function fuzzyScore(query: string, target: string): number {
  const q = normalizeStr(query)
  const t = normalizeStr(target)
  if (!q) return 0

  // Exact match
  if (q === t) return 100

  // Target contains full query
  if (t.includes(q)) return 80

  // Query contains full target
  if (q.includes(t)) return 70

  // Token-level matching
  const qTokens = q.split(/\s+/)
  const tTokens = t.split(/\s+/)
  let tokenHits = 0
  for (const qt of qTokens) {
    if (tTokens.some(tt => tt.startsWith(qt) || qt.startsWith(tt))) tokenHits++
  }
  const tokenScore = (tokenHits / Math.max(qTokens.length, tTokens.length)) * 60

  // Character-level: how many query chars appear in order in target
  let ci = 0
  for (const ch of q) {
    const found = t.indexOf(ch, ci)
    if (found !== -1) ci = found + 1
  }
  const charScore = (ci > 0 ? q.length / t.length : 0) * 20

  return Math.max(tokenScore, charScore)
}

// ─── Resolve a free-text query to a VE location ─────────────────────────────
export type LocationMatch = {
  location: VELocation
  score: number
}

export function resolveLocation(query: string): LocationMatch | null {
  if (!query.trim()) return null

  let best: LocationMatch | null = null

  for (const loc of venezuelaLocations) {
    // Score against nombre + all aliases
    const candidates = [loc.nombre, ...loc.aliases]
    const score = Math.max(...candidates.map(c => fuzzyScore(query, c)))

    if (score > 0 && (!best || score > best.score)) {
      best = { location: loc, score }
    }
  }

  // Require at least a weak match (>= 25) to avoid false positives
  return best && best.score >= 25 ? best : null
}

// ─── Search result ───────────────────────────────────────────────────────────
export type SearchResult = {
  posada: Posada
  distanceKm: number | null
  isProximity: boolean // true if shown because of proximity, not exact location match
}

export type SearchOptions = {
  query?: string
  checkIn?: string    // ISO date
  checkOut?: string   // ISO date
  metodoPago?: string // '' = any
  precioMax?: number
  sort?: 'rating' | 'precio' | 'distancia'
}

// ─── Main search function ────────────────────────────────────────────────────
export function searchPosadas(posadas: Posada[], opts: SearchOptions): SearchResult[] {
  const { query = '', metodoPago = '', precioMax = 999, sort = 'rating' } = opts

  let results: SearchResult[]
  const locationMatch = resolveLocation(query)

  if (!query.trim()) {
    // No query — return everything
    results = posadas.map(p => ({ posada: p, distanceKm: null, isProximity: false }))
  } else if (locationMatch) {
    const { location } = locationMatch
    const EXACT_RADIUS_KM = 80   // within this → "exact" results
    const PROX_RADIUS_KM = 400   // within this → proximity results

    const withDist = posadas.map(p => ({
      posada: p,
      distanceKm: haversineKm(location.lat, location.lng, p.lat, p.lng),
    }))

    const exactMatches = withDist.filter(r => r.distanceKm <= EXACT_RADIUS_KM)

    if (exactMatches.length > 0) {
      results = exactMatches.map(r => ({ ...r, isProximity: false }))
    } else {
      // No exact results → show nearest within proximity radius
      results = withDist
        .filter(r => r.distanceKm <= PROX_RADIUS_KM)
        .sort((a, b) => a.distanceKm - b.distanceKm)
        .slice(0, 8)
        .map(r => ({ ...r, isProximity: true }))

      // If still nothing, show all sorted by distance
      if (results.length === 0) {
        results = withDist
          .sort((a, b) => a.distanceKm - b.distanceKm)
          .slice(0, 6)
          .map(r => ({ ...r, isProximity: true }))
      }
    }
  } else {
    // Query typed but not matched to any known location
    // Fall back to text search on nombre/destino/tipo/tags
    const q = normalizeStr(query)
    results = posadas
      .filter(p => {
        const haystack = normalizeStr(
          [p.nombre, p.destino, p.tipo, ...p.tags, p.descripcion].join(' ')
        )
        return fuzzyScore(query, haystack) > 15 || haystack.includes(q)
      })
      .map(p => ({ posada: p, distanceKm: null, isProximity: false }))
  }

  // Apply filters
  results = results
    .filter(r => r.posada.precio <= precioMax)
    .filter(r => {
      if (!metodoPago) return true
      return r.posada.metodoPago.some(m => normalizeStr(m).includes(normalizeStr(metodoPago)))
    })

  // Sort
  if (sort === 'distancia' && results[0]?.distanceKm !== null) {
    results.sort((a, b) => (a.distanceKm ?? 9999) - (b.distanceKm ?? 9999))
  } else if (sort === 'precio') {
    results.sort((a, b) => a.posada.precio - b.posada.precio)
  } else {
    results.sort((a, b) => b.posada.rating - a.posada.rating)
  }

  return results
}
