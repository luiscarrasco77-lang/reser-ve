'use client'

import { POLICY_FIELDS, type PolicyState } from '@/lib/policies'

// Políticas de la posada con menús desplegables (se usa dentro de los formularios de
// nueva posada y editar posada, que ya traen los estilos .field / .field-row).
export default function PoliciesPicker({ value, onChange }: { value: PolicyState; onChange: (v: PolicyState) => void }) {
  const set = (key: string, v: string) => onChange({ ...value, values: { ...value.values, [key]: v } })
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
      <div className="field">
        <label>Otras políticas <span style={{ fontWeight: 400, color: 'var(--muted)', textTransform: 'none', letterSpacing: 0 }}>(opcional, una por línea)</span></label>
        <textarea value={value.otras} onChange={e => onChange({ ...value, otras: e.target.value })} rows={2}
          placeholder={'Ej: Se ofrece traslado desde el aeropuerto con costo adicional'} />
      </div>
    </div>
  )
}
