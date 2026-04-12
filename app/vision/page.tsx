import Link from 'next/link'

export const metadata = {
  title: 'Por qué posadas? · RESER-VE',
  description: 'Las posadas venezolanas son más que un hospedaje — son el alma de Venezuela. Descubre nuestra misión de conectar viajeros con anfitriones auténticos.',
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
          position: sticky; top: 0; z-index: 60;
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
          <Link href="/registro-posada" className="vis-nav-link">Posaderos</Link>
          <Link href="/registro-posada" className="vis-nav-cta">Registra tu posada</Link>
        </div>
      </nav>

      {/* HERO */}
      <section className="vis-hero">
        <div className="vis-hero-img" />
        <div className="vis-hero-overlay" />
        <div className="vis-hero-content">
          <div className="vis-hero-label">Nuestra visión</div>
          <h1 className="vis-hero-h1">
            ¿Por qué <em>posadas</em>?
          </h1>
          <p className="vis-hero-sub">
            Más que un hospedaje — las posadas son el corazón auténtico de Venezuela, donde cada estadía es una historia que vale la pena vivir.
          </p>
        </div>
      </section>

      {/* MAIN CONTENT */}
      <main className="vis-main">

        {/* Section 1 */}
        <section className="vis-section">
          <div className="vis-section-label">Más que un hospedaje</div>
          <h2 className="vis-h2">El alma de <em>Venezuela</em> tiene nombre propio</h2>
          <p className="vis-p">
            Una posada no es simplemente un lugar donde dormir. Es una familia que te abre su puerta, una historia que se teje con la tuya, una experiencia que ningún hotel de cadena puede replicar. En cada rincón de Venezuela — desde las islas de coral del Caribe hasta las mesas de roca milenaria de la Gran Sabana — las posadas guardan el secreto de lo que significa viajar de verdad.
          </p>
          <p className="vis-p">
            Son espacios íntimos donde el desayuno huele a cocina de abuela, donde el dueño te cuenta los mejores secretos del pueblo, donde el servicio no es una transacción sino un gesto genuino de hospitalidad. Aquí, el viajero no es un número de reserva: es un huésped bienvenido en el hogar de alguien.
          </p>
        </section>

        <div className="vis-divider" />

        {/* Image */}
        <div className="vis-img-block">
          <img src="/images/lodge-canaima_01.webp" alt="Posada en Canaima, Venezuela" loading="lazy" />
        </div>

        {/* Pull Quote */}
        <div className="vis-quote">
          <blockquote>
            "Cuando te quedas en una posada venezolana, no estás pagando por una cama. Estás invirtiendo en una conexión humana que dura toda la vida."
          </blockquote>
          <cite>— Un viajero que regresó tres veces al mismo lugar</cite>
        </div>

        {/* Section 2 */}
        <section className="vis-section">
          <div className="vis-section-label">Una tradición venezolana</div>
          <h2 className="vis-h2">Décadas de <em>hospitalidad</em> que no se improvisan</h2>
          <p className="vis-p">
            La posada venezolana tiene raíces profundas. Nació de la tradición de recibir al viajero con la misma calidez con que se recibe a un familiar. Los posaderos llevan generaciones perfeccionando el arte de hacer sentir a sus huéspedes como en casa — conocen cada sendero, cada plato típico, cada historia local que ningún guía turístico ha escrito.
          </p>
          <p className="vis-p">
            En un mundo donde el alojamiento se ha vuelto impersonal y predecible, las posadas venezolanas son una resistencia cultural y una apuesta por lo humano. Cada posadero que abre sus puertas al mundo es un embajador silencioso de lo mejor que Venezuela tiene para ofrecer: sus paisajes, su gente, su sabor.
          </p>
        </section>

        <div className="vis-divider" />

        {/* Section 3 */}
        <section className="vis-section">
          <div className="vis-section-label">Nuestra misión</div>
          <h2 className="vis-h2">Conectar lo <em>auténtico</em> con quien lo merece</h2>
          <p className="vis-p">
            RESER-VE nació de una convicción sencilla: Venezuela tiene un tesoro escondido en sus posadas, y el mundo debería poder encontrarlo con facilidad. Somos la primera plataforma especializada en alojamientos auténticos venezolanos — no hoteles de franquicia, no hostales genéricos, sino posadas con historia, con alma y con dueños que ponen el corazón en cada detalle.
          </p>
          <p className="vis-p">
            Trabajamos directamente con los posaderos, sin intermediarios que inflen precios o distorsionen la experiencia. Facilitamos los pagos en la forma que más le convenga al viajero — Zelle, Pago Móvil, transferencia, efectivo — porque entendemos la realidad venezolana y nos adaptamos a ella sin excusas.
          </p>
          <p className="vis-p">
            Cada posada en RESER-VE es un acto de confianza mutua: el posadero confía en que te mandamos un viajero que valora lo que ofrece, y el viajero confía en que la posada que encuentra aquí es exactamente lo que promete ser.
          </p>
        </section>

        {/* CTA */}
        <div className="vis-cta">
          <div className="vis-cta-inner">
            <h2>Explora las <em>posadas</em></h2>
            <p>Desde las playas cristalinas de Los Roques hasta los picos andinos de Mérida, tu próxima historia te está esperando.</p>
            <div className="vis-cta-btns">
              <Link href="/buscar" className="vis-cta-btn">
                Ver todas las posadas →
              </Link>
              <Link href="/registro-posada" className="vis-cta-sec">
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
