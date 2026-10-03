'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { signOut } from 'next-auth/react'
import NavUser from '@/components/NavUser'

type Info = { user: { name: string; email: string; role: string; createdAt: string }; activeBookings: number; activePosadas: string[] }

export default function CuentaPage() {
  const [info, setInfo] = useState<Info | null>(null)
  const [open, setOpen] = useState(false)
  const [password, setPassword] = useState('')
  const [confirmText, setConfirmText] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { fetch('/api/account').then(r => r.ok ? r.json() : null).then(setInfo).catch(() => {}) }, [])

  const blocked = !!info && (info.activeBookings > 0 || info.activePosadas.length > 0)

  async function eliminar() {
    setBusy(true); setError('')
    const res = await fetch('/api/account', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password }) })
    const data = await res.json().catch(() => ({}))
    setBusy(false)
    if (!res.ok) { setError(data.error ?? 'No se pudo eliminar la cuenta'); return }
    await signOut({ callbackUrl: '/?cuenta=eliminada' })
  }

  const rol = info?.user.role === 'host' ? 'Posadero' : info?.user.role === 'admin' ? 'Administrador' : 'Viajero'

  return (
    <>
      <style>{`
        :root{--indigo:#1A2B4C;--cacao:#E67E22;--sand:#FDFBF7;--muted:#7A8699;--line:rgba(26,43,76,0.09);}
        body{font-family:'Inter',system-ui,sans-serif;background:var(--sand);color:var(--indigo);margin:0;}
        .nav{position:sticky;top:var(--pp-h,0px);z-index:50;background:white;border-bottom:1.5px solid var(--line);height:62px;display:flex;align-items:center;justify-content:space-between;padding:0 1.5rem;}
        .logo{font-size:1.25rem;font-weight:800;letter-spacing:-0.04em;color:var(--indigo);text-decoration:none;}
        .logo span{color:var(--cacao);}
        .wrap{max-width:640px;margin:0 auto;padding:2.5rem 1.25rem 4rem;}
        h1{font-family:'Playfair Display',Georgia,serif;font-size:1.9rem;margin:0 0 1.5rem;}
        .card{background:white;border:1px solid var(--line);border-radius:16px;padding:1.2rem 1.3rem;margin-bottom:1.2rem;}
        .row{display:flex;justify-content:space-between;padding:.55rem 0;border-bottom:1px solid var(--line);font-size:.9rem;}
        .row:last-child{border-bottom:none;}
        .row span:first-child{color:var(--muted);}
        .h{font-weight:700;margin-bottom:.4rem;}
        .muted{color:var(--muted);font-size:.86rem;line-height:1.55;}
        .danger{border-color:rgba(220,38,38,.25);}
        .btn{padding:.65rem 1.1rem;border-radius:999px;border:none;font-weight:700;font-size:.86rem;cursor:pointer;font-family:inherit;}
        .btn-red{background:#DC2626;color:white;}
        .btn-red:disabled{opacity:.45;cursor:not-allowed;}
        .btn-ghost{background:white;border:1.5px solid var(--line);color:var(--indigo);}
        input{width:100%;padding:.7rem .9rem;border:1.5px solid var(--line);border-radius:10px;font-family:inherit;font-size:.9rem;margin:.35rem 0 .8rem;box-sizing:border-box;}
        .err{color:#B42318;font-size:.84rem;margin:.3rem 0 .6rem;}
        ul{margin:.4rem 0 .8rem;padding-left:1.2rem;font-size:.86rem;}
      `}</style>
      <nav className="nav">
        <Link href="/" className="logo">RESER<span>-VE</span></Link>
        <NavUser />
      </nav>
      <div className="wrap">
        <h1>Mi cuenta</h1>
        {!info ? <div className="muted">Cargando…</div> : (
          <>
            <div className="card">
              <div className="row"><span>Nombre</span><strong>{info.user.name}</strong></div>
              <div className="row"><span>Correo</span><strong>{info.user.email}</strong></div>
              <div className="row"><span>Tipo de cuenta</span><strong>{rol}</strong></div>
              <div className="row"><span>Miembro desde</span><strong>{new Date(info.user.createdAt).toLocaleDateString('es-VE', { month: 'long', year: 'numeric' })}</strong></div>
              <p className="muted" style={{ marginTop: '.6rem' }}>¿Quieres cambiar tu contraseña? <Link href="/recuperar" style={{ color: 'var(--cacao)' }}>Te enviamos un enlace</Link>.</p>
            </div>

            <div className="card danger">
              <div className="h">Eliminar cuenta</div>
              {blocked ? (
                <>
                  <p className="muted">Para eliminar tu cuenta primero tienes que:</p>
                  <ul>
                    {info.activeBookings > 0 && <li>Cancelar o terminar tus {info.activeBookings} reserva{info.activeBookings === 1 ? '' : 's'} activa{info.activeBookings === 1 ? '' : 's'} ({info.user.role === 'traveler' ? <Link href="/mis-reservas">Mis reservas</Link> : <Link href="/dashboard/reservas">Reservas</Link>}).</li>}
                    {info.activePosadas.length > 0 && <li>Pausar tus posadas publicadas o en revisión: {info.activePosadas.join(', ')} (<Link href="/dashboard/posadas">Mis posadas</Link>).</li>}
                  </ul>
                </>
              ) : !open ? (
                <>
                  <p className="muted">Se borrarán tus datos personales y tus favoritos, y no podrás volver a entrar. El historial de reservas y mensajes se conserva sin tu nombre ni tu correo.</p>
                  <button className="btn btn-red" style={{ marginTop: '.6rem' }} onClick={() => setOpen(true)}>Eliminar mi cuenta</button>
                </>
              ) : (
                <>
                  <p className="muted">Esta acción no se puede deshacer. Escribe tu contraseña y la palabra <strong>ELIMINAR</strong> para confirmar.</p>
                  <input type="password" placeholder="Tu contraseña" value={password} onChange={e => setPassword(e.target.value)} autoComplete="current-password" />
                  <input placeholder="Escribe ELIMINAR" value={confirmText} onChange={e => setConfirmText(e.target.value)} />
                  {error && <div className="err">{error}</div>}
                  <div style={{ display: 'flex', gap: '.5rem' }}>
                    <button className="btn btn-red" disabled={busy || !password || confirmText.trim().toUpperCase() !== 'ELIMINAR'} onClick={eliminar}>{busy ? 'Eliminando…' : 'Eliminar definitivamente'}</button>
                    <button className="btn btn-ghost" onClick={() => { setOpen(false); setError('') }}>Cancelar</button>
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </>
  )
}
