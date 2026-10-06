import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Zonas que requieren sesión: sin ella se manda a /login conservando la página exacta
// (p. ej. el enlace "Gestionar reserva" de un correo). Los permisos por rol se siguen
// comprobando en el servidor (layouts y APIs).
const PRIVATE = [/^\/dashboard(\/|$)/, /^\/mensajes(\/|$)/, /^\/admin(\/|$)/, /^\/mis-reservas$/, /^\/favoritos$/, /^\/cuenta$/]

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl

  if (PRIVATE.some(r => r.test(pathname))) {
    const hasSession = request.cookies.getAll().some(c => /^(__Secure-)?authjs\.session-token(\.\d+)?$/.test(c.name))
    if (!hasSession) {
      const url = new URL('/login', request.url)
      url.searchParams.set('callbackUrl', pathname + search)
      return NextResponse.redirect(url)
    }
  }

  // Idioma: la primera visita de un navegador en inglés recibe la web en inglés.
  // Después manda siempre la elección guardada en la cookie `lang`.
  if (!request.cookies.has('lang')) {
    const accept = (request.headers.get('accept-language') ?? '').toLowerCase()
    const lang = accept.trim().startsWith('en') ? 'en' : 'es'
    const headers = new Headers(request.headers)
    headers.set('cookie', [request.headers.get('cookie'), `lang=${lang}`].filter(Boolean).join('; '))
    const res = NextResponse.next({ request: { headers } })
    res.cookies.set('lang', lang, { path: '/', maxAge: 31536000, sameSite: 'lax' })
    return res
  }
  return NextResponse.next()
}

export const config = {
  // Todas las páginas; no las APIs ni los archivos estáticos.
  matcher: ['/((?!api|_next|images|docs|maplibre|favicon.ico|icon|apple-icon|apple-touch-icon|logo-512.png|robots.txt|sitemap.xml).*)'],
}
