'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'

const destinosOpciones = [
  { label: 'Los Roques', slug: 'los-roques', lat: 11.85, lng: -66.75 },
  { label: 'Mérida', slug: 'merida', lat: 8.6, lng: -71.15 },
  { label: 'Mochima', slug: 'mochima', lat: 10.35, lng: -64.35 },
  { label: 'Morrocoy', slug: 'morrocoy', lat: 10.87, lng: -68.22 },
  { label: 'Canaima', slug: 'canaima', lat: 6.23, lng: -62.85 },
  { label: 'Isla Margarita', slug: 'isla-margarita', lat: 10.97, lng: -63.91 },
  { label: 'Roraima', slug: 'roraima', lat: 5.14, lng: -60.76 },
  { label: 'Choroní', slug: 'choroni', lat: 10.49, lng: -67.62 },
  { label: 'Puerto Colombia', slug: 'puerto-colombia', lat: 10.53, lng: -67.65 },
  { label: 'Otro destino', slug: 'otro', lat: 8.0, lng: -66.0 },
]

const tiposOpciones = [
  'Posada de playa', 'Posada de montaña', 'Posada rural', 'Posada urbana', 'Posada de aventura', 'Eco-posada',
]

const tagsOpciones = [
  'Frente al mar', 'Vista a la montaña', 'Desayuno incluido', 'Pet friendly',
  'Piscina', 'Wi-Fi', 'Aire acondicionado', 'Estacionamiento', 'Chimenea',
  'Acceso privado a playa', 'Rodeado de naturaleza', 'Vistas panorámicas',
]

const serviciosOpciones = [
  'Wi-Fi', 'Desayuno incluido', 'Aire acondicionado', 'Estacionamiento',
  'Piscina', 'Bar', 'Agua caliente', 'Cocina equipada', 'Lavandería',
  'Traslados', 'Tours guiados', 'Snorkel / Buceo', 'Kayak', 'Chimenea',
]

const metodosOpciones = [
  'Zelle', 'Transferencia bancaria', 'Efectivo USD', 'Efectivo Bs', 'Tarjeta de crédito',
]

type Posada = {
  id: number
  slug: string
  nombre: string
  destino: string
  tipo: string
  descripcion: string
  precio: number
  habitaciones: number
  capacidad: number
  tags: unknown
  servicios: unknown
  metodoPago: unknown
  imgs: unknown
  lat: number | null
  lng: number | null
  status: string
  reviewNotes: string | null
}

function toggle(list: string[], item: string) {
  return list.includes(item) ? list.filter(x => x !== item) : [...list, item]
}

