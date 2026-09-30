// Constantes compartidas de la plataforma.

// Modelo de IA vía Vercel AI Gateway. Gemini 2.5 Flash está disponible en el
// free tier del Gateway (los modelos Claude requieren créditos de pago).
export const AI_MODEL = 'google/gemini-2.5-flash'


// Comisión de RESER-VE sobre reservas confirmadas. La asume la posada; NUNCA se suma
// al precio del viajero ni se le muestra.
export const HOST_COMMISSION_RATE = 0.10

// URL pública del sitio (para metadata/SEO/sitemap).
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://reser-ve.com'

export const SUPPORT_EMAIL = 'hola@reser-ve.com'

// Fase privada: los posaderos ya pueden publicar, pero las reservas aún no están abiertas
// al público mientras perfeccionamos el pago. Para abrirlas: NEXT_PUBLIC_BOOKINGS_OPEN=true.
// Los admins pueden reservar siempre (para pruebas internas).
export const BOOKINGS_OPEN = process.env.NEXT_PUBLIC_BOOKINGS_OPEN === 'true'
export const PRIVATE_PHASE_MSG = 'Estamos en fase privada: las posadas se están sumando y las reservas abren muy pronto.'

// Longitud máxima de un mensaje de chat.
export const MAX_MESSAGE = 4000
