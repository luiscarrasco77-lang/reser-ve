'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

// Botón de corazón para guardar/quitar una posada de favoritos.
// `posadaId` es el id numérico de la posada (de la API).
export default function FavoriteButton({ posadaId, variant = 'card' }: { posadaId: number; variant?: 'card' | 'full' }) {
  const { status } = useSession()
  const router = useRouter()
  const [fav, setFav] = useState(false)
  const [busy, setBusy] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (status !== 'authenticated') { setReady(true); return }
    fetch('/api/favorites')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (Array.isArray(d?.ids)) setFav(d.ids.includes(posadaId)) })
      .catch(() => {})
      .finally(() => setReady(true))
  }, [status, posadaId])

  async function toggle(e: React.MouseEvent) {
    e.preventDefault(); e.stopPropagation()
    if (status !== 'authenticated') { router.push('/login?callbackUrl=/buscar'); return }
    if (busy) return
    setBusy(true)
    const next = !fav
    setFav(next)
    try {
      await fetch('/api/favorites', {
        method: next ? 'POST' : 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ posadaId }),
      })
    } catch { setFav(!next) }
    finally { setBusy(false) }
  }

  const full = variant === 'full'
  return (
    <button
      onClick={toggle}
      aria-label={fav ? 'Quitar de favoritos' : 'Guardar en favoritos'}
      aria-pressed={fav}
      title={fav ? 'Quitar de favoritos' : 'Guardar en favoritos'}
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: full ? '0.5rem' : 0,
        width: full ? 'auto' : 38, height: 38, padding: full ? '0 1rem' : 0,
        borderRadius: full ? 999 : '50%',
        border: '1.5px solid rgba(26,43,76,0.12)',
        background: 'rgba(255,255,255,0.95)', cursor: 'pointer',
        boxShadow: '0 2px 10px rgba(26,43,76,0.12)', transition: 'all 0.15s',
        opacity: ready ? 1 : 0.6,
        fontFamily: 'Inter, sans-serif', fontSize: '0.84rem', fontWeight: 600, color: 'var(--indigo, #1A2B4C)',
      }}
    >
      <svg width="18" height="18" viewBox="0 0 24 24"
        fill={fav ? '#E67E22' : 'none'} stroke={fav ? '#E67E22' : '#7A8699'} strokeWidth="2">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
      </svg>
      {full && (fav ? 'Guardada' : 'Guardar')}
    </button>
  )
}
