# RESER-VE · Arquitectura técnica

Guía para cualquier programador que se sume al proyecto: qué hay, dónde vive cada cosa y cómo se conecta.
Última actualización: 1 de octubre de 2026.

---

## 1. Resumen en una frase

RESER-VE es **una sola aplicación Next.js** (frontend + backend en el mismo repositorio), desplegada en **Vercel**, con una base de datos **Postgres en Neon**, correos con **Resend**, fotos en **Vercel Blob** e IA vía **Vercel AI Gateway**. No hay servidores propios que mantener.

```
                ┌──────────────────────────── Vercel ────────────────────────────┐
 Navegador ───► │  Next.js 16 (App Router)                                       │
 (viajero,      │   • Páginas (app/**/page.tsx)       • API (app/api/**/route.ts) │
  posadero,     │   • proxy.ts (redirige a /login)    • Cron diario (vercel.json) │
  admin)        └──────┬───────────────┬───────────────┬───────────────┬─────────┘
                       │               │               │               │
                 Neon Postgres    Vercel Blob       Resend         AI Gateway
                 (datos)          (fotos)           (correos)      (Gemini 2.5 Flash)
                                                      ▲
                       correos que llegan a hola@reser-ve.com ─► webhook /api/inbound
```

## 2. Tecnologías

| Pieza | Qué se usa | Dónde |
|---|---|---|
| Framework | Next.js 16.2 (App Router), React 19, TypeScript | todo el repo |
| Base de datos | Postgres en **Neon** (serverless) | `DATABASE_URL` |
| ORM | **Drizzle ORM** | `lib/db/schema.ts`, `lib/db/index.ts` |
| Autenticación | **NextAuth v5 (Auth.js)**, credenciales email+contraseña, sesiones JWT, contraseñas con bcrypt | `auth.ts` |
| Correo saliente | **Resend** (principal) + **Brevo** (respaldo opcional) | `lib/email.ts` |
| Correo entrante | Resend Receiving (MX del dominio) → webhook | `app/api/inbound/route.ts`, `app/admin/correo` |
| Fotos | **Vercel Blob** (público) | `app/api/upload/route.ts`, `lib/upload-image.ts` |
| IA | **Vercel AI Gateway** + AI SDK v6, modelo `google/gemini-2.5-flash` | `lib/constants.ts` (`AI_MODEL`) |
| Mapa | **MapLibre GL** + teselas gratuitas de **OpenFreeMap** (sin API key) | `components/MapView.tsx` |
| Hosting / dominio / DNS | **Vercel** (dominio reser-ve.com y DNS en Vercel) | proyecto `reser-ve` |
| Código | GitHub `luiscarrasco77-lang/reser-ve`, rama `main` = producción | — |

## 3. Estructura de carpetas

```
app/                     Páginas y API (cada carpeta = una URL)
  page.tsx               Portada
  buscar/                Buscador con mapa
  posadas/[slug]/        Ficha de una posada (+ layout.tsx: SEO y 404)
  destinos/[slug]/       Página de destino (lee la BD)
  reservar/[slug]/       Formulario de reserva (cerrado en fase privada)
  reserva/confirmada/    Confirmación tras reservar
  mis-reservas/ favoritos/ mensajes/      Zona del viajero
  dashboard/             Panel del posadero (layout.tsx exige rol host/admin)
  admin/                 Panel de administración (+ admin/correo = buzón hola@)
  posaderos/             Landing para posaderos
  aurora/                Concierge de viajes con IA
  login/ register/ recuperar/ restablecer/   Cuentas
  faq/ terminos/ privacidad/ vision/         Páginas informativas
  api/                   Backend (ver sección 6)
  sitemap.ts robots.ts   SEO
components/              Piezas de interfaz reutilizables (mapa, menús, chat de Vera, aviso de fase privada)
lib/                     Lógica compartida (ver sección 4)
  db/schema.ts           Definición de TODAS las tablas
scripts/                 Tareas de terminal (sembrar datos, crear admin, copiar el worker del mapa)
public/                  Archivos estáticos (imágenes, PDFs de /docs, worker de MapLibre)
docs/                    Esta documentación
proxy.ts                 Redirige a /login (conservando la página) si no hay sesión en zonas privadas
auth.ts                  Configuración de NextAuth (el rol se relee de la BD en cada petición)
vercel.json              Cron diario
drizzle.config.ts        Config de Drizzle (migraciones)
```

