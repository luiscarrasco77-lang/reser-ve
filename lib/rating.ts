// Texto de valoración: "★ 4.8 · 12 reseñas" o "Nueva" si aún no tiene reseñas verificadas.
export function ratingText(rating: number, reviews: number, short = false): string {
  if (!reviews) return short ? 'Nueva' : 'Nueva en RESER-VE'
  return short ? `★ ${rating} (${reviews})` : `★ ${rating} · ${reviews} reseña${reviews === 1 ? '' : 's'}`
}
