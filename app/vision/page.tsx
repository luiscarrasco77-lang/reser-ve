import Link from 'next/link'

export const metadata = {
  title: 'Sobre nosotros',
  description: 'Qué es RESER-VE y por qué nos enfocamos en las posadas de Venezuela.',
}

export default function VisionPage() {
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
          --cacao-light: rgba(230,126,34,0.12);
          --text: #1A2B4C;
          --muted: #7A8699;
          --line: rgba(26,43,76,0.08);
          --shadow: 0 8px 32px rgba(26,43,76,0.10);
          --shadow-lg: 0 20px 60px rgba(26,43,76,0.14);
        }
        *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
        html { scroll-behavior: smooth; }
        body {
          font-family: 'Inter', sans-serif;
          background: var(--sand);
          color: var(--text);
          overflow-x: hidden;
        }

        /* NAV */
        .vis-nav {
          position: sticky; top: var(--pp-h, 0px); z-index: 60;
          display: flex; align-items: center; justify-content: space-between;
          padding: 1rem 2rem;
          background: rgba(253,251,247,0.96);
          backdrop-filter: blur(24px);
          border-bottom: 1px solid var(--line);
          box-shadow: 0 4px 24px rgba(26,43,76,0.06);
        }
        .vis-logo { height: 32px; width: auto; display: block; }
        .vis-nav-links { display: flex; align-items: center; gap: 1.5rem; }
        .vis-nav-link {
          font-size: 0.88rem; color: rgba(26,43,76,0.65); text-decoration: none;
          font-weight: 500; transition: color 0.2s;
        }
        .vis-nav-link:hover { color: var(--indigo); }
        .vis-nav-cta {
          padding: 0.65rem 1.2rem; border-radius: 999px;
          font-size: 0.84rem; font-weight: 700; text-decoration: none;
          background: var(--cacao); color: white;
          transition: background 0.2s, transform 0.2s;
          box-shadow: 0 6px 20px rgba(230,126,34,0.28);
        }
        .vis-nav-cta:hover { background: var(--cacao-dark); transform: translateY(-1px); }
        @media(max-width: 768px) {
          .vis-nav-links { display: none; }
          .vis-nav { padding: 0.85rem 1.25rem; }
        }

        /* HERO */
        .vis-hero {
          position: relative; min-height: 72vh;
          display: flex; align-items: flex-end;
          overflow: hidden;
        }
        .vis-hero-img {
          position: absolute; inset: 0;
          background: url('/images/Guacamaya.webp') center/cover no-repeat;
          filter: brightness(0.68) saturate(1.1);
        }
        .vis-hero-overlay {
          position: absolute; inset: 0;
          background: linear-gradient(165deg, rgba(15,27,48,0.72) 0%, rgba(26,43,76,0.45) 50%, transparent 80%),
                      linear-gradient(0deg, rgba(15,27,48,0.78) 0%, transparent 60%);
        }
        .vis-hero-content {
          position: relative; z-index: 2;
          max-width: 1100px; margin: 0 auto; width: 100%;
          padding: 4rem 2rem 5rem;
          color: white;
        }
        .vis-hero-label {
          display: inline-block; margin-bottom: 1.2rem;
          padding: 0.44rem 0.9rem; border-radius: 999px;
          font-size: 0.74rem; font-weight: 700; letter-spacing: 0.1em;
          text-transform: uppercase;
          background: rgba(230,126,34,0.9); color: white;
          box-shadow: 0 4px 16px rgba(230,126,34,0.3);
        }
        .vis-hero-h1 {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: clamp(3rem, 8vw, 5.5rem);
          line-height: 1.0; letter-spacing: -0.04em;
          font-weight: 800; margin-bottom: 1.2rem;
        }
        .vis-hero-h1 em { font-style: italic; color: #ffc88a; }
        .vis-hero-sub {
          font-size: 1.12rem; line-height: 1.8;
          color: rgba(255,255,255,0.78); max-width: 560px;
        }
        @media(max-width: 600px) {
          .vis-hero-content { padding: 3rem 1.25rem 3.5rem; }
        }

        /* CONTENT */
        .vis-main { max-width: 780px; margin: 0 auto; padding: 5rem 2rem; }
        @media(max-width: 600px) { .vis-main { padding: 3.5rem 1.25rem; } }

        .vis-section { margin-bottom: 4.5rem; }
        .vis-section-label {
          display: inline-flex; align-items: center; gap: 0.5rem;
          padding: 0.4rem 0.85rem; border-radius: 999px;
          font-size: 0.72rem; font-weight: 700; letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--cacao); background: rgba(230,126,34,0.08);
          border: 1px solid rgba(230,126,34,0.18);
          margin-bottom: 1rem;
        }
        .vis-section-label::before {
          content: ''; width: 6px; height: 6px; border-radius: 50%; background: var(--cacao);
        }
        .vis-h2 {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: clamp(1.9rem, 4.5vw, 2.8rem);
          line-height: 1.1; letter-spacing: -0.03em;
          font-weight: 800; color: var(--indigo);
          margin-bottom: 1.1rem;
        }
        .vis-h2 em { font-style: italic; color: var(--cacao); }
        .vis-p {
          font-size: 1.05rem; line-height: 1.88;
          color: var(--muted); margin-bottom: 1.3rem;
        }
        .vis-p:last-child { margin-bottom: 0; }

        /* PULL QUOTE */
        .vis-quote {
          margin: 3rem 0;
          padding: 2.2rem 2.5rem;
          background: linear-gradient(135deg, rgba(230,126,34,0.06) 0%, rgba(230,126,34,0.02) 100%);
          border-left: 4px solid var(--cacao);
          border-radius: 0 20px 20px 0;
          box-shadow: var(--shadow);
        }
        .vis-quote blockquote {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 1.45rem; font-style: italic;
          line-height: 1.65; color: var(--indigo);
          margin-bottom: 0.9rem;
        }
        .vis-quote cite {
          font-size: 0.84rem; font-style: normal;
          color: var(--muted); font-weight: 600;
        }
        @media(max-width: 600px) {
          .vis-quote { padding: 1.5rem 1.5rem; }
          .vis-quote blockquote { font-size: 1.2rem; }
        }

        /* DIVIDER */
        .vis-divider {
          height: 1px; background: linear-gradient(to right, transparent, rgba(26,43,76,0.1), transparent);
          margin: 0 0 4.5rem;
        }

        /* IMAGE BLOCK */
        .vis-img-block {
          border-radius: 24px; overflow: hidden;
          margin: 2.5rem 0; box-shadow: var(--shadow-lg);
          max-height: 420px;
        }
        .vis-img-block img {
          width: 100%; height: 100%; object-fit: cover;
          display: block; max-height: 420px;
          filter: brightness(0.92) saturate(1.05);
          transition: transform 0.6s ease;
        }
        .vis-img-block:hover img { transform: scale(1.02); }

        /* CTA SECTION */
        .vis-cta {
          background: var(--indigo);
          border-radius: 28px;
          padding: 3.5rem 3rem;
          text-align: center;
          position: relative; overflow: hidden;
          margin-top: 1rem;
        }
        .vis-cta::before {
          content: '';
          position: absolute; inset: 0;
          background: radial-gradient(ellipse 80% 60% at 50% 50%, rgba(230,126,34,0.18) 0%, transparent 70%);
          pointer-events: none;
        }
        .vis-cta-inner { position: relative; z-index: 1; }
        .vis-cta h2 {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: clamp(1.8rem, 4vw, 2.8rem);
          font-weight: 800; color: white;
          letter-spacing: -0.03em; line-height: 1.1;
          margin-bottom: 0.9rem;
        }
        .vis-cta h2 em { font-style: italic; color: #ffc88a; }
        .vis-cta p { font-size: 1rem; line-height: 1.7; color: rgba(255,255,255,0.65); margin-bottom: 2rem; }
        .vis-cta-btn {
          display: inline-flex; align-items: center; gap: 0.5rem;
          text-decoration: none; padding: 1.05rem 2rem; border-radius: 999px;
          font-size: 0.95rem; font-weight: 700;
          background: var(--cacao); color: white;
          box-shadow: 0 10px 28px rgba(230,126,34,0.35); transition: all 0.25s;
          font-family: 'Inter', sans-serif;
        }
        .vis-cta-btn:hover { background: var(--cacao-dark); transform: translateY(-2px); box-shadow: 0 16px 40px rgba(230,126,34,0.45); }
        .vis-cta-sec {
          display: inline-flex; align-items: center; gap: 0.5rem;
          text-decoration: none; padding: 1.05rem 1.8rem; border-radius: 999px;
          font-size: 0.93rem; font-weight: 600;
          color: rgba(255,255,255,0.82);
          border: 1.5px solid rgba(255,255,255,0.28);
          transition: all 0.25s; margin-left: 1rem;
          font-family: 'Inter', sans-serif;
        }
        .vis-cta-sec:hover { border-color: rgba(255,255,255,0.65); background: rgba(255,255,255,0.08); }
        .vis-cta-btns { display: flex; gap: 0.75rem; justify-content: center; flex-wrap: wrap; }
        @media(max-width: 600px) {
          .vis-cta { padding: 2.5rem 1.5rem; border-radius: 20px; }
          .vis-cta-sec { margin-left: 0; }
        }

        /* FOOTER NOTE */
        .vis-footer-note {
          max-width: 780px; margin: 0 auto;
          padding: 2rem 2rem 3rem;
          text-align: center;
          font-size: 0.84rem; color: var(--muted);
          border-top: 1px solid var(--line);
        }
        .vis-footer-note a { color: var(--muted); transition: color 0.2s; }
        .vis-footer-note a:hover { color: var(--indigo); }
      `}</style>

      {/* NAV */}
      <nav className="vis-nav">
        <Link href="/">
          <img src="/images/logo-horizontal.svg" alt="RESER-VE" className="vis-logo" />
        </Link>
        <div className="vis-nav-links">
          <Link href="/buscar" className="vis-nav-link">Explorar posadas</Link>
          <Link href="/posaderos" className="vis-nav-link">Posaderos</Link>
          <Link href="/register?role=host" className="vis-nav-cta">Registra tu posada</Link>
        </div>
      </nav>

      {/* HERO */}
      <section className="vis-hero">
        <div className="vis-hero-img" />
        <div className="vis-hero-overlay" />
        <div className="vis-hero-content">
          <div className="vis-hero-label">Sobre nosotros</div>
          <h1 className="vis-hero-h1">
            Por qué <em>posadas</em>
          </h1>
          <p className="vis-hero-sub">
            En Venezuela, la mejor forma de conocer un destino suele ser quedarse en una posada. Queremos que encontrarlas y reservarlas sea igual de fácil que reservar un hotel.
          </p>
        </div>
      </section>

      {/* MAIN CONTENT */}
      <main className="vis-main">

        {/* Section 1 */}
        <section className="vis-section">
          <div className="vis-section-label">Qué es una posada</div>
          <h2 className="vis-h2">Pequeñas, familiares y bien ubicadas</h2>
          <p className="vis-p">
            Una posada es un alojamiento pequeño, normalmente de pocas habitaciones, que gestiona una familia. Los dueños suelen vivir en el lugar o muy cerca y conocen bien la zona: saben qué tour vale la pena, quién hace el mejor traslado y dónde comer.
          </p>
          <p className="vis-p">
            Hay posadas frente al mar en Los Roques y Mochima, en la montaña en Mérida, en pueblos coloniales como Coro o junto a los tepuyes de la Gran Sabana. En muchos de esos lugares no hay hoteles grandes: las posadas son la forma principal de alojarse.
          </p>
        </section>

        <div className="vis-divider" />

        {/* Image */}
        <div className="vis-img-block">
          <img src="/images/lodge-canaima_01.webp" alt="Posada en Canaima, Venezuela" loading="lazy" />
        </div>

        {/* Section 2 */}
        <section className="vis-section">
          <div className="vis-section-label">El problema</div>
          <h2 className="vis-h2">Difíciles de encontrar y de reservar</h2>
          <p className="vis-p">
            La mayoría de las posadas no aparecen en Booking ni en Airbnb. Se reservan por WhatsApp o Instagram, sin precios claros, sin fotos actualizadas y sin ninguna garantía para quien paga por adelantado. Para quien viaja desde el exterior es todavía más difícil.
          </p>
        </section>

        <div className="vis-divider" />

        {/* Section 3 */}
        <section className="vis-section">
          <div className="vis-section-label">Qué hacemos</div>
          <h2 className="vis-h2">Un solo lugar para buscar, comparar y reservar</h2>
          <p className="vis-p">
            En RESER-VE cada posada tiene su página con fotos, precio por noche, servicios, políticas y ubicación. Nuestro equipo revisa cada una antes de publicarla. El viajero paga exactamente el precio publicado y coordina todo con el posadero por un chat dentro de la plataforma, que deja registro de lo acordado.
          </p>
          <p className="vis-p">
            Los pagos se hacen como ya funciona en Venezuela: Zelle, Pago Móvil, transferencia o efectivo, según lo que acepte cada posada.
          </p>
          <p className="vis-p">
            RESER-VE es un proyecto de <a href="https://www.instagram.com/doslocosdeviaje/" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'underline' }}>Dos Locos de Viaje</a>, una comunidad de viajeros venezolanos.
          </p>
        </section>

        {/* CTA */}
        <div className="vis-cta">
          <div className="vis-cta-inner">
            <h2>Explora las <em>posadas</em></h2>
            <p>Busca por destino, precio o forma de pago.</p>
            <div className="vis-cta-btns">
              <Link href="/buscar" className="vis-cta-btn">
                Ver posadas
              </Link>
              <Link href="/register?role=host" className="vis-cta-sec">
                Tengo una posada
              </Link>
            </div>
          </div>
        </div>

      </main>

      {/* FOOTER NOTE */}
      <div className="vis-footer-note">
        <p>
          © 2026 RESER-VE · Impulsado por{' '}
          <a href="https://www.instagram.com/doslocosdeviaje/" target="_blank" rel="noopener noreferrer">
            dos locos de viaje
          </a>
          {' '}·{' '}
          <Link href="/">Inicio</Link>
          {' '}·{' '}
          <Link href="/buscar">Explorar posadas</Link>
        </p>
      </div>
    </>
  )
}
