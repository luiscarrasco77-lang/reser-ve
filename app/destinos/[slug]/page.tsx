import { getDestino, getPosadasByDestino } from '@/lib/data'

export default async function DestinoPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const destino = getDestino(slug)
  const posadas = getPosadasByDestino(slug)

  if (!destino) {
    return (
      <main
        style={{
          minHeight: '100vh',
          fontFamily: 'Inter, sans-serif',
          background:
            'radial-gradient(circle at top left, rgba(230,126,34,0.08) 0%, transparent 28%), radial-gradient(circle at top right, rgba(26,43,76,0.06) 0%, transparent 30%), linear-gradient(180deg, #fffefb 0%, #FDFBF7 42%, #f8f3ea 100%)',
          color: '#23324A',
          padding: '3rem 1.5rem',
        }}
      >
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <a href="/" style={{ display: 'inline-block', marginBottom: '1.5rem', color: '#1A2B4C', textDecoration: 'none', fontWeight: 700 }}>
            ← Volver al inicio
          </a>
          <h1 style={{ fontSize: 'clamp(2.3rem, 6vw, 4rem)', lineHeight: 1, letterSpacing: '-0.06em', fontWeight: 800, color: '#1A2B4C', marginBottom: '1rem' }}>
            Destino no encontrado
          </h1>
          <p style={{ fontSize: '1rem', lineHeight: 1.8, color: '#6B7482', maxWidth: '700px' }}>
            Este destino todavía no está disponible en RESER-VE.
          </p>
        </div>
      </main>
    )
  }

  const avgRating =
    posadas.length > 0
      ? (posadas.reduce((sum, p) => sum + p.rating, 0) / posadas.length).toFixed(1)
      : '—'

  function renderStars(rating: number) {
    const full = Math.floor(rating)
    const half = rating - full >= 0.5 ? 1 : 0
    const empty = 5 - full - half
    return '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(empty)
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,600;0,700;0,800;1,700&family=Inter:wght@300;400;500;600;700;800&display=swap');

        :root {
          --indigo: #1A2B4C;
          --cacao: #E67E22;
          --cacao-dark: #C96510;
          --sand: #FDFBF7;
          --cream: #F5EFE0;
          --text: #1A2B4C;
          --muted: #7A8699;
          --line: rgba(26,43,76,0.08);
          --shadow: 0 8px 32px rgba(26,43,76,0.10);
        }

        * { box-sizing: border-box; }
        html { scroll-behavior: smooth; }
        body {
          margin: 0;
          font-family: 'Inter', sans-serif;
          background:
            radial-gradient(circle at top left, rgba(230,126,34,0.08) 0%, transparent 28%),
            radial-gradient(circle at top right, rgba(26,43,76,0.06) 0%, transparent 30%),
            linear-gradient(180deg, #fffefb 0%, var(--sand) 42%, #f8f3ea 100%);
          color: var(--text);
          overflow-x: hidden;
        }

        .grain {
          position: fixed; inset: 0; pointer-events: none; z-index: 100; opacity: 0.018;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
        }

        .page { min-height: 100vh; }

        .nav {
          position: sticky; top: 0; z-index: 60;
          display: flex; align-items: center; justify-content: space-between;
          padding: 1rem 2rem;
          background: rgba(253,251,247,0.88); backdrop-filter: blur(18px);
          border-bottom: 1px solid var(--line);
          box-shadow: 0 8px 30px rgba(26,43,76,0.05);
        }

        .logo { font-size: 2.2rem; font-weight: 800; letter-spacing: -0.04em; color: var(--indigo); text-decoration: none; }
        .logo span { color: var(--cacao); }

        .nav-actions { display: flex; align-items: center; gap: 0.8rem; }

        .nav-btn {
          padding: 0.7rem 1.1rem; border-radius: 999px; font-size: 0.9rem; font-weight: 600;
          text-decoration: none; background: white; color: var(--indigo);
          border: 1px solid rgba(26,43,76,0.12); transition: all 0.22s;
        }
        .nav-btn:hover { background: rgba(255,255,255,0.85); transform: translateY(-1px); }

        .nav-cta {
          padding: 0.75rem 1.15rem; border-radius: 999px; font-size: 0.84rem; font-weight: 600;
          text-decoration: none; background: var(--cacao); border: 1px solid var(--cacao); color: white;
          box-shadow: 0 12px 30px rgba(230,126,34,0.22); transition: all 0.22s;
        }
        .nav-cta:hover { background: var(--cacao-dark); transform: translateY(-1px); }

        .hero { position: relative; min-height: 62vh; display: flex; align-items: end; overflow: hidden; }

        .hero-bg {
          position: absolute; inset: 0; background-size: cover; background-position: center;
          filter: saturate(1.05) brightness(0.8);
        }

        .hero-overlay {
          position: absolute; inset: 0;
          background:
            linear-gradient(180deg, rgba(253,251,247,0.05) 0%, rgba(253,251,247,0.28) 100%),
            linear-gradient(105deg, rgba(26,43,76,0.82) 0%, rgba(26,43,76,0.58) 42%, rgba(26,43,76,0.16) 74%, transparent 100%);
        }

        .hero-inner {
          position: relative; z-index: 2;
          width: 100%; max-width: 1100px; margin: 0 auto;
          padding: 6rem 1.5rem 4rem; color: white;
        }

        .badge {
          display: inline-flex; align-items: center;
          padding: 0.45rem 0.9rem; font-size: 0.76rem; font-weight: 700;
          border-radius: 999px; background: rgba(230,126,34,0.95); color: white;
          box-shadow: 0 10px 24px rgba(230,126,34,0.18); margin-bottom: 1rem;
        }

        .hero-title {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: clamp(2.8rem, 7vw, 5.2rem); line-height: 0.95;
          letter-spacing: -0.03em; font-weight: 800; margin: 0 0 1rem;
        }
        .hero-title em { font-style: italic; color: #ffe1c4; }

        .hero-sub { max-width: 640px; font-size: 1rem; line-height: 1.8; color: rgba(255,255,255,0.86); margin: 0; }

        .section { max-width: 1100px; margin: 0 auto; padding: 5rem 1.5rem; }

        .section-label {
          display: inline-block; padding: 0.42rem 0.78rem; border-radius: 999px;
          font-size: 0.76rem; font-weight: 700; color: var(--indigo);
          background: rgba(26,43,76,0.05); border: 1px solid rgba(26,43,76,0.08); margin-bottom: 1rem;
        }

        .section-h2 {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: clamp(2rem, 5vw, 3.5rem); line-height: 1.02;
          letter-spacing: -0.02em; font-weight: 800; color: var(--indigo); margin: 0 0 0.8rem;
        }
        .section-h2 em { font-style: italic; color: var(--cacao); }

        .section-sub { font-size: 1rem; line-height: 1.78; color: var(--muted); max-width: 760px; margin: 0 0 2.4rem; }

        /* STATS BAR — 4 items */
        .stats {
          display: flex; justify-content: center; gap: 1rem; flex-wrap: wrap;
          width: min(1100px, calc(100% - 2rem)); margin: -2rem auto 0; position: relative; z-index: 3;
        }

        .stat-card {
          min-width: 160px; flex: 1; padding: 1.2rem 1.4rem; border-radius: 20px;
          background: rgba(255,255,255,0.92); border: 1px solid rgba(26,43,76,0.08);
          box-shadow: var(--shadow); text-align: center; backdrop-filter: blur(12px);
        }
        .stat-n { font-size: 1.6rem; font-weight: 800; letter-spacing: -0.05em; color: var(--indigo); margin-bottom: 0.16rem; }
        .stat-n.cacao { color: var(--cacao); }
        .stat-l { font-size: 0.82rem; color: var(--muted); }

        /* PREMIUM POSADA CARDS */
        .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(290px, 1fr)); gap: 1.5rem; }

        .card {
          overflow: hidden; border-radius: 24px;
          background: white; border: 1px solid var(--line);
          border-top: 3px solid transparent;
          box-shadow: var(--shadow); transition: all 0.32s ease;
          text-decoration: none; color: inherit; display: block;
        }
        .card:hover {
          transform: translateY(-6px);
          box-shadow: 0 24px 52px rgba(26,43,76,0.15);
          border-top-color: var(--cacao);
        }

        .card-img { position: relative; aspect-ratio: 3/2; overflow: hidden; border-radius: 20px 20px 0 0; }
        .card-img img { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform 0.5s ease; }
        .card:hover .card-img img { transform: scale(1.06); }

        .card-tipo {
          position: absolute; top: 0.75rem; left: 0.75rem;
          padding: 0.3rem 0.75rem; border-radius: 999px;
          font-size: 0.68rem; font-weight: 700;
          background: rgba(230,126,34,0.9); color: white;
        }
        .card-price-badge {
          position: absolute; bottom: 0.75rem; right: 0.75rem;
          background: var(--indigo); color: white;
          font-size: 0.85rem; font-weight: 800; border-radius: 999px; padding: 0.4rem 0.9rem;
          box-shadow: 0 4px 14px rgba(26,43,76,0.25);
        }

        .card-body { padding: 1.25rem 1.25rem 1.3rem; }
        .card-title {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 1.15rem; font-weight: 700;
          letter-spacing: -0.01em; color: var(--indigo); margin: 0 0 0.25rem; line-height: 1.3;
        }
        .card-location { font-size: 0.85rem; color: var(--muted); margin: 0 0 0.35rem; }
        .card-rating { font-size: 0.82rem; color: var(--cacao); font-weight: 700; margin: 0 0 0.5rem; letter-spacing: 0.02em; }
        .card-desc { font-size: 0.9rem; line-height: 1.7; color: var(--muted); margin: 0 0 0.9rem; }

        .card-bottom {
          display: flex; align-items: center; justify-content: space-between;
          gap: 0.8rem; flex-wrap: wrap;
        }

        .price { font-size: 1rem; font-weight: 800; color: var(--cacao); }

        .card-cta-link {
          font-size: 0.8rem; font-weight: 600; color: var(--cacao);
          text-decoration: none; transition: color 0.2s;
        }
        .card-cta-link:hover { color: var(--cacao-dark); }

        /* CONSEJO DE VIAJE */
        .consejo-section { max-width: 1100px; margin: 0 auto; padding: 0 1.5rem 5rem; }
        .consejo-card {
          background: rgba(230,126,34,0.06);
          border: 1px solid rgba(230,126,34,0.18);
          border-radius: 20px;
          padding: 2.2rem 2.5rem;
          display: flex; align-items: flex-start; justify-content: space-between;
          gap: 2rem; flex-wrap: wrap;
        }
        .consejo-content { flex: 1; min-width: 240px; }
        .consejo-icon { font-size: 1.6rem; margin-bottom: 0.6rem; }
        .consejo-title {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 1.35rem; font-weight: 700; color: var(--indigo);
          margin: 0 0 0.6rem; line-height: 1.3;
        }
        .consejo-text { font-size: 0.92rem; line-height: 1.75; color: var(--muted); margin: 0; }
        .consejo-btn {
          display: inline-block; text-decoration: none;
          background: var(--cacao); color: white;
          padding: 0.85rem 1.5rem; border-radius: 999px;
          font-size: 0.88rem; font-weight: 700;
          box-shadow: 0 8px 24px rgba(230,126,34,0.22);
          transition: all 0.22s; white-space: nowrap; align-self: center; min-height: 44px;
          display: flex; align-items: center;
        }
        .consejo-btn:hover { background: var(--cacao-dark); transform: translateY(-2px); }

        .divider {
          width: min(1100px, calc(100% - 3rem)); height: 1px; margin: 0 auto;
          background: linear-gradient(to right, transparent, rgba(26,43,76,0.12), transparent);
        }

        .footer {
          border-top: 1px solid rgba(26,43,76,0.08); padding: 2rem 1.5rem;
          display: flex; align-items: center; justify-content: space-between;
          flex-wrap: wrap; gap: 1rem; max-width: 1100px; margin: 0 auto;
        }
        .footer-logo { font-size: 1rem; font-weight: 800; color: var(--indigo); }
        .footer-logo span { color: var(--cacao); }
        .footer-text { font-size: 0.88rem; color: rgba(26,43,76,0.48); }

        @media (max-width: 768px) {
          .nav { padding: 0.9rem 1rem; }
          .nav-actions { display: none; }
          .logo { font-size: 1.8rem; }
          .hero { min-height: 56vh; }
          .hero-inner { padding: 5rem 1rem 3rem; }
          .section { padding: 4rem 1rem; }
          .stats { flex-direction: column; align-items: stretch; }
          .stat-card { width: 100%; min-width: unset; }
          .consejo-section { padding: 0 1rem 4rem; }
          .consejo-card { padding: 1.5rem; }
        }
      `}</style>

      <div className="grain" />

      <main className="page">
        <nav className="nav">
          <a href="/" className="logo">RESER<span>-VE</span></a>
          <div className="nav-actions">
            <a href="/buscar" className="nav-btn">Destinos</a>
            <a href="/registro-posada" className="nav-btn">Posaderos</a>
            <a href="/#como-funciona" className="nav-btn">Cómo funciona</a>
            <a href="/registro-posada" className="nav-cta">Registra tu posada</a>
          </div>
        </nav>

        <section className="hero">
          <div className="hero-bg" style={{ backgroundImage: `url('${destino.hero}')` }} />
          <div className="hero-overlay" />
          <div className="hero-inner">
            <div className="badge">{destino.tagline}</div>
            <h1 className="hero-title">
              Posadas en <br /><em>{destino.nombre}</em>
            </h1>
            <p className="hero-sub">{destino.descripcion}</p>
          </div>
        </section>

        <div className="stats">
          <div className="stat-card">
            <div className="stat-n">{posadas.length}</div>
            <div className="stat-l">posadas disponibles</div>
          </div>
          <div className="stat-card">
            <div className={`stat-n${Number(avgRating) >= 4.5 ? ' cacao' : ''}`}>★ {avgRating}</div>
            <div className="stat-l">valoración promedio</div>
          </div>
          <div className="stat-card">
            <div className="stat-n">Flexible</div>
            <div className="stat-l">USD, bolívares, Zelle, Binance y más</div>
          </div>
          <div className="stat-card">
            <div className="stat-n">Boutique</div>
            <div className="stat-l">estancias locales y auténticas</div>
          </div>
        </div>

        <section className="section">
          <div className="section-label">Alojamientos</div>
          <h2 className="section-h2">Explora las <em>posadas</em> disponibles</h2>
          <p className="section-sub">
            Selecciona la opción que mejor se adapte a tu viaje y descubre una
            forma más cálida, local y confiable de hospedarte en Venezuela.
          </p>

          <div className="grid">
            {posadas.map((posada) => (
              <a href={`/posadas/${posada.slug}`} className="card" key={posada.slug}>
                <div className="card-img">
                  <img src={posada.imgs[0]} alt={posada.nombre} />
                  <div className="card-tipo">{posada.tipo}</div>
                  <div className="card-price-badge">${posada.precio} / noche</div>
                </div>
                <div className="card-body">
                  <h3 className="card-title">{posada.nombre}</h3>
                  <p className="card-location">{posada.destino}</p>
                  <p className="card-rating">{renderStars(posada.rating)} {posada.rating} · {posada.reviews} reseñas</p>
                  <p className="card-desc">{posada.descripcion.slice(0, 100)}…</p>
                  <div className="card-bottom">
                    <div className="price">${posada.precio} / noche</div>
                    <span className="card-cta-link">Ver posada →</span>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </section>

        <div className="consejo-section">
          <div className="consejo-card">
            <div className="consejo-content">
              <div className="consejo-icon">🧭</div>
              <h3 className="consejo-title">¿Tu primera vez en {destino.nombre}?</h3>
              <p className="consejo-text">
                Reserva con mínimo 2 semanas de antelación. La mayoría de posadas en este destino
                se agotan rápido, especialmente en temporada alta.
              </p>
            </div>
            <a href={`/buscar?destino=${encodeURIComponent(destino.nombre)}`} className="consejo-btn">
              Explorar posadas disponibles →
            </a>
          </div>
        </div>

        <div className="divider" />

        <footer className="footer">
          <div className="footer-logo">RESER<span>-VE</span></div>
          <div className="footer-text">Impulsado por Dos Locos de Viaje</div>
        </footer>
      </main>
    </>
  )
}
