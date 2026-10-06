'use client'

import { useState } from 'react'
import { useT } from './LangProvider'

// Pantalla para que un viajero active su modo posadero (misma cuenta para todo).
export default function BecomeHost({ name }: { name: string }) {
  const t = useT()
  const [ok, setOk] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function activar() {
    setBusy(true); setError('')
    const res = await fetch('/api/account/host', { method: 'POST' }).catch(() => null)
    if (res?.ok) { window.location.href = '/dashboard/posada/nueva'; return }
    setError(t('No pudimos activar tu modo posadero. Intenta de nuevo.'))
    setBusy(false)
  }

  const item = (big: string, title: string, text: string) => (
    <div style={{ display: 'flex', gap: '.9rem', alignItems: 'flex-start', padding: '.85rem 0', borderBottom: '1px solid rgba(26,43,76,.08)' }}>
      <div style={{ flexShrink: 0, minWidth: 56, fontFamily: "'Playfair Display',Georgia,serif", fontWeight: 800, fontSize: '1.35rem', color: '#E67E22' }}>{big}</div>
      <div><div style={{ fontWeight: 700, fontSize: '.92rem' }}>{t(title)}</div><div style={{ fontSize: '.84rem', color: '#7A8699', lineHeight: 1.5 }}>{t(text)}</div></div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#FDFBF7', fontFamily: "'Inter',system-ui,sans-serif", color: '#1A2B4C', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2.5rem 1.25rem' }}>
      <div style={{ background: 'white', border: '1.5px solid rgba(26,43,76,.08)', borderRadius: 24, boxShadow: '0 16px 56px rgba(26,43,76,.10)', padding: '2.2rem 2rem', maxWidth: 520, width: '100%' }}>
        <div style={{ fontSize: '.72rem', fontWeight: 800, letterSpacing: '.14em', textTransform: 'uppercase', color: '#E67E22' }}>{t('Modo posadero')}</div>
        <h1 style={{ fontFamily: "'Playfair Display',Georgia,serif", fontSize: '1.8rem', margin: '.4rem 0 .5rem', lineHeight: 1.15 }}>{name ? t('{name}, publica tu posada', { name: name.split(' ')[0] }) : t('Publica tu posada')}</h1>
        <p style={{ fontSize: '.9rem', color: '#7A8699', lineHeight: 1.55, margin: '0 0 .8rem' }}>
          {t('Usas la misma cuenta para viajar y para recibir huéspedes. Tus reservas como viajero siguen en')} <b>{t('Mis reservas')}</b>.
        </p>
        {item('$0', 'Publicar es gratis', 'Sin mensualidad, sin costo de alta, sin permanencia.')}
        {item('10%', 'Solo por reserva confirmada', 'Lo asume la posada; el viajero paga exactamente tu precio. Tarifa fundadora garantizada 12 meses.')}
        {item('=', 'Mismo precio y ofertas', 'Igual que en tus otros canales; si haces una promoción fuera, también va aquí.')}
        {item('💬', 'Todo por la app', 'Hablas con los huéspedes por el chat de RESER-VE.')}
        <label style={{ display: 'flex', gap: '.6rem', alignItems: 'flex-start', margin: '1.1rem 0 .4rem', fontSize: '.84rem', lineHeight: 1.5, cursor: 'pointer' }}>
          <input type="checkbox" checked={ok} onChange={e => setOk(e.target.checked)} style={{ marginTop: 3, accentColor: '#E67E22', width: 16, height: 16 }} />
          <span>{t('Acepto las')} <a href="/posaderos#condiciones" target="_blank" style={{ color: '#E67E22', fontWeight: 600 }}>{t('condiciones para posaderos')}</a> {t('y los')} <a href="/terminos" target="_blank" style={{ color: '#E67E22', fontWeight: 600 }}>{t('Términos')}</a>.</span>
        </label>
        {error && <div style={{ color: '#dc2626', fontSize: '.84rem', margin: '.4rem 0' }}>{error}</div>}
        <button onClick={activar} disabled={!ok || busy} style={{ width: '100%', marginTop: '.8rem', padding: '.95rem', border: 'none', borderRadius: 12, background: '#E67E22', color: 'white', fontWeight: 700, fontSize: '.95rem', fontFamily: 'inherit', cursor: ok && !busy ? 'pointer' : 'not-allowed', opacity: ok && !busy ? 1 : .55 }}>
          {busy ? t('Activando…') : t('Empezar a publicar mi posada')}
        </button>
        <a href="/" style={{ display: 'block', textAlign: 'center', marginTop: '1rem', fontSize: '.84rem', color: '#7A8699', textDecoration: 'none' }}>{t('Ahora no')}</a>
      </div>
    </div>
  )
}
