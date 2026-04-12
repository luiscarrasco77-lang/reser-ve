'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import NavUser from '@/components/NavUser'

type Conversation = {
  id: number
  type: 'booking' | 'support'
  subject: string
  lastMessageAt: string
  unread: number
  userName: string
  hostName: string | null
  posadaNombre: string | null
  lastMessage: { body: string; senderName: string } | null
}

export default function MensajesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [newSubject, setNewSubject] = useState('')
  const [newBody, setNewBody] = useState('')
  const [showNew, setShowNew] = useState(false)
  const [filter, setFilter] = useState<'all' | 'booking' | 'support'>('all')

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login?callbackUrl=/mensajes')
  }, [status, router])

  useEffect(() => {
    if (status !== 'authenticated') return
    fetch('/api/conversations')
      .then(r => r.json())
      .then(data => { setConversations(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [status])

  // Auto-open new support conversation if redirected from landing
  useEffect(() => {
    if (searchParams.get('type') === 'support') setShowNew(true)
  }, [searchParams])

  async function createConversation() {
    if (!newSubject.trim() || !newBody.trim()) return
    setCreating(true)
    const res = await fetch('/api/conversations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'support', subject: newSubject, body: newBody }),
    })
    if (res.ok) {
      const conv = await res.json()
      router.push(`/mensajes/${conv.id}`)
    }
    setCreating(false)
  }

  const role = (session?.user as any)?.role
  const userId = parseInt((session?.user as any)?.id ?? '0')
  const filtered = filter === 'all' ? conversations : conversations.filter(c => c.type === filter)

  if (status === 'loading') return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'Inter,sans-serif', color: '#7A8699' }}>Cargando…</div>

  return (
    <>
      <style>{`
        :root{--indigo:#1A2B4C;--cacao:#E67E22;--sand:#FDFBF7;--muted:#7A8699;--line:rgba(26,43,76,0.08);}
        *,*::before,*::after{box-sizing:border-box;}
        body{font-family:'Inter',sans-serif;background:var(--sand);color:var(--indigo);margin:0;}
        .nav{background:white;border-bottom:1.5px solid var(--line);padding:0 2rem;height:64px;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:100;}
        .nav-logo{font-size:1.25rem;font-weight:800;letter-spacing:-0.04em;color:var(--indigo);text-decoration:none;}
        .nav-logo span{color:var(--cacao);}
        .main{max-width:820px;margin:0 auto;padding:2.5rem 1.5rem;}
        .page-title{font-family:'Playfair Display',Georgia,serif;font-size:1.8rem;font-weight:700;margin-bottom:0.3rem;}
        .page-sub{font-size:0.9rem;color:var(--muted);margin-bottom:2rem;}
        .tabs{display:flex;gap:0.4rem;margin-bottom:1.5rem;}
        .tab{padding:0.45rem 1rem;border-radius:999px;font-size:0.82rem;font-weight:600;font-family:inherit;border:1.5px solid var(--line);background:white;cursor:pointer;transition:all 0.15s;color:var(--muted);}
        .tab.active{background:var(--indigo);color:white;border-color:var(--indigo);}
        .conv-list{display:flex;flex-direction:column;gap:0.75rem;}
        .conv-card{background:white;border:1.5px solid var(--line);border-radius:16px;padding:1.1rem 1.3rem;cursor:pointer;transition:all 0.18s;text-decoration:none;color:inherit;display:block;}
        .conv-card:hover{box-shadow:0 8px 28px rgba(26,43,76,0.1);border-color:rgba(26,43,76,0.18);transform:translateY(-1px);}
        .conv-card.unread{border-left:3px solid var(--cacao);}
        .conv-top{display:flex;align-items:flex-start;justify-content:space-between;gap:1rem;margin-bottom:0.4rem;}
        .conv-subject{font-weight:700;font-size:0.95rem;}
        .conv-meta{font-size:0.76rem;color:var(--muted);white-space:nowrap;}
        .conv-preview{font-size:0.83rem;color:var(--muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
        .conv-badge{display:inline-flex;align-items:center;gap:0.35rem;font-size:0.7rem;font-weight:700;padding:0.18rem 0.55rem;border-radius:99px;}
        .badge-booking{background:rgba(99,102,241,0.1);color:#6366f1;}
        .badge-support{background:rgba(16,185,129,0.1);color:#10b981;}
        .unread-dot{background:var(--cacao);color:white;border-radius:99px;font-size:0.7rem;font-weight:700;padding:0.1rem 0.48rem;min-width:20px;text-align:center;}
        .new-btn{display:inline-flex;align-items:center;gap:0.5rem;padding:0.7rem 1.3rem;background:var(--cacao);color:white;border:none;border-radius:999px;font-size:0.86rem;font-weight:700;font-family:inherit;cursor:pointer;margin-bottom:1.5rem;transition:background 0.15s;}
        .new-btn:hover{background:#c96510;}
        .new-form{background:white;border:1.5px solid var(--line);border-radius:18px;padding:1.5rem;margin-bottom:1.5rem;box-shadow:0 8px 32px rgba(26,43,76,0.07);}
        .form-label{font-size:0.75rem;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:var(--muted);display:block;margin-bottom:0.4rem;}
        .form-input{width:100%;padding:0.6rem 0.85rem;border:1.5px solid var(--line);border-radius:10px;font-family:inherit;font-size:0.88rem;color:var(--indigo);background:white;outline:none;transition:border 0.15s;margin-bottom:1rem;}
        .form-input:focus{border-color:var(--cacao);}
        .form-textarea{width:100%;padding:0.6rem 0.85rem;border:1.5px solid var(--line);border-radius:10px;font-family:inherit;font-size:0.88rem;color:var(--indigo);background:white;outline:none;transition:border 0.15s;resize:vertical;min-height:90px;margin-bottom:1rem;}
        .form-textarea:focus{border-color:var(--cacao);}
        .form-actions{display:flex;gap:0.6rem;}
        .btn-primary{padding:0.6rem 1.3rem;background:var(--cacao);color:white;border:none;border-radius:999px;font-size:0.86rem;font-weight:700;font-family:inherit;cursor:pointer;transition:background 0.15s;}
        .btn-primary:hover:not(:disabled){background:#c96510;}
        .btn-primary:disabled{opacity:0.5;cursor:not-allowed;}
        .btn-ghost{padding:0.6rem 1.1rem;background:none;color:var(--muted);border:1.5px solid var(--line);border-radius:999px;font-size:0.86rem;font-weight:600;font-family:inherit;cursor:pointer;}
        .empty{text-align:center;padding:3rem;color:var(--muted);font-size:0.9rem;}
      `}</style>

      <nav className="nav">
        <a href="/" className="nav-logo">RESER<span>-VE</span></a>
        <NavUser />
      </nav>

      <main className="main">
        <div className="page-title">Mensajes</div>
        <div className="page-sub">
          {role === 'admin'
            ? 'Todos los mensajes de la plataforma'
            : 'Tus conversaciones con posaderos y el equipo RESER-VE'}
        </div>

        <button className="new-btn" onClick={() => setShowNew(v => !v)}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Nuevo mensaje al equipo RESER-VE
        </button>

        {showNew && (
          <div className="new-form">
            <div style={{ fontWeight: 700, marginBottom: '1rem', color: 'var(--indigo)' }}>Contactar al equipo RESER-VE</div>
            <label className="form-label">Asunto</label>
            <input className="form-input" placeholder="¿En qué podemos ayudarte?" value={newSubject} onChange={e => setNewSubject(e.target.value)} />
            <label className="form-label">Mensaje</label>
            <textarea className="form-textarea" placeholder="Cuéntanos tu consulta o problema…" value={newBody} onChange={e => setNewBody(e.target.value)} />
            <div className="form-actions">
              <button className="btn-primary" disabled={creating || !newSubject.trim() || !newBody.trim()} onClick={createConversation}>
                {creating ? 'Enviando…' : 'Enviar mensaje'}
              </button>
              <button className="btn-ghost" onClick={() => setShowNew(false)}>Cancelar</button>
            </div>
          </div>
        )}

        <div className="tabs">
          {(['all', 'booking', 'support'] as const).map(t => (
            <button key={t} className={`tab${filter === t ? ' active' : ''}`} onClick={() => setFilter(t)}>
              {t === 'all' ? 'Todos' : t === 'booking' ? 'Reservas' : 'Servicio al cliente'}
              {t !== 'all' && <span style={{ marginLeft: 4, opacity: 0.7 }}>({conversations.filter(c => c.type === t).length})</span>}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="empty">Cargando mensajes…</div>
        ) : filtered.length === 0 ? (
          <div className="empty">
            {filter === 'all' ? 'No tienes conversaciones aún.' : `No hay conversaciones de tipo ${filter === 'booking' ? 'reserva' : 'soporte'}.`}
          </div>
        ) : (
          <div className="conv-list">
            {filtered.map(conv => (
              <a key={conv.id} href={`/mensajes/${conv.id}`} className={`conv-card${conv.unread > 0 ? ' unread' : ''}`}>
                <div className="conv-top">
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                      <span className={`conv-badge ${conv.type === 'booking' ? 'badge-booking' : 'badge-support'}`}>
                        {conv.type === 'booking' ? '🏠 Reserva' : '💬 Soporte'}
                      </span>
                      {conv.posadaNombre && (
                        <span style={{ fontSize: '0.76rem', color: 'var(--muted)' }}>{conv.posadaNombre}</span>
                      )}
                    </div>
                    <div className="conv-subject">{conv.subject}</div>
                    <div style={{ fontSize: '0.76rem', color: 'var(--muted)', marginTop: '0.2rem' }}>
                      {conv.type === 'booking'
                        ? `${conv.userName} ↔ ${conv.hostName ?? 'Posadero'}`
                        : role === 'admin' ? `De: ${conv.userName}` : 'Con equipo RESER-VE'}
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.4rem' }}>
                    <span className="conv-meta">{new Date(conv.lastMessageAt).toLocaleDateString('es-VE', { day: 'numeric', month: 'short' })}</span>
                    {conv.unread > 0 && <span className="unread-dot">{conv.unread}</span>}
                  </div>
                </div>
                {conv.lastMessage && (
                  <div className="conv-preview">
                    <strong>{conv.lastMessage.senderName}:</strong> {conv.lastMessage.body}
                  </div>
                )}
              </a>
            ))}
          </div>
        )}
      </main>
    </>
  )
}
