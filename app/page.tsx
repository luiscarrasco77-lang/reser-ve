'use client'

import { useEffect, useRef, useState } from 'react'

export default function Home() {
  const [scrollY, setScrollY] = useState(0)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    setLoaded(true)
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const destinos = [
    {
      name: 'Los Roques',
      tag: 'Archipiélago',
      count: '12 posadas',
      img: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=600&q=80',
      color: '#0EA5E9',
    },
    {
      name: 'Mérida',
      tag: 'Los Andes',
      count: '9 posadas',
      img: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&q=80',
      color: '#10B981',
    },
    {
      name: 'Mochima',
      tag: 'Costa Oriental',
      count: '7 posadas',
      img: 'https://images.unsplash.com/photo-1559128010-7c1ad6e1b6a5?w=600&q=80',
      color: '#F59E0B',
    },
    {
      name: 'Morrocoy',
      tag: 'Costa Occidental',
      count: '6 posadas',
      img: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=80',
      color: '#6366F1',
    },
    {
      name: 'Canaima',
      tag: 'Gran Sabana',
      count: '4 posadas',
      img: 'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=600&q=80',
      color: '#EF4444',
    },
    {
      name: 'Isla Margarita',
      tag: 'Caribe',
      count: '11 posadas',
      img: 'https://images.unsplash.com/photo-1519046904884-53103b34b206?w=600&q=80',
      color: '#EC4899',
    },
  ]

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&family=DM+Sans:wght@300;400;500&display=swap');

        * { margin: 0; padding: 0; box-sizing: border-box; }

        body {
          font-family: 'DM Sans', sans-serif;
          background: #0A0A08;
          color: #F5F0E8;
          overflow-x: hidden;
        }

        .serif { font-family: 'Cormorant Garamond', serif; }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(32px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.94); }
          to { opacity: 1; transform: scale(1); }
        }

        .anim-0 { animation: fadeUp 0.9s cubic-bezier(0.16,1,0.3,1) 0.1s both; }
        .anim-1 { animation: fadeUp 0.9s cubic-bezier(0.16,1,0.3,1) 0.25s both; }
        .anim-2 { animation: fadeUp 0.9s cubic-bezier(0.16,1,0.3,1) 0.4s both; }
        .anim-3 { animation: fadeUp 0.9s cubic-bezier(0.16,1,0.3,1) 0.55s both; }
        .anim-4 { animation: fadeUp 0.9s cubic-bezier(0.16,1,0.3,1) 0.7s both; }
        .anim-scale { animation: scaleIn 1.1s cubic-bezier(0.16,1,0.3,1) 0.2s both; }

        .grain {
          position: fixed; inset: 0; pointer-events: none; z-index: 100; opacity: 0.035;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
        }

        .nav {
          position: fixed; top: 0; left: 0; right: 0; z-index: 50;
          display: flex; align-items: center; justify-content: space-between;
          padding: 1.25rem 2.5rem;
          transition: all 0.4s ease;
        }
        .nav.scrolled {
          background: rgba(10,10,8,0.85);
          backdrop-filter: blur(20px);
          border-bottom: 0.5px solid rgba(245,240,232,0.08);
        }
        .logo {
          font-family: 'Cormorant Garamond', serif;
          font-size: 1.5rem; font-weight: 300; letter-spacing: 0.15em;
          color: #F5F0E8;
        }
        .logo span { color: #D4A853; }
        .nav-links { display: flex; align-items: center; gap: 2rem; }
        .nav-links a {
          font-size: 0.75rem; letter-spacing: 0.1em; text-transform: uppercase;
          color: rgba(245,240,232,0.6); text-decoration: none;
          transition: color 0.3s ease;
        }
        .nav-links a:hover { color: #F5F0E8; }
        .nav-cta {
          font-size: 0.7rem; letter-spacing: 0.12em; text-transform: uppercase;
          padding: 0.6rem 1.4rem; border: 0.5px solid rgba(212,168,83,0.5);
          color: #D4A853; background: transparent; cursor: pointer;
          transition: all 0.3s ease; font-family: 'DM Sans', sans-serif;
        }
        .nav-cta:hover { background: rgba(212,168,83,0.1); border-color: #D4A853; }

        .hero {
          min-height: 100vh; position: relative;
          display: flex; align-items: center; justify-content: center;
          overflow: hidden;
        }
        .hero-bg {
          position: absolute; inset: 0;
          background: linear-gradient(160deg, #0A0A08 0%, #0D1A0F 40%, #0A1520 100%);
        }
        .hero-bg-img {
          position: absolute; inset: 0;
          background: url('https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1800&q=70') center/cover no-repeat;
          opacity: 0.18;
        }
        .hero-overlay {
          position: absolute; inset: 0;
          background: radial-gradient(ellipse at 50% 60%, rgba(212,168,83,0.06) 0%, transparent 70%);
        }
        .hero-content {
          position: relative; z-index: 2; text-align: center;
          padding: 0 1.5rem; max-width: 900px;
        }
        .hero-eyebrow {
          font-size: 0.7rem; letter-spacing: 0.25em; text-transform: uppercase;
          color: #D4A853; margin-bottom: 1.5rem;
          display: inline-flex; align-items: center; gap: 0.75rem;
        }
        .hero-eyebrow::before, .hero-eyebrow::after {
          content: ''; width: 2rem; height: 0.5px; background: #D4A853; opacity: 0.6;
        }
        .hero-h1 {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(3.5rem, 8vw, 7rem);
          font-weight: 300; line-height: 1.0; letter-spacing: -0.02em;
          color: #F5F0E8; margin-bottom: 1.5rem;
        }
        .hero-h1 em { font-style: italic; color: #D4A853; }
        .hero-sub {
          font-size: 1rem; line-height: 1.8; font-weight: 300;
          color: rgba(245,240,232,0.55); max-width: 480px; margin: 0 auto 3rem;
        }
        .hero-btns {
          display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;
          margin-bottom: 4rem;
        }
        .btn-gold {
          padding: 0.9rem 2.5rem; background: #D4A853; color: #0A0A08;
          font-size: 0.75rem; letter-spacing: 0.12em; text-transform: uppercase;
          border: none; cursor: pointer; font-family: 'DM Sans', sans-serif;
          font-weight: 500; transition: all 0.3s ease; text-decoration: none;
          display: inline-block;
        }
        .btn-gold:hover { background: #E8BC6A; transform: translateY(-1px); }
        .btn-outline {
          padding: 0.9rem 2.5rem; background: transparent;
          border: 0.5px solid rgba(245,240,232,0.25); color: rgba(245,240,232,0.7);
          font-size: 0.75rem; letter-spacing: 0.12em; text-transform: uppercase;
          cursor: pointer; font-family: 'DM Sans', sans-serif;
          transition: all 0.3s ease; text-decoration: none; display: inline-block;
        }
        .btn-outline:hover { border-color: rgba(245,240,232,0.6); color: #F5F0E8; }

        .search-bar {
          background: rgba(245,240,232,0.04);
          border: 0.5px solid rgba(245,240,232,0.12);
          padding: 1rem 1.25rem;
          display: flex; gap: 0.75rem; align-items: center;
          flex-wrap: wrap; max-width: 580px; margin: 0 auto 3rem;
          backdrop-filter: blur(10px);
        }
        .search-bar select, .search-bar input {
          flex: 1; min-width: 130px; background: transparent;
          border: none; border-bottom: 0.5px solid rgba(245,240,232,0.2);
          color: #F5F0E8; font-family: 'DM Sans', sans-serif; font-size: 0.8rem;
          padding: 0.4rem 0; outline: none; letter-spacing: 0.05em;
        }
        .search-bar select option { background: #1a1a18; color: #F5F0E8; }
        .search-bar button {
          background: #D4A853; color: #0A0A08; border: none;
          padding: 0.6rem 1.5rem; font-size: 0.7rem; letter-spacing: 0.12em;
          text-transform: uppercase; cursor: pointer; font-family: 'DM Sans', sans-serif;
          font-weight: 500; transition: all 0.3s ease; white-space: nowrap;
        }
        .search-bar button:hover { background: #E8BC6A; }

        .stats {
          display: flex; justify-content: center; gap: 4rem; flex-wrap: wrap;
          padding-top: 2rem; border-top: 0.5px solid rgba(245,240,232,0.08);
        }
        .stat-n {
          font-family: 'Cormorant Garamond', serif;
          font-size: 2.2rem; font-weight: 300; color: #D4A853;
        }
        .stat-l {
          font-size: 0.7rem; letter-spacing: 0.1em; text-transform: uppercase;
          color: rgba(245,240,232,0.4); margin-top: 0.25rem;
        }

        .scroll-hint {
          position: absolute; bottom: 2rem; left: 50%;
          transform: translateX(-50%); display: flex; flex-direction: column;
          align-items: center; gap: 0.5rem; animation: float 2.5s ease-in-out infinite;
        }
        .scroll-hint span {
          font-size: 0.6rem; letter-spacing: 0.2em; text-transform: uppercase;
          color: rgba(245,240,232,0.3);
        }
        .scroll-line {
          width: 0.5px; height: 3rem; background: linear-gradient(to bottom, rgba(212,168,83,0.6), transparent);
        }

        .section { padding: 7rem 2.5rem; max-width: 1100px; margin: 0 auto; }
        .section-label {
          font-size: 0.65rem; letter-spacing: 0.25em; text-transform: uppercase;
          color: #D4A853; margin-bottom: 1rem;
          display: inline-flex; align-items: center; gap: 0.75rem;
        }
        .section-label::before {
          content: ''; width: 1.5rem; height: 0.5px; background: #D4A853; opacity: 0.6;
        }
        .section-h2 {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(2.2rem, 4vw, 3.5rem); font-weight: 300;
          line-height: 1.15; color: #F5F0E8; margin-bottom: 0.75rem;
        }
        .section-h2 em { font-style: italic; color: #D4A853; }
        .section-sub {
          font-size: 0.85rem; color: rgba(245,240,232,0.45);
          line-height: 1.8; margin-bottom: 3rem; max-width: 500px;
        }

        .divider {
          width: 100%; height: 0.5px;
          background: linear-gradient(to right, transparent, rgba(245,240,232,0.1), transparent);
          margin: 0 2.5rem;
        }

        .steps-grid {
          display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 2rem;
        }
        .step-card {
          padding: 2rem 1.5rem;
          border: 0.5px solid rgba(245,240,232,0.07);
          transition: all 0.4s ease; cursor: default;
          position: relative; overflow: hidden;
        }
        .step-card::before {
          content: ''; position: absolute; inset: 0;
          background: linear-gradient(135deg, rgba(212,168,83,0.04), transparent);
          opacity: 0; transition: opacity 0.4s ease;
        }
        .step-card:hover::before { opacity: 1; }
        .step-card:hover { border-color: rgba(212,168,83,0.2); transform: translateY(-3px); }
        .step-num {
          font-family: 'Cormorant Garamond', serif;
          font-size: 3rem; font-weight: 300; color: rgba(212,168,83,0.2);
          line-height: 1; margin-bottom: 1rem;
        }
        .step-title { font-size: 0.85rem; font-weight: 500; color: #F5F0E8; margin-bottom: 0.5rem; }
        .step-desc { font-size: 0.78rem; color: rgba(245,240,232,0.45); line-height: 1.7; }

        .tabs { display: flex; gap: 0; margin-bottom: 2.5rem; border-bottom: 0.5px solid rgba(245,240,232,0.1); }
        .tab-btn {
          padding: 0.75rem 2rem; font-size: 0.72rem; letter-spacing: 0.1em;
          text-transform: uppercase; background: transparent; border: none;
          color: rgba(245,240,232,0.4); cursor: pointer; font-family: 'DM Sans', sans-serif;
          transition: all 0.3s ease; border-bottom: 1px solid transparent;
          margin-bottom: -0.5px;
        }
        .tab-btn.active { color: #D4A853; border-bottom-color: #D4A853; }
        .tab-btn:hover { color: rgba(245,240,232,0.7); }

        .dest-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 1.25rem;
        }
        .dest-card {
          position: relative; overflow: hidden; cursor: pointer;
          aspect-ratio: 4/3;
          transition: transform 0.5s cubic-bezier(0.16,1,0.3,1);
        }
        .dest-card:hover { transform: scale(1.02); }
        .dest-card img {
          width: 100%; height: 100%; object-fit: cover;
          transition: transform 0.7s cubic-bezier(0.16,1,0.3,1);
          filter: brightness(0.65) saturate(1.1);
        }
        .dest-card:hover img { transform: scale(1.06); filter: brightness(0.75) saturate(1.2); }
        .dest-overlay {
          position: absolute; inset: 0;
          background: linear-gradient(to top, rgba(10,10,8,0.85) 0%, transparent 60%);
        }
        .dest-info { position: absolute; bottom: 0; left: 0; right: 0; padding: 1.5rem; }
        .dest-tag {
          font-size: 0.6rem; letter-spacing: 0.15em; text-transform: uppercase;
          color: #D4A853; margin-bottom: 0.4rem;
        }
        .dest-name {
          font-family: 'Cormorant Garamond', serif;
          font-size: 1.6rem; font-weight: 300; color: #F5F0E8; line-height: 1;
          margin-bottom: 0.3rem;
        }
        .dest-count { font-size: 0.7rem; color: rgba(245,240,232,0.5); }

        .posadero-section {
          background: linear-gradient(135deg, rgba(212,168,83,0.04) 0%, rgba(10,10,8,0) 60%);
          border: 0.5px solid rgba(212,168,83,0.12);
          padding: 4rem; display: flex; gap: 4rem; align-items: flex-start; flex-wrap: wrap;
        }
        .posadero-left { flex: 1.2; min-width: 280px; }
        .posadero-right { flex: 1; min-width: 240px; }
        .feature-list { display: flex; flex-direction: column; gap: 1rem; margin-bottom: 2rem; }
        .feature-item { display: flex; align-items: flex-start; gap: 0.75rem; }
        .feature-dot {
          width: 1px; height: 1rem; background: #D4A853;
          flex-shrink: 0; margin-top: 0.25rem; opacity: 0.6;
        }
        .feature-text { font-size: 0.82rem; color: rgba(245,240,232,0.6); line-height: 1.6; }

        .plan-card {
          border: 0.5px solid rgba(212,168,83,0.2);
          padding: 2rem; background: rgba(212,168,83,0.03);
        }
        .plan-label {
          font-size: 0.6rem; letter-spacing: 0.2em; text-transform: uppercase;
          color: #D4A853; margin-bottom: 0.75rem;
        }
        .plan-price {
          font-family: 'Cormorant Garamond', serif;
          font-size: 3rem; font-weight: 300; color: #F5F0E8; line-height: 1;
        }
        .plan-price span { font-size: 0.9rem; color: rgba(245,240,232,0.4); font-family: 'DM Sans', sans-serif; }
        .plan-desc { font-size: 0.78rem; color: rgba(245,240,232,0.4); margin: 0.75rem 0 1.5rem; line-height: 1.6; }
        .plan-items { list-style: none; display: flex; flex-direction: column; gap: 0.6rem; margin-bottom: 2rem; }
        .plan-items li { font-size: 0.78rem; color: rgba(245,240,232,0.55); display: flex; gap: 0.75rem; align-items: center; }
        .plan-items li::before { content: '—'; color: #D4A853; font-size: 0.7rem; }

        footer {
          border-top: 0.5px solid rgba(245,240,232,0.08);
          padding: 2.5rem 2.5rem;
          display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 1rem;
        }
        footer a { color: rgba(245,240,232,0.35); font-size: 0.72rem; text-decoration: none; letter-spacing: 0.05em; transition: color 0.3s; }
        footer a:hover { color: rgba(245,240,232,0.7); }
        .footer-logo {
          font-family: 'Cormorant Garamond', serif; font-size: 1.1rem;
          font-weight: 300; letter-spacing: 0.15em; color: rgba(245,240,232,0.3);
        }
        .footer-logo span { color: rgba(212,168,83,0.5); }

        @media (max-width: 768px) {
          .nav { padding: 1rem 1.25rem; }
          .nav-links { display: none; }
          .section { padding: 4rem 1.25rem; }
          .posadero-section { padding: 2rem; gap: 2rem; }
          .dest-grid { grid-template-columns: 1fr 1fr; }
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
        <div className="hero-bg" />
        <div className="hero-bg-img" style={{ transform: `translateY(${scrollY * 0.25}px)` }} />
        <div className="hero-overlay" />
        <div className="hero-content">
          <div className={`hero-eyebrow ${loaded ? 'anim-0' : ''}`}>Venezuela turística · Beta 2026</div>
          <h1 className={`hero-h1 ${loaded ? 'anim-1' : ''}`}>
            Descubre<br />
            <em>posadas auténticas</em><br />
            en Venezuela
          </h1>
          <p className={`hero-sub ${loaded ? 'anim-2' : ''}`}>
            La primera plataforma especializada en alojamientos locales venezolanos.
            Reserva con confianza, paga en USD.
          </p>
          <div className={`hero-btns ${loaded ? 'anim-3' : ''}`}>
            <a href="#destinos" className="btn-gold">Explorar posadas</a>
            <a href="#posaderos" className="btn-outline">¿Tienes una posada?</a>
          </div>
          <div className={`search-bar ${loaded ? 'anim-3' : ''}`}>
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
            <button>Buscar</button>
          </div>
          <div className={`stats ${loaded ? 'anim-4' : ''}`}>
            <div style={{textAlign:'center'}}>
              <div className="stat-n">+3.4M</div>
              <div className="stat-l">turistas en 2025</div>
            </div>
            <div style={{textAlign:'center'}}>
              <div className="stat-n">+44%</div>
              <div className="stat-l">crecimiento turístico</div>
            </div>
            <div style={{textAlign:'center'}}>
              <div className="stat-n">8M</div>
              <div className="stat-l">diáspora venezolana</div>
            </div>
          </div>
        </div>
        <div className="scroll-hint">
          <span>Descubre</span>
          <div className="scroll-line" />
        </div>
      </section>

      <div className="divider" />

      {/* CÓMO FUNCIONA */}
      <section id="como-funciona" style={{padding:'7rem 2.5rem', maxWidth:'1100px', margin:'0 auto'}}>
        <div className="section-label">Cómo funciona</div>
        <h2 className="section-h2">Simple para <em>todos</em></h2>
        <p className="section-sub">Desde la búsqueda hasta el check-in. Sin fricción, sin sorpresas.</p>

        <div className="tabs">
          <button className="tab-btn active" id="tab-viajero" onClick={e => {
            document.getElementById('steps-viajero')!.style.display = 'grid'
            document.getElementById('steps-posadero')!.style.display = 'none'
            document.getElementById('tab-viajero')!.classList.add('active')
            document.getElementById('tab-posadero')!.classList.remove('active')
          }}>Soy viajero</button>
          <button className="tab-btn" id="tab-posadero" onClick={e => {
            document.getElementById('steps-viajero')!.style.display = 'none'
            document.getElementById('steps-posadero')!.style.display = 'grid'
            document.getElementById('tab-posadero')!.classList.add('active')
            document.getElementById('tab-viajero')!.classList.remove('active')
          }}>Tengo una posada</button>
        </div>

        <div className="steps-grid" id="steps-viajero">
          {[
            ["Busca tu destino", "Filtra por destino, fechas y tipo de posada en más de 6 regiones venezolanas."],
            ["Elige con confianza", "Fotos profesionales, reseñas verificadas y toda la info que necesitas."],
            ["Reserva y paga en USD", "Pago seguro vía Zelle o Zinli. Confirmación instantánea por WhatsApp."],
            ["Vive Venezuela", "Llega con todo listo. Sin sorpresas, sin gestión manual."],
          ].map(([t, d], i) => (
            <div className="step-card" key={i}>
              <div className="step-num">0{i+1}</div>
              <div className="step-title">{t}</div>
              <div className="step-desc">{d}</div>
            </div>
          ))}
        </div>
        <div className="steps-grid" id="steps-posadero" style={{display:'none'}}>
          {[
            ["Regístra tu posada", "Alta en menos de 10 minutos. Sin tecnicismos, todo en español venezolano."],
            ["Te hacemos las fotos", "Enviamos un fotógrafo profesional a tu posada. Nosotros producimos todo el contenido."],
            ["Empieza a recibir reservas", "Tu perfil activo 24/7. Los viajeros reservan directamente desde la plataforma."],
            ["Cobra en USD", "Recibe pagos vía Zelle y Zinli. Sin complicaciones con divisas."],
          ].map(([t, d], i) => (
            <div className="step-card" key={i}>
              <div className="step-num">0{i+1}</div>
              <div className="step-title">{t}</div>
              <div className="step-desc">{d}</div>
            </div>
          ))}
        </div>
      </section>

      <div className="divider" />

      {/* DESTINOS */}
      <section id="destinos" style={{padding:'7rem 2.5rem', maxWidth:'1100px', margin:'0 auto'}}>
        <div className="section-label">Destinos</div>
        <h2 className="section-h2">Los rincones más <em>extraordinarios</em></h2>
        <p className="section-sub">Posadas verificadas en los destinos más buscados de Venezuela.</p>
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
      <section id="posaderos" style={{padding:'7rem 2.5rem', maxWidth:'1100px', margin:'0 auto'}}>
        <div className="posadero-section">
          <div className="posadero-left">
            <div className="section-label">Para posaderos</div>
            <h2 className="section-h2" style={{marginBottom:'1.5rem'}}>
              Tu posada merece<br /><em>visibilidad real</em>
            </h2>
            <p style={{fontSize:'0.85rem', color:'rgba(245,240,232,0.5)', lineHeight:1.8, marginBottom:'2rem'}}>
              Deja de gestionar reservas por WhatsApp. RESER-VE te da visibilidad digital,
              fotos profesionales y pagos en USD — sin complicaciones técnicas ni costes fijos elevados.
            </p>
            <div className="feature-list">
              {[
                "Fotografía profesional incluida en el paquete de digitalización",
                "Perfil activo con visibilidad para la diáspora venezolana",
                "Cobros seguros en USD por Zelle y Zinli",
                "Respaldado por la comunidad Dos Locos de Viaje",
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
              <div className="plan-price">$150 <span>USD · pago único</span></div>
              <div className="plan-desc">Todo lo que necesitas para empezar a recibir reservas desde cualquier parte del mundo.</div>
              <ul className="plan-items">
                <li>Sesión fotográfica profesional</li>
                <li>Perfil completo en la plataforma</li>
                <li>Gestión del perfil digital</li>
                <li>1 mes de visibilidad premium</li>
              </ul>
              <button className="btn-gold" style={{width:'100%', textAlign:'center'}}>
                Quiero digitalizar mi posada
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer>
        <div className="footer-logo">RESER<span>-VE</span></div>
        <div style={{display:'flex', gap:'2rem'}}>
          <a href="#">Sobre nosotros</a>
          <a href="#">Contacto</a>
          <a href="#">Términos</a>
          <a href="#">Privacidad</a>
        </div>
        <div style={{fontSize:'0.7rem', color:'rgba(245,240,232,0.2)', letterSpacing:'0.05em'}}>
          Impulsado por Dos Locos de Viaje
        </div>
      </footer>
    </>
  )
}