'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'

const LINKS = [
  { href: '/dashboard', label: 'Panel' },
  { href: '/dashboard/posadas', label: 'Mis posadas' },
  { href: '/dashboard/reservas', label: 'Reservas' },
  { href: '/mensajes', label: 'Mensajes' },
  { href: '/dashboard/posada/nueva', label: '+ Nueva posada' },
]

// Navegación común del panel del posadero (se adapta a móvil con scroll horizontal).
export default function DashboardNav() {
  const path = usePathname()
  return (
    <>
      <style>{`
        .dnav{position:sticky;top:var(--pp-h,0px);z-index:100;background:white;border-bottom:1.5px solid rgba(26,43,76,0.08);display:flex;align-items:center;gap:1rem;padding:0 1.5rem;height:62px;font-family:'Inter',system-ui,sans-serif}
        .dnav-logo{font-size:1.25rem;font-weight:800;letter-spacing:-0.04em;color:#1A2B4C;text-decoration:none;flex-shrink:0}
        .dnav-logo span{color:#E67E22}
        .dnav-links{display:flex;gap:.25rem;margin-left:auto;overflow-x:auto;scrollbar-width:none;-webkit-overflow-scrolling:touch}
        .dnav-links::-webkit-scrollbar{display:none}
        .dnav-a{white-space:nowrap;padding:.5rem .8rem;border-radius:999px;font-size:.84rem;font-weight:600;color:#7A8699;text-decoration:none;background:none;border:none;cursor:pointer;font-family:inherit}
        .dnav-a:hover{color:#1A2B4C;background:rgba(26,43,76,.05)}
        .dnav-a.on{color:#E67E22;background:rgba(230,126,34,.1)}
        @media(max-width:640px){.dnav{padding:0 .9rem;gap:.5rem}.dnav-logo{font-size:1.05rem}.dnav-a{font-size:.78rem;padding:.45rem .6rem}}
      `}</style>
      <nav className="dnav">
        <Link href="/" className="dnav-logo">RESER<span>-VE</span></Link>
        <div className="dnav-links">
          {LINKS.map(l => (
            <Link key={l.href} href={l.href} className={`dnav-a${path === l.href ? ' on' : ''}`}>{l.label}</Link>
          ))}
          <button className="dnav-a" onClick={() => signOut({ callbackUrl: '/' })}>Cerrar sesión</button>
        </div>
      </nav>
    </>
  )
}
