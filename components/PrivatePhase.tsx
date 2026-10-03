'use client'

import { useSession } from 'next-auth/react'
import { BOOKINGS_OPEN } from '@/lib/constants'

// true si el usuario actual puede reservar (reservas abiertas, o admin haciendo pruebas).
export function useBookingsOpen() {
  const { data } = useSession()
  return BOOKINGS_OPEN || (data?.user as any)?.role === 'admin'
}

// Aviso que sustituye al botón de reservar durante la fase privada.
export function PrivatePhaseNotice({ compact = false }: { compact?: boolean }) {
  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(230,126,34,0.08), rgba(26,43,76,0.05))',
      border: '1.5px dashed rgba(230,126,34,0.45)', borderRadius: 14,
      padding: compact ? '0.75rem 0.9rem' : '1rem 1.1rem', textAlign: 'center',
      fontFamily: "'Inter', system-ui, sans-serif", color: '#1A2B4C',
    }}>
      <div style={{ fontWeight: 800, fontSize: compact ? '0.86rem' : '0.95rem' }}>Reservas muy pronto</div>
      <div style={{ fontSize: compact ? '0.74rem' : '0.8rem', color: '#7A8699', marginTop: 4, lineHeight: 1.5 }}>
        RESER-VE está en fase privada mientras incorporamos posadas y perfeccionamos el pago. Crea tu cuenta gratis y guarda tus favoritas: te avisaremos por correo cuando abran las reservas.
      </div>
    </div>
  )
}

// Franja superior del sitio: fija, de altura --pp-h. Los headers usan top: var(--pp-h)
// (ver globals.css) para quedar justo debajo y no chocar.
export function PrivatePhaseBar() {
  const { data } = useSession()
  if (BOOKINGS_OPEN) return null
  return (
    <>
      <style>{`
        :root{--pp-h:34px}
        body{padding-top:var(--pp-h)}
        .pp-bar{position:fixed;top:0;left:0;right:0;height:var(--pp-h);z-index:250;display:flex;align-items:center;justify-content:center;gap:.4rem;
          background:#1A2B4C;color:rgba(255,255,255,.88);font-family:'Inter',system-ui,sans-serif;font-size:.78rem;padding:0 1rem;white-space:nowrap;overflow:hidden}
        .pp-bar strong{color:#FFC88A}
        .pp-bar a{color:#FFC88A;font-weight:700;text-decoration:none}
        .pp-long{overflow:hidden;text-overflow:ellipsis}
        @media(max-width:640px){.pp-long{display:none}}
      `}</style>
      <div className="pp-bar" role="note">
        <strong>Fase privada</strong>
        <span className="pp-long">· Estamos sumando posadas; las reservas abren muy pronto.</span>
        {(data?.user as any)?.role === 'host' || (data?.user as any)?.role === 'admin'
          ? <span>Ya puedes publicar y editar tus posadas.</span>
          : <a href="/posaderos">¿Tienes una posada? Únete →</a>}
      </div>
    </>
  )
}
