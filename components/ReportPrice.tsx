'use client'

import { useState } from 'react'

// "¿La viste más barata en otro lado?": el viajero avisa y el equipo revisa la paridad de precios.
export default function ReportPrice({ slug }: { slug: string }) {
  const [open, setOpen] = useState(false)
  const [canal, setCanal] = useState('Instagram')
  const [precio, setPrecio] = useState('')
  const [enlace, setEnlace] = useState('')
  const [estado, setEstado] = useState<'' | 'enviando' | 'ok' | 'error'>('')

  async function enviar() {
    setEstado('enviando')
    const res = await fetch(`/api/posadas/${slug}/report-price`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ canal, precio, enlace }),
    }).catch(() => null)
    setEstado(res?.ok ? 'ok' : 'error')
  }

  const box: React.CSSProperties = { marginTop: '.9rem', fontSize: '.78rem', color: '#7A8699', textAlign: 'center' }
  const input: React.CSSProperties = { width: '100%', padding: '.5rem .65rem', border: '1.5px solid rgba(26,43,76,.12)', borderRadius: 8, fontFamily: 'inherit', fontSize: '.8rem', marginTop: '.4rem', boxSizing: 'border-box' }

  if (estado === 'ok') return <div style={box}>Gracias por avisar. Lo revisamos con la posada.</div>
  if (!open) return (
    <div style={box}>
      <button onClick={() => setOpen(true)} style={{ background: 'none', border: 'none', color: '#7A8699', textDecoration: 'underline', cursor: 'pointer', fontFamily: 'inherit', fontSize: 'inherit' }}>
        ¿La viste más barata en otro lado?
      </button>
    </div>
  )
  return (
    <div style={{ ...box, textAlign: 'left', background: 'rgba(26,43,76,.03)', borderRadius: 10, padding: '.75rem' }}>
      <div style={{ fontWeight: 700, color: '#1A2B4C' }}>Avísanos y lo revisamos</div>
      <select value={canal} onChange={e => setCanal(e.target.value)} style={input}>
        {['Instagram', 'WhatsApp', 'Facebook', 'Booking', 'Airbnb', 'Página propia', 'Otro'].map(c => <option key={c}>{c}</option>)}
      </select>
      <input style={input} placeholder="Precio que viste (ej. $40/noche)" value={precio} onChange={e => setPrecio(e.target.value)} maxLength={40} />
      <input style={input} placeholder="Enlace (opcional)" value={enlace} onChange={e => setEnlace(e.target.value)} maxLength={300} />
      <button onClick={enviar} disabled={estado === 'enviando'} style={{ marginTop: '.5rem', width: '100%', padding: '.55rem', border: 'none', borderRadius: 999, background: '#1A2B4C', color: 'white', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', fontSize: '.8rem' }}>
        {estado === 'enviando' ? 'Enviando…' : 'Enviar aviso'}
      </button>
      {estado === 'error' && <div style={{ color: '#B42318', marginTop: '.4rem' }}>No se pudo enviar. Intenta más tarde.</div>}
    </div>
  )
}
