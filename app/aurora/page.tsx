'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import NavUser from '@/components/NavUser'
import RichText from '@/components/RichText'

type PosadaCard = {
  slug: string; nombre: string; destino: string; tipo: string
  precio: number; rating: number; reviews: number; img: string; tags: string[]; resumen: string
}

const EJEMPLOS = [
  '5 días entre playa y aventura en agosto, presupuesto $500',
  'Luna de miel romántica frente al mar, 4 noches',
  'Escapada familiar a la montaña con 2 niños',
  'Quiero ver el Salto Ángel y los tepuyes, 6 días',
]

export default function AuroraPage() {
  const [input, setInput] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)

  const { messages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({ api: '/api/aurora' }),
  })

  const busy = status === 'submitted' || status === 'streaming'
  const started = messages.length > 0

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, busy])

  function send(text: string) {
    const t = text.trim()
    if (!t || busy) return
    sendMessage({ text: t })
    setInput('')
  }

  return (
    <>
      <style>{`
        :root{--indigo:#1A2B4C;--cacao:#E67E22;--cacao-dark:#C96510;--sand:#FDFBF7;--muted:#7A8699;--line:rgba(26,43,76,0.08);}
        *,*::before,*::after{box-sizing:border-box;}
        body{margin:0;font-family:'Inter',system-ui,sans-serif;color:var(--indigo);background:
          radial-gradient(1200px 500px at 80% -10%, rgba(230,126,34,0.10), transparent 60%),
          radial-gradient(900px 500px at 0% 0%, rgba(26,43,76,0.06), transparent 55%),
          linear-gradient(180deg,#fffdf9,#FDFBF7);min-height:100vh;}
        .nav{display:flex;align-items:center;justify-content:space-between;padding:1rem 1.75rem;position:sticky;top:var(--pp-h,0px);z-index:50;background:rgba(253,251,247,0.8);backdrop-filter:blur(14px);border-bottom:1px solid var(--line);}
        .logo{font-size:1.3rem;font-weight:800;letter-spacing:-0.04em;color:var(--indigo);text-decoration:none;}
        .logo span{color:var(--cacao);}
        .wrap{max-width:760px;margin:0 auto;padding:1.5rem 1.25rem 8rem;}
        /* Hero */
        .hero{text-align:center;padding:2.5rem 0 1.5rem;}
        .a-badge{display:inline-flex;align-items:center;gap:0.5rem;background:rgba(230,126,34,0.1);color:var(--cacao-dark);font-size:0.72rem;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;padding:0.35rem 0.9rem;border-radius:999px;margin-bottom:1.1rem;}
        .a-title{font-family:'Playfair Display',Georgia,serif;font-size:clamp(2rem,5vw,2.9rem);font-weight:700;letter-spacing:-0.02em;line-height:1.1;margin:0 0 0.6rem;}
        .a-title em{color:var(--cacao);font-style:italic;}
        .a-sub{font-size:1rem;color:var(--muted);max-width:520px;margin:0 auto;line-height:1.6;}
        .chips{display:flex;flex-wrap:wrap;gap:0.6rem;justify-content:center;margin-top:1.75rem;}
        .chip{background:white;border:1.5px solid var(--line);border-radius:14px;padding:0.7rem 1rem;font-size:0.85rem;font-weight:500;color:var(--indigo);cursor:pointer;transition:all 0.16s;font-family:inherit;text-align:left;max-width:330px;}
        .chip:hover{border-color:var(--cacao);background:rgba(230,126,34,0.04);transform:translateY(-2px);box-shadow:0 8px 22px rgba(26,43,76,0.08);}
        /* Chat */
        .msg{margin-bottom:1.4rem;}
        .msg.user{display:flex;justify-content:flex-end;}
        .user-bub{background:linear-gradient(135deg,var(--cacao),var(--cacao-dark));color:white;padding:0.8rem 1.1rem;border-radius:18px 18px 4px 18px;font-size:0.92rem;max-width:80%;box-shadow:0 8px 20px rgba(230,126,34,0.25);}
        .ai-row{display:flex;gap:0.75rem;align-items:flex-start;}
        .ai-ava{color:white;font-weight:800;width:38px;height:38px;border-radius:50%;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:1.2rem;background:linear-gradient(135deg,#24395f,#1A2B4C);box-shadow:0 4px 14px rgba(26,43,76,0.3);}
        .ai-body{flex:1;min-width:0;}
        .ai-name{font-size:0.75rem;font-weight:800;letter-spacing:0.02em;color:var(--cacao-dark);margin-bottom:0.35rem;}
        .ai-text{background:white;border:1px solid var(--line);border-radius:4px 18px 18px 18px;padding:1rem 1.2rem;font-size:0.92rem;line-height:1.65;box-shadow:0 6px 20px rgba(26,43,76,0.06);}
        .tool-chip{display:inline-flex;align-items:center;gap:0.5rem;background:rgba(26,43,76,0.05);border:1px solid var(--line);border-radius:999px;padding:0.4rem 0.85rem;font-size:0.78rem;color:var(--muted);font-weight:600;margin:0.3rem 0;}
        .tool-chip .spin{width:12px;height:12px;border:2px solid rgba(230,126,34,0.3);border-top-color:var(--cacao);border-radius:50%;animation:sp 0.7s linear infinite;}
        @keyframes sp{to{transform:rotate(360deg);}}
        .pcards{display:grid;grid-template-columns:1fr 1fr;gap:0.75rem;margin:0.75rem 0;}
        @media(max-width:560px){.pcards{grid-template-columns:1fr;}}
        .pcard{background:white;border:1px solid var(--line);border-radius:16px;overflow:hidden;text-decoration:none;color:inherit;display:flex;flex-direction:column;transition:all 0.16s;}
        .pcard:hover{transform:translateY(-3px);box-shadow:0 14px 32px rgba(26,43,76,0.13);border-color:rgba(230,126,34,0.25);}
        .pcard-img{width:100%;height:120px;object-fit:cover;background:#eee;}
        .pcard-b{padding:0.7rem 0.85rem 0.85rem;display:flex;flex-direction:column;gap:0.15rem;flex:1;}
        .pcard-t{font-size:0.7rem;letter-spacing:0.08em;text-transform:uppercase;color:var(--cacao);font-weight:700;}
        .pcard-n{font-size:0.9rem;font-weight:700;line-height:1.2;}
        .pcard-m{font-size:0.76rem;color:var(--muted);margin-top:0.1rem;}
        .pcard-f{display:flex;align-items:center;justify-content:space-between;margin-top:auto;padding-top:0.5rem;}
        .pcard-p{font-weight:800;font-size:0.9rem;}
        .pcard-p span{font-weight:400;font-size:0.7rem;color:var(--muted);}
        .pcard-cta{font-size:0.75rem;font-weight:700;color:var(--cacao);}
        .dots{display:flex;gap:5px;padding:0.3rem 0;}
        .dots span{width:8px;height:8px;border-radius:50%;background:#c4ccd8;animation:bl 1.2s infinite;}
        .dots span:nth-child(2){animation-delay:.2s;}.dots span:nth-child(3){animation-delay:.4s;}
        @keyframes bl{0%,60%,100%{opacity:.3}30%{opacity:1}}
        /* Composer */
        .composer{position:fixed;bottom:0;left:0;right:0;background:linear-gradient(180deg,transparent,var(--sand) 22%);padding:1.5rem 1.25rem calc(1.25rem + env(safe-area-inset-bottom,0px));z-index:40;}
        .composer-inner{max-width:760px;margin:0 auto;display:flex;gap:0.6rem;align-items:flex-end;background:white;border:1.5px solid var(--line);border-radius:18px;padding:0.55rem 0.55rem 0.55rem 1rem;box-shadow:0 12px 40px rgba(26,43,76,0.12);}
        .composer-inner:focus-within{border-color:var(--cacao);}
        .composer textarea{flex:1;border:none;outline:none;resize:none;font-family:inherit;font-size:0.95rem;color:var(--indigo);max-height:120px;padding:0.5rem 0;background:transparent;}
        .send{width:44px;height:44px;border-radius:13px;border:none;background:linear-gradient(135deg,var(--cacao),var(--cacao-dark));color:white;cursor:pointer;flex-shrink:0;display:flex;align-items:center;justify-content:center;transition:all 0.15s;}
        .send:disabled{opacity:0.4;cursor:not-allowed;}
        .send:not(:disabled):hover{transform:scale(1.06);}
        .disc{text-align:center;font-size:0.68rem;color:#9aa4b2;margin-top:0.6rem;}
      `}</style>

      <nav className="nav">
        <Link href="/" className="logo">RESER<span>-VE</span></Link>
        <NavUser />
      </nav>

      <div className="wrap" ref={scrollRef} style={{ height: 'calc(100vh - 60px)', overflowY: 'auto' }}>
        {!started && (
          <div className="hero">
            <div className="a-badge">Aurora · tu compañera de viaje</div>
            <h1 className="a-title">Hola, soy <em>Aurora</em></h1>
            <p className="a-sub">Cuéntame qué viaje sueñas por Venezuela y armo un itinerario a tu medida con posadas reales, disponibilidad y precios. ¿Por dónde empezamos?</p>
            <div className="chips">
              {EJEMPLOS.map(e => (
                <button key={e} className="chip" onClick={() => send(e)}>{e}</button>
              ))}
            </div>
          </div>
        )}

        {messages.map(m => {
          if (m.role === 'user') {
            const text = m.parts.filter(p => p.type === 'text').map(p => (p as any).text).join('')
            return <div key={m.id} className="msg user"><div className="user-bub">{text}</div></div>
          }
          // Assistant: render text + tool activity + posada cards in order
          return (
            <div key={m.id} className="msg">
              <div className="ai-row">
                <div className="ai-ava">A</div>
                <div className="ai-body">
                  <div className="ai-name">AURORA</div>
                  {m.parts.map((part, i) => {
                    if (part.type === 'text' && (part as any).text?.trim()) {
                      return <div key={i} className="ai-text"><RichText text={(part as any).text} /></div>
                    }
                    if (part.type === 'tool-buscarPosadas') {
                      const p: any = part
                      if (p.state === 'output-available' && Array.isArray(p.output)) {
                        const cards = p.output as PosadaCard[]
                        if (cards.length === 0) return null
                        return (
                          <div key={i} className="pcards">
                            {cards.map(c => (
                              <Link key={c.slug} href={`/posadas/${c.slug}`} className="pcard" target="_blank">
                                <img className="pcard-img" src={c.img} alt={c.nombre} loading="lazy" />
                                <div className="pcard-b">
                                  <div className="pcard-t">{c.tipo} · {c.destino}</div>
                                  <div className="pcard-n">{c.nombre}</div>
                                  <div className="pcard-m">{c.reviews ? `★ ${c.rating} · ${c.reviews} reseñas` : 'Nueva en RESER-VE'}</div>
                                  <div className="pcard-f">
                                    <div className="pcard-p">${c.precio}<span>/noche</span></div>
                                    <div className="pcard-cta">Ver posada →</div>
                                  </div>
                                </div>
                              </Link>
                            ))}
                          </div>
                        )
                      }
                      return <div key={i} className="tool-chip"><span className="spin" /> Buscando posadas…</div>
                    }
                    if (part.type === 'tool-verDisponibilidad') {
                      const p: any = part
                      if (p.state !== 'output-available') {
                        return <div key={i} className="tool-chip"><span className="spin" /> Verificando disponibilidad…</div>
                      }
                    }
                    return null
                  })}
                </div>
              </div>
            </div>
          )
        })}

        {busy && messages[messages.length - 1]?.role === 'user' && (
          <div className="msg"><div className="ai-row"><div className="ai-ava">A</div>
            <div className="ai-body"><div className="ai-name">AURORA</div><div className="ai-text"><div className="dots"><span /><span /><span /></div></div></div>
          </div></div>
        )}

        {error && (
          <div className="msg"><div className="ai-row"><div className="ai-ava">A</div>
            <div className="ai-body"><div className="ai-text">{error.message && error.message !== 'An error occurred.' ? error.message : 'Tuve un problema para responder. Intenta de nuevo en un momento. 🙏'}</div></div>
          </div></div>
        )}
      </div>

      <div className="composer">
        <form className="composer-inner" onSubmit={e => { e.preventDefault(); send(input) }}>
          <textarea
            placeholder="Ej: 4 noches en Los Roques y Canaima, 2 personas, presupuesto $600…"
            value={input}
            rows={1}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input) } }}
          />
          <button className="send" type="submit" disabled={busy || !input.trim()} aria-label="Enviar">
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
          </button>
        </form>
        <div className="disc">Aurora usa IA y datos reales de RESER-VE · puede cometer errores</div>
      </div>
    </>
  )
}
