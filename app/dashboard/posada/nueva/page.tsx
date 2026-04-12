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

export default function NuevaPosadaPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [uploadingImg, setUploadingImg] = useState(false)

  // Form state
  const [nombre, setNombre] = useState('')
  const [destinoIdx, setDestinoIdx] = useState(0)
  const [tipo, setTipo] = useState(tiposOpciones[0])
  const [descripcion, setDescripcion] = useState('')
  const [precio, setPrecio] = useState('')
  const [habitaciones, setHabitaciones] = useState('4')
  const [capacidad, setCapacidad] = useState('8')
  const [tags, setTags] = useState<string[]>([])
  const [servicios, setServicios] = useState<string[]>([])
  const [metodosPago, setMetodosPago] = useState<string[]>([])
  const [imgs, setImgs] = useState<string[]>([])
  const [latOverride, setLatOverride] = useState('')
  const [lngOverride, setLngOverride] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const destino = destinosOpciones[destinoIdx]
  const lat = latOverride ? parseFloat(latOverride) : destino.lat
  const lng = lngOverride ? parseFloat(lngOverride) : destino.lng

  function toggleItem(list: string[], setList: (v: string[]) => void, item: string) {
    setList(list.includes(item) ? list.filter(x => x !== item) : [...list, item])
  }

  async function handleImageUpload(files: FileList | null) {
    if (!files || files.length === 0) return
    setUploadingImg(true)
    const uploaded: string[] = []
    for (const file of Array.from(files)) {
      const fd = new FormData()
      fd.append('file', file)
      try {
        const res = await fetch('/api/upload', { method: 'POST', body: fd })
        if (res.ok) {
          const { url } = await res.json()
          uploaded.push(url)
        }
      } catch {
        // skip failed uploads
      }
    }
    setImgs(prev => [...prev, ...uploaded])
    setUploadingImg(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!nombre || !descripcion || !precio) {
      setError('Completa todos los campos obligatorios')
      return
    }
    setLoading(true)
    setError('')

    const body = {
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
      politicas: [],
      imgs,
      lat,
      lng,
      metodoPago: metodosPago,
    }

    const res = await fetch('/api/posadas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    setLoading(false)
    if (!res.ok) {
      const data = await res.json()
      setError(data.error || 'Error al crear la posada')
      return
    }

    router.push('/dashboard')
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
        .form-sub{font-size:0.9rem;color:var(--muted);margin-bottom:2rem;}
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
        .img-preview{width:80px;height:80px;border-radius:10px;object-fit:cover;border:1.5px solid var(--line);}
        .form-error{background:rgba(220,38,38,0.07);border:1px solid rgba(220,38,38,0.2);border-radius:10px;padding:0.7rem 1rem;font-size:0.84rem;color:#dc2626;margin-bottom:1rem;text-align:center;}
        .btn-submit{padding:0.95rem 2.5rem;border-radius:12px;background:var(--cacao);color:white;border:none;font-size:0.93rem;font-weight:700;font-family:inherit;cursor:pointer;transition:all 0.2s;}
        .btn-submit:hover:not(:disabled){background:var(--cacao-dark);transform:translateY(-1px);}
        .btn-submit:disabled{opacity:0.6;cursor:not-allowed;}
        .hint{font-size:0.75rem;color:var(--muted);margin-top:0.3rem;}
      `}</style>

      <nav className="form-nav">
        <a href="/dashboard" className="form-nav-logo">RESER<span>-VE</span></a>
        <a href="/dashboard" style={{fontSize:'0.85rem',color:'var(--muted)',textDecoration:'none'}}>← Volver al dashboard</a>
      </nav>

      <div className="form-wrap">
        <div className="form-title">Publicar nueva posada</div>
        <div className="form-sub">Completa la información para que los viajeros encuentren tu posada</div>

        {error && <div className="form-error">{error}</div>}

        <form onSubmit={handleSubmit}>
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
              <textarea value={descripcion} onChange={e => setDescripcion(e.target.value)} required placeholder="Describe tu posada: qué la hace especial, qué pueden esperar los huéspedes…" rows={4} />
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
            <div className="field" style={{maxWidth:'240px'}}>
              <label>Capacidad máxima (personas)</label>
              <input type="number" value={capacidad} onChange={e => setCapacidad(e.target.value)} min="1" />
            </div>
          </div>

          {/* Tags */}
          <div className="form-section">
            <div className="section-head">Características destacadas</div>
            <div className="checkbox-grid">
              {tagsOpciones.map(t => (
                <div key={t} className={`cb-item${tags.includes(t) ? ' checked' : ''}`} onClick={() => toggleItem(tags, setTags, t)}>
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
                <div key={s} className={`cb-item${servicios.includes(s) ? ' checked' : ''}`} onClick={() => toggleItem(servicios, setServicios, s)}>
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
                <div key={m} className={`cb-item${metodosPago.includes(m) ? ' checked' : ''}`} onClick={() => toggleItem(metodosPago, setMetodosPago, m)}>
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
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{color:'var(--muted)',marginBottom:'0.5rem'}}><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
              <div style={{fontSize:'0.88rem',color:'var(--muted)'}}>
                {uploadingImg ? 'Subiendo fotos…' : 'Haz clic o arrastra fotos aquí'}
              </div>
              <div className="hint">JPG, PNG, WebP — máx. 10 fotos recomendado</div>
            </div>
            {imgs.length > 0 && (
              <div className="img-previews">
                {imgs.map((url, i) => (
                  <img key={i} src={url} alt={`Foto ${i + 1}`} className="img-preview" />
                ))}
              </div>
            )}
          </div>

          {/* Coordinates override */}
          <div className="form-section">
            <div className="section-head">Coordenadas (opcional)</div>
            <div className="hint" style={{marginBottom:'0.8rem'}}>Se pre-rellenan del destino. Ajusta solo si tu posada está en una ubicación exacta diferente.</div>
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

          <div style={{display:'flex',gap:'1rem',alignItems:'center'}}>
            <button type="submit" className="btn-submit" disabled={loading || uploadingImg}>
              {loading ? 'Publicando…' : 'Publicar posada'}
            </button>
            <a href="/dashboard" style={{fontSize:'0.86rem',color:'var(--muted)',textDecoration:'none'}}>Cancelar</a>
          </div>
        </form>
      </div>
    </>
  )
}
