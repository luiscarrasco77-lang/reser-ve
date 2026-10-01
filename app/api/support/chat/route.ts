import { NextRequest } from 'next/server'
import { rateLimit } from '@/lib/http'
import { convertToModelMessages, streamText, stepCountIs, tool, type UIMessage } from 'ai'
import { z } from 'zod'
import { auth } from '@/auth'
import { getDb } from '@/lib/db'
import { conversations, messages as messagesTable, users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { SUPPORT_SYSTEM_PROMPT } from '@/lib/support-kb'
import { AI_MODEL } from '@/lib/constants'
import { emailNewMessage } from '@/lib/email'

// El asistente puede dar varios pasos (responder + usar herramienta)
export const maxDuration = 30

// Modelo vía Vercel AI Gateway. Autentica con OIDC en Vercel o AI_GATEWAY_API_KEY en local.
const MODEL = AI_MODEL

export async function POST(req: Request) {
  const limited = rateLimit(req as NextRequest, 'vera', 30, 10 * 60_000)
  if (limited) return limited
  const body = await req.json().catch(() => null)
  const messages: UIMessage[] = Array.isArray(body?.messages) ? body.messages.slice(-30) : []
  if (messages.length === 0) return new Response(JSON.stringify({ error: 'Datos inválidos' }), { status: 400 })

  const session = await auth()
  const userId = session?.user ? parseInt((session.user as any).id) : null
  const userName = session?.user?.name ?? null
  const userRole = session?.user ? (session.user as any).role : 'invitado'

  const contextoUsuario = userId
    ? `\n\n# Contexto del usuario actual\nEstá conectado como ${userName} (rol: ${userRole}, id: ${userId}). Puedes abrir tickets a su nombre.`
    : `\n\n# Contexto del usuario actual\nNO ha iniciado sesión. Para abrir un ticket formal con un agente, invítalo a iniciar sesión en /login; aun así puedes recoger su consulta.`

  try {
    const result = streamText({
      model: MODEL,
      system: SUPPORT_SYSTEM_PROMPT + contextoUsuario,
      messages: await convertToModelMessages(messages),
      stopWhen: stepCountIs(4),
      tools: {
        escalarAAgente: tool({
          description:
            'Abre un ticket de soporte con un agente humano del equipo RESER-VE. Úsala cuando el usuario lo pida explícitamente, tenga un problema con un pago/reserva concreto, una queja, o algo que no puedas resolver con la información disponible.',
          inputSchema: z.object({
            asunto: z.string().describe('Asunto corto del ticket, ej: "Problema con pago de reserva RV-2026-1001"'),
            resumen: z.string().describe('Resumen claro de la consulta o problema del usuario para que el agente tenga contexto.'),
          }),
          execute: async ({ asunto, resumen }) => {
            // Sin sesión no podemos crear un hilo asociado a un usuario.
            if (!userId) {
              return {
                creado: false,
                mensaje:
                  'Para conectar con un agente humano necesitas iniciar sesión en /login. Luego, desde /mensajes, podrás abrir un ticket de "Servicio al cliente" y te responderemos por ahí. También puedes escribir a hola@reser-ve.com.',
              }
            }
            try {
              const db = getDb()
              const [conv] = await db.insert(conversations).values({
                type: 'support',
                userId,
                subject: asunto,
                lastMessageAt: new Date(),
              }).returning()

              await db.insert(messagesTable).values({
                conversationId: conv.id,
                senderId: userId,
                senderName: userName ?? 'Usuario',
                senderRole: userRole,
                body: `[Ticket abierto vía asistente IA]\n\n${resumen}`,
              })
              // Avisa a los admins del nuevo ticket.
              const admins = await db.select({ email: users.email, name: users.name }).from(users).where(eq(users.role, 'admin'))
              await Promise.all(admins.map(a => emailNewMessage({
                recipientEmail: a.email, recipientName: a.name, senderName: userName ?? 'Usuario',
                subject: `[Soporte] ${asunto}`, body: resumen, conversationId: conv.id,
              })))

              return {
                creado: true,
                conversationId: conv.id,
                mensaje:
                  'Listo, abrí un ticket con nuestro equipo. Un agente te responderá pronto. Puedes seguir la conversación en /mensajes.',
              }
            } catch {
              return {
                creado: false,
                mensaje:
                  'No pude abrir el ticket automáticamente. Por favor escríbenos a hola@reser-ve.com o desde /mensajes y te ayudamos enseguida.',
              }
            }
          },
        }),
      },
    })

    return result.toUIMessageStreamResponse()
  } catch (err) {
    return new Response(
      JSON.stringify({
        error:
          'El asistente no está disponible en este momento. Por favor intenta más tarde o escríbenos a hola@reser-ve.com.',
      }),
      { status: 503, headers: { 'Content-Type': 'application/json' } },
    )
  }
}
