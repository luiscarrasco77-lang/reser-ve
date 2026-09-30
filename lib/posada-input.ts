// Validación y lista blanca de campos de una posada (alta y edición por el posadero).
// Nunca incluye status, hostId, rating, reviews ni slug.

const arr = (v: unknown) => Array.isArray(v) ? v.map(String).slice(0, 60) : []

type Result = { ok: true; data: Record<string, unknown> } | { ok: false; error: string }

// partial = edición: solo valida los campos presentes.
export function parsePosadaInput(body: any, partial = false): Result {
  if (!body || typeof body !== 'object') return { ok: false, error: 'Datos inválidos' }
  const d: Record<string, unknown> = {}
  const has = (k: string) => body[k] !== undefined

  if (!partial || has('nombre')) {
    const v = String(body.nombre ?? '').trim()
    if (!v) return { ok: false, error: 'El nombre es obligatorio' }
    d.nombre = v.slice(0, 120)
  }
  if (!partial || has('descripcion')) {
    const v = String(body.descripcion ?? '').trim()
    if (!v) return { ok: false, error: 'La descripción es obligatoria' }
    d.descripcion = v.slice(0, 5000)
  }
  if (!partial || has('destino') || has('destinoSlug')) {
    if (!body.destino || !body.destinoSlug) return { ok: false, error: 'Elige un destino' }
    d.destino = String(body.destino).slice(0, 80)
    d.destinoSlug = String(body.destinoSlug).slice(0, 80)
  }
  if (!partial || has('precio')) {
    const v = Number(body.precio)
    if (!Number.isInteger(v) || v < 1 || v > 10000) return { ok: false, error: 'El precio por noche debe ser un número entre 1 y 10.000 USD' }
    d.precio = v
  }
  if (!partial || has('lat') || has('lng')) {
    const lat = body.lat === null || body.lat === '' ? NaN : Number(body.lat)
    const lng = body.lng === null || body.lng === '' ? NaN : Number(body.lng)
    if (!(lat >= -90 && lat <= 90) || !(lng >= -180 && lng <= 180)) return { ok: false, error: 'Marca la ubicación de tu posada en el mapa' }
    d.lat = lat; d.lng = lng
  }
  for (const k of ['habitaciones', 'capacidad'] as const) {
    if (!partial || has(k)) {
      const v = Number(body[k] ?? (k === 'capacidad' ? 2 : 1))
      if (!Number.isInteger(v) || v < 1 || v > 500) return { ok: false, error: `Número de ${k} inválido` }
      d[k] = v
    }
  }
  if (!partial || has('tipo')) d.tipo = String(body.tipo || 'Posada').slice(0, 60)
  for (const k of ['tags', 'servicios', 'politicas', 'imgs', 'metodoPago'] as const) {
    if (!partial || has(k)) d[k] = arr(body[k])
  }
  return { ok: true, data: d }
}
