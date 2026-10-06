'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { useT } from '@/components/LangProvider'
import LangCorner from '@/components/LangCorner'

function Inner() {
  const sp = useSearchParams()
  const router = useRouter()
  const t = useT()
  const token = sp.get('token') ?? ''
  const [pass, setPass] = useState('')
  const [pass2, setPass2] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (pass.length < 8) { setError(t('La contraseña debe tener al menos 8 caracteres')); return }
    if (pass !== pass2) { setError(t('Las contraseñas no coinciden')); return }
    setBusy(true)
    try {
      const res = await fetch('/api/password/reset', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password: pass }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) { setError(t(data.error || 'No se pudo restablecer')); return }
      setDone(true)
      setTimeout(() => router.push('/login'), 2500)
    } catch { setError(t('Error de red. Intenta de nuevo.')) } finally { setBusy(false) }
  }

  return (
    <>
      <style>{`
        :root{--indigo:#1A2B4C;--cacao:#E67E22;--cacao-dark:#C96510;--sand:#FDFBF7;--muted:#7A8699;--line:rgba(26,43,76,0.1);}
        *,*::before,*::after{box-sizing:border-box;}
        body{margin:0;font-family:'Inter',system-ui,sans-serif;background:var(--sand);color:var(--indigo);}
        .wrap{min-height:calc(100vh - var(--pp-h,0px));display:flex;align-items:center;justify-content:center;padding:2rem 1.25rem;}
        .card{background:white;border:1px solid var(--line);border-radius:22px;box-shadow:0 12px 40px rgba(26,43,76,0.1);padding:2.2rem;max-width:420px;width:100%;}
        .logo{font-size:1.5rem;font-weight:800;letter-spacing:-0.04em;text-align:center;text-decoration:none;color:var(--indigo);display:block;}
        .logo span{color:var(--cacao);}
        h1{font-family:'Playfair Display',Georgia,serif;font-size:1.6rem;font-weight:700;text-align:center;margin:1.5rem 0 .3rem;}
        .sub{text-align:center;color:var(--muted);font-size:.9rem;margin-bottom:1.75rem;}
        label{display:block;font-size:.72rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);margin:.9rem 0 .4rem;}
        input{width:100%;padding:.85rem 1rem;border:1.5px solid var(--line);border-radius:12px;font-family:inherit;font-size:.92rem;color:var(--indigo);outline:none;transition:border .15s;}
        input:focus{border-color:var(--cacao);}
        button{width:100%;margin-top:1.25rem;padding:.95rem;background:linear-gradient(135deg,var(--cacao),var(--cacao-dark));color:white;border:none;border-radius:999px;font-family:inherit;font-size:.92rem;font-weight:700;cursor:pointer;}
        button:disabled{opacity:.5;cursor:not-allowed;}
        .err{background:rgba(239,68,68,.08);border:1px solid rgba(239,68,68,.25);color:#dc2626;border-radius:10px;padding:.7rem .9rem;font-size:.84rem;margin-top:1rem;}
        .ok{background:rgba(16,185,129,.08);border:1px solid rgba(16,185,129,.3);color:#0f9d6b;border-radius:12px;padding:1rem;font-size:.9rem;line-height:1.6;text-align:center;}
        .back{display:block;text-align:center;margin-top:1.25rem;font-size:.84rem;color:var(--muted);text-decoration:none;}
      `}</style>
      <LangCorner />
      <div className="wrap">
        <div className="card">
          <Link href="/" className="logo">RESER<span>-VE</span></Link>
          {!token ? (
            <>
              <h1>{t("Enlace inválido")}</h1>
              <div className="ok" style={{background:'rgba(239,68,68,.06)',border:'1px solid rgba(239,68,68,.2)',color:'#b91c1c'}}>{t("Este enlace no es válido. Solicita uno nuevo.")}</div>
              <Link href="/recuperar" className="back">{t("← Solicitar enlace de recuperación")}</Link>
            </>
          ) : done ? (
            <>
              <h1>{t("¡Contraseña actualizada!")}</h1>
              <div className="ok">{t("Listo. Ya puedes iniciar sesión con tu nueva contraseña. Redirigiendo…")}</div>
              <Link href="/login" className="back">{t("Ir a iniciar sesión →")}</Link>
            </>
          ) : (
            <>
              <h1>{t("Nueva contraseña")}</h1>
              <div className="sub">{t("Crea una contraseña nueva para tu cuenta.")}</div>
              <form onSubmit={submit}>
                <label>{t("Nueva contraseña")}</label>
                <input type="password" required placeholder={t('Mínimo 8 caracteres')} value={pass} onChange={e => setPass(e.target.value)} />
                <label>{t("Repite la contraseña")}</label>
                <input type="password" required placeholder={t('Repite la contraseña')} value={pass2} onChange={e => setPass2(e.target.value)} />
                {error && <div className="err">{error}</div>}
                <button type="submit" disabled={busy}>{busy ? t('Guardando…') : t('Guardar contraseña')}</button>
              </form>
            </>
          )}
        </div>
      </div>
    </>
  )
}

export default function RestablecerPage() {
  return (
    <Suspense fallback={<div style={{minHeight:'100vh',background:'#FDFBF7'}} />}>
      <Inner />
    </Suspense>
  )
}
