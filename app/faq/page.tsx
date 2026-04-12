import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Preguntas frecuentes | RESER-VE',
  description: 'Respuestas a las preguntas más comunes sobre RESER-VE, reservas, pagos y posadas venezolanas.',
}

const faqs = [
  {
    category: 'Sobre RESER-VE',
    items: [
      {
        q: '¿Qué es RESER-VE?',
        a: 'RESER-VE es la primera plataforma especializada en posadas auténticas venezolanas. Conectamos a viajeros con anfitriones locales en los destinos más hermosos de Venezuela — desde Los Roques hasta los Andes, pasando por Mochima, Canaima y mucho más.',
      },
      {
        q: '¿RESER-VE cobra comisiones?',
        a: 'No. RESER-VE no cobra comisiones al viajero. El precio que ves es el precio que pagas directamente al posadero. Sin sorpresas, sin cargos ocultos.',
      },
      {
        q: '¿Cómo está respaldada la plataforma?',
        a: 'RESER-VE es un proyecto impulsado por Dos Locos de Viaje, una comunidad venezolana de viajeros que cree en el turismo auténtico y responsable. Cada posada listada es revisada manualmente para garantizar calidad.',
      },
    ],
  },
  {
    category: 'Reservas y pagos',
    items: [
      {
        q: '¿Cómo funciona el proceso de reserva?',
        a: 'Encuentra tu posada ideal usando nuestro buscador, selecciona tus fechas y método de pago, y serás contactado directamente con el posadero. La coordinación final de la reserva ocurre de forma directa entre tú y el anfitrión.',
      },
      {
        q: '¿Qué métodos de pago se aceptan?',
        a: 'Cada posada define sus métodos de pago. Los más comunes en Venezuela son: Zelle (USD), transferencia bancaria venezolana (bolívares), efectivo en USD, efectivo en bolívares, y en algunos casos tarjeta de crédito. Puedes filtrar por método de pago en el buscador.',
      },
      {
        q: '¿Puedo cancelar mi reserva?',
        a: 'Las políticas de cancelación las define cada posadero de forma individual. Encontrarás los detalles en la página de cada posada. Te recomendamos leerlas antes de confirmar tu reserva y comunicarte directamente con el anfitrión ante cualquier cambio.',
      },
      {
        q: '¿Es seguro pagar por Zelle?',
        a: 'Zelle es el método de pago más utilizado entre venezolanos en el exterior. Es un servicio seguro vinculado a cuentas bancarias de EE.UU. Sin embargo, siempre recomendamos confirmar los datos del posadero antes de hacer cualquier transferencia, y comunicarte directamente con el anfitrión.',
      },
    ],
  },
  {
    category: 'Posadas y destinos',
    items: [
      {
        q: '¿Qué es una posada venezolana?',
        a: 'Una posada es un alojamiento pequeño, generalmente familiar, que forma parte de la tradición turística venezolana. A diferencia de los hoteles de cadena, las posadas ofrecen una experiencia personal, auténtica y cercana. El posadero suele vivir en el lugar y conoce a fondo su región.',
      },
      {
        q: '¿Las posadas están verificadas?',
        a: 'Sí. Antes de publicar cualquier posada en RESER-VE, nuestro equipo verifica la información del alojamiento, las fotos y los datos del anfitrión. Adicionalmente, las reseñas de huéspedes reales ayudan a mantener la calidad del listado.',
      },
      {
        q: '¿Cuáles son los destinos disponibles?',
        a: 'Actualmente cubrimos las principales regiones turísticas de Venezuela: Los Roques, Isla Margarita, Mochima, Morrocoy, Canaima, Mérida, Choroní, Caracas, La Guaira y más. Estamos agregando nuevas posadas constantemente.',
      },
      {
        q: '¿Puedo buscar por región?',
        a: 'Sí. En el buscador puedes seleccionar regiones completas como "Caribe Central", "Los Andes", "Islas del Caribe" o "Gran Sabana y Canaima", y ver todas las posadas disponibles en esa zona.',
      },
    ],
  },
  {
    category: 'Para posaderos',
    items: [
      {
        q: '¿Cómo publico mi posada en RESER-VE?',
        a: 'Visita nuestra página para posaderos y completa el formulario de registro. Nuestro equipo revisará tu solicitud y te contactará para completar el proceso. Es gratuito publicar tu posada.',
      },
      {
        q: '¿Cuánto cobra RESER-VE a los posaderos?',
        a: 'El listado básico es completamente gratuito. RESER-VE cree en apoyar el ecosistema de posadas venezolanas sin barreras económicas. En el futuro podríamos ofrecer planes premium opcionales con mayor visibilidad.',
      },
      {
        q: '¿Quién controla los precios y disponibilidad?',
        a: 'Tú como posadero tienes control total sobre tus precios, métodos de pago aceptados y políticas de la posada. RESER-VE es solo el canal de visibilidad; la relación con el huésped es siempre directa contigo.',
      },
    ],
  },
]

