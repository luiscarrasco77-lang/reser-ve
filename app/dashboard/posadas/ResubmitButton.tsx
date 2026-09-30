'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function ResubmitButton({ slug, status, action = 'resubmit' }: { slug: string; status: string; action?: 'resubmit' | 'pause' }) {
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const router = useRouter()

  async function resubmit() {
    if (action === 'pause' && !confirm('¿Pausar esta posada? Dejará de verse en RESER-VE. Podrás reactivarla cuando quieras (pasará de nuevo por una revisión rápida).')) return
    setLoading(true)
    const res = await fetch(`/api/posadas/${slug}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    })
    if (res.ok) {
      setDone(true)
      router.refresh()
    }
    setLoading(false)
  }

  if (done) {
    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
        padding: '0.55rem 1.1rem', borderRadius: 999,
        background: 'rgba(245,158,11,0.1)', color: '#92400e',
        fontSize: '0.82rem', fontWeight: 700,
      }}>
        {action === 'pause' ? '⏸ Pausada' : '⏳ Enviada a revisión'}
      </span>
    )
  }

  return (
    <button
      onClick={resubmit}
      disabled={loading}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
        padding: '0.55rem 1.1rem', borderRadius: 999,
        background: loading ? 'rgba(26,43,76,0.06)' : action === 'pause' ? 'white' : '#E67E22',
        color: loading ? '#7A8699' : action === 'pause' ? '#7A8699' : 'white',
        boxShadow: action === 'pause' ? 'inset 0 0 0 1.5px rgba(26,43,76,0.12)' : 'none',
        fontSize: '0.82rem', fontWeight: 700,
        fontFamily: 'inherit', border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
        transition: 'all 0.15s',
      }}
    >
      {loading ? 'Un momento…' : action === 'pause' ? '⏸ Pausar' : status === 'rejected' ? '↩ Reenviar a revisión' : status === 'suspended' ? '▶ Reactivar' : '→ Enviar a revisión'}
    </button>
  )
}
