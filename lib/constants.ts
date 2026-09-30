// Constantes compartidas de la plataforma.

// Modelo de IA vía Vercel AI Gateway. Gemini 2.5 Flash está disponible en el
// free tier del Gateway (los modelos Claude requieren créditos de pago).
export const AI_MODEL = 'google/gemini-2.5-flash'


// Comisión de servicio que paga el viajero (incluida en el total mostrado).
export const SERVICE_FEE_RATE = 0.10

export function withServiceFee(subtotal: number): number {
  return Math.round(subtotal * (1 + SERVICE_FEE_RATE))
}

export function serviceFee(subtotal: number): number {
  return Math.round(subtotal * SERVICE_FEE_RATE)
}

// URL pública del sitio (para metadata/SEO/sitemap).
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://reser-ve.com'

export const SUPPORT_EMAIL = 'hola@reser-ve.com'