## 4. Librería interna (`lib/`)

| Archivo | Para qué sirve |
|---|---|
| `db/schema.ts`, `db/index.ts` | Tablas y conexión a Neon |
| `constants.ts` | Modelo de IA, URL del sitio, **`BOOKINGS_OPEN`** (fase privada), comisión, límites |
| `email.ts` | Todas las plantillas de correo + envío (Resend → Brevo). Escapa el texto del usuario |
| `posada-input.ts` | Validación y lista blanca de campos al crear/editar posadas (bloquea teléfonos/enlaces) |
| `posadas-query.ts` | Consulta de posadas activas (la usan Aurora y el sitemap) |
| `reviews.ts`, `rating.ts` | Solo cuentan reseñas **verificadas** (con reserva confirmada); “Nueva” si no hay |
| `demo.ts` | Posadas de demostración: retirarlas/restaurarlas |
| `http.ts` | `parseId` (ids seguros) y `rateLimit` (límite de peticiones por IP) |
| `vera.ts`, `support-kb.ts` | Asistente de soporte Vera (respuestas en tickets + base de conocimiento) |
| `search.ts`, `regions.ts`, `locations-ve.ts` | Búsqueda por texto, regiones y coordenadas de Venezuela |
| `destinos-form.ts` | Lista de destinos del formulario de posadas |
| `upload-image.ts` | Reduce la foto en el navegador antes de subirla |
| `data.ts` | Catálogo de ejemplo original (solo se usa si no hay base de datos, p. ej. en desarrollo) |

## 5. Base de datos (Neon Postgres)

Definida en `lib/db/schema.ts`. Tablas principales:

| Tabla | Qué guarda | Campos clave |
|---|---|---|
| `users` | Cuentas | `email` (único, en minúsculas), `password_hash`, `role` (`traveler` / `host` / `admin`) |
| `posadas` | Alojamientos | `host_id`, `status` (`pending_review` / `active` / `suspended` / `rejected` / `draft`), `precio` (USD/noche), `imgs`, `lat`/`lng`, `rating`/`reviews` (calculados), `review_notes`, **`is_demo`** |
| `bookings` | Reservas | `posada_id`, `guest_id`, `check_in`/`check_out` (YYYY-MM-DD), `total_price` (noches × precio, **sin comisión al viajero**), `status` (`pending` / `confirmed` / `cancelled` / `completed`), `booking_code` |
| `reviews` | Reseñas | Solo se muestran si el autor tiene una reserva confirmada o completada en esa posada |
| `conversations`, `messages` | Chat interno | `type` = `booking` (viajero ↔ posadero) o `support` (usuario ↔ equipo/Vera) |
| `favorites` | Posadas guardadas | `user_id`, `posada_id` |
| `password_resets` | Tokens de “olvidé mi contraseña” | Un solo uso, vencen en 1 h |
| `accounts`, `sessions`, `verification_tokens` | Requeridas por NextAuth | (sin uso activo: las sesiones son JWT) |

**Cambiar el esquema:** editar `lib/db/schema.ts` y aplicar con `npm run db:push` (o una sentencia `ALTER TABLE` en Neon). Hacer siempre copia antes en Neon (branching).

**Ver/editar datos a mano:** consola de Neon (SQL Editor) o `npx drizzle-kit studio`.

## 6. API (backend) — `app/api/**/route.ts`

Todas devuelven JSON. Los permisos se comprueban en el servidor en cada ruta.

