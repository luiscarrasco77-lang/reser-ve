const destinosData: Record<
  string,
  {
    nombre: string
    tagline: string
    descripcion: string
    hero: string
    posadas: {
      nombre: string
      ubicacion: string
      precio: string
      imagen: string
      descripcion: string
    }[]
  }
> = {
  'los-roques': {
    nombre: 'Los Roques',
    tagline: 'Archipiélago',
    descripcion:
      'Descubre posadas auténticas en Los Roques, con una experiencia más cálida, cuidada y conectada con el destino.',
    hero: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1600&q=80',
    posadas: [
      {
        nombre: 'Posada Acuarela',
        ubicacion: 'Gran Roque',
        precio: '$120 / noche',
        imagen: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&q=80',
        descripcion: 'Ambiente boutique, atención cercana y ubicación ideal para explorar el archipiélago.',
      },
      {
        nombre: 'Casa Coral',
        ubicacion: 'Gran Roque',
        precio: '$95 / noche',
        imagen: 'https://images.unsplash.com/photo-1493558103817-58b2924bce98?w=1200&q=80',
        descripcion: 'Una opción íntima y cómoda para viajeros que buscan descanso frente al mar.',
      },
    ],
  },

  merida: {
    nombre: 'Mérida',
    tagline: 'Los Andes',
    descripcion:
      'Encuentra posadas acogedoras en Mérida, rodeadas de montaña, naturaleza y una hospitalidad auténtica.',
    hero: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1600&q=80',
    posadas: [
      {
        nombre: 'Posada Sierra Nevada',
        ubicacion: 'Mérida centro',
        precio: '$70 / noche',
        imagen: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1200&q=80',
        descripcion: 'Ideal para quienes quieren combinar ciudad, clima andino y escapadas naturales.',
      },
      {
        nombre: 'Refugio Andino',
        ubicacion: 'Tabay',
        precio: '$85 / noche',
        imagen: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1200&q=80',
        descripcion: 'Perfecta para una experiencia cálida, tranquila y rodeada de paisaje montañoso.',
      },
    ],
  },

  mochima: {
    nombre: 'Mochima',
    tagline: 'Costa Oriental',
    descripcion:
      'Explora posadas en Mochima para una experiencia frente al mar, entre naturaleza, playa y tranquilidad.',
    hero: 'https://images.unsplash.com/photo-1559128010-7c1ad6e1b6a5?w=1600&q=80',
    posadas: [
      {
        nombre: 'Posada Bahía Azul',
        ubicacion: 'Mochima',
        precio: '$80 / noche',
        imagen: 'https://images.unsplash.com/photo-1500375592092-40eb2168fd21?w=1200&q=80',
        descripcion: 'Una estadía relajada con esencia costera y cercanía a las mejores playas de la zona.',
      },
    ],
  },

  morrocoy: {
    nombre: 'Morrocoy',
    tagline: 'Costa Occidental',
    descripcion:
      'Descubre posadas disponibles en Morrocoy para disfrutar de playas increíbles y una escapada cálida.',
    hero: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1600&q=80',
    posadas: [
      {
        nombre: 'Posada Cayo Norte',
        ubicacion: 'Tucacas',
        precio: '$90 / noche',
        imagen: 'https://images.unsplash.com/photo-1519046904884-53103b34b206?w=1200&q=80',
        descripcion: 'Una opción cómoda y luminosa para quienes quieren vivir Morrocoy con estilo.',
      },
    ],
  },

  canaima: {
    nombre: 'Canaima',
    tagline: 'Gran Sabana',
    descripcion:
      'Hospédate cerca de uno de los destinos más extraordinarios de Venezuela con una experiencia auténtica.',
    hero: 'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=1600&q=80',
    posadas: [
      {
        nombre: 'Posada Salto Ángel',
        ubicacion: 'Canaima',
        precio: '$140 / noche',
        imagen: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=1200&q=80',
        descripcion: 'Conecta con la naturaleza y vive Canaima desde una posada acogedora y bien ubicada.',
      },
    ],
  },

  'isla-margarita': {
    nombre: 'Isla Margarita',
    tagline: 'Caribe',
    descripcion:
      'Encuentra posadas boutique en Isla Margarita para una experiencia relajada, tropical y memorable.',
    hero: 'https://images.unsplash.com/photo-1519046904884-53103b34b206?w=1600&q=80',
    posadas: [
      {
        nombre: 'Posada Brisa Marina',
        ubicacion: 'Playa El Agua',
        precio: '$110 / noche',
        imagen: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&q=80',
        descripcion: 'Una escapada frente al mar con una estética cálida, fresca y cuidada.',
      },
    ],
  },
}

