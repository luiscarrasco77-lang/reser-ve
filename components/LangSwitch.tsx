'use client'

import { useId } from 'react'
import { useLang } from './LangProvider'
import type { Lang } from '@/lib/i18n'

// Banderas circulares en SVG (los emoji de banderas no se ven en Windows).
function Flag({ lang }: { lang: Lang }) {
  const id = `flag-${lang}-${useId().replace(/:/g, '')}`
  if (lang === 'es') {
    // Venezuela: amarillo, azul con el arco de 8 estrellas, rojo.
    const stars = Array.from({ length: 8 }, (_, i) => {
      const a = Math.PI * (0.9 - (i * 0.8) / 7)
      return <circle key={i} cx={15 + 6.2 * Math.cos(a)} cy={17.6 - 6.2 * Math.sin(a)} r={0.85} fill="#fff" />
    })
    return (
      <svg viewBox="0 0 30 30" width="100%" height="100%" aria-hidden="true">
        <defs><clipPath id={id}><circle cx="15" cy="15" r="15" /></clipPath></defs>
        <g clipPath={`url(#${id})`}>
          <rect width="30" height="10" fill="#FFCC00" />
          <rect y="10" width="30" height="10" fill="#00247D" />
          <rect y="20" width="30" height="10" fill="#CF142B" />
          {stars}
        </g>
      </svg>
    )
  }
  // Estados Unidos: franjas y cantón azul con estrellas.
  return (
    <svg viewBox="0 0 30 30" width="100%" height="100%" aria-hidden="true">
      <defs><clipPath id={id}><circle cx="15" cy="15" r="15" /></clipPath></defs>
      <g clipPath={`url(#${id})`}>
        <rect width="30" height="30" fill="#fff" />
        {Array.from({ length: 7 }, (_, i) => <rect key={i} y={i * (30 / 6.5)} width="30" height={30 / 13} fill="#B22234" />)}
        <rect width="15" height={30 * 7 / 13} fill="#3C3B6E" />
        {Array.from({ length: 9 }, (_, i) => <circle key={i} cx={3 + (i % 3) * 4.5} cy={3 + Math.floor(i / 3) * 4.6} r={0.9} fill="#fff" />)}
      </g>
    </svg>
  )
}

// Selector de idioma con banderitas. `dark` para usarlo sobre fondos oscuros (portada).
export default function LangSwitch({ dark = false }: { dark?: boolean }) {
  const { lang, setLang } = useLang()
  return (
    <div className="lang-switch" role="group" aria-label={lang === 'en' ? 'Language' : 'Idioma'} style={{
      display: 'inline-flex', alignItems: 'center', gap: 3, padding: 3, borderRadius: 999,
      border: `1px solid ${dark ? 'rgba(255,255,255,0.22)' : 'rgba(26,43,76,0.12)'}`,
      background: dark ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.85)',
      backdropFilter: 'blur(8px)', flexShrink: 0,
      boxShadow: dark ? 'none' : '0 2px 10px rgba(26,43,76,0.08)',
    }}>
      {(['es', 'en'] as const).map(l => {
        const on = lang === l
        const label = l === 'es' ? 'Español' : 'English'
        return (
          <button key={l} type="button" onClick={() => !on && setLang(l)} aria-pressed={on}
            aria-label={label} title={label} className={on ? 'on' : ''}
            style={{
              width: 30, height: 30, padding: 3, border: 'none', cursor: on ? 'default' : 'pointer',
              background: on ? (dark ? 'rgba(255,255,255,0.95)' : '#1A2B4C') : 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'background .2s, transform .2s',
            }}>
            <span style={{
              display: 'block', width: '100%', height: '100%', borderRadius: '50%', overflow: 'hidden',
              boxShadow: '0 0 0 1px rgba(0,0,0,0.08)',
              filter: on ? 'none' : 'saturate(0.55)', opacity: on ? 1 : 0.72,
              transition: 'filter .2s, opacity .2s',
            }}>
              <Flag lang={l} />
            </span>
          </button>
        )
      })}
    </div>
  )
}