| Ruta | Métodos | Quién | Qué hace |
|---|---|---|---|
| `auth/[...nextauth]` | GET/POST | todos | Login, logout, sesión (NextAuth) |
| `register` | POST | público | Crear cuenta (viajero o posadero) + correo de bienvenida |
| `password/forgot`, `password/reset` | POST | público | Recuperar contraseña por correo |
| `posadas` | GET / POST | público / posadero | Listado de activas / crear posada (queda en revisión, avisa a admins) |
| `posadas/[slug]` | GET / PATCH / PUT / DELETE | público / dueño | Ficha / editar, pausar (`action:'pause'`), reenviar (`action:'resubmit'`) / pausar |
| `posadas/[slug]/availability` | GET | público | Fechas ocupadas |
| `bookings` | GET / POST | usuario | Mis reservas (o las de mis posadas) / reservar (**403 en fase privada salvo admin**) |
| `bookings/[id]` | GET / PATCH | huésped, posadero, admin | Ver / cambiar estado (máquina de estados) + correos |
| `bookings/[id]/chat` | POST | huésped, posadero, admin | Abre o crea el chat de la reserva |
| `conversations` | GET / POST | usuario | Mis conversaciones / abrir ticket de soporte |
| `conversations/with-host` | POST | viajero | Chat con el posadero (solo con reserva en fase privada) |
| `conversations/[id]`, `.../messages` | GET / POST | participantes, admin | Leer / escribir mensajes (+ correo al otro) |
| `favorites` | GET/POST/DELETE | usuario | Favoritos |
| `reviews` | POST | huésped con estadía | Dejar reseña |
| `upload` | POST | posadero, admin | Subir foto a Vercel Blob (valida que sea imagen real) |
| `aurora` | POST | público (con límite) | Concierge de viajes IA (streaming) |
| `support/chat` | POST | público (con límite) | Asistente Vera (botón naranja) |
| `stats` | GET | público | Cifras de la portada |
| `geocode` | GET | público | Búsqueda de lugares (OpenStreetMap Nominatim) |
| `admin/*` | varios | admin | Estadísticas, usuarios y roles, reservas, revisión de posadas (`approve`/`reject`/`suspend`), demos |
| `inbound` | POST | Resend (firmado) | Recibe correos de @reser-ve.com y los reenvía a los admins |
| `cron/lifecycle` | GET | Vercel Cron (con `CRON_SECRET`) | Diario 04:00 UTC: cancela solicitudes sin respuesta > 24 h y completa estancias pasadas |

## 7. Servicios externos y cuentas

| Servicio | Para qué | Dónde se administra | Plan actual |
|---|---|---|---|
| **Vercel** | Hosting, dominio, DNS, Blob, AI Gateway, cron, variables de entorno | vercel.com → proyecto `reser-ve` | Hobby (pasar a Pro antes de cobrar) |
| **Neon** | Base de datos Postgres | console.neon.tech | Free |
| **Resend** | Enviar correos y recibir los de hola@ | resend.com | Free (100/día, 3.000/mes) |
| **Brevo** (opcional) | Respaldo de envío de correos | brevo.com | — (por activar) |
| **GitHub** | Código fuente | github.com/luiscarrasco77-lang/reser-ve | — |
| **OpenFreeMap** | Teselas del mapa | sin cuenta | gratis |

## 8. Variables de entorno

Se configuran en Vercel → Settings → Environment Variables. En local: copiar `.env.example` a `.env.local` (o `vercel env pull .env.local`). **Nunca** se suben al repositorio.

