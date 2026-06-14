'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import NavUser from '@/components/NavUser'
import RichText from '@/components/RichText'

type Message = {
  id: number
  senderId: number
  senderName: string
  senderRole: string
  body: string
  readAt: string | null
  createdAt: string
}

type Conversation = {
  id: number
  type: 'booking' | 'support'
  subject: string
  userId: number
  hostId: number | null
  posadaNombre?: string | null
  messages: Message[]
  lastMessageAt: string
}

export default function ConversationPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { id } = useParams<{ id: string }>()
  const [conv, setConv] = useState<Conversation | null>(null)
  const [loading, setLoading] = useState(true)
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login?callbackUrl=/mensajes')
  }, [status, router])

  const loadConversation = () => {
    if (status !== 'authenticated') return
    fetch(`/api/conversations/${id}`)
      .then(r => r.json())
      .then(data => {
        if (data.id) setConv(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }

  useEffect(() => {
    loadConversation()
    // Poll for new messages every 8 seconds
    pollRef.current = setInterval(loadConversation, 8000)
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [status, id])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [conv?.messages?.length])

  async function sendMessage() {
    if (!body.trim() || sending) return
    setSending(true)
    const res = await fetch(`/api/conversations/${id}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body }),
    })
    if (res.ok) {
      const msg = await res.json()
      setConv(prev => prev ? { ...prev, messages: [...prev.messages, msg] } : prev)
      setBody('')
    }
    setSending(false)
  }

  const myId = parseInt((session?.user as any)?.id ?? '0')
  const myRole = (session?.user as any)?.role

  if (status === 'loading' || loading) {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'Inter,sans-serif', color: '#7A8699' }}>Cargando…</div>
  }

  if (!conv) {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'Inter,sans-serif', color: '#7A8699' }}>Conversación no encontrada.</div>
  }

  function getRoleLabel(role: string) {
    if (role === 'admin') return 'Equipo RESER-VE'
    if (role === 'host') return 'Posadero'
    return null
  }

  return (
    <>
      <style>{`
        :root{--indigo:#1A2B4C;--cacao:#E67E22;--sand:#FDFBF7;--muted:#7A8699;--line:rgba(26,43,76,0.08);}
        *,*::before,*::after{box-sizing:border-box;}
        html,body{height:100%;margin:0;}
        body{font-family:'Inter',sans-serif;background:var(--sand);color:var(--indigo);display:flex;flex-direction:column;}
        .nav{background:white;border-bottom:1.5px solid var(--line);padding:0 1.5rem;height:64px;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:100;flex-shrink:0;}
        .nav-logo{font-size:1.2rem;font-weight:800;letter-spacing:-0.04em;color:var(--indigo);text-decoration:none;}
        .nav-logo span{color:var(--cacao);}
        .chat-wrap{max-width:760px;margin:0 auto;width:100%;display:flex;flex-direction:column;flex:1;padding:0 1rem;}
        .chat-header{padding:1.5rem 0 1rem;border-bottom:1.5px solid var(--line);flex-shrink:0;}
        .back-link{display:inline-flex;align-items:center;gap:0.4rem;font-size:0.82rem;font-weight:600;color:var(--muted);text-decoration:none;margin-bottom:0.8rem;transition:color 0.15s;}
        .back-link:hover{color:var(--indigo);}
        .chat-title{font-family:'Playfair Display',Georgia,serif;font-size:1.35rem;font-weight:700;}
        .chat-meta{font-size:0.78rem;color:var(--muted);margin-top:0.25rem;}
        .badge{display:inline-flex;align-items:center;font-size:0.7rem;font-weight:700;padding:0.18rem 0.55rem;border-radius:99px;margin-right:0.5rem;}
        .badge-booking{background:rgba(99,102,241,0.1);color:#6366f1;}
        .badge-support{background:rgba(16,185,129,0.1);color:#10b981;}
        .messages{flex:1;overflow-y:auto;padding:1.5rem 0;display:flex;flex-direction:column;gap:1rem;}
        .msg{display:flex;flex-direction:column;max-width:72%;}
        .msg.mine{align-self:flex-end;align-items:flex-end;}
        .msg.theirs{align-self:flex-start;align-items:flex-start;}
        .msg-bubble{padding:0.75rem 1rem;border-radius:18px;font-size:0.88rem;line-height:1.55;word-break:break-word;}
        .msg.mine .msg-bubble{background:var(--cacao);color:white;border-bottom-right-radius:4px;}
        .msg.theirs .msg-bubble{background:white;border:1.5px solid var(--line);color:var(--indigo);border-bottom-left-radius:4px;}
        .msg.admin .msg-bubble{background:rgba(26,43,76,0.06);border:1.5px solid rgba(26,43,76,0.12);}
        .msg-sender{font-size:0.72rem;font-weight:700;color:var(--muted);margin-bottom:0.25rem;}
        .msg-time{font-size:0.68rem;color:var(--muted);margin-top:0.25rem;}
        .msg-role-chip{display:inline-block;font-size:0.62rem;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;background:rgba(230,126,34,0.12);color:var(--cacao);padding:0.1rem 0.4rem;border-radius:4px;margin-left:0.3rem;}
        .input-area{border-top:1.5px solid var(--line);padding:1rem 0 1.5rem;flex-shrink:0;display:flex;gap:0.7rem;align-items:flex-end;}
        .msg-input{flex:1;padding:0.75rem 1rem;border:1.5px solid var(--line);border-radius:14px;font-family:inherit;font-size:0.88rem;color:var(--indigo);background:white;outline:none;transition:border 0.15s;resize:none;min-height:44px;max-height:140px;}
        .msg-input:focus{border-color:var(--cacao);}
        .send-btn{padding:0.75rem 1.3rem;background:var(--cacao);color:white;border:none;border-radius:14px;font-size:0.86rem;font-weight:700;font-family:inherit;cursor:pointer;transition:background 0.15s;flex-shrink:0;}
        .send-btn:hover:not(:disabled){background:#c96510;}
        .send-btn:disabled{opacity:0.5;cursor:not-allowed;}
        @media(max-width:600px){.msg{max-width:88%;}.chat-wrap{padding:0 0.5rem;}}
      `}</style>

      <nav className="nav">
        <a href="/" className="nav-logo">RESER<span>-VE</span></a>
        <NavUser />
      </nav>

      <div className="chat-wrap">
        <div className="chat-header">
          <a href="/mensajes" className="back-link">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
            Bandeja de mensajes
          </a>
          <div className="chat-title">
            <span className={`badge ${conv.type === 'booking' ? 'badge-booking' : 'badge-support'}`}>
              {conv.type === 'booking' ? '🏠 Reserva' : '💬 Soporte'}
            </span>
            {conv.subject}
          </div>
          {conv.posadaNombre && (
            <div className="chat-meta">Relacionado con: {conv.posadaNombre}</div>
          )}
        </div>

        <div className="messages">
          {conv.messages.length === 0 && (
            <div style={{ textAlign: 'center', color: 'var(--muted)', fontSize: '0.88rem', padding: '2rem' }}>
              No hay mensajes aún. Sé el primero en escribir.
            </div>
          )}
          {conv.messages.map(msg => {
            const isMine = msg.senderId === myId
            const isAdmin = msg.senderRole === 'admin'
            return (
              <div key={msg.id} className={`msg ${isMine ? 'mine' : isAdmin ? 'admin theirs' : 'theirs'}`}>
                {!isMine && (
                  <div className="msg-sender">
                    {msg.senderName}
                    {getRoleLabel(msg.senderRole) && (
                      <span className="msg-role-chip">{getRoleLabel(msg.senderRole)}</span>
                    )}
                  </div>
                )}
                <div className="msg-bubble"><RichText text={msg.body} /></div>
                <div className="msg-time">
                  {new Date(msg.createdAt).toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' })},&nbsp;
                  {new Date(msg.createdAt).toLocaleDateString('es-VE', { day: 'numeric', month: 'short' })}
                </div>
              </div>
            )
          })}
          <div ref={bottomRef} />
        </div>

        <div className="input-area">
          <textarea
            className="msg-input"
            placeholder="Escribe tu mensaje…"
            value={body}
            onChange={e => setBody(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
            rows={1}
          />
          <button className="send-btn" disabled={sending || !body.trim()} onClick={sendMessage}>
            {sending ? '…' : 'Enviar'}
          </button>
        </div>
      </div>
    </>
  )
}
