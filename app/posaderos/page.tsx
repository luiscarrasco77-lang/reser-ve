import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Para posaderos | RESER-VE',
  description: 'Publica tu posada venezolana y llega a miles de viajeros que buscan experiencias auténticas. Sin comisiones, sin complicaciones.',
}

const benefits = [
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
        <circle cx="12" cy="9" r="2.5"/>
      </svg>
    ),
    title: 'Visibilidad nacional e internacional',
    desc: 'Tu posada aparece en búsquedas de viajeros venezolanos y de la diáspora en todo el mundo que quieren redescubrir Venezuela. Llega a un público que valora la autenticidad.',
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="8" x2="12" y2="12"/>
        <line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
    ),
    title: 'Sin comisiones',
    desc: 'RESER-VE no cobra comisiones sobre tus reservas. El dinero va directo a ti. Los viajeros pagan con Zelle, efectivo, transferencia — tú decides.',
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
    title: 'Comunicación directa con el huésped',
    desc: 'Sin intermediarios. El viajero se comunica contigo directamente para coordinar la llegada, preferencias y cualquier detalle especial. Tú construyes la relación.',
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
      </svg>
    ),
    title: 'Reseñas auténticas',
    desc: 'Construye tu reputación con reseñas reales de huéspedes verificados. Una buena reputación es el mejor marketing que existe para una posada.',
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2"/>
        <line x1="8" y1="21" x2="16" y2="21"/>
        <line x1="12" y1="17" x2="12" y2="21"/>
      </svg>
    ),
    title: 'Perfil digital profesional',
    desc: 'Tu posada tendrá una página propia con galería de fotos, descripción, servicios, mapa interactivo y reseñas. Una presencia online digna, sin que tengas que crear un sitio web.',
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
        <polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    ),
    title: 'Parte del ecosistema venezolano',
    desc: 'RESER-VE nació para fortalecer el turismo venezolano desde adentro. Al unirte, eres parte de un movimiento que promueve la autenticidad y el turismo responsable en Venezuela.',
  },
]

const steps = [
  {
    n: '01',
    title: 'Regístrate',
    desc: 'Completa el formulario de registro con los datos de tu posada. El proceso toma menos de 10 minutos.',
  },
  {
    n: '02',
    title: 'Revisamos tu perfil',
    desc: 'Nuestro equipo verifica la información y te contacta para completar los detalles. Queremos que tu posada brille.',
  },
  {
    n: '03',
    title: 'Sal en vivo',
    desc: 'Tu posada aparece en el buscador, el mapa y las sugerencias. Los viajeros empiezan a encontrarte.',
  },
  {
    n: '04',
    title: 'Recibe huéspedes',
    desc: 'Coordina directamente con cada viajero. Cobra como siempre lo has hecho. Sin plataformas intermediarias.',
  },
]

