'use client'

import { useEffect, useState } from 'react'

export default function Home() {
  const [scrollY, setScrollY] = useState(0)
  const [loaded, setLoaded] = useState(false)
  const [activeTab, setActiveTab] = useState<'viajero' | 'posadero'>('viajero')

  useEffect(() => {
    setLoaded(true)
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const destinos = [
    { name: 'Los Roques', tag: 'Archipiélago', count: '12 posadas', img: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&q=80' },
    { name: 'Mérida', tag: 'Los Andes', count: '9 posadas', img: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80' },
    { name: 'Mochima', tag: 'Costa Oriental', count: '7 posadas', img: 'https://images.unsplash.com/photo-1559128010-7c1ad6e1b6a5?w=800&q=80' },
    { name: 'Morrocoy', tag: 'Costa Occidental', count: '6 posadas', img: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80' },
    { name: 'Canaima', tag: 'Gran Sabana', count: '4 posadas', img: 'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=800&q=80' },
    { name: 'Isla Margarita', tag: 'Caribe', count: '11 posadas', img: 'https://images.unsplash.com/photo-1519046904884-53103b34b206?w=800&q=80' },
  ]

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');

        :root {
          --indigo: #1A2B4C;
          --sand: #FDFBF7;
          --cacao: #E67E22;
          --cacao-dark: #C96510;
          --text: #23324A;
          --muted: #6B7482;
          --line: rgba(26,43,76,0.10);
          --card: rgba(255,255,255,0.78);
          --shadow: 0 20px 60px rgba(26,43,76,0.10);
        }

        * { margin:0; padding:0; box-sizing:border-box; }
        html { scroll-behavior: smooth; }

        body {
          font-family: 'Inter', sans-serif;
          background: radial-gradient(circle at top left, rgba(230,126,34,0.08) 0%, transparent 28%),
            radial-gradient(circle at top right, rgba(26,43,76,0.06) 0%, transparent 30%),
            linear-gradient(180deg, #fffefb 0%, var(--sand) 42%, #f8f3ea 100%);
          color: var(--text);
          overflow-x: hidden;
        }

        @keyframes fadeUp {
          from { opacity:0; transform:translateY(26px); }
          to { opacity:1; transform:translateY(0); }
        }
        .anim-0 { animation: fadeUp 0.8s cubic-bezier(0.16,1,0.3,1) 0.05s both; }
        .anim-1 { animation: fadeUp 0.8s cubic-bezier(0.16,1,0.3,1) 0.15s both; }
        .anim-2 { animation: fadeUp 0.8s cubic-bezier(0.16,1,0.3,1) 0.25s both; }
        .anim-3 { animation: fadeUp 0.8s cubic-bezier(0.16,1,0.3,1) 0.35s both; }
        .anim-4 { animation: fadeUp 0.8s cubic-bezier(0.16,1,0.3,1) 0.45s both; }

        .grain {
          position:fixed; inset:0; pointer-events:none; z-index:100; opacity:0.018;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
        }

        /* NAV */
        .nav {
          position:fixed; top:0; left:0; right:0; z-index:60;
          display:flex; align-items:center; justify-content:space-between;
          padding:1rem 2rem; transition:all 0.35s ease;
        }
        .nav.scrolled {
          background: rgba(253,251,247,0.88);
          backdrop-filter: blur(18px);
          border-bottom: 1px solid var(--line);
          box-shadow: 0 8px 30px rgba(26,43,76,0.05);
        }
        .logo { font-size:3.05rem; font-weight:800; letter-spacing:-0.04em; color:var(--indigo); }
        .logo span { color:var(--cacao); }
        .nav-links { display:flex; align-items:center; gap:1.5rem; }
        .nav-links a { font-size:0.94rem; color:rgba(26,43,76,0.78); text-decoration:none; transition:color 0.22s; }
        .nav-links a:hover { color:var(--indigo); }
        .nav-cta {
          padding:0.75rem 1.15rem; border-radius:999px;
          font-size:0.84rem; font-weight:600; cursor:pointer;
          background:var(--cacao); border:1px solid var(--cacao); color:white;
          box-shadow:0 12px 30px rgba(230,126,34,0.22); transition:all 0.22s;
          font-family:'Inter',sans-serif;
        }
        .nav-cta:hover { background:var(--cacao-dark); transform:translateY(-1px); }

        /* HERO */
        .hero {
          min-height: 100vh; position:relative;
          display:flex; flex-direction:column;
          align-items:center; justify-content:center;
          overflow:hidden; padding:7rem 1.5rem 3rem;
        }
        .hero-bg-img {
          position:absolute; inset:0;
          background: url('/images/los-roques-hero.webp') center/cover no-repeat;
          filter: saturate(1.05) brightness(0.82);
        }
        .hero-bg {
          position:absolute; inset:0;
          background: linear-gradient(180deg, rgba(253,251,247,0.05) 0%, rgba(253,251,247,0.55) 100%);
        }
        .hero-overlay {
          position:absolute; inset:0;
          background: linear-gradient(105deg, rgba(26,43,76,0.78) 0%, rgba(26,43,76,0.5) 40%, rgba(26,43,76,0.12) 70%, transparent 100%);
        }
        .hero-content {
          position:relative; z-index:2;
          width:100%; max-width:1100px;
          margin:0 auto; color:white;
        }
        .hero-panel { max-width:600px; padding:1rem 0; }
        .hero-badges { display:flex; gap:0.6rem; flex-wrap:wrap; margin-bottom:1rem; }
        .hero-badge {
          display:inline-flex; align-items:center;
          padding:0.45rem 0.9rem; font-size:0.76rem; font-weight:600;
          border-radius:999px; background:rgba(230,126,34,0.95); color:white;
          box-shadow:0 10px 24px rgba(230,126,34,0.18);
        }
        .hero-h1 {
          font-size:clamp(2.8rem, 7vw, 5.5rem); line-height:0.95;
          letter-spacing:-0.065em; font-weight:800; margin-bottom:1rem;
        }
        .hero-h1 em { font-style:normal; color:#ffe1c4; }
        .hero-sub {
          max-width:540px; font-size:1rem; line-height:1.75;
          color:rgba(255,255,255,0.86); margin-bottom:1.6rem;
        }
        .hero-btns { display:flex; gap:0.9rem; flex-wrap:wrap; margin-bottom:0; }
        .btn-primary {
          display:inline-block; text-decoration:none;
          padding:0.98rem 1.6rem; border-radius:999px;
          font-size:0.94rem; font-weight:600;
          background:var(--cacao); border:1px solid var(--cacao); color:white;
          box-shadow:0 12px 30px rgba(230,126,34,0.28); transition:all 0.22s;
        }
        .btn-primary:hover { background:var(--cacao-dark); transform:translateY(-1px); }
        .btn-secondary {
          display:inline-block; text-decoration:none;
          padding:0.98rem 1.6rem; border-radius:999px;
          font-size:0.94rem; font-weight:600;
          background:transparent; color:white;
          border:1px solid rgba(255,255,255,0.42);
          backdrop-filter:blur(8px); transition:all 0.22s;
        }
        .btn-secondary:hover { background:rgba(255,255,255,0.12); transform:translateY(-1px); }

        /* SEARCH BAR */
        .search-wrap {
          position:relative; z-index:3;
          width:100%; max-width:1100px;
          margin:2rem auto 0; padding:0 0;
        }
        .search-bar {
          max-width:780px;
          padding:0.65rem;
          display:grid;
          grid-template-columns: 1.4fr 1fr 1fr auto;
          gap:0.65rem;
          background:rgba(255,255,255,0.92);
          border:1px solid rgba(26,43,76,0.08);
          backdrop-filter:blur(18px);
          box-shadow:0 20px 60px rgba(26,43,76,0.18);
          border-radius:22px;
        }
        .search-bar select, .search-bar input {
          width:100%; min-width:0;
          border:1px solid rgba(26,43,76,0.08);
          background:white; color:var(--indigo);
          padding:0.9rem 1rem; border-radius:14px;
          outline:none; font-size:0.9rem;
          font-family:'Inter',sans-serif;
        }
        .search-bar select option { background:white; color:var(--indigo); }
        .search-bar button {
          border:none; padding:0.9rem 1.35rem; border-radius:14px;
          font-size:0.9rem; font-weight:700; cursor:pointer; white-space:nowrap;
          background:var(--cacao); color:white;
          box-shadow:0 10px 24px rgba(230,126,34,0.22);
          transition:all 0.22s; font-family:'Inter',sans-serif;
        }
        .search-bar button:hover { background:var(--cacao-dark); }

        /* STATS */
        .stats {
          display:flex; justify-content:center;
          gap:1rem; flex-wrap:wrap;
          width:min(1100px, calc(100% - 2rem));
          margin:2rem auto 0; padding:0 0 1rem;
        }
        .stat-card {
          min-width:180px; padding:1.2rem 1.4rem;
          border-radius:20px;
          background:rgba(255,255,255,0.82);
          border:1px solid rgba(26,43,76,0.08);
          box-shadow:var(--shadow); text-align:center;
        }
        .stat-n { font-size:1.9rem; font-weight:800; letter-spacing:-0.05em; color:var(--indigo); margin-bottom:0.16rem; }
        .stat-l { font-size:0.82rem; color:var(--muted); }

        /* DIVIDER */
        .divider {
          width:min(1100px, calc(100% - 3rem)); height:1px; margin:0 auto;
          background:linear-gradient(to right, transparent, rgba(26,43,76,0.12), transparent);
        }

        /* SECTIONS */
        .section { padding:6rem 1.5rem; max-width:1100px; margin:0 auto; }
        .section-label {
          display:inline-block; padding:0.42rem 0.78rem; border-radius:999px;
          font-size:0.76rem; font-weight:700; color:var(--indigo);
          background:rgba(26,43,76,0.05); border:1px solid rgba(26,43,76,0.08);
          margin-bottom:1rem;
        }
        .section-h2 {
          font-size:clamp(2rem, 5vw, 3.5rem); line-height:1.02;
          letter-spacing:-0.06em; font-weight:800; color:var(--indigo); margin-bottom:0.8rem;
        }
        .section-h2 em { font-style:normal; color:var(--cacao); }
        .section-sub { font-size:1rem; line-height:1.78; color:var(--muted); max-width:700px; margin-bottom:2.4rem; }

        /* TABS */
        .tabs {
          display:inline-flex; padding:0.35rem; border-radius:999px;
          background:rgba(26,43,76,0.05); border:1px solid rgba(26,43,76,0.08);
          margin-bottom:2rem; gap:0.35rem;
        }
        .tab-btn {
          padding:0.82rem 1.2rem; border:none; border-radius:999px;
          background:transparent; color:rgba(26,43,76,0.62);
          font-size:0.9rem; font-weight:600; cursor:pointer;
          transition:all 0.22s; font-family:'Inter',sans-serif;
        }
        .tab-btn.active { background:var(--indigo); color:white; box-shadow:0 12px 24px rgba(26,43,76,0.18); }

        /* STEPS */
        .steps-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(220px,1fr)); gap:1rem; }
        .step-card {
          padding:1.5rem; border-radius:24px;
          background:rgba(255,255,255,0.78);
          border:1px solid rgba(26,43,76,0.08);
          box-shadow:var(--shadow); transition:transform 0.3s ease;
        }
        .step-card:hover { transform:translateY(-3px); }
        .step-num { font-size:2rem; font-weight:800; letter-spacing:-0.04em; color:var(--cacao); margin-bottom:0.7rem; }
        .step-title { font-size:1rem; font-weight:700; color:var(--indigo); margin-bottom:0.5rem; }
        .step-desc { font-size:0.92rem; line-height:1.7; color:var(--muted); }

        /* DESTINOS */
        .dest-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(280px,1fr)); gap:1rem; }
        .dest-card {
          position:relative; overflow:hidden; aspect-ratio:4/3; cursor:pointer;
          border-radius:24px; border:1px solid rgba(26,43,76,0.08);
          transition:transform 0.32s ease, box-shadow 0.32s ease;
          box-shadow:var(--shadow);
        }
        .dest-card:hover { transform:translateY(-4px); box-shadow:0 24px 45px rgba(26,43,76,0.16); }
        .dest-card img { width:100%; height:100%; object-fit:cover; transition:transform 0.45s ease; filter:brightness(0.80); }
        .dest-card:hover img { transform:scale(1.04); }
        .dest-overlay { position:absolute; inset:0; background:linear-gradient(to top, rgba(26,43,76,0.88) 0%, rgba(26,43,76,0.12) 65%); }
        .dest-info { position:absolute; left:0; right:0; bottom:0; padding:1.35rem; }
        .dest-tag {
          display:inline-block; margin-bottom:0.55rem;
          padding:0.36rem 0.65rem; border-radius:999px;
          font-size:0.72rem; font-weight:700; color:white;
          background:rgba(230,126,34,0.96);
        }
        .dest-name { font-size:1.45rem; font-weight:800; letter-spacing:-0.04em; color:white; margin-bottom:0.25rem; }
        .dest-count { font-size:0.88rem; color:rgba(255,255,255,0.84); }

        /* POSADERO */
        .posadero-section {
          background:rgba(255,255,255,0.80); border:1px solid rgba(26,43,76,0.08);
          padding:2.5rem; border-radius:28px;
          display:flex; gap:2.5rem; align-items:flex-start; flex-wrap:wrap;
          box-shadow:var(--shadow);
        }
        .posadero-left { flex:1.2; min-width:280px; }
        .posadero-right { flex:1; min-width:260px; }
        .feature-list { display:flex; flex-direction:column; gap:0.9rem; margin-top:1.2rem; }
        .feature-item { display:flex; align-items:flex-start; gap:0.75rem; }
        .feature-dot { width:9px; height:9px; border-radius:999px; background:var(--cacao); margin-top:0.42rem; flex-shrink:0; }
        .feature-text { font-size:0.94rem; line-height:1.7; color:var(--muted); }

        /* PLAN CARD */
        .plan-card {
          padding:1.75rem; border-radius:24px;
          background:linear-gradient(180deg, #fffaf3 0%, #ffffff 100%);
          border:1px solid rgba(230,126,34,0.18);
          box-shadow:0 22px 50px rgba(230,126,34,0.10);
        }
        .plan-label {
          display:inline-block; margin-bottom:0.9rem;
          padding:0.35rem 0.6rem; border-radius:999px;
          font-size:0.76rem; font-weight:700; color:var(--cacao-dark);
          background:rgba(230,126,34,0.10); border:1px solid rgba(230,126,34,0.12);
        }
        .plan-price { font-size:2.6rem; font-weight:800; line-height:1; letter-spacing:-0.05em; color:var(--indigo); }
        .plan-price span { font-size:0.9rem; font-weight:500; color:var(--muted); }
        .plan-desc { font-size:0.95rem; line-height:1.7; color:var(--muted); margin:0.85rem 0 1.2rem; }
        .plan-items { list-style:none; display:flex; flex-direction:column; gap:0.7rem; margin-bottom:1.4rem; }
        .plan-items li { font-size:0.92rem; color:var(--text); display:flex; gap:0.6rem; align-items:flex-start; }
        .plan-items li::before { content:'✓'; color:var(--cacao); font-weight:700; flex-shrink:0; }
        .full-btn { width:100%; text-align:center; cursor:pointer; }

        /* FOOTER */
        footer {
          border-top:1px solid rgba(26,43,76,0.08);
          padding:2rem 1.5rem;
          display:flex; align-items:center; justify-content:space-between;
          flex-wrap:wrap; gap:1rem;
          max-width:1100px; margin:0 auto;
        }
        footer a { color:rgba(26,43,76,0.64); text-decoration:none; font-size:0.9rem; transition:color 0.2s; }
        footer a:hover { color:var(--indigo); }
        .footer-logo { font-size:1rem; font-weight:800; color:var(--indigo); }
        .footer-logo span { color:var(--cacao); }

        /* RESPONSIVE */
        @media (max-width:900px) {
          .search-bar { grid-template-columns:1fr 1fr; }
        }

        @media (max-width:768px) {
          .nav { padding:0.9rem 1rem; }
          .nav-links { display:none; }

          .hero {
            padding:5.5rem 1rem 2.5rem;
            justify-content:flex-start;
          }
          .hero-panel {
            max-width:100%;
            padding:0.5rem 0 1rem;
          }
          .hero-h1 { font-size:clamp(2.4rem, 11vw, 3.2rem); }
          .hero-sub { font-size:0.92rem; }
          .hero-overlay {
            background:linear-gradient(180deg, rgba(26,43,76,0.72) 0%, rgba(26,43,76,0.55) 50%, rgba(26,43,76,0.28) 100%);
          }

          .search-wrap { margin-top:1.5rem; padding:0; }
          .search-bar {
            grid-template-columns:1fr;
            border-radius:20px;
            max-width:100%;
          }

          .stats { flex-direction:column; align-items:stretch; }
          .stat-card { width:100%; min-width:unset; }

          .section { padding:4rem 1rem; }
          .dest-grid { grid-template-columns:1fr; }
          .posadero-section { padding:1.5rem; gap:1.5rem; }
          footer { padding:2rem 1rem; }
        }
      `}</style>

      <div className="grain" />

      {/* NAV */}
      <nav className={`nav ${scrollY > 50 ? 'scrolled' : ''}`}>
        <div className="logo">RESER<span>-VE</span></div>
        <div className="nav-links">
          <a href="#destinos">Destinos</a>
          <a href="#posaderos">Posaderos</a>
          <a href="#como-funciona">Cómo funciona</a>
          <button className="nav-cta">Registra tu posada</button>
        </div>
      </nav>

      {/* HERO */}
      <section className="hero">
        <div className="hero-bg-img" style={{ transform: `translateY(${scrollY * 0.18}px)` }} />
        <div className="hero-bg" />
        <div className="hero-overlay" />

        <div className="hero-content">
          <div className="hero-panel">
            <div className={`hero-badges ${loaded ? 'anim-0' : ''}`}>
              <span className="hero-badge">Boutique</span>
              <span className="hero-badge">Venezuela</span>
            </div>
            <h1 className={`hero-h1 ${loaded ? 'anim-1' : ''}`}>
              Descubre <br />
              <em>posadas auténticas</em><br />
              en Venezuela
            </h1>
            <p className={`hero-sub ${loaded ? 'anim-2' : ''}`}>
              La primera plataforma especializada en alojamientos locales venezolanos.
              Reserva con confianza y paga en USD o bolívares con Zelle, Pago Móvil, transferencia o Binance.
            </p>
            <div className={`hero-btns ${loaded ? 'anim-3' : ''}`}>
              <a href="#destinos" className="btn-primary">Explorar posadas</a>
              <a href="#posaderos" className="btn-secondary">¿Tienes una posada?</a>
            </div>
          </div>
        </div>

        <div className={`search-wrap ${loaded ? 'anim-4' : ''}`}>
          <div className="search-bar">
            <select>
              <option>¿A dónde vas?</option>
              <option>Los Roques</option>
              <option>Mérida</option>
              <option>Mochima</option>
              <option>Morrocoy</option>
              <option>Canaima</option>
              <option>Isla Margarita</option>
            </select>
            <input type="date" />
            <select>
              <option>Tipo de pago</option>
              <option>Zelle</option>
              <option>Pago Móvil</option>
              <option>Transferencia</option>
              <option>Binance</option>
            </select>
            <button>Buscar</button>
          </div>
        </div>
      </section>

      {/* STATS */}
      <div className={`stats ${loaded ? 'anim-4' : ''}`}>
        <div className="stat-card">
          <div className="stat-n">+3.4M</div>
          <div className="stat-l">turistas en 2025</div>
        </div>
        <div className="stat-card">
          <div className="stat-n">+44%</div>
          <div className="stat-l">crecimiento turístico</div>
        </div>
        <div className="stat-card">
          <div className="stat-n">Flexible</div>
          <div className="stat-l">USD, bolívares, Zelle, Binance y más</div>
        </div>
      </div>

      <div className="divider" style={{ marginTop: '2rem' }} />

      {/* CÓMO FUNCIONA */}
      <section id="como-funciona" className="section">
        <div className="section-label">Cómo funciona</div>
        <h2 className="section-h2">Simple para <em>todos</em></h2>
        <p className="section-sub">Desde la búsqueda hasta el check-in. Una experiencia clara y confiable para viajeros y posaderos.</p>
        <div className="tabs">
          <button className={`tab-btn ${activeTab === 'viajero' ? 'active' : ''}`} onClick={() => setActiveTab('viajero')}>
            Soy viajero
          </button>
          <button className={`tab-btn ${activeTab === 'posadero' ? 'active' : ''}`} onClick={() => setActiveTab('posadero')}>
            Tengo una posada
          </button>
        </div>
        {activeTab === 'viajero' ? (
          <div className="steps-grid">
            {[
              ['Busca tu destino', 'Filtra por destino, fechas y método de pago en los rincones más especiales de Venezuela.'],
              ['Elige con confianza', 'Fotos profesionales, perfiles cuidados y toda la información antes de reservar.'],
              ['Reserva y paga fácil', 'Paga en USD o bolívares con Zelle, Pago Móvil, transferencia o Binance.'],
              ['Vive la experiencia', 'Llega con todo listo y disfruta una estancia boutique sin fricción.'],
            ].map(([t, d], i) => (
              <div className="step-card" key={i}>
                <div className="step-num">0{i + 1}</div>
                <div className="step-title">{t}</div>
                <div className="step-desc">{d}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="steps-grid">
            {[
              ['Registra tu posada', 'Alta sencilla y visual para mostrar tu espacio con el nivel que merece.'],
              ['Te ayudamos con el contenido', 'Fotografía profesional y acompañamiento para presentar tu posada de forma premium.'],
              ['Empieza a recibir reservas', 'Tu perfil queda activo para viajeros locales, internacionales y diáspora venezolana.'],
              ['Cobra con flexibilidad', 'Recibe pagos en USD o bolívares con Zelle, Pago Móvil, transferencia o Binance.'],
            ].map(([t, d], i) => (
              <div className="step-card" key={i}>
                <div className="step-num">0{i + 1}</div>
                <div className="step-title">{t}</div>
                <div className="step-desc">{d}</div>
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="divider" />

      {/* DESTINOS */}
      <section id="destinos" className="section">
        <div className="section-label">Destinos</div>
        <h2 className="section-h2">Los rincones más <em>extraordinarios</em></h2>
        <p className="section-sub">Posadas verificadas en destinos memorables de Venezuela, con una experiencia más boutique, cálida y confiable.</p>
        <div className="dest-grid">
          {destinos.map((d, i) => (
            <div className="dest-card" key={i}>
              <img src={d.img} alt={d.name} />
              <div className="dest-overlay" />
              <div className="dest-info">
                <div className="dest-tag">{d.tag}</div>
                <div className="dest-name">{d.name}</div>
                <div className="dest-count">{d.count}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="divider" />

      {/* POSADEROS */}
      <section id="posaderos" className="section">
        <div className="posadero-section">
          <div className="posadero-left">
            <div className="section-label">Para posaderos</div>
            <h2 className="section-h2" style={{ marginBottom: '0.5rem' }}>
              Tu posada merece <br /><em>visibilidad real</em>
            </h2>
            <p className="section-sub" style={{ marginBottom: '0' }}>
              Deja de depender solo de WhatsApp. RESER-VE te ayuda a mostrar tu posada con imagen premium,
              recibir reservas con más confianza y cobrar con flexibilidad.
            </p>
            <div className="feature-list">
              {[
                'Fotografía profesional incluida en el paquete de digitalización',
                'Perfil activo con mayor visibilidad para viajeros y diáspora venezolana',
                'Cobros flexibles vía Zelle, Pago Móvil, transferencia o Binance',
                'Respaldado por la comunidad Dos Locos de Viaje',
              ].map((f, i) => (
                <div className="feature-item" key={i}>
                  <div className="feature-dot" />
                  <div className="feature-text">{f}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="posadero-right">
            <div className="plan-card">
              <div className="plan-label">Paquete digitalización</div>
              <div className="plan-price">$150 <span>USD / equiv. en bolívares</span></div>
              <div className="plan-desc">Todo lo que necesitas para empezar a recibir reservas desde cualquier parte del mundo.</div>
              <ul className="plan-items">
                <li>Sesión fotográfica profesional</li>
                <li>Perfil completo en la plataforma</li>
                <li>Optimización visual y descripción</li>
                <li>1 mes de visibilidad premium</li>
              </ul>
              <button className="btn-primary full-btn">Quiero digitalizar mi posada</button>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer>
        <div className="footer-logo">RESER<span>-VE</span></div>
        <div style={{ display:'flex', gap:'1.25rem', flexWrap:'wrap' }}>
          <a href="#">Sobre nosotros</a>
          <a href="#">Contacto</a>
          <a href="#">Términos</a>
          <a href="#">Privacidad</a>
        </div>
        <div style={{ fontSize:'0.88rem', color:'rgba(26,43,76,0.48)' }}>
          Impulsado por Dos Locos de Viaje
        </div>
      </footer>
    </>
  )
}