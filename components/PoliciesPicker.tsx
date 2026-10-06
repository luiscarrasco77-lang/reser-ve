'use client'

import { POLICY_EXTRAS, POLICY_FIELDS, type PolicyState } from '@/lib/policies'

// Políticas de la posada con menús desplegables (se usa dentro de los formularios de
// nueva posada y editar posada, que ya traen los estilos .field / .field-row).
export default function PoliciesPicker({ value, onChange }: { value: PolicyState; onChange: (v: PolicyState) => void }) {
  const set = (key: string, v: string) => onChange({ ...value, values: { ...value.values, [key]: v } })
  const toggle = (e: string) => onChange({ ...value, extras: value.extras.includes(e) ? value.extras.filter(x => x !== e) : [...value.extras, e] })
  return (
    <div>
      <p style={{ fontSize: '0.82rem', color: 'var(--muted)', margin: '0 0 1rem', lineHeight: 1.5 }}>
        Elige las que apliquen; las que dejes en “Sin especificar” no aparecen en tu página. Si tienes alguna regla distinta, escríbela abajo.
      </p>
      <div className="field-row">
        {POLICY_FIELDS.map(f => (
          <div className="field" key={f.key}>
            <label>{f.label}</label>
            <select value={value.values[f.key] ?? ''} onChange={e => set(f.key, e.target.value)}>
              {f.options.map(o => <option key={o} value={o}>{o || 'Sin especificar'}</option>)}
            </select>
          </div>
        ))}
      </div>
      <div style={{ margin: '0.4rem 0 1.4rem' }}>
        <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--indigo)', marginBottom: '0.2rem' }}>Más detalles de tu posada</div>
        <p style={{ fontSize: '0.8rem', color: 'var(--muted)', margin: '0 0 0.9rem' }}>Marca todo lo que aplique. Ayuda al viajero a saber qué esperar y evita malentendidos.</p>
        {POLICY_EXTRAS.map(g => (
          <div key={g.group} style={{ marginBottom: '1rem' }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '0.5rem' }}>{g.group}</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem' }}>
              {g.items.map(([es]) => {
                const on = value.extras.includes(es)
                return (
                  <button type="button" key={es} onClick={() => toggle(es)} aria-pressed={on} className="pol-chip" style={{
                    padding: '0.45rem 0.8rem', borderRadius: 999, fontSize: '0.8rem', fontFamily: 'inherit', cursor: 'pointer',
                    border: `1.5px solid ${on ? 'var(--cacao)' : 'var(--line)'}`, background: on ? 'rgba(230,126,34,0.08)' : 'white',
                    color: on ? 'var(--cacao)' : 'var(--indigo)', fontWeight: on ? 700 : 500, transition: 'all .15s', textAlign: 'left',
                  }}>{on ? '✓ ' : ''}{es}</button>
                )
              })}
            </div>
          </div>
        ))}
      </div>
      <div className="field">
        <label>Otras políticas <span style={{ fontWeight: 400, color: 'var(--muted)', textTransform: 'none', letterSpacing: 0 }}>(opcional, una por línea)</span></label>
        <textarea value={value.otras} onChange={e => onChange({ ...value, otras: e.target.value })} rows={2}
          placeholder={'Ej: Se ofrece traslado desde el aeropuerto con costo adicional'} />
      </div>
    </div>
  )
}
