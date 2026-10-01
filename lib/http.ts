import { NextRequest, NextResponse } from 'next/server'

// Id numérico válido para una columna int4 (o null). Evita 500 con "abc" o ids gigantes.
export function parseId(v: unknown): number | null {
  const n = typeof v === 'number' ? v : typeof v === 'string' && /^\d{1,10}$/.test(v) ? Number(v) : NaN
  return Number.isSafeInteger(n) && n >= 1 && n <= 2147483647 ? n : null
}

// Límite simple de peticiones por IP y clave, en memoria de la instancia.
// No es global entre instancias, pero frena abusos básicos (bots, bucles) sin servicios extra.
const hits = new Map<string, number[]>()
export function rateLimit(req: NextRequest, key: string, max: number, windowMs: number): NextResponse | null {
  const ip = (req.headers.get('x-forwarded-for') ?? '').split(',')[0].trim() || 'anon'
  const k = `${key}:${ip}`
  const now = Date.now()
  const list = (hits.get(k) ?? []).filter(t => now - t < windowMs)
  if (list.length >= max) {
    return NextResponse.json({ error: 'Demasiadas solicitudes. Intenta de nuevo en unos minutos.' }, { status: 429 })
  }
  list.push(now)
  hits.set(k, list)
  if (hits.size > 5000) hits.clear()
  return null
}
