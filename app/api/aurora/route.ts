import { convertToModelMessages, streamText, stepCountIs, tool, type UIMessage } from 'ai'
import { z } from 'zod'
import { queryPosadas, isAvailable } from '@/lib/posadas-query'

export const maxDuration = 30

const MODEL = 'anthropic/claude-haiku-4.5'

const SYSTEM = `Eres **Aurora**, la concierge de viajes IA de RESER-VE, la plataforma de posadas auténticas de Venezuela. Tu misión: convertir el sueño de viaje de una persona en un itinerario concreto y reservable, usando posadas reales de la plataforma.

# Cómo trabajas
1. Entiende lo que pide: destino(s) o vibra (playa, aventura, montaña, relax), fechas o mes, número de personas, presupuesto por noche o total, y método de pago si lo menciona.
2. USA la herramienta \`buscarPosadas\` para encontrar opciones reales antes de recomendar NADA. Nunca inventes posadas, precios ni datos: solo usa lo que devuelven las herramientas.
3. Si el usuario da fechas concretas, usa \`verDisponibilidad\` para las posadas que vas a recomendar.
4. Arma un itinerario claro, día por día o por tramos, combinando destinos si tiene sentido (ej: 3 noches Los Roques + 2 noches Canaima).

# Formato de respuesta
- Cálida, venezolana, concreta. Español. Usa **negritas** para los nombres de posadas y títulos.
- Para cada posada recomendada menciona: nombre, destino, precio/noche y por qué encaja.
- Incluye un **estimado de costo total** (noches × precio + 10% de comisión de servicio de RESER-VE).
- Cierra con un llamado claro a reservar (cada posada se reserva en su página /posadas/<slug>).
- Si el presupuesto no alcanza, dilo con honestidad y ofrece la mejor alternativa.
- Sé concisa: es un plan para leer rápido, no un ensayo.

Si la petición no tiene que ver con viajar por Venezuela, redirige con amabilidad.`

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json()

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
            const results = await queryPosadas(args)
            return results.slice(0, 6).map(p => ({
              slug: p.slug, nombre: p.nombre, destino: p.destino, tipo: p.tipo,
              precio: p.precio, rating: p.rating, reviews: p.reviews, capacidad: p.capacidad,
              tags: p.tags, img: p.img,
              resumen: p.descripcion.slice(0, 160),
            }))
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

    return result.toUIMessageStreamResponse()
  } catch {
    return new Response(
      JSON.stringify({ error: 'Aurora no está disponible ahora mismo. Intenta de nuevo en un momento.' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } },
    )
  }
}
