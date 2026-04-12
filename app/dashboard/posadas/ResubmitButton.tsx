'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function ResubmitButton({ slug, status }: { slug: string; status: string }) {
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const router = useRouter()

  async function resubmit() {
    setLoading(true)
    const res = await fetch(`/api/posadas/${slug}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'resubmit' }),
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
        ⏳ Enviada a revisión
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
        background: loading ? 'rgba(26,43,76,0.06)' : '#E67E22',
        color: loading ? '#7A8699' : 'white',
        fontSize: '0.82rem', fontWeight: 700,
        fontFamily: 'inherit', border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
        transition: 'all 0.15s',
      }}
    >
      {loading ? 'Enviando…' : status === 'rejected' ? '↩ Reenviar a revisión' : '→ Enviar a revisión'}
    </button>
  )
}
