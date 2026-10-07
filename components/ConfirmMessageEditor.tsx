'use client'

import { useRef, useState } from 'react'
import { CONFIRM_VARS, DEFAULT_CONFIRM_MESSAGE, renderConfirmMessage } from '@/lib/confirm-message'

const EJEMPLO = { huesped: 'Ana Pérez', posada: 'tu posada', checkIn: '2026-12-20', checkOut: '2026-12-23', nights: 3, guests: 2, total: 180, metodo: 'Zelle', codigo: 'RV-2026-1041' }

// Mensaje predeterminado al confirmar una reserva (dentro de los formularios de posada).
export default function ConfirmMessageEditor({ value, onChange, posadaNombre }: { value: string; onChange: (v: string) => void; posadaNombre?: string }) {
  const ref = useRef<HTMLTextAreaElement>(null)
  const [preview, setPreview] = useState(false)

  function insert(key: string) {
    const el = ref.current
    const tag = `{${key}}`
    if (!el) { onChange(value + tag); return }
    const start = el.selectionStart ?? value.length
    const end = el.selectionEnd ?? value.length
    onChange(value.slice(0, start) + tag + value.slice(end))
    requestAnimationFrame(() => { el.focus(); el.setSelectionRange(start + tag.length, start + tag.length) })
  }

  return (
    <div>
      <p style={{ fontSize: '0.82rem', color: 'var(--muted)', margin: '0 0 0.8rem', lineHeight: 1.5 }}>
        Se envía solo al chat del huésped cuando confirmas una reserva (y va en su correo de confirmación). Puedes ajustarlo en cada reserva antes de confirmar. Aquí sí puedes poner tus datos de pago: solo los ve el huésped confirmado.
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.6rem' }}>
        {CONFIRM_VARS.map(v => (
          <button type="button" key={v.key} className="pol-chip" onClick={() => insert(v.key)} title={`Insertar ${v.label.toLowerCase()}`}
            style={{ padding: '0.32rem 0.7rem', fontSize: '0.75rem', fontFamily: 'inherit', cursor: 'pointer', border: '1.5px solid var(--line)', background: 'white', color: 'var(--indigo)', fontWeight: 600 }}>
            + {v.label}
          </button>
        ))}
      </div>
      <div className="field" style={{ marginBottom: '0.5rem' }}>
        {preview ? (
          <div style={{ whiteSpace: 'pre-wrap', background: 'rgba(230,126,34,0.06)', border: '1.5px solid rgba(230,126,34,0.25)', borderRadius: 12, padding: '0.9rem 1rem', fontSize: '0.88rem', lineHeight: 1.55, color: 'var(--indigo)' }}>
            {renderConfirmMessage(value, { ...EJEMPLO, posada: posadaNombre || EJEMPLO.posada })}
          </div>
        ) : (
          <textarea ref={ref} value={value} onChange={e => onChange(e.target.value)} rows={10} maxLength={2000} />
        )}
      </div>
      <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem' }}>
        <button type="button" onClick={() => setPreview(p => !p)} style={{ background: 'none', border: 'none', color: 'var(--cacao)', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', padding: 0 }}>
          {preview ? '✎ Editar' : '👁 Ver cómo le llega al huésped'}
        </button>
        {value !== DEFAULT_CONFIRM_MESSAGE && (
          <button type="button" onClick={() => { onChange(DEFAULT_CONFIRM_MESSAGE); setPreview(false) }} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontFamily: 'inherit', padding: 0, textDecoration: 'underline' }}>
            Usar el texto sugerido
          </button>
        )}
      </div>
    </div>
  )
}
