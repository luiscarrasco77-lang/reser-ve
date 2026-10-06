'use client'

import { useState, Suspense } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useT } from '@/components/LangProvider'
import LangCorner from '@/components/LangCorner'

function RegisterForm() {
  const router = useRouter()
  const t = useT()
  const searchParams = useSearchParams()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<'traveler' | 'host'>(searchParams.get('role') === 'host' ? 'host' : 'traveler')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, role }),
    })

    if (!res.ok) {
      const data = await res.json()
      setError(t(data.error || 'Error al registrar'))
      setLoading(false)
      return
    }

    // Auto sign-in after registration
    const signInRes = await signIn('credentials', { email, password, redirect: false })
    setLoading(false)

    if (signInRes?.error) {
      setError(t('Cuenta creada, pero error al iniciar sesión automáticamente'))
      router.push('/login')
      return
    }

    router.push(role === 'host' ? '/dashboard' : '/')
  }

  return (
    <>
      <style>{`
        :root{--indigo:#1A2B4C;--cacao:#E67E22;--cacao-dark:#C96510;--sand:#FDFBF7;--muted:#7A8699;--line:rgba(26,43,76,0.08);}
        *,*::before,*::after{margin:0;padding:0;box-sizing:border-box;}
        body{font-family:'Inter',sans-serif;background:var(--sand);color:var(--indigo);min-height:100dvh;display:flex;flex-direction:column;}
        .auth-wrap{flex:1;display:flex;align-items:center;justify-content:center;padding:2rem 1.25rem;}
        .auth-card{background:white;border:1.5px solid var(--line);border-radius:24px;padding:2.4rem 2.2rem;width:100%;max-width:440px;box-shadow:0 16px 56px rgba(26,43,76,0.10);}
        .auth-logo{text-align:center;margin-bottom:1.8rem;}
        .auth-logo a{font-size:1.6rem;font-weight:800;letter-spacing:-0.04em;color:var(--indigo);text-decoration:none;}
        .auth-logo span{color:var(--cacao);}
        .auth-title{font-family:'Playfair Display',Georgia,serif;font-size:1.65rem;font-weight:700;text-align:center;margin-bottom:0.35rem;}
        .auth-sub{font-size:0.87rem;color:var(--muted);text-align:center;margin-bottom:1.8rem;}
        .field{margin-bottom:1rem;}
        .field label{display:block;font-size:0.75rem;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:var(--muted);margin-bottom:0.4rem;}
        .field input{width:100%;padding:0.82rem 1rem;border:1.5px solid var(--line);border-radius:12px;font-size:0.9rem;font-family:inherit;color:var(--indigo);background:white;transition:border-color 0.2s;outline:none;}
        .field input:focus{border-color:var(--cacao);}
        .role-grid{display:grid;grid-template-columns:1fr 1fr;gap:0.75rem;margin-bottom:1.2rem;}
        .role-card{border:2px solid var(--line);border-radius:14px;padding:1rem 0.75rem;cursor:pointer;text-align:center;transition:all 0.18s;background:white;}
        .role-card:hover{border-color:rgba(230,126,34,0.4);background:rgba(253,251,247,0.7);}
        .role-card.active{border-color:var(--cacao);background:rgba(230,126,34,0.05);}
        .role-card .role-icon{margin-bottom:0.4rem;color:var(--cacao);display:flex;justify-content:center;}
        .role-card .role-label{font-size:0.82rem;font-weight:700;color:var(--indigo);}
        .role-card .role-desc{font-size:0.73rem;color:var(--muted);margin-top:0.2rem;}
        .role-section-label{font-size:0.75rem;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:var(--muted);margin-bottom:0.6rem;}
        .btn-submit{width:100%;padding:0.95rem;border-radius:12px;background:var(--cacao);color:white;border:none;font-size:0.93rem;font-weight:700;font-family:inherit;cursor:pointer;transition:all 0.2s;margin-top:0.5rem;}
        .btn-submit:hover:not(:disabled){background:var(--cacao-dark);transform:translateY(-1px);}
        .btn-submit:disabled{opacity:0.6;cursor:not-allowed;}
        .auth-error{background:rgba(220,38,38,0.07);border:1px solid rgba(220,38,38,0.2);border-radius:10px;padding:0.7rem 1rem;font-size:0.84rem;color:#dc2626;margin-bottom:1rem;text-align:center;}
        .auth-footer{text-align:center;margin-top:1.5rem;font-size:0.84rem;color:var(--muted);}
        .auth-footer a{color:var(--cacao);font-weight:600;text-decoration:none;}
        .auth-footer a:hover{text-decoration:underline;}
        .back-link{display:flex;align-items:center;justify-content:center;gap:0.35rem;font-size:0.8rem;color:var(--muted);text-decoration:none;margin-bottom:1.5rem;transition:color 0.2s;}
        .back-link:hover{color:var(--indigo);}
      `}</style>
      <LangCorner />
      <div className="auth-wrap">
        <div>
          <a href="/" className="back-link">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
            {t("Volver al inicio")}
          </a>
          <div className="auth-card">
            <div className="auth-logo">
              <a href="/">RESER<span>-VE</span></a>
            </div>
            <h1 className="auth-title">{t("Crea tu cuenta")}</h1>
            <p className="auth-sub">{t("Únete a la comunidad de posadas venezolanas")}</p>

            {error && <div className="auth-error">{error}</div>}

            <form onSubmit={handleSubmit}>
              <div className="role-section-label">{t("Soy…")}</div>
              <div className="role-grid">
                <div
                  className={`role-card${role === 'traveler' ? ' active' : ''}`}
                  onClick={() => setRole('traveler')}
                  role="button"
                  tabIndex={0}
                  onKeyDown={e => e.key === 'Enter' && setRole('traveler')}
                >
                  <div className="role-icon"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></div>
                  <div className="role-label">{t("Viajero")}</div>
                  <div className="role-desc">{t("Quiero explorar y reservar posadas")}</div>
                </div>
                <div
                  className={`role-card${role === 'host' ? ' active' : ''}`}
                  onClick={() => setRole('host')}
                  role="button"
                  tabIndex={0}
                  onKeyDown={e => e.key === 'Enter' && setRole('host')}
                >
                  <div className="role-icon"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/></svg></div>
                  <div className="role-label">{t("Posadero")}</div>
                  <div className="role-desc">{t("Quiero publicar mi posada")}</div>
                </div>
              </div>

              <div className="field">
                <label>{t("Nombre completo")}</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} required placeholder={t('Tu nombre')} />
              </div>
              <div className="field">
                <label>Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder={t('tu@email.com')} />
              </div>
              <div className="field">
                <label>{t("Contraseña")}</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder={t('Mínimo 8 caracteres')} minLength={8} />
              </div>

              <button type="submit" className="btn-submit" disabled={loading}>
                {loading ? t('Creando cuenta…') : t('Crear cuenta gratis')}
              </button>
              <p style={{ fontSize: '0.74rem', color: '#7A8699', textAlign: 'center', marginTop: '0.8rem', lineHeight: 1.5 }}>
                {t('Al crear tu cuenta aceptas los')} <a href="/terminos" target="_blank" style={{ color: '#E67E22' }}>{t("Términos")}</a> {t('y la')} <a href="/privacidad" target="_blank" style={{ color: '#E67E22' }}>{t("Política de privacidad")}</a>
                {role === 'host' && <> {t('y las')} <a href="/posaderos#condiciones" target="_blank" style={{ color: '#E67E22' }}>{t("condiciones para posaderos")}</a> ({t('10% por reserva confirmada, mismo precio y mismas ofertas que en otros canales, y comunicación dentro de la app')})</>}.
              </p>
            </form>

            <div className="auth-footer">
              {t('¿Ya tienes cuenta?')} <a href="/login">{t("Inicia sesión")}</a>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  )
}
