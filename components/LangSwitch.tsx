'use client'

import { useLang } from './LangProvider'

// Selector ES / EN. `dark` para usarlo sobre fondos oscuros (portada).
export default function LangSwitch({ dark = false }: { dark?: boolean }) {
  const { lang, setLang } = useLang()
  const base = dark ? 'rgba(255,255,255,' : 'rgba(26,43,76,'
  return (
    <div className="lang-switch" role="group" aria-label={lang === 'en' ? 'Language' : 'Idioma'} style={{
      display: 'inline-flex', alignItems: 'center', gap: 2, padding: 3, borderRadius: 999,
      border: `1px solid ${base}0.18)`, background: dark ? 'rgba(255,255,255,0.08)' : 'rgba(26,43,76,0.04)',
      backdropFilter: dark ? 'blur(8px)' : undefined, flexShrink: 0,
    }}>
      {(['es', 'en'] as const).map(l => {
        const on = lang === l
        return (
          <button key={l} type="button" onClick={() => !on && setLang(l)} aria-pressed={on}
            title={l === 'es' ? 'Español' : 'English'}
            style={{
              border: 'none', cursor: on ? 'default' : 'pointer', fontFamily: 'inherit',
              fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.06em',
              padding: '0.32rem 0.6rem', borderRadius: '999px',
              background: on ? (dark ? 'white' : '#1A2B4C') : 'transparent',
              color: on ? (dark ? '#1A2B4C' : 'white') : `${base}0.7)`,
              transition: 'background .15s, color .15s',
            }}>
            {l.toUpperCase()}
          </button>
        )
      })}
    </div>
  )
}