export default async function DestinoPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const destino = destinosData[slug]

  if (!destino) {
    return (
      <main
        style={{
          minHeight: '100vh',
          fontFamily: 'Inter, sans-serif',
          background:
            "radial-gradient(circle at top left, rgba(230,126,34,0.08) 0%, transparent 28%), radial-gradient(circle at top right, rgba(26,43,76,0.06) 0%, transparent 30%), linear-gradient(180deg, #fffefb 0%, #FDFBF7 42%, #f8f3ea 100%)",
          color: '#23324A',
          padding: '3rem 1.5rem',
        }}
      >
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <a
            href="/"
            style={{
              display: 'inline-block',
              marginBottom: '1.5rem',
              color: '#1A2B4C',
              textDecoration: 'none',
              fontWeight: 700,
            }}
          >
            ← Volver al inicio
          </a>

          <h1
            style={{
              fontSize: 'clamp(2.3rem, 6vw, 4rem)',
              lineHeight: 1,
              letterSpacing: '-0.06em',
              fontWeight: 800,
              color: '#1A2B4C',
              marginBottom: '1rem',
            }}
          >
            Destino no encontrado
          </h1>

          <p
            style={{
              fontSize: '1rem',
              lineHeight: 1.8,
              color: '#6B7482',
              maxWidth: '700px',
            }}
          >
            Este destino todavía no está disponible en RESER-VE.
          </p>
        </div>
      </main>
    )
  }

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
          --shadow: 0 20px 60px rgba(26,43,76,0.10);
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
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 100;
          opacity: 0.018;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
        }

        .page {
          min-height: 100vh;
        }

        .nav {
          position: sticky;
          top: 0;
          z-index: 60;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1rem 2rem;
          background: rgba(253,251,247,0.88);
          backdrop-filter: blur(18px);
          border-bottom: 1px solid var(--line);
          box-shadow: 0 8px 30px rgba(26,43,76,0.05);
        }

        .logo {
          font-size: 2.2rem;
          font-weight: 800;
          letter-spacing: -0.04em;
          color: var(--indigo);
          text-decoration: none;
        }

        .logo span {
          color: var(--cacao);
        }

        .nav-actions {
          display: flex;
          align-items: center;
          gap: 0.8rem;
        }

        .nav-btn {
          padding: 0.7rem 1.1rem;
          border-radius: 999px;
          font-size: 0.9rem;
          font-weight: 600;
          text-decoration: none;
          background: white;
          color: var(--indigo);
          border: 1px solid rgba(26,43,76,0.12);
          transition: all 0.22s;
        }

        .nav-btn:hover {
          background: rgba(255,255,255,0.85);
          transform: translateY(-1px);
        }

        .nav-cta {
          padding: 0.75rem 1.15rem;
          border-radius: 999px;
          font-size: 0.84rem;
          font-weight: 600;
          text-decoration: none;
          background: var(--cacao);
          border: 1px solid var(--cacao);
          color: white;
          box-shadow: 0 12px 30px rgba(230,126,34,0.22);
          transition: all 0.22s;
        }

        .nav-cta:hover {
          background: var(--cacao-dark);
          transform: translateY(-1px);
        }

        .hero {
          position: relative;
          min-height: 62vh;
          display: flex;
          align-items: end;
          overflow: hidden;
        }

        .hero-bg {
          position: absolute;
          inset: 0;
          background-size: cover;
          background-position: center;
          filter: saturate(1.05) brightness(0.8);
        }

        .hero-overlay {
          position: absolute;
          inset: 0;
          background:
            linear-gradient(180deg, rgba(253,251,247,0.05) 0%, rgba(253,251,247,0.28) 100%),
            linear-gradient(105deg, rgba(26,43,76,0.82) 0%, rgba(26,43,76,0.58) 42%, rgba(26,43,76,0.16) 74%, transparent 100%);
        }

        .hero-inner {
          position: relative;
          z-index: 2;
          width: 100%;
          max-width: 1100px;
          margin: 0 auto;
          padding: 6rem 1.5rem 4rem;
          color: white;
        }

        .badge {
          display: inline-flex;
          align-items: center;
          padding: 0.45rem 0.9rem;
          font-size: 0.76rem;
          font-weight: 700;
          border-radius: 999px;
          background: rgba(230,126,34,0.95);
          color: white;
          box-shadow: 0 10px 24px rgba(230,126,34,0.18);
          margin-bottom: 1rem;
        }

        .hero-title {
          font-size: clamp(2.8rem, 7vw, 5.2rem);
          line-height: 0.95;
          letter-spacing: -0.065em;
          font-weight: 800;
          margin: 0 0 1rem;
        }

        .hero-title em {
          font-style: normal;
          color: #ffe1c4;
        }

        .hero-sub {
          max-width: 640px;
          font-size: 1rem;
          line-height: 1.8;
          color: rgba(255,255,255,0.86);
          margin: 0;
        }

        .section {
          max-width: 1100px;
          margin: 0 auto;
          padding: 5rem 1.5rem;
        }

        .section-label {
          display: inline-block;
          padding: 0.42rem 0.78rem;
          border-radius: 999px;
          font-size: 0.76rem;
          font-weight: 700;
          color: var(--indigo);
          background: rgba(26,43,76,0.05);
          border: 1px solid rgba(26,43,76,0.08);
          margin-bottom: 1rem;
        }

        .section-h2 {
          font-size: clamp(2rem, 5vw, 3.5rem);
          line-height: 1.02;
          letter-spacing: -0.06em;
          font-weight: 800;
          color: var(--indigo);
          margin: 0 0 0.8rem;
        }

        .section-h2 em {
          font-style: normal;
          color: var(--cacao);
        }

        .section-sub {
          font-size: 1rem;
          line-height: 1.78;
          color: var(--muted);
          max-width: 760px;
          margin: 0 0 2.4rem;
        }

        .stats {
          display: flex;
          justify-content: center;
          gap: 1rem;
          flex-wrap: wrap;
          width: min(1100px, calc(100% - 2rem));
          margin: -2rem auto 0;
          position: relative;
          z-index: 3;
        }

        .stat-card {
          min-width: 180px;
          padding: 1.2rem 1.4rem;
          border-radius: 20px;
          background: rgba(255,255,255,0.86);
          border: 1px solid rgba(26,43,76,0.08);
          box-shadow: var(--shadow);
          text-align: center;
          backdrop-filter: blur(12px);
        }

        .stat-n {
          font-size: 1.6rem;
          font-weight: 800;
          letter-spacing: -0.05em;
          color: var(--indigo);
          margin-bottom: 0.16rem;
        }

        .stat-l {
          font-size: 0.82rem;
          color: var(--muted);
        }

        .grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 1rem;
        }

        .card {
          overflow: hidden;
          border-radius: 24px;
          background: rgba(255,255,255,0.84);
          border: 1px solid rgba(26,43,76,0.08);
          box-shadow: var(--shadow);
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }

        .card:hover {
          transform: translateY(-4px);
          box-shadow: 0 24px 45px rgba(26,43,76,0.16);
        }

        .card img {
          width: 100%;
          height: 240px;
          object-fit: cover;
          display: block;
        }

        .card-body {
          padding: 1.25rem;
        }

        .card-title {
          font-size: 1.35rem;
          font-weight: 800;
          letter-spacing: -0.04em;
          color: var(--indigo);
          margin: 0 0 0.4rem;
        }

        .card-location {
          font-size: 0.94rem;
          color: var(--muted);
          margin: 0 0 0.55rem;
        }

        .card-desc {
          font-size: 0.92rem;
          line-height: 1.7;
          color: var(--muted);
          margin: 0 0 1rem;
        }

        .card-bottom {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.8rem;
          flex-wrap: wrap;
        }

        .price {
          font-size: 1rem;
          font-weight: 800;
          color: var(--cacao);
        }

        .mini-btn {
          display: inline-block;
          text-decoration: none;
          padding: 0.82rem 1.1rem;
          border-radius: 999px;
          font-size: 0.88rem;
          font-weight: 600;
          background: var(--indigo);
          color: white;
          transition: all 0.22s;
        }

        .mini-btn:hover {
          transform: translateY(-1px);
          background: #15233f;
        }

        .divider {
          width: min(1100px, calc(100% - 3rem));
          height: 1px;
          margin: 0 auto;
          background: linear-gradient(to right, transparent, rgba(26,43,76,0.12), transparent);
        }

        .footer {
          border-top: 1px solid rgba(26,43,76,0.08);
          padding: 2rem 1.5rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 1rem;
          max-width: 1100px;
          margin: 0 auto;
        }

        .footer-logo {
          font-size: 1rem;
          font-weight: 800;
          color: var(--indigo);
        }

        .footer-logo span {
          color: var(--cacao);
        }

        .footer-text {
          font-size: 0.88rem;
          color: rgba(26,43,76,0.48);
        }

        @media (max-width: 768px) {
          .nav {
            padding: 0.9rem 1rem;
          }

          .nav-actions {
            display: none;
          }

          .logo {
            font-size: 1.8rem;
          }

          .hero {
            min-height: 56vh;
          }

          .hero-inner {
            padding: 5rem 1rem 3rem;
          }

          .section {
            padding: 4rem 1rem;
          }

          .stats {
            flex-direction: column;
            align-items: stretch;
          }

          .stat-card {
            width: 100%;
            min-width: unset;
          }

          .card img {
            height: 220px;
          }
        }
      `}</style>

      <div className="grain" />

      <main className="page">
        <nav className="nav">
          <a href="/" className="logo">
            RESER<span>-VE</span>
          </a>

          <div className="nav-actions">
            <a href="/#destinos" className="nav-btn">
              Destinos
            </a>
            <a href="/#posaderos" className="nav-btn">
              Posaderos
            </a>
            <a href="/#como-funciona" className="nav-btn">
              Cómo funciona
            </a>
            <a href="/#posaderos" className="nav-cta">
              Registra tu posada
            </a>
          </div>
        </nav>

        <section className="hero">
          <div
            className="hero-bg"
            style={{ backgroundImage: `url('${destino.hero}')` }}
          />
          <div className="hero-overlay" />

          <div className="hero-inner">
            <div className="badge">{destino.tagline}</div>
            <h1 className="hero-title">
              Posadas en <br />
              <em>{destino.nombre}</em>
            </h1>
            <p className="hero-sub">{destino.descripcion}</p>
          </div>
        </section>

        <div className="stats">
          <div className="stat-card">
            <div className="stat-n">{destino.posadas.length}</div>
            <div className="stat-l">posadas disponibles</div>
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
          <h2 className="section-h2">
            Explora las <em>posadas</em> disponibles
          </h2>
          <p className="section-sub">
            Selecciona la opción que mejor se adapte a tu viaje y descubre una
            forma más cálida, local y confiable de hospedarte en Venezuela.
          </p>

          <div className="grid">
            {destino.posadas.map((posada, index) => (
              <div className="card" key={index}>
                <img src={posada.imagen} alt={posada.nombre} />
                <div className="card-body">
                  <h3 className="card-title">{posada.nombre}</h3>
                  <p className="card-location">{posada.ubicacion}</p>
                  <p className="card-desc">{posada.descripcion}</p>

                  <div className="card-bottom">
                    <div className="price">{posada.precio}</div>
                    <a href="#" className="mini-btn">
                      Ver detalles
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="divider" />

        <footer className="footer">
          <div className="footer-logo">
            RESER<span>-VE</span>
          </div>
          <div className="footer-text">Impulsado por Dos Locos de Viaje</div>
        </footer>
      </main>
    </>
  )
}