'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function RecuperarPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim() || busy) return
    setBusy(true)
    setError('')
    try {
      const res = await fetch('/api/password/forgot', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) { setError(data.error || 'No pudimos procesar la solicitud.'); return }
      setSent(true)
    } catch { setError('Error de conexión. Intenta de nuevo.') } finally { setBusy(false) }
  }

  return (
    <>
      <style>{`
        :root{--indigo:#1A2B4C;--cacao:#E67E22;--cacao-dark:#C96510;--sand:#FDFBF7;--muted:#7A8699;--line:rgba(26,43,76,0.1);}
        *,*::before,*::after{box-sizing:border-box;}
        body{margin:0;font-family:'Inter',system-ui,sans-serif;background:var(--sand);color:var(--indigo);}
        .wrap{min-height:calc(100vh - var(--pp-h,0px));display:flex;flex-direction:column;align-items:center;justify-content:center;padding:2rem 1.25rem;}
        .card{background:white;border:1px solid var(--line);border-radius:22px;box-shadow:0 12px 40px rgba(26,43,76,0.1);padding:2.2rem;max-width:420px;width:100%;}
        .logo{font-size:1.5rem;font-weight:800;letter-spacing:-0.04em;text-align:center;text-decoration:none;color:var(--indigo);display:block;}
        .logo span{color:var(--cacao);}
        h1{font-family:'Playfair Display',Georgia,serif;font-size:1.6rem;font-weight:700;text-align:center;margin:1.5rem 0 .3rem;}
        .sub{text-align:center;color:var(--muted);font-size:.9rem;margin-bottom:1.75rem;line-height:1.5;}
        label{display:block;font-size:.72rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);margin-bottom:.4rem;}
        input{width:100%;padding:.85rem 1rem;border:1.5px solid var(--line);border-radius:12px;font-family:inherit;font-size:.92rem;color:var(--indigo);outline:none;transition:border .15s;}
        input:focus{border-color:var(--cacao);}
        button{width:100%;margin-top:1.25rem;padding:.95rem;background:linear-gradient(135deg,var(--cacao),var(--cacao-dark));color:white;border:none;border-radius:999px;font-family:inherit;font-size:.92rem;font-weight:700;cursor:pointer;transition:transform .15s;}
        button:disabled{opacity:.5;cursor:not-allowed;}
        button:not(:disabled):hover{transform:translateY(-1px);}
        .back{display:block;text-align:center;margin-top:1.25rem;font-size:.84rem;color:var(--muted);text-decoration:none;}
        .back:hover{color:var(--indigo);}
        .ok{background:rgba(16,185,129,.08);border:1px solid rgba(16,185,129,.3);color:#0f9d6b;border-radius:12px;padding:1rem;font-size:.88rem;line-height:1.6;text-align:center;}
      `}</style>
      <div className="wrap">
        <div className="card">
          <Link href="/" className="logo">RESER<span>-VE</span></Link>
          {sent ? (
            <>
              <h1>Revisa tu correo</h1>
              <div className="sub">Te enviamos a <strong>{email}</strong> un enlace para crear una nueva contraseña. El enlace vence en 1 hora.</div>
              <div className="ok">Revisa tu bandeja de entrada (y la carpeta de spam).</div>
              <Link href="/login" className="back">← Volver a iniciar sesión</Link>
            </>
          ) : (
            <>
              <h1>¿Olvidaste tu contraseña?</h1>
              <div className="sub">Ingresa tu correo y te enviaremos un enlace para restablecerla.</div>
              <form onSubmit={submit}>
                <label>Correo electrónico</label>
                <input type="email" required placeholder="tu@email.com" value={email} onChange={e => { setEmail(e.target.value); setError('') }} />
                {error && (
                  <div style={{ background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.25)', color: '#dc2626', borderRadius: 10, padding: '.7rem .9rem', fontSize: '.84rem', marginTop: '1rem', lineHeight: 1.5 }}>
                    {error}
                    {error.includes('No hay ninguna cuenta') && <> <Link href="/register" style={{ color: '#E67E22', fontWeight: 700 }}>Crear una cuenta →</Link></>}
                  </div>
                )}
                <button type="submit" disabled={busy || !email.trim()}>{busy ? 'Enviando…' : 'Enviar enlace'}</button>
              </form>
              <Link href="/login" className="back">← Volver a iniciar sesión</Link>
            </>
          )}
        </div>
      </div>
    </>
  )
}
