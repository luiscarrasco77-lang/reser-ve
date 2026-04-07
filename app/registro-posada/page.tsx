'use client'

import { useState } from 'react'
import Link from 'next/link'

const serviciosOpciones = [
  'Wi-Fi', 'Desayuno incluido', 'Aire acondicionado', 'Estacionamiento',
  'Piscina', 'Bar', 'Agua caliente', 'Cocina equipada', 'Lavandería',
  'Traslados', 'Tours guiados', 'Snorkel / Buceo', 'Kayak', 'Chimenea',
]

const destinosOpciones = [
  'Los Roques', 'Mérida', 'Mochima', 'Morrocoy', 'Canaima',
  'Isla Margarita', 'Roraima', 'Choroní', 'Puerto Colombia', 'Otro destino',
]

type Paso = 1 | 2 | 3 | 4 | 'listo'

export default function RegistroPosada() {
  const [paso, setPaso] = useState<Paso>(1)

  // Paso 1
  const [nombrePosada, setNombrePosada] = useState('')
  const [destino, setDestino] = useState('')
  const [tipo, setTipo] = useState('')
  const [descripcion, setDescripcion] = useState('')

  // Paso 2
  const [habitaciones, setHabitaciones] = useState('4')
  const [precio, setPrecio] = useState('')
  const [servicios, setServicios] = useState<string[]>([])
  const [capacidad, setCapacidad] = useState('8')

  // Paso 3
  const [nombrePosadero, setNombrePosadero] = useState('')
  const [emailPosadero, setEmailPosadero] = useState('')
  const [telefonoPosadero, setTelefonoPosadero] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [metodoCobro, setMetodoCobro] = useState<string[]>([])

  const toggleServicio = (s: string) =>
    setServicios(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])

  const toggleMetodo = (m: string) =>
    setMetodoCobro(prev => prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m])

  const progreso = paso === 'listo' ? 100 : ((paso as number) - 1) * 33.3

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
        :root{--indigo:#1A2B4C;--sand:#FDFBF7;--cacao:#E67E22;--cacao-dark:#C96510;--text:#23324A;--muted:#6B7482;--line:rgba(26,43,76,0.10);--shadow:0 8px 30px rgba(26,43,76,0.08);}
        *{margin:0;padding:0;box-sizing:border-box;}
        body{font-family:'Inter',sans-serif;background:radial-gradient(circle at top left,rgba(230,126,34,0.06) 0%,transparent 30%),linear-gradient(180deg,#fffefb 0%,var(--sand) 100%);color:var(--text);min-height:100vh;}
        .grain{position:fixed;inset:0;pointer-events:none;z-index:100;opacity:0.018;background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");}
        .nav{position:sticky;top:0;z-index:60;display:flex;align-items:center;justify-content:space-between;padding:1rem 2rem;background:rgba(253,251,247,0.92);backdrop-filter:blur(18px);border-bottom:1px solid var(--line);box-shadow:0 4px 20px rgba(26,43,76,0.05);}
        .logo{font-size:1.6rem;font-weight:800;letter-spacing:-0.04em;color:var(--indigo);text-decoration:none;}
        .logo span{color:var(--cacao);}
        .nav-back{font-size:0.85rem;color:var(--muted);text-decoration:none;font-weight:500;transition:color 0.2s;}
        .nav-back:hover{color:var(--indigo);}

        .page{max-width:680px;margin:0 auto;padding:3rem 1.5rem 6rem;}

        /* PROGRESS */
        .progress-wrap{margin-bottom:2.5rem;}
        .progress-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:0.6rem;}
        .progress-label{font-size:0.8rem;font-weight:600;color:var(--indigo);}
        .progress-step{font-size:0.75rem;color:var(--muted);}
        .progress-bar{height:5px;background:rgba(26,43,76,0.08);border-radius:999px;overflow:hidden;}
        .progress-fill{height:100%;background:linear-gradient(90deg,var(--cacao),#f0a050);border-radius:999px;transition:width 0.5s cubic-bezier(0.16,1,0.3,1);}
        .steps-row{display:flex;gap:0.5rem;margin-top:0.75rem;}
        .step-dot{flex:1;height:3px;border-radius:999px;transition:background 0.4s;}
        .step-dot.done{background:var(--cacao);}
        .step-dot.active{background:rgba(230,126,34,0.4);}
        .step-dot.pending{background:rgba(26,43,76,0.08);}

        /* CARD */
        .card{background:white;border:1px solid var(--line);border-radius:24px;padding:2rem;box-shadow:var(--shadow);}
        .card-icon{width:44px;height:44px;border-radius:14px;background:linear-gradient(135deg,rgba(230,126,34,0.12),rgba(230,126,34,0.04));border:1px solid rgba(230,126,34,0.15);display:flex;align-items:center;justify-content:center;font-size:1.2rem;margin-bottom:1rem;}
        .card-title{font-size:1.35rem;font-weight:800;letter-spacing:-0.04em;color:var(--indigo);margin-bottom:0.3rem;}
        .card-sub{font-size:0.88rem;color:var(--muted);margin-bottom:1.75rem;line-height:1.6;}

        /* FORM */
        .form-group{margin-bottom:1.1rem;}
        .form-label{display:block;font-size:0.75rem;font-weight:600;color:var(--indigo);margin-bottom:0.4rem;}
        .form-label span{color:var(--muted);font-weight:400;}
        .form-input{width:100%;padding:0.85rem 1rem;border:1.5px solid var(--line);border-radius:12px;font-family:'Inter',sans-serif;font-size:0.9rem;color:var(--text);background:white;outline:none;transition:border-color 0.22s;}
        .form-input:focus{border-color:var(--cacao);}
        .form-input::placeholder{color:rgba(26,43,76,0.25);}
        .form-textarea{width:100%;padding:0.85rem 1rem;border:1.5px solid var(--line);border-radius:12px;font-family:'Inter',sans-serif;font-size:0.9rem;color:var(--text);background:white;outline:none;resize:vertical;min-height:110px;transition:border-color 0.22s;}
        .form-textarea:focus{border-color:var(--cacao);}
        .form-textarea::placeholder{color:rgba(26,43,76,0.25);}
        .form-select{width:100%;padding:0.85rem 1rem;border:1.5px solid var(--line);border-radius:12px;font-family:'Inter',sans-serif;font-size:0.9rem;color:var(--text);background:white;outline:none;appearance:none;cursor:pointer;transition:border-color 0.22s;}
        .form-select:focus{border-color:var(--cacao);}
        .form-row{display:grid;grid-template-columns:1fr 1fr;gap:1rem;}
        @media(max-width:500px){.form-row{grid-template-columns:1fr;}}

        /* CHIPS */
        .chips{display:flex;flex-wrap:wrap;gap:0.5rem;margin-top:0.4rem;}
        .chip{padding:0.45rem 0.85rem;border-radius:999px;font-size:0.78rem;font-weight:500;border:1.5px solid var(--line);background:white;color:var(--muted);cursor:pointer;transition:all 0.2s;font-family:'Inter',sans-serif;}
        .chip:hover{border-color:rgba(230,126,34,0.3);color:var(--text);}
        .chip.active{border-color:var(--cacao);background:rgba(230,126,34,0.07);color:var(--cacao);}

        /* TIPO POSADA */
        .tipo-grid{display:grid;grid-template-columns:1fr 1fr;gap:0.65rem;margin-top:0.4rem;}
        .tipo-btn{padding:0.9rem;border:1.5px solid var(--line);border-radius:14px;background:white;cursor:pointer;transition:all 0.22s;text-align:left;font-family:'Inter',sans-serif;}
        .tipo-btn:hover{border-color:rgba(230,126,34,0.3);}
        .tipo-btn.active{border-color:var(--cacao);background:rgba(230,126,34,0.05);}
        .tipo-name{font-size:0.88rem;font-weight:700;color:var(--indigo);margin-bottom:0.15rem;}
        .tipo-btn.active .tipo-name{color:var(--cacao);}
        .tipo-desc{font-size:0.72rem;color:var(--muted);}

        /* COUNTER */
        .counter{display:flex;align-items:center;gap:0.75rem;}
        .counter-btn{width:34px;height:34px;border-radius:50%;border:1.5px solid var(--line);background:white;font-size:1.1rem;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;color:var(--indigo);transition:all 0.2s;font-family:'Inter',sans-serif;}
        .counter-btn:hover{border-color:var(--cacao);color:var(--cacao);}
        .counter-val{font-size:1.1rem;font-weight:800;color:var(--indigo);min-width:2rem;text-align:center;}

        /* BUTTONS */
        .btn-primary{width:100%;padding:1rem;background:var(--cacao);color:white;font-size:0.92rem;font-weight:700;border:none;border-radius:999px;cursor:pointer;font-family:'Inter',sans-serif;box-shadow:0 12px 28px rgba(230,126,34,0.26);transition:all 0.22s;margin-top:0.5rem;}
        .btn-primary:hover{background:var(--cacao-dark);transform:translateY(-1px);}
        .btn-primary:disabled{opacity:0.35;cursor:not-allowed;transform:none;}
        .btn-back{width:100%;padding:0.9rem;background:transparent;color:var(--muted);font-size:0.88rem;font-weight:600;border:none;cursor:pointer;font-family:'Inter',sans-serif;transition:color 0.2s;margin-top:0.35rem;}
        .btn-back:hover{color:var(--indigo);}

        /* RESUMEN */
        .resumen-item{display:flex;justify-content:space-between;align-items:flex-start;padding:0.7rem 0;border-bottom:1px solid var(--line);font-size:0.88rem;}
        .resumen-item:last-child{border-bottom:none;}
        .resumen-key{color:var(--muted);font-weight:500;flex-shrink:0;margin-right:1rem;}
        .resumen-val{color:var(--indigo);font-weight:600;text-align:right;}

        /* LISTO */
        .listo-icon{width:80px;height:80px;border-radius:50%;background:linear-gradient(135deg,rgba(230,126,34,0.15),rgba(230,126,34,0.04));border:2px solid rgba(230,126,34,0.2);display:flex;align-items:center;justify-content:center;font-size:2rem;margin:0 auto 1.5rem;}
        .listo-title{font-size:1.8rem;font-weight:800;letter-spacing:-0.05em;color:var(--indigo);text-align:center;margin-bottom:0.5rem;}
        .listo-sub{font-size:0.92rem;color:var(--muted);text-align:center;line-height:1.7;margin-bottom:2rem;}
        .listo-btns{display:flex;flex-direction:column;gap:0.65rem;}
        .info-box{background:rgba(230,126,34,0.05);border:1px solid rgba(230,126,34,0.15);border-radius:14px;padding:1.1rem 1.25rem;margin-bottom:1.25rem;}
        .info-box p{font-size:0.85rem;color:var(--text);line-height:1.7;}
        .info-box strong{color:var(--cacao);}
      `}</style>

      <div className="grain" />

      <nav className="nav">
        <Link href="/" className="logo">RESER<span>-VE</span></Link>
        <Link href="/" className="nav-back">← Volver al inicio</Link>
      </nav>

      <div className="page">
        {paso !== 'listo' && (
          <div className="progress-wrap">
            <div className="progress-header">
              <span className="progress-label">
                {paso === 1 && 'Tu posada'}
                {paso === 2 && 'Detalles y servicios'}
                {paso === 3 && 'Tu información'}
                {paso === 4 && 'Revisión final'}
              </span>
              <span className="progress-step">Paso {paso} de 4</span>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{width: `${(paso as number) * 25}%`}} />
            </div>
            <div className="steps-row">
              {[1,2,3,4].map(n => (
                <div key={n} className={`step-dot ${n < (paso as number) ? 'done' : n === (paso as number) ? 'active' : 'pending'}`} />
              ))}
            </div>
          </div>
        )}

        {/* PASO 1 */}
        {paso === 1 && (
          <div className="card">
            <div className="card-icon">🏠</div>
            <div className="card-title">Cuéntanos sobre tu posada</div>
            <div className="card-sub">La información básica para crear tu perfil en RESER-VE.</div>

            <div className="form-group">
              <label className="form-label">Nombre de la posada</label>
              <input className="form-input" placeholder="Ej: Posada Los Flamboyanes" value={nombrePosada} onChange={e => setNombrePosada(e.target.value)} />
            </div>

            <div className="form-group">
              <label className="form-label">Destino / Ubicación</label>
              <select className="form-select" value={destino} onChange={e => setDestino(e.target.value)}>
                <option value="">Selecciona el destino</option>
                {destinosOpciones.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Tipo de alojamiento</label>
              <div className="tipo-grid">
                {[
                  {val:'Posada boutique', desc:'Experiencia cuidada y personalizada'},
                  {val:'Posada de playa', desc:'Frente al mar o acceso directo'},
                  {val:'Posada de montaña', desc:'Entorno natural y clima fresco'},
                  {val:'Lodge / Eco-posada', desc:'Naturaleza y aventura'},
                ].map(t => (
                  <button key={t.val} type="button" className={`tipo-btn ${tipo === t.val ? 'active' : ''}`} onClick={() => setTipo(t.val)}>
                    <div className="tipo-name">{t.val}</div>
                    <div className="tipo-desc">{t.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Descripción breve <span>(mínimo 80 caracteres)</span></label>
              <textarea className="form-textarea" placeholder="Describe qué hace especial a tu posada: ubicación, ambiente, lo que la diferencia…" value={descripcion} onChange={e => setDescripcion(e.target.value)} />
              <div style={{fontSize:'0.72rem',color: descripcion.length >= 80 ? 'var(--cacao)' : 'var(--muted)',marginTop:'0.3rem'}}>
                {descripcion.length} / 80 caracteres mínimos
              </div>
            </div>

            <button className="btn-primary" disabled={!nombrePosada || !destino || !tipo || descripcion.length < 80} onClick={() => setPaso(2)}>
              Continuar →
            </button>
          </div>
        )}

        {/* PASO 2 */}
        {paso === 2 && (
          <div className="card">
            <div className="card-icon">⚙️</div>
            <div className="card-title">Detalles y servicios</div>
            <div className="card-sub">Configura la capacidad, precio y los servicios que ofreces.</div>

            <div className="form-row" style={{marginBottom:'1.1rem'}}>
              <div className="form-group" style={{marginBottom:0}}>
                <label className="form-label">Habitaciones</label>
                <div className="counter">
                  <button type="button" className="counter-btn" onClick={() => setHabitaciones(String(Math.max(1, +habitaciones - 1)))}>−</button>
                  <div className="counter-val">{habitaciones}</div>
                  <button type="button" className="counter-btn" onClick={() => setHabitaciones(String(Math.min(50, +habitaciones + 1)))}>+</button>
                </div>
              </div>
              <div className="form-group" style={{marginBottom:0}}>
                <label className="form-label">Capacidad total (personas)</label>
                <div className="counter">
                  <button type="button" className="counter-btn" onClick={() => setCapacidad(String(Math.max(1, +capacidad - 1)))}>−</button>
                  <div className="counter-val">{capacidad}</div>
                  <button type="button" className="counter-btn" onClick={() => setCapacidad(String(Math.min(100, +capacidad + 1)))}>+</button>
                </div>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Precio base por noche <span>(en USD)</span></label>
              <input className="form-input" type="number" min="10" placeholder="Ej: 85" value={precio} onChange={e => setPrecio(e.target.value)} />
            </div>

            <div className="form-group">
              <label className="form-label">Servicios que ofreces</label>
              <div className="chips">
                {serviciosOpciones.map(s => (
                  <button type="button" key={s} className={`chip ${servicios.includes(s) ? 'active' : ''}`} onClick={() => toggleServicio(s)}>
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <button className="btn-primary" disabled={!precio || +precio < 10} onClick={() => setPaso(3)}>
              Continuar →
            </button>
            <button className="btn-back" onClick={() => setPaso(1)}>← Atrás</button>
          </div>
        )}

        {/* PASO 3 */}
        {paso === 3 && (
          <div className="card">
            <div className="card-icon">👤</div>
            <div className="card-title">Tu información de contacto</div>
            <div className="card-sub">Así te contactaremos para verificar tu posada y activar tu perfil.</div>

            <div className="form-group">
              <label className="form-label">Tu nombre completo</label>
              <input className="form-input" placeholder="Nombre del posadero/a" value={nombrePosadero} onChange={e => setNombrePosadero(e.target.value)} />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Email</label>
                <input className="form-input" type="email" placeholder="tu@email.com" value={emailPosadero} onChange={e => setEmailPosadero(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Teléfono</label>
                <input className="form-input" type="tel" placeholder="+58 412 000 0000" value={telefonoPosadero} onChange={e => setTelefonoPosadero(e.target.value)} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">WhatsApp <span>(recomendado para recibir reservas)</span></label>
              <input className="form-input" type="tel" placeholder="+58 412 000 0000" value={whatsapp} onChange={e => setWhatsapp(e.target.value)} />
            </div>

            <div className="form-group">
              <label className="form-label">¿Cómo prefieres cobrar?</label>
              <div className="chips">
                {['Zelle', 'Zinli', 'Pago Móvil', 'Tarjeta', 'Transferencia', 'Binance', 'PayPal'].map(m => (
                  <button type="button" key={m} className={`chip ${metodoCobro.includes(m) ? 'active' : ''}`} onClick={() => toggleMetodo(m)}>
                    {m}
                  </button>
                ))}
              </div>
            </div>

            <button className="btn-primary" disabled={!nombrePosadero || !emailPosadero} onClick={() => setPaso(4)}>
              Revisar y enviar →
            </button>
            <button className="btn-back" onClick={() => setPaso(2)}>← Atrás</button>
          </div>
        )}

        {/* PASO 4 — REVISIÓN */}
        {paso === 4 && (
          <div className="card">
            <div className="card-icon">✅</div>
            <div className="card-title">Revisa tu solicitud</div>
            <div className="card-sub">Confirma que todo esté correcto antes de enviar.</div>

            <div style={{marginBottom:'1.5rem'}}>
              {[
                ['Posada', nombrePosada],
                ['Destino', destino],
                ['Tipo', tipo],
                ['Habitaciones', `${habitaciones} habitaciones · ${capacidad} personas`],
                ['Precio base', `$${precio} USD / noche`],
                ['Servicios', servicios.length > 0 ? servicios.join(', ') : 'Ninguno seleccionado'],
                ['Posadero/a', nombrePosadero],
                ['Email', emailPosadero],
                ['WhatsApp', whatsapp || telefonoPosadero || '—'],
                ['Métodos de cobro', metodoCobro.length > 0 ? metodoCobro.join(', ') : '—'],
              ].map(([k, v]) => (
                <div className="resumen-item" key={k}>
                  <span className="resumen-key">{k}</span>
                  <span className="resumen-val">{v}</span>
                </div>
              ))}
            </div>

            <div className="info-box">
              <p>Nuestro equipo revisará tu solicitud en <strong>48–72 horas</strong>. Te contactaremos por email y WhatsApp para coordinar la sesión fotográfica y la activación de tu perfil.</p>
            </div>

            <button className="btn-primary" onClick={() => setPaso('listo')}>
              Enviar solicitud de registro
            </button>
            <button className="btn-back" onClick={() => setPaso(3)}>← Editar información</button>
          </div>
        )}

        {/* LISTO */}
        {paso === 'listo' && (
          <div style={{textAlign:'center'}}>
            <div className="listo-icon">🎉</div>
            <div className="listo-title">¡Solicitud enviada!</div>
            <div className="listo-sub">
              Hola <strong>{nombrePosadero}</strong>, recibimos tu solicitud para registrar <strong>{nombrePosada}</strong>.<br />
              Te contactaremos en los próximos 2–3 días hábiles al correo <strong>{emailPosadero}</strong>.
            </div>

            <div style={{background:'white',border:'1px solid var(--line)',borderRadius:'20px',padding:'1.5rem',marginBottom:'2rem',boxShadow:'var(--shadow)',textAlign:'left'}}>
              <p style={{fontSize:'0.78rem',fontWeight:700,textTransform:'uppercase',letterSpacing:'0.1em',color:'var(--cacao)',marginBottom:'1rem'}}>Próximos pasos</p>
              {[
                ['📞', 'Llamada de verificación', 'Confirmaremos los datos de tu posada y resolveremos dudas.'],
                ['📸', 'Sesión fotográfica', 'Nuestro equipo coordinará la sesión para presentar tu espacio con calidad premium.'],
                ['🚀', 'Perfil activo', 'Tu posada aparecerá en RESER-VE y empezarás a recibir reservas.'],
              ].map(([icon, title, desc]) => (
                <div key={title as string} style={{display:'flex',gap:'0.75rem',alignItems:'flex-start',marginBottom:'1rem'}}>
                  <div style={{width:'36px',height:'36px',borderRadius:'10px',background:'rgba(230,126,34,0.08)',border:'1px solid rgba(230,126,34,0.15)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1rem',flexShrink:0}}>{icon}</div>
                  <div>
                    <div style={{fontSize:'0.88rem',fontWeight:700,color:'var(--indigo)',marginBottom:'0.15rem'}}>{title as string}</div>
                    <div style={{fontSize:'0.8rem',color:'var(--muted)',lineHeight:1.6}}>{desc as string}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="listo-btns">
              <Link href="/" style={{display:'block',padding:'1rem',background:'var(--cacao)',color:'white',fontWeight:700,borderRadius:'999px',textDecoration:'none',fontSize:'0.92rem',boxShadow:'0 12px 28px rgba(230,126,34,0.26)',transition:'all 0.22s'}}>
                Volver al inicio
              </Link>
              <Link href="/buscar" style={{display:'block',padding:'0.9rem',background:'white',border:'1px solid var(--line)',color:'var(--indigo)',fontWeight:600,borderRadius:'999px',textDecoration:'none',fontSize:'0.88rem'}}>
                Explorar otras posadas
              </Link>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