export default function PosaderosPage() {
  return (
    <>
      <style>{`
        :root {
          --indigo: #1A2B4C;
          --indigo-deep: #0F1B30;
          --sand: #FDFBF7;
          --cream: #F5EFE0;
          --cacao: #E67E22;
          --cacao-dark: #C96510;
          --muted: #7A8699;
          --line: rgba(26,43,76,0.08);
          --sh: 0 8px 32px rgba(26,43,76,0.10);
        }
        *, *::before, *::after { margin:0; padding:0; box-sizing:border-box; }
        body { font-family:'Inter',sans-serif; background:var(--sand); color:var(--indigo); }

        /* Nav */
        .nav {
          position:sticky; top:0; z-index:60;
          display:flex; align-items:center; justify-content:space-between;
          padding:1rem 2rem;
          background:rgba(253,251,247,0.95); backdrop-filter:blur(20px);
          border-bottom:1px solid var(--line);
        }
        .logo { font-size:1.4rem; font-weight:800; letter-spacing:-0.04em; color:var(--indigo); text-decoration:none; }
        .logo span { color:var(--cacao); }
        .nav-cta {
          padding:0.65rem 1.2rem; border-radius:999px;
          background:var(--cacao); color:white;
          font-size:0.84rem; font-weight:700;
          text-decoration:none; transition:all 0.2s;
          box-shadow:0 6px 20px rgba(230,126,34,0.25);
        }
        .nav-cta:hover { background:var(--cacao-dark); transform:translateY(-1px); }

        /* Hero */
        .hero {
          position:relative; overflow:hidden;
          min-height:82vh; display:flex; align-items:center;
          padding:6rem 2rem 4rem;
        }
        .hero-bg {
          position:absolute; inset:0;
          background-image:url('/images/Jape.webp');
          background-size:cover; background-position:center;
          filter:saturate(1.05) brightness(0.55);
        }
        .hero-overlay {
          position:absolute; inset:0;
          background:linear-gradient(110deg, rgba(15,27,48,0.88) 0%, rgba(26,43,76,0.55) 50%, rgba(26,43,76,0.1) 100%);
        }
        .hero-content { position:relative; z-index:2; max-width:1100px; margin:0 auto; width:100%; }
        .hero-panel { max-width:620px; color:white; }
        .hero-eyebrow {
          display:inline-flex; align-items:center; gap:0.5rem;
          font-size:0.76rem; font-weight:700; letter-spacing:0.1em; text-transform:uppercase;
          background:rgba(230,126,34,0.9); color:white;
          padding:0.45rem 1rem; border-radius:999px; margin-bottom:1.5rem;
        }
        .hero h1 {
          font-family:'Playfair Display',Georgia,serif;
          font-size:clamp(2.8rem,6vw,5rem);
          font-weight:800; line-height:0.95; letter-spacing:-0.04em;
          margin-bottom:1.4rem;
        }
        .hero h1 em { font-style:italic; color:#ffc88a; }
        .hero-sub { font-size:1.05rem; color:rgba(255,255,255,0.8); line-height:1.75; margin-bottom:2.2rem; max-width:500px; }
        .hero-btns { display:flex; gap:1rem; flex-wrap:wrap; }
        .btn-primary {
          display:inline-flex; align-items:center; gap:0.5rem;
          padding:1rem 1.8rem; border-radius:999px;
          background:var(--cacao); color:white;
          font-size:0.92rem; font-weight:700; text-decoration:none;
          box-shadow:0 10px 28px rgba(230,126,34,0.32); transition:all 0.22s;
        }
        .btn-primary:hover { background:var(--cacao-dark); transform:translateY(-2px); }
        .btn-ghost-white {
          display:inline-flex; align-items:center; gap:0.5rem;
          padding:1rem 1.8rem; border-radius:999px;
          background:rgba(255,255,255,0.1); color:white;
          font-size:0.92rem; font-weight:600; text-decoration:none;
          border:1.5px solid rgba(255,255,255,0.28); transition:all 0.22s;
        }
        .btn-ghost-white:hover { background:rgba(255,255,255,0.18); }

        /* Benefits */
        .section { padding:4rem 2rem; max-width:1100px; margin:0 auto; }
        .sec-eyebrow {
          font-size:0.7rem; font-weight:700; letter-spacing:0.12em; text-transform:uppercase;
          color:var(--cacao); margin-bottom:0.7rem;
        }
        .sec-title {
          font-family:'Playfair Display',Georgia,serif;
          font-size:clamp(1.9rem,4vw,2.9rem); font-weight:700;
          letter-spacing:-0.03em; line-height:1.1;
          margin-bottom:1rem; color:var(--indigo);
        }
        .sec-sub { font-size:1rem; color:var(--muted); line-height:1.7; max-width:540px; margin-bottom:3rem; }

        .benefits-grid {
          display:grid; grid-template-columns:repeat(3,1fr); gap:1.4rem;
        }
        @media(max-width:860px){ .benefits-grid { grid-template-columns:repeat(2,1fr); } }
        @media(max-width:560px){ .benefits-grid { grid-template-columns:1fr; } }

        .benefit-card {
          background:white; border:1.5px solid var(--line);
          border-radius:18px; padding:1.6rem 1.4rem;
          box-shadow:var(--sh); transition:all 0.24s;
        }
        .benefit-card:hover { transform:translateY(-3px); box-shadow:0 16px 48px rgba(26,43,76,0.12); border-color:rgba(230,126,34,0.2); }
        .benefit-icon {
          width:52px; height:52px; border-radius:14px;
          background:rgba(230,126,34,0.08); color:var(--cacao);
          display:flex; align-items:center; justify-content:center;
          margin-bottom:1rem;
        }
        .benefit-title { font-size:0.98rem; font-weight:700; margin-bottom:0.48rem; color:var(--indigo); }
        .benefit-desc { font-size:0.86rem; color:var(--muted); line-height:1.65; }

        /* Steps */
        .steps-section { background:var(--indigo); padding:4.5rem 2rem; }
        .steps-inner { max-width:1100px; margin:0 auto; }
        .steps-section .sec-eyebrow { color:rgba(230,126,34,0.9); }
        .steps-section .sec-title { color:white; }
        .steps-section .sec-sub { color:rgba(255,255,255,0.62); }
        .steps-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:1.2rem; }
        @media(max-width:860px){ .steps-grid { grid-template-columns:repeat(2,1fr); } }
        @media(max-width:480px){ .steps-grid { grid-template-columns:1fr; } }
        .step-card { background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); border-radius:16px; padding:1.5rem 1.3rem; }
        .step-num { font-family:'Playfair Display',Georgia,serif; font-size:2.2rem; font-weight:800; color:rgba(230,126,34,0.5); line-height:1; margin-bottom:0.8rem; }
        .step-title { font-size:0.97rem; font-weight:700; color:white; margin-bottom:0.4rem; }
        .step-desc { font-size:0.83rem; color:rgba(255,255,255,0.55); line-height:1.6; }

        /* Vision callout */
        .vision-callout {
          background:var(--cream); border:1.5px solid rgba(230,126,34,0.18);
          border-radius:22px; padding:2.4rem 2.2rem;
          display:flex; align-items:center; gap:2rem;
          margin-top:3rem; flex-wrap:wrap;
        }
        .vision-text { flex:1; min-width:260px; }
        .vision-text h3 {
          font-family:'Playfair Display',Georgia,serif;
          font-size:1.35rem; font-weight:700; color:var(--indigo);
          margin-bottom:0.5rem;
        }
        .vision-text p { font-size:0.88rem; color:var(--muted); line-height:1.65; }
        .vision-link {
          padding:0.8rem 1.5rem; border-radius:999px;
          background:var(--indigo); color:white;
          font-size:0.86rem; font-weight:700;
          text-decoration:none; white-space:nowrap; transition:all 0.2s;
          flex-shrink:0;
        }
        .vision-link:hover { background:#1e3a6e; transform:translateY(-1px); }

        /* CTA */
        .cta-section { background:var(--cream); padding:4rem 2rem; text-align:center; }
        .cta-box { max-width:580px; margin:0 auto; }
        .cta-box h2 {
          font-family:'Playfair Display',Georgia,serif;
          font-size:clamp(1.8rem,4vw,2.6rem); font-weight:700;
          letter-spacing:-0.03em; color:var(--indigo); margin-bottom:0.8rem;
        }
        .cta-box p { font-size:1rem; color:var(--muted); line-height:1.7; margin-bottom:2rem; }
        .cta-btns { display:flex; gap:0.8rem; justify-content:center; flex-wrap:wrap; }
        .btn-indigo {
          padding:0.95rem 1.8rem; border-radius:999px;
          background:var(--indigo); color:white;
          font-size:0.92rem; font-weight:700;
          text-decoration:none; transition:all 0.2s;
          box-shadow:0 8px 24px rgba(26,43,76,0.22);
        }
        .btn-indigo:hover { background:#1e3a6e; transform:translateY(-1px); }

        @media(max-width:640px){
          .hero { min-height:75vh; padding:5rem 1.25rem 3rem; }
          .section { padding:3rem 1.25rem; }
          .steps-section { padding:3.5rem 1.25rem; }
          .cta-section { padding:3rem 1.25rem; }
        }
      `}</style>

      {/* Nav */}
      <nav className="nav">
        <a href="/" className="logo">RESER<span>-VE</span></a>
        <a href="/registro-posada" className="nav-cta">Registra tu posada</a>
      </nav>

      {/* Hero */}
      <section className="hero">
        <div className="hero-bg" />
        <div className="hero-overlay" />
        <div className="hero-content">
          <div className="hero-panel">
            <div className="hero-eyebrow">Para posaderos</div>
            <h1>Tu posada merece<br/><em>más viajeros</em></h1>
            <p className="hero-sub">
              RESER-VE conecta tu posada con miles de viajeros que buscan experiencias auténticas venezolanas. Sin comisiones, sin intermediarios, sin complicaciones.
            </p>
            <div className="hero-btns">
              <a href="/registro-posada" className="btn-primary">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12l7 7 7-7"/></svg>
                Publicar mi posada gratis
              </a>
              <a href="#como-funciona" className="btn-ghost-white">Cómo funciona</a>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <div className="section">
        <div className="sec-eyebrow">Por qué RESER-VE</div>
        <h2 className="sec-title">Todo lo que necesitas,<br/>nada que no necesitas</h2>
        <p className="sec-sub">Una plataforma pensada para el posadero venezolano: simple, directa y sin cargos sorpresa.</p>
        <div className="benefits-grid">
          {benefits.map(b => (
            <div key={b.title} className="benefit-card">
              <div className="benefit-icon">{b.icon}</div>
              <div className="benefit-title">{b.title}</div>
              <div className="benefit-desc">{b.desc}</div>
            </div>
          ))}
        </div>

        {/* Vision callout */}
        <div className="vision-callout">
          <div className="vision-text">
            <h3>¿Por qué las posadas son especiales?</h3>
            <p>Las posadas venezolanas son más que un hospedaje — son patrimonio cultural, hospitalidad familiar y autenticidad pura. Conoce nuestra visión sobre por qué apostamos por este modelo.</p>
          </div>
          <a href="/vision" className="vision-link">Leer nuestra visión →</a>
        </div>
      </div>

      {/* Steps */}
      <section className="steps-section" id="como-funciona">
        <div className="steps-inner">
          <div className="sec-eyebrow">Proceso</div>
          <h2 className="sec-title" style={{color:'white'}}>Estar en RESER-VE<br/>es muy sencillo</h2>
          <p className="sec-sub">Cuatro pasos para que tu posada llegue a viajeros de todo el mundo.</p>
          <div className="steps-grid">
            {steps.map(s => (
              <div key={s.n} className="step-card">
                <div className="step-num">{s.n}</div>
                <div className="step-title">{s.title}</div>
                <div className="step-desc">{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section">
        <div className="cta-box">
          <h2>¿Listo para recibir más huéspedes?</h2>
          <p>Únete a las posadas que ya confían en RESER-VE para conectar con viajeros que valoran lo auténtico.</p>
          <div className="cta-btns">
            <a href="/registro-posada" className="btn-primary">Registrar mi posada</a>
            <a href="/buscar" className="btn-indigo">Ver posadas de ejemplo</a>
          </div>
        </div>
      </section>
    </>
  )
}