| Variable | Obligatoria | Para qué |
|---|---|---|
| `DATABASE_URL` | sí | Conexión a Neon |
| `AUTH_SECRET`, `NEXTAUTH_URL` | sí | Firmar sesiones / URL base |
| `BLOB_READ_WRITE_TOKEN` | sí | Subir fotos |
| `RESEND_API_KEY`, `RESEND_FROM` | sí | Enviar correos |
| `RESEND_WEBHOOK_SECRET` | sí | Verificar el webhook de correo entrante |
| `CRON_SECRET` | sí | Proteger el cron |
| `BREVO_API_KEY` | no | Respaldo de correo |
| `NEXT_PUBLIC_BOOKINGS_OPEN` | no | `true` = abrir reservas al público (fin de la fase privada) |
| `NEXT_PUBLIC_SITE_URL` | no | URL pública (por defecto https://reser-ve.com) |
| `AI_GATEWAY_API_KEY` | solo en local | En Vercel la IA se autentica sola (OIDC) |

## 9. Flujos principales

**Alta de posada:** posadero se registra (`/register?role=host`) → `/dashboard/posada/nueva` → `POST /api/posadas` (estado `pending_review`, correo al posadero y a los admins) → admin aprueba en `/admin` → estado `active`, correo “publicada” y se retira una posada demo del mismo destino.

**Reserva (cuando se abra al público):** viajero elige fechas → `POST /api/bookings` (precio recalculado en el servidor, sin comisión al viajero) → correo al posadero y al huésped → posadero confirma/rechaza en `/dashboard/reservas` → chat de la reserva para enviar datos de pago → el cron marca `completed` tras el check-out → el huésped puede reseñar.

**Comisión:** 10% de las reservas confirmadas, la asume la posada. Hoy no hay cobro automático: se calcula en el panel (Admin → Comisión RESER-VE) y se factura aparte.

**Soporte:** botón naranja (Vera, IA) → si no puede resolver, abre ticket (`conversations` tipo `support`) → aviso por correo a los admins → respuesta desde `/mensajes`.

## 10. Seguridad (lo importante)

- Roles en la BD; el rol se relee en cada petición (quitar admin surte efecto al instante). Nadie puede auto-asignarse admin.
- Todas las rutas validan permisos y entradas en el servidor; ids con `parseId`, JSON inválido → 400.
- Texto de usuarios escapado en correos; teléfonos/enlaces bloqueados en las posadas; comunicación solo por el chat interno.
- Límites de uso por IP en IA, registro, recuperación de contraseña y subida de fotos.
- Secretos solo en variables de entorno de Vercel.

## 11. Cómo trabajar en el proyecto

```bash
npm install                 # instala dependencias (copia también el worker del mapa)
vercel env pull .env.local  # trae las variables (requiere acceso al proyecto en Vercel)
npm run dev                 # http://localhost:3000
npm run build               # comprobar que compila antes de subir
```

- **Desplegar:** todo lo que entra a la rama `main` de GitHub se publica solo en reser-ve.com (Vercel). Para probar sin publicar, trabajar en otra rama: Vercel crea una URL de vista previa.
- **Crear un admin por terminal:** `npx tsx scripts/make-admin.ts correo@ejemplo.com` (o desde /admin → Usuarios).
- **Datos de ejemplo:** `scripts/seed-prod.ts` (marca las posadas como demo).

## 12. Operación del día a día

| Tarea | Dónde |
|---|---|
| Aprobar/rechazar/suspender posadas | `/admin` → Revisión / Posadas |
| Retirar o restaurar posadas demo | `/admin` → Posadas (recuadro “Posadas de demostración”) |
| Leer correos de hola@ | Gmail de los admins, `/admin/correo` o Resend → Receiving |
| Abrir las reservas al público | Vercel → `NEXT_PUBLIC_BOOKINGS_OPEN=true` → Redeploy |
| Ver errores | Vercel → proyecto → Logs |
| Ver correos enviados / cuota | Resend → Emails |
| Copias de seguridad de datos | Neon → Branches / Restore |

## 13. Deuda técnica conocida

- Varias páginas grandes (`app/page.tsx`, `app/buscar/page.tsx`) llevan sus estilos dentro del componente; conviene dividirlas en componentes más pequeños.
- Los límites de uso son por servidor (no globales); para tráfico real usar Upstash Ratelimit o Vercel Firewall.
- Cambiar la contraseña no cierra otras sesiones abiertas.
- Sin pasarela de pago integrada (modelo actual: el viajero paga directo a la posada).
- Sin tests automatizados en el repositorio (las pruebas se hicieron contra producción con scripts temporales).
