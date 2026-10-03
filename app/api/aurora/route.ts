import { NextRequest } from 'next/server'
import { rateLimit, readJson } from '@/lib/http'
import { convertToModelMessages, streamText, stepCountIs, tool, type UIMessage } from 'ai'
import { z } from 'zod'
import { queryPosadas, isAvailable } from '@/lib/posadas-query'
import { AI_MODEL, BOOKINGS_OPEN } from '@/lib/constants'

export const maxDuration = 30

const MODEL = AI_MODEL

const SYSTEM = `Eres **Aurora**, la concierge de viajes IA de RESER-VE, la plataforma de posadas auténticas de Venezuela. Tu misión: convertir el sueño de viaje de una persona en un itinerario concreto y reservable, usando posadas reales de la plataforma.

# Cómo trabajas
1. Entiende lo que pide (si falta algún dato como el nº de personas, busca igualmente y da precios por noche; no hagas preguntas antes de mostrar opciones): destino(s) o vibra (playa, aventura, montaña, relax), fechas o mes, número de personas, presupuesto por noche o total, y método de pago si lo menciona.
2. USA la herramienta \`buscarPosadas\` para encontrar opciones reales antes de recomendar NADA. Nunca inventes posadas, precios ni datos: solo usa lo que devuelven las herramientas.
3. Si el usuario da fechas concretas, usa \`verDisponibilidad\` para las posadas que vas a recomendar.
4. Arma un itinerario claro, día por día o por tramos, combinando destinos si tiene sentido (ej: 3 noches Los Roques + 2 noches Canaima).

# Formato de respuesta
- Cálida, venezolana, concreta. Español. Usa **negritas** para los nombres de posadas y títulos.
- Para cada posada recomendada menciona: nombre, destino, precio/noche y por qué encaja.
- Incluye un **estimado de costo total** calculado SOLO como noches × precio por noche de cada posada. NO menciones comisiones, cargos de servicio ni ningún "10%": el precio que ve el viajero es el precio final.
- Cierra invitando a ver cada posada en su página (enlace relativo /posadas/<slug>, nunca con http://) y a guardarla en favoritos.
- Las posadas sin reseñas aparecen como "Nueva": no inventes valoraciones ni digas que se ocultan.
- Si piden contactos externos (WhatsApp, teléfono, redes), di que toda la comunicación va por el chat de RESER-VE, y busca igualmente las posadas.
- IMPORTANTE: ${BOOKINGS_OPEN ? 'las reservas están abiertas; cada posada se reserva en su página.' : 'RESER-VE está en FASE PRIVADA: las reservas aún no están abiertas al público (abren muy pronto). Si el usuario quiere reservar, dilo con naturalidad y sugiere guardar sus favoritas para cuando abran. No inventes otra forma de reservar ni des contactos externos.'}
- Si el presupuesto no alcanza, dilo con honestidad y ofrece la mejor alternativa.
- Sé concisa: es un plan para leer rápido, no un ensayo.

Si la petición no tiene que ver con viajar por Venezuela, redirige con amabilidad.`

export async function POST(req: Request) {
  const limited = rateLimit(req as NextRequest, 'aurora', 20, 10 * 60_000)
  if (limited) return limited
  const body = await readJson(req)
  const messages: UIMessage[] = Array.isArray(body?.messages) ? body.messages.slice(-30) : []
  if (messages.length === 0) return new Response(JSON.stringify({ error: 'Datos inválidos' }), { status: 400 })

  try {
    const result = streamText({
      model: MODEL,
      system: SYSTEM,
      messages: await convertToModelMessages(messages),
      stopWhen: stepCountIs(6),
      tools: {
        buscarPosadas: tool({
          description: 'Busca posadas reales activas en RESER-VE por destino, precio máximo por noche, número de huéspedes y/o palabras clave (playa, aventura, montaña, snorkel, etc.). Devuelve opciones reales para el itinerario.',
          inputSchema: z.object({
            destino: z.string().optional().describe('Destino o zona, ej: "Los Roques", "Canaima", "Mérida".'),
            precioMax: z.number().optional().describe('Precio máximo por noche en USD.'),
            huespedes: z.number().optional().describe('Número de personas.'),
            texto: z.string().optional().describe('Palabras clave de la vibra: playa, aventura, snorkel, montaña, romántico, familiar…'),
          }),
          execute: async (args) => {
            try {
              const results = await queryPosadas(args)
              return results.slice(0, 6).map(p => ({
                slug: p.slug, nombre: p.nombre, destino: p.destino, tipo: p.tipo,
                precio: p.precio, rating: p.rating, reviews: p.reviews, capacidad: p.capacidad,
                tags: p.tags, img: p.img,
                resumen: p.descripcion.slice(0, 160),
              }))
            } catch {
              return []
            }
          },
        }),
        verDisponibilidad: tool({
          description: 'Verifica si una posada está disponible en un rango de fechas (YYYY-MM-DD).',
          inputSchema: z.object({
            slug: z.string(),
            checkIn: z.string().describe('Fecha de llegada YYYY-MM-DD'),
            checkOut: z.string().describe('Fecha de salida YYYY-MM-DD'),
          }),
          execute: async ({ slug, checkIn, checkOut }) => {
            const disponible = await isAvailable(slug, checkIn, checkOut)
            return { slug, disponible }
          },
        }),
      },
    })

    return result.toUIMessageStreamResponse({
      onError: (error) => {
        const msg = error instanceof Error ? error.message : String(error)
        console.error('[aurora] stream error:', msg)
        if (/gateway|unauthenticat|api[\s_-]?key|credit|quota|balance|402|401|billing/i.test(msg)) {
          return 'La IA no está configurada en el servidor (falta o venció la AI_GATEWAY_API_KEY, o no hay créditos). Revísala en Vercel → AI Gateway.'
        }
        return 'Aurora tuvo un problema al responder. Intenta de nuevo en un momento.'
      },
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[aurora] fatal:', msg)
    return new Response(
      JSON.stringify({ error: 'Aurora no está disponible ahora mismo. Intenta de nuevo en un momento.' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } },
    )
  }
}
