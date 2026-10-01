import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Sin sesión, las zonas privadas mandan a /login conservando la página exacta
// (p. ej. el enlace "Gestionar reserva" de un correo). Los permisos por rol
// se siguen comprobando en el servidor (layouts y APIs).
export function proxy(request: NextRequest) {
  const hasSession = request.cookies.getAll().some(c => /^(__Secure-)?authjs\.session-token(\.\d+)?$/.test(c.name))
  if (hasSession) return NextResponse.next()
  const url = new URL('/login', request.url)
  url.searchParams.set('callbackUrl', request.nextUrl.pathname + request.nextUrl.search)
  return NextResponse.redirect(url)
}

export const config = {
  matcher: ['/dashboard/:path*', '/mensajes/:path*', '/admin/:path*', '/mis-reservas', '/favoritos'],
}