export default function EditarPosadaForm({ posada }: { posada: Posada }) {
  const router = useRouter()

  const initDestinoIdx = destinosOpciones.findIndex(d => d.label === posada.destino)

  const [nombre, setNombre] = useState(posada.nombre)
  const [destinoIdx, setDestinoIdx] = useState(initDestinoIdx >= 0 ? initDestinoIdx : 0)
  const [tipo, setTipo] = useState(posada.tipo ?? tiposOpciones[0])
  const [descripcion, setDescripcion] = useState(posada.descripcion ?? '')
  const [precio, setPrecio] = useState(String(posada.precio ?? ''))
  const [habitaciones, setHabitaciones] = useState(String(posada.habitaciones ?? 4))
  const [capacidad, setCapacidad] = useState(String(posada.capacidad ?? 8))
  const [tags, setTags] = useState<string[]>((posada.tags as string[]) ?? [])
  const [servicios, setServicios] = useState<string[]>((posada.servicios as string[]) ?? [])
  const [metodosPago, setMetodosPago] = useState<string[]>((posada.metodoPago as string[]) ?? [])
  const [imgs, setImgs] = useState<string[]>((posada.imgs as string[]) ?? [])
  const [latOverride, setLatOverride] = useState(posada.lat ? String(posada.lat) : '')
  const [lngOverride, setLngOverride] = useState(posada.lng ? String(posada.lng) : '')

  const [saving, setSaving] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [uploadingImg, setUploadingImg] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const destino = destinosOpciones[destinoIdx]
  const lat = latOverride ? parseFloat(latOverride) : destino.lat
  const lng = lngOverride ? parseFloat(lngOverride) : destino.lng

  async function handleImageUpload(files: FileList | null) {
    if (!files || files.length === 0) return
    setUploadingImg(true)
    setError('')
    const uploaded: string[] = []
    for (const file of Array.from(files)) {
      const fd = new FormData()
      fd.append('file', file)
      try {
        const res = await fetch('/api/upload', { method: 'POST', body: fd })
        const data = await res.json()
        if (res.ok && data.url) {
          uploaded.push(data.url)
        } else {
          setError(`Error al subir ${file.name}: ${data.error ?? 'Error desconocido'}`)
        }
      } catch {
        setError(`Error de conexión al subir ${file.name}`)
      }
    }
    setImgs(prev => [...prev, ...uploaded])
    setUploadingImg(false)
  }

  function buildBody() {
    return {
      nombre,
      destino: destino.label,
      destinoSlug: destino.slug,
      tipo,
      descripcion,
      precio: parseInt(precio),
      habitaciones: parseInt(habitaciones),
      capacidad: parseInt(capacidad),
      tags,
      servicios,
      metodoPago: metodosPago,
      imgs,
      lat,
      lng,
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!nombre || !descripcion || !precio) { setError('Completa todos los campos obligatorios'); return }
    setSaving(true)
    setError('')
    const res = await fetch(`/api/posadas/${posada.slug}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(buildBody()),
    })
    setSaving(false)
    if (!res.ok) { setError((await res.json()).error ?? 'Error al guardar'); return }
    router.push('/dashboard/posadas')
  }

  async function handleSaveAndSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!nombre || !descripcion || !precio) { setError('Completa todos los campos obligatorios'); return }
    setSubmitting(true)
    setError('')
    // First save fields
    const r1 = await fetch(`/api/posadas/${posada.slug}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(buildBody()),
    })
    if (!r1.ok) { setError((await r1.json()).error ?? 'Error al guardar'); setSubmitting(false); return }
    // Then resubmit
    const r2 = await fetch(`/api/posadas/${posada.slug}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'resubmit' }),
    })
    setSubmitting(false)
    if (!r2.ok) { setError((await r2.json()).error ?? 'Error al enviar a revisión'); return }
    router.push('/dashboard/posadas')
  }

  return (
    <>
      <style>{`
        :root{--indigo:#1A2B4C;--cacao:#E67E22;--cacao-dark:#C96510;--sand:#FDFBF7;--muted:#7A8699;--line:rgba(26,43,76,0.08);}
        *,*::before,*::after{box-sizing:border-box;}
        body{font-family:'Inter',sans-serif;background:var(--sand);color:var(--indigo);margin:0;}
        .form-nav{background:white;border-bottom:1.5px solid var(--line);padding:0 2rem;height:64px;display:flex;align-items:center;justify-content:space-between;}
        .form-nav-logo{font-size:1.3rem;font-weight:800;letter-spacing:-0.04em;color:var(--indigo);text-decoration:none;}
        .form-nav-logo span{color:var(--cacao);}
        .form-wrap{max-width:720px;margin:0 auto;padding:2.5rem 1.5rem;}
        .form-title{font-family:'Playfair Display',Georgia,serif;font-size:1.8rem;font-weight:700;margin-bottom:0.4rem;}
        .form-sub{font-size:0.9rem;color:var(--muted);margin-bottom:0.5rem;}
        .rejection-banner{background:rgba(239,68,68,0.06);border:1.5px solid rgba(239,68,68,0.18);border-radius:13px;padding:1rem 1.25rem;margin-bottom:1.8rem;}
        .rejection-banner-title{font-size:0.72rem;font-weight:700;text-transform:uppercase;letter-spacing:0.07em;color:#ef4444;margin-bottom:0.4rem;}
        .rejection-banner-notes{font-size:0.88rem;color:var(--indigo);line-height:1.6;}
        .form-section{background:white;border:1.5px solid var(--line);border-radius:17px;padding:1.8rem;margin-bottom:1.5rem;box-shadow:0 4px 16px rgba(26,43,76,0.05);}
        .section-head{font-size:0.95rem;font-weight:700;color:var(--indigo);margin-bottom:1.2rem;padding-bottom:0.8rem;border-bottom:1px solid var(--line);}
        .field{margin-bottom:1.1rem;}
        .field label{display:block;font-size:0.75rem;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:var(--muted);margin-bottom:0.4rem;}
        .field input,.field textarea,.field select{width:100%;padding:0.82rem 1rem;border:1.5px solid var(--line);border-radius:12px;font-size:0.9rem;font-family:inherit;color:var(--indigo);background:white;transition:border-color 0.2s;outline:none;resize:vertical;}
        .field input:focus,.field textarea:focus,.field select:focus{border-color:var(--cacao);}
        .field-row{display:grid;grid-template-columns:1fr 1fr;gap:1rem;}
        .checkbox-grid{display:flex;flex-wrap:wrap;gap:0.5rem;}
        .cb-item{display:flex;align-items:center;gap:0.4rem;padding:0.4rem 0.75rem;border:1.5px solid var(--line);border-radius:8px;cursor:pointer;font-size:0.82rem;font-weight:500;transition:all 0.15s;user-select:none;}
        .cb-item:hover{border-color:rgba(230,126,34,0.4);}
        .cb-item.checked{border-color:var(--cacao);background:rgba(230,126,34,0.07);color:var(--cacao);}
        .img-drop{border:2px dashed var(--line);border-radius:14px;padding:2rem;text-align:center;cursor:pointer;transition:all 0.2s;position:relative;}
        .img-drop:hover{border-color:rgba(230,126,34,0.4);background:rgba(230,126,34,0.02);}
        .img-drop input{position:absolute;inset:0;opacity:0;cursor:pointer;}
        .img-previews{display:flex;flex-wrap:wrap;gap:0.6rem;margin-top:1rem;}
        .img-preview-wrap{position:relative;width:80px;height:80px;}
        .img-preview{width:80px;height:80px;border-radius:10px;object-fit:cover;border:1.5px solid var(--line);}
        .img-remove{position:absolute;top:-6px;right:-6px;width:20px;height:20px;border-radius:50%;background:#ef4444;color:white;border:none;cursor:pointer;font-size:0.65rem;font-weight:700;display:flex;align-items:center;justify-content:center;line-height:1;}
        .form-error{background:rgba(220,38,38,0.07);border:1px solid rgba(220,38,38,0.2);border-radius:10px;padding:0.7rem 1rem;font-size:0.84rem;color:#dc2626;margin-bottom:1rem;text-align:center;}
        .actions-bar{display:flex;gap:0.8rem;align-items:center;flex-wrap:wrap;margin-top:0.5rem;}
        .btn-submit{padding:0.9rem 2rem;border-radius:12px;background:var(--cacao);color:white;border:none;font-size:0.9rem;font-weight:700;font-family:inherit;cursor:pointer;transition:all 0.2s;}
        .btn-submit:hover:not(:disabled){background:var(--cacao-dark);transform:translateY(-1px);}
        .btn-submit:disabled{opacity:0.6;cursor:not-allowed;}
        .btn-save{padding:0.9rem 2rem;border-radius:12px;background:white;color:var(--indigo);border:1.5px solid var(--line);font-size:0.9rem;font-weight:700;font-family:inherit;cursor:pointer;transition:all 0.2s;}
        .btn-save:hover:not(:disabled){border-color:rgba(26,43,76,0.3);}
        .btn-save:disabled{opacity:0.6;cursor:not-allowed;}
        .hint{font-size:0.75rem;color:var(--muted);margin-top:0.3rem;}
      `}</style>

      <nav className="form-nav">
        <a href="/dashboard" className="form-nav-logo">RESER<span>-VE</span></a>
        <a href="/dashboard/posadas" style={{ fontSize: '0.85rem', color: 'var(--muted)', textDecoration: 'none' }}>← Mis posadas</a>
      </nav>

      <div className="form-wrap">
        <div className="form-title">Editar posada</div>
        <div className="form-sub" style={{ marginBottom: '1.2rem' }}>Modifica los datos y envíala a revisión cuando esté lista</div>

        {posada.status === 'rejected' && posada.reviewNotes && (
          <div className="rejection-banner">
            <div className="rejection-banner-title">✕ Motivo del rechazo</div>
            <div className="rejection-banner-notes">{posada.reviewNotes}</div>
          </div>
        )}

        {error && <div className="form-error">{error}</div>}

        <form>
          {/* Basic info */}
          <div className="form-section">
            <div className="section-head">Información básica</div>
            <div className="field">
              <label>Nombre de la posada *</label>
              <input type="text" value={nombre} onChange={e => setNombre(e.target.value)} required placeholder="Ej: Posada La Brisa del Mar" />
            </div>
            <div className="field-row">
              <div className="field">
                <label>Destino *</label>
                <select value={destinoIdx} onChange={e => setDestinoIdx(parseInt(e.target.value))}>
                  {destinosOpciones.map((d, i) => (
                    <option key={d.slug} value={i}>{d.label}</option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>Tipo de posada *</label>
                <select value={tipo} onChange={e => setTipo(e.target.value)}>
                  {tiposOpciones.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <div className="field">
              <label>Descripción *</label>
              <textarea value={descripcion} onChange={e => setDescripcion(e.target.value)} required placeholder="Describe tu posada…" rows={4} />
            </div>
          </div>

          {/* Pricing & capacity */}
          <div className="form-section">
            <div className="section-head">Precio y capacidad</div>
            <div className="field-row">
              <div className="field">
                <label>Precio por noche (USD) *</label>
                <input type="number" value={precio} onChange={e => setPrecio(e.target.value)} required min="1" placeholder="80" />
              </div>
              <div className="field">
                <label>Habitaciones</label>
                <input type="number" value={habitaciones} onChange={e => setHabitaciones(e.target.value)} min="1" />
              </div>
            </div>
            <div className="field" style={{ maxWidth: '240px' }}>
              <label>Capacidad máxima (personas)</label>
              <input type="number" value={capacidad} onChange={e => setCapacidad(e.target.value)} min="1" />
            </div>
          </div>

          {/* Tags */}
          <div className="form-section">
            <div className="section-head">Características destacadas</div>
            <div className="checkbox-grid">
              {tagsOpciones.map(t => (
                <div key={t} className={`cb-item${tags.includes(t) ? ' checked' : ''}`} onClick={() => setTags(toggle(tags, t))}>
                  {tags.includes(t) && '✓ '}{t}
                </div>
              ))}
            </div>
          </div>

          {/* Servicios */}
          <div className="form-section">
            <div className="section-head">Servicios incluidos</div>
            <div className="checkbox-grid">
              {serviciosOpciones.map(s => (
                <div key={s} className={`cb-item${servicios.includes(s) ? ' checked' : ''}`} onClick={() => setServicios(toggle(servicios, s))}>
                  {servicios.includes(s) && '✓ '}{s}
                </div>
              ))}
            </div>
          </div>

          {/* Métodos de pago */}
          <div className="form-section">
            <div className="section-head">Métodos de pago aceptados</div>
            <div className="checkbox-grid">
              {metodosOpciones.map(m => (
                <div key={m} className={`cb-item${metodosPago.includes(m) ? ' checked' : ''}`} onClick={() => setMetodosPago(toggle(metodosPago, m))}>
                  {metodosPago.includes(m) && '✓ '}{m}
                </div>
              ))}
            </div>
          </div>

          {/* Photos */}
          <div className="form-section">
            <div className="section-head">Fotos de la posada</div>
            <div className="img-drop" onClick={() => fileRef.current?.click()}>
              <input ref={fileRef} type="file" accept="image/*" multiple onChange={e => handleImageUpload(e.target.files)} />
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: 'var(--muted)', marginBottom: '0.5rem' }}>
                <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
              </svg>
              <div style={{ fontSize: '0.88rem', color: 'var(--muted)' }}>
                {uploadingImg ? 'Subiendo fotos…' : 'Haz clic o arrastra fotos aquí'}
              </div>
              <div className="hint">JPG, PNG, WebP — máx. 10 MB por foto</div>
            </div>
            {imgs.length > 0 && (
              <div className="img-previews">
                {imgs.map((url, i) => (
                  <div key={i} className="img-preview-wrap">
                    <img src={url} alt={`Foto ${i + 1}`} className="img-preview" />
                    <button
                      type="button"
                      className="img-remove"
                      onClick={() => setImgs(imgs.filter((_, idx) => idx !== i))}
                      title="Eliminar foto"
                    >✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Coordinates */}
          <div className="form-section">
            <div className="section-head">Coordenadas (opcional)</div>
            <div className="hint" style={{ marginBottom: '0.8rem' }}>Se pre-rellenan del destino. Ajusta solo si tu posada está en una ubicación exacta diferente.</div>
            <div className="field-row">
              <div className="field">
                <label>Latitud</label>
                <input type="number" step="0.0001" value={latOverride || destino.lat} onChange={e => setLatOverride(e.target.value)} />
              </div>
              <div className="field">
                <label>Longitud</label>
                <input type="number" step="0.0001" value={lngOverride || destino.lng} onChange={e => setLngOverride(e.target.value)} />
              </div>
            </div>
          </div>

          <div className="actions-bar">
            <button type="button" className="btn-submit" disabled={submitting || saving || uploadingImg} onClick={handleSaveAndSubmit}>
              {submitting ? 'Enviando a revisión…' : '↩ Guardar y enviar a revisión'}
            </button>
            <button type="button" className="btn-save" disabled={saving || submitting || uploadingImg} onClick={handleSave}>
              {saving ? 'Guardando…' : 'Guardar borrador'}
            </button>
            <a href="/dashboard/posadas" style={{ fontSize: '0.86rem', color: 'var(--muted)', textDecoration: 'none' }}>Cancelar</a>
          </div>
        </form>
      </div>
    </>
  )
}
