'use client'

import { useState, useRef, useEffect } from 'react'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { WELCOME_MESSAGE, SUGGESTED_QUESTIONS } from '@/lib/support-kb'

export default function SupportChat() {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)

  const { messages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({ api: '/api/support/chat' }),
  })

  const busy = status === 'submitted' || status === 'streaming'

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, busy])

  function send(text: string) {
    const t = text.trim()
    if (!t || busy) return
    sendMessage({ text: t })
    setInput('')
  }

  // ¿Algún ticket se abrió en esta conversación?
  const ticketAbierto = messages.some(m =>
    m.parts.some(p => (p as any).type === 'tool-escalarAAgente' && (p as any).output?.creado),
  )

  return (
    <>
      <style>{`
        .sc-fab{position:fixed;bottom:1.5rem;right:1.5rem;z-index:900;width:60px;height:60px;border-radius:50%;border:none;cursor:pointer;background:linear-gradient(135deg,#E67E22,#C96510);color:#fff;box-shadow:0 12px 30px rgba(230,126,34,0.4),0 4px 12px rgba(26,43,76,0.2);display:flex;align-items:center;justify-content:center;transition:transform .2s,box-shadow .2s;}
        .sc-fab:hover{transform:translateY(-3px) scale(1.04);box-shadow:0 18px 42px rgba(230,126,34,0.5);}
        .sc-fab-dot{position:absolute;top:2px;right:2px;width:14px;height:14px;background:#10b981;border:2.5px solid #fff;border-radius:50%;}
        .sc-panel{position:fixed;bottom:1.5rem;right:1.5rem;z-index:901;width:min(390px,calc(100vw - 2rem));height:min(600px,calc(100vh - 3rem));background:#FDFBF7;border-radius:22px;box-shadow:0 24px 70px rgba(26,43,76,0.28);display:flex;flex-direction:column;overflow:hidden;border:1px solid rgba(26,43,76,0.08);font-family:'Inter',system-ui,sans-serif;animation:scIn .22s cubic-bezier(.16,1,.3,1);}
        @keyframes scIn{from{opacity:0;transform:translateY(16px) scale(.97);}to{opacity:1;transform:none;}}
        .sc-head{background:linear-gradient(135deg,#1A2B4C,#24395f);color:#fff;padding:1rem 1.1rem;display:flex;align-items:center;gap:.7rem;}
        .sc-ava{width:38px;height:38px;border-radius:50%;background:linear-gradient(135deg,#E67E22,#C96510);display:flex;align-items:center;justify-content:center;font-size:1.1rem;flex-shrink:0;}
        .sc-title{font-weight:800;font-size:.95rem;letter-spacing:-.01em;}
        .sc-sub{font-size:.72rem;color:rgba(255,255,255,.7);display:flex;align-items:center;gap:.35rem;margin-top:1px;}
        .sc-online{width:7px;height:7px;border-radius:50%;background:#34d399;display:inline-block;}
        .sc-x{margin-left:auto;background:rgba(255,255,255,.12);border:none;color:#fff;width:30px;height:30px;border-radius:50%;cursor:pointer;font-size:1rem;display:flex;align-items:center;justify-content:center;transition:background .15s;}
        .sc-x:hover{background:rgba(255,255,255,.22);}
        .sc-body{flex:1;overflow-y:auto;padding:1.1rem;display:flex;flex-direction:column;gap:.7rem;}
        .sc-row{display:flex;gap:.5rem;max-width:88%;}
        .sc-row.me{align-self:flex-end;flex-direction:row-reverse;}
        .sc-bub{padding:.65rem .85rem;border-radius:15px;font-size:.86rem;line-height:1.5;white-space:pre-wrap;word-break:break-word;}
        .sc-row.ai .sc-bub{background:#fff;border:1px solid rgba(26,43,76,0.08);color:#1A2B4C;border-bottom-left-radius:4px;}
        .sc-row.me .sc-bub{background:linear-gradient(135deg,#E67E22,#C96510);color:#fff;border-bottom-right-radius:4px;}
        .sc-mini-ava{width:26px;height:26px;border-radius:50%;background:linear-gradient(135deg,#E67E22,#C96510);display:flex;align-items:center;justify-content:center;font-size:.78rem;flex-shrink:0;align-self:flex-end;}
        .sc-ticket{align-self:center;background:rgba(16,185,129,.1);border:1px solid rgba(16,185,129,.3);color:#0f9d6b;font-size:.74rem;font-weight:600;padding:.4rem .8rem;border-radius:99px;display:flex;align-items:center;gap:.4rem;}
        .sc-sugs{display:flex;flex-direction:column;gap:.45rem;margin-top:.3rem;}
        .sc-sug{text-align:left;background:#fff;border:1px solid rgba(26,43,76,0.1);color:#1A2B4C;font-size:.82rem;font-weight:500;padding:.6rem .8rem;border-radius:12px;cursor:pointer;transition:all .15s;font-family:inherit;}
        .sc-sug:hover{border-color:#E67E22;background:rgba(230,126,34,.05);}
        .sc-dots{display:flex;gap:4px;padding:.3rem .2rem;}
        .sc-dots span{width:7px;height:7px;border-radius:50%;background:#c4ccd8;animation:scBlink 1.2s infinite;}
        .sc-dots span:nth-child(2){animation-delay:.2s;}
        .sc-dots span:nth-child(3){animation-delay:.4s;}
        @keyframes scBlink{0%,60%,100%{opacity:.3;}30%{opacity:1;}}
        .sc-foot{padding:.8rem;border-top:1px solid rgba(26,43,76,0.07);background:#fff;}
        .sc-form{display:flex;gap:.5rem;align-items:flex-end;}
        .sc-input{flex:1;border:1.5px solid rgba(26,43,76,0.12);border-radius:13px;padding:.6rem .8rem;font-family:inherit;font-size:.86rem;color:#1A2B4C;outline:none;resize:none;max-height:90px;transition:border .15s;}
        .sc-input:focus{border-color:#E67E22;}
        .sc-send{width:40px;height:40px;border-radius:11px;border:none;background:linear-gradient(135deg,#E67E22,#C96510);color:#fff;cursor:pointer;flex-shrink:0;display:flex;align-items:center;justify-content:center;transition:opacity .15s,transform .15s;}
        .sc-send:disabled{opacity:.4;cursor:not-allowed;}
        .sc-send:not(:disabled):hover{transform:scale(1.06);}
        .sc-disc{font-size:.66rem;color:#9aa4b2;text-align:center;margin-top:.5rem;}
      `}</style>

      {!open && (
        <button className="sc-fab" onClick={() => setOpen(true)} aria-label="Abrir asistente">
          <span className="sc-fab-dot" />
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
        </button>
      )}

      {open && (
        <div className="sc-panel">
          <div className="sc-head">
            <div className="sc-ava">🌴</div>
            <div>
              <div className="sc-title">Vera · Asistente RESER-VE</div>
              <div className="sc-sub"><span className="sc-online" /> En línea · responde al instante</div>
            </div>
            <button className="sc-x" onClick={() => setOpen(false)} aria-label="Cerrar">✕</button>
          </div>

          <div className="sc-body" ref={scrollRef}>
            {/* Bienvenida + sugerencias cuando no hay mensajes */}
            <div className="sc-row ai">
              <div className="sc-mini-ava">🌴</div>
              <div className="sc-bub">{WELCOME_MESSAGE}</div>
            </div>
            {messages.length === 0 && (
              <div className="sc-sugs">
                {SUGGESTED_QUESTIONS.map(q => (
                  <button key={q} className="sc-sug" onClick={() => send(q)}>{q}</button>
                ))}
              </div>
            )}

            {messages.map(m => {
              const text = m.parts.filter(p => p.type === 'text').map(p => (p as any).text).join('')
              if (!text) return null
              return (
                <div key={m.id} className={`sc-row ${m.role === 'user' ? 'me' : 'ai'}`}>
                  {m.role !== 'user' && <div className="sc-mini-ava">🌴</div>}
                  <div className="sc-bub">{text}</div>
                </div>
              )
            })}

            {ticketAbierto && (
              <div className="sc-ticket">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                Ticket abierto con un agente humano
              </div>
            )}

            {busy && (
              <div className="sc-row ai">
                <div className="sc-mini-ava">🌴</div>
                <div className="sc-bub"><div className="sc-dots"><span /><span /><span /></div></div>
              </div>
            )}

            {error && (
              <div className="sc-row ai">
                <div className="sc-mini-ava">🌴</div>
                <div className="sc-bub">Ups, tuve un problema para responder. Intenta de nuevo o escríbenos a hola@reser-ve.com.</div>
              </div>
            )}
          </div>

          <div className="sc-foot">
            <form className="sc-form" onSubmit={e => { e.preventDefault(); send(input) }}>
              <textarea
                className="sc-input"
                placeholder="Escribe tu mensaje…"
                value={input}
                rows={1}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input) } }}
              />
              <button className="sc-send" type="submit" disabled={busy || !input.trim()} aria-label="Enviar">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
              </button>
            </form>
            <div className="sc-disc">IA de RESER-VE · puede cometer errores</div>
          </div>
        </div>
      )}
    </>
  )
}
