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
      <div style={{ fontWeight: 800, fontSize: compact ? '0.86rem' : '0.95rem' }}>🔒 Reservas muy pronto</div>
      <div style={{ fontSize: compact ? '0.74rem' : '0.8rem', color: '#7A8699', marginTop: 4, lineHeight: 1.5 }}>
        RESER-VE está en fase privada mientras incorporamos posadas y perfeccionamos el pago. Guarda tus favoritas y te avisaremos cuando abran las reservas.
      </div>
    </div>
  )
}

// Franja superior del sitio.
export function PrivatePhaseBar() {
  if (BOOKINGS_OPEN) return null
  return (
    <div style={{
      background: '#1A2B4C', color: 'rgba(255,255,255,0.88)', textAlign: 'center',
      fontFamily: "'Inter', system-ui, sans-serif", fontSize: '0.78rem', padding: '0.5rem 1rem', lineHeight: 1.4,
    }}>
      <strong style={{ color: '#FFC88A' }}>Fase privada</strong> · Estamos sumando posadas; las reservas abren muy pronto.{' '}
      <a href="/posaderos" style={{ color: '#FFC88A', fontWeight: 700, textDecoration: 'none' }}>¿Tienes una posada? Únete →</a>
    </div>
  )
}
