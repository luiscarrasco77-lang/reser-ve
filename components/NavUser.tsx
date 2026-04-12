'use client'

import { useSession, signOut } from 'next-auth/react'
import { useState, useRef, useEffect } from 'react'

export default function NavUser({ dark = false }: { dark?: boolean }) {
  const { data: session, status } = useSession()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function h(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  if (status === 'loading') return <div style={{ width: 80 }} />

  const role = (session?.user as any)?.role

  if (!session) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
        <a href="/login" style={{
          fontSize: '0.84rem', fontWeight: 600, textDecoration: 'none',
          color: dark ? 'rgba(255,255,255,0.82)' : 'rgba(26,43,76,0.7)',
          transition: 'color 0.2s',
        }}>
          Iniciar sesión
        </a>
        <a href="/register" style={{
          padding: '0.55rem 1.1rem', borderRadius: 999,
          fontSize: '0.82rem', fontWeight: 700, textDecoration: 'none',
          background: 'var(--cacao)', color: 'white',
          boxShadow: '0 6px 18px rgba(230,126,34,0.28)',
          transition: 'all 0.2s',
        }}>
          Registrarse
        </a>
      </div>
    )
  }

  const initials = session.user?.name
    ? session.user.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : '?'

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          background: 'white', border: '1.5px solid rgba(26,43,76,0.12)',
          borderRadius: 999, padding: '0.32rem 0.72rem 0.32rem 0.32rem',
          cursor: 'pointer', boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
          transition: 'box-shadow 0.2s',
        }}
      >
        <div style={{
          width: 30, height: 30, borderRadius: '50%',
          background: 'var(--cacao)', color: 'white',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '0.72rem', fontWeight: 800, flexShrink: 0,
        }}>
          {initials}
        </div>
        <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--indigo)', maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {session.user?.name?.split(' ')[0]}
        </span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2.5" style={{ transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'none' }}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 8px)', right: 0,
          background: 'white', border: '1.5px solid rgba(26,43,76,0.09)',
          borderRadius: 16, boxShadow: '0 16px 48px rgba(26,43,76,0.14)',
          minWidth: 200, overflow: 'hidden', zIndex: 500,
        }}>
          {/* User info */}
          <div style={{ padding: '0.9rem 1rem 0.7rem', borderBottom: '1px solid rgba(26,43,76,0.07)' }}>
            <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--indigo)' }}>{session.user?.name}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: 2 }}>{session.user?.email}</div>
            <div style={{
              display: 'inline-block', marginTop: 6,
              fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase',
              background: role === 'host' ? 'rgba(230,126,34,0.12)' : 'rgba(26,43,76,0.07)',
              color: role === 'host' ? 'var(--cacao)' : 'var(--muted)',
              padding: '0.18rem 0.52rem', borderRadius: 999,
            }}>
              {role === 'host' ? 'Posadero' : role === 'admin' ? 'Admin' : 'Viajero'}
            </div>
          </div>

          {/* Links */}
          {role === 'host' || role === 'admin' ? (
            <>
              <MenuItem href="/dashboard" icon="grid">Mi dashboard</MenuItem>
              <MenuItem href="/dashboard/posada/nueva" icon="plus">Publicar posada</MenuItem>
              <MenuItem href="/dashboard/reservas" icon="calendar">Mis reservas</MenuItem>
            </>
          ) : (
            <MenuItem href="/mis-reservas" icon="calendar">Mis reservas</MenuItem>
          )}
          <MenuItem href="/buscar" icon="search">Explorar posadas</MenuItem>

          <div style={{ height: 1, background: 'rgba(26,43,76,0.07)', margin: '0.3rem 0' }} />
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            style={{
              width: '100%', textAlign: 'left', padding: '0.72rem 1rem',
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: '0.85rem', color: '#dc2626', fontFamily: 'inherit',
              display: 'flex', alignItems: 'center', gap: '0.6rem',
              transition: 'background 0.13s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(220,38,38,0.05)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'none')}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            Cerrar sesión
          </button>
        </div>
      )}
    </div>
  )
}

function MenuItem({ href, icon, children }: { href: string; icon: string; children: React.ReactNode }) {
  const icons: Record<string, React.ReactNode> = {
    grid: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
    plus: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
    calendar: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
    search: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  }
  return (
    <a href={href} style={{
      display: 'flex', alignItems: 'center', gap: '0.65rem',
      padding: '0.72rem 1rem', fontSize: '0.85rem', fontWeight: 500,
      color: 'var(--indigo)', textDecoration: 'none',
      transition: 'background 0.13s',
    }}
    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(26,43,76,0.04)')}
    onMouseLeave={e => (e.currentTarget.style.background = 'none')}
    >
      <span style={{ color: 'var(--muted)', display: 'flex' }}>{icons[icon]}</span>
      {children}
    </a>
  )
}
