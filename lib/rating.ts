import type { T } from './i18n'

// Texto de valoración: "★ 4.8 · 12 reseñas" o "Nueva" si aún no tiene reseñas verificadas.
export function ratingText(rating: number, reviews: number, short = false, t: T = s => s): string {
  if (!reviews) return short ? t('Nueva') : t('Nueva en RESER-VE')
  return short ? `★ ${rating} (${reviews})` : `★ ${rating} · ${t(reviews === 1 ? '{n} reseña' : '{n} reseñas', { n: reviews })}`
}