export default function FaqPage() {
  return (
    <>
      <style>{`
        :root {
          --indigo: #1A2B4C;
          --indigo-deep: #0F1B30;
          --sand: #FDFBF7;
          --cacao: #E67E22;
          --cacao-dark: #C96510;
          --muted: #7A8699;
          --line: rgba(26,43,76,0.08);
        }
        *, *::before, *::after { margin:0; padding:0; box-sizing:border-box; }
        body { font-family:'Inter',sans-serif; background:var(--sand); color:var(--indigo); }

        .nav {
          position:sticky; top:0; z-index:60;
          display:flex; align-items:center; justify-content:space-between;
          padding:1rem 2rem;
          background:rgba(253,251,247,0.95); backdrop-filter:blur(20px);
          border-bottom:1px solid var(--line);
        }
        .logo { font-size:1.4rem; font-weight:800; letter-spacing:-0.04em; color:var(--indigo); text-decoration:none; }
        .logo span { color:var(--cacao); }
        .nav-back { font-size:0.85rem; color:var(--muted); text-decoration:none; display:flex; align-items:center; gap:0.4rem; transition:color 0.2s; }
        .nav-back:hover { color:var(--indigo); }

        .hero-faq {
          background:linear-gradient(135deg, var(--indigo-deep) 0%, #1e3a6e 100%);
          padding:4rem 2rem 3.5rem;
          text-align:center;
          color:white;
        }
        .hero-faq h1 {
          font-family:'Playfair Display',Georgia,serif;
          font-size:clamp(2.2rem,5vw,3.5rem);
          font-weight:800; letter-spacing:-0.03em;
          margin-bottom:0.9rem;
        }
        .hero-faq p { font-size:1.05rem; color:rgba(255,255,255,0.72); max-width:520px; margin:0 auto; line-height:1.7; }

        .faq-wrap { max-width:760px; margin:0 auto; padding:3.5rem 2rem 5rem; }

        .faq-category { margin-bottom:3rem; }
        .cat-title {
          font-size:0.72rem; font-weight:700; letter-spacing:0.12em;
          text-transform:uppercase; color:var(--cacao);
          margin-bottom:1.2rem; padding-bottom:0.7rem;
          border-bottom:2px solid rgba(230,126,34,0.18);
        }

        details {
          border:1.5px solid var(--line);
          border-radius:14px;
          margin-bottom:0.7rem;
          background:white;
          overflow:hidden;
          transition:box-shadow 0.2s;
        }
        details:hover { box-shadow:0 4px 20px rgba(26,43,76,0.07); }
        details[open] { box-shadow:0 4px 20px rgba(26,43,76,0.10); }

        summary {
          display:flex; align-items:center; justify-content:space-between;
          padding:1.1rem 1.3rem;
          font-size:0.95rem; font-weight:600; color:var(--indigo);
          cursor:pointer; list-style:none; gap:1rem;
          user-select:none;
        }
        summary::-webkit-details-marker { display:none; }
        summary::after {
          content:''; flex-shrink:0;
          width:18px; height:18px;
          background:url("data:image/svg+xml,%3Csvg viewBox='0 0 24 24' fill='none' stroke='%237A8699' strokeWidth='2' xmlns='http://www.w3.org/2000/svg'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E") center/contain no-repeat;
          transition:transform 0.22s;
        }
        details[open] summary::after { transform:rotate(180deg); }

        .faq-answer {
          padding:0 1.3rem 1.2rem;
          font-size:0.9rem; color:var(--muted);
          line-height:1.75; border-top:1px solid var(--line);
          padding-top:0.9rem;
        }

        .cta-box {
          background:linear-gradient(135deg, var(--indigo) 0%, #1e3a6e 100%);
          border-radius:22px; padding:3rem 2rem;
          text-align:center; color:white; margin-top:3rem;
        }
        .cta-box h2 {
          font-family:'Playfair Display',Georgia,serif;
          font-size:1.8rem; font-weight:700; margin-bottom:0.7rem;
        }
        .cta-box p { color:rgba(255,255,255,0.72); margin-bottom:1.6rem; font-size:0.95rem; }
        .cta-btns { display:flex; gap:0.8rem; justify-content:center; flex-wrap:wrap; }
        .btn-primary {
          padding:0.85rem 1.6rem; border-radius:999px;
          background:var(--cacao); color:white;
          font-size:0.9rem; font-weight:700;
          text-decoration:none; transition:all 0.2s;
          box-shadow:0 8px 24px rgba(230,126,34,0.3);
        }
        .btn-primary:hover { background:var(--cacao-dark); transform:translateY(-1px); }
        .btn-ghost {
          padding:0.85rem 1.6rem; border-radius:999px;
          background:rgba(255,255,255,0.1); color:white;
          font-size:0.9rem; font-weight:600; border:1.5px solid rgba(255,255,255,0.25);
          text-decoration:none; transition:all 0.2s;
        }
        .btn-ghost:hover { background:rgba(255,255,255,0.18); }

        @media(max-width:640px) {
          .hero-faq { padding:3rem 1.25rem 2.5rem; }
          .faq-wrap { padding:2.5rem 1.25rem 4rem; }
        }
      `}</style>

      <nav className="nav">
        <a href="/" className="logo">RESER<span>-VE</span></a>
        <a href="/" className="nav-back">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
          Volver al inicio
        </a>
      </nav>

      <section className="hero-faq">
        <h1>Preguntas frecuentes</h1>
        <p>Todo lo que necesitas saber antes de reservar tu próxima aventura venezolana.</p>
      </section>

      <div className="faq-wrap">
        {faqs.map(cat => (
          <div key={cat.category} className="faq-category">
            <div className="cat-title">{cat.category}</div>
            {cat.items.map(item => (
              <details key={item.q}>
                <summary>{item.q}</summary>
                <div className="faq-answer">{item.a}</div>
              </details>
            ))}
          </div>
        ))}

        <div className="cta-box">
          <h2>¿Tienes otra pregunta?</h2>
          <p>Escríbenos directamente — respondemos rápido.</p>
          <div className="cta-btns">
            <a href="mailto:hola@reser-ve.com" className="btn-primary">Contáctanos</a>
            <a href="/buscar" className="btn-ghost">Explorar posadas</a>
          </div>
        </div>
      </div>
    </>
  )
}
