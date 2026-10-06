import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Política de Privacidad',
  description: 'Cómo RESER-VE recopila, usa y protege tus datos.',
}

const SECCIONES: { t: string; p: string[] }[] = [
  { t: '1. Datos que recopilamos', p: [
    'Recopilamos los datos que nos proporcionas al crear una cuenta (nombre, correo electrónico y contraseña cifrada), al reservar (fechas, número de huéspedes, método de pago preferido y notas) y al comunicarte con posaderos o con soporte.',
    'Si publicas una posada, recopilamos la información del listado (fotos, descripción, ubicación, precios y datos de contacto).',
  ]},
  { t: '2. Cómo usamos tus datos', p: [
    'Usamos tus datos para operar la plataforma: mostrar posadas, gestionar solicitudes de reserva, facilitar la comunicación entre viajero y posadero, enviar notificaciones por correo y mejorar el servicio.',
    'No vendemos tus datos personales a terceros.',
  ]},
  { t: '3. Asistente de IA', p: [
    'Nuestros asistentes de IA (Chigüi y Aurora) procesan tus mensajes para ayudarte a reservar y responder consultas. No compartimos datos sensibles de pago con ellos y sus respuestas pueden contener errores.',
  ]},
  { t: '4. Con quién compartimos datos', p: [
    'Compartimos con el posadero los datos necesarios para gestionar tu reserva (nombre, fechas, contacto). Usamos proveedores de infraestructura (alojamiento, base de datos, envío de correos) que procesan datos en nuestro nombre bajo acuerdos de confidencialidad.',
  ]},
  { t: '5. Seguridad', p: [
    'Las contraseñas se almacenan cifradas. Aplicamos medidas razonables para proteger tu información, aunque ningún sistema es 100% infalible. Nunca te pediremos tu contraseña ni datos completos de tarjeta por correo o chat.',
  ]},
  { t: '6. Tus derechos', p: [
    'Puedes acceder, corregir o eliminar tus datos personales escribiéndonos. También puedes cerrar tu cuenta en cualquier momento.',
  ]},
  { t: '7. Cookies', p: [
    'Usamos cookies estrictamente necesarias para mantener tu sesión iniciada y el funcionamiento del sitio.',
  ]},
  { t: '8. Contacto', p: [
    'Para cualquier asunto relacionado con tu privacidad, escríbenos a hola@reser-ve.com.',
  ]},
]

export default function PrivacidadPage() {
  return (
    <>
      <style>{`
        :root{--indigo:#1A2B4C;--cacao:#E67E22;--sand:#FDFBF7;--muted:#5d6b80;--line:rgba(26,43,76,0.1);}
        *,*::before,*::after{box-sizing:border-box;}
        body{margin:0;font-family:'Inter',system-ui,sans-serif;background:var(--sand);color:var(--indigo);}
        .nav{background:white;border-bottom:1.5px solid var(--line);padding:0 2rem;height:64px;display:flex;align-items:center;justify-content:space-between;position:sticky;top:var(--pp-h,0px);z-index:50;}
        .logo{font-size:1.25rem;font-weight:800;letter-spacing:-0.04em;color:var(--indigo);text-decoration:none;}
        .logo span{color:var(--cacao);}
        .back{font-size:0.85rem;color:var(--muted);text-decoration:none;font-weight:600;}
        .wrap{max-width:760px;margin:0 auto;padding:3rem 1.5rem 5rem;}
        h1{font-family:'Playfair Display',Georgia,serif;font-size:2.2rem;font-weight:700;margin:0 0 .3rem;}
        .sub{color:var(--muted);font-size:.9rem;margin-bottom:2.5rem;}
        h2{font-size:1.1rem;font-weight:800;margin:2rem 0 .6rem;color:var(--indigo);}
        p{line-height:1.75;color:#33445c;margin:.5rem 0;font-size:.95rem;}
        .foot{margin-top:3rem;padding-top:1.5rem;border-top:1px solid var(--line);font-size:.85rem;color:var(--muted);}
      `}</style>
      <nav className="nav">
        <Link href="/" className="logo">RESER<span>-VE</span></Link>
        <Link href="/" className="back">← Inicio</Link>
      </nav>
      <main className="wrap">
        <h1>Política de Privacidad</h1>
        <div className="sub">Última actualización: septiembre 2026</div>
        {SECCIONES.map(s => (
          <section key={s.t}>
            <h2>{s.t}</h2>
            {s.p.map((par, i) => <p key={i}>{par}</p>)}
          </section>
        ))}
        <div className="foot">
          Consulta también nuestros <Link href="/terminos" style={{ color: 'var(--cacao)' }}>Términos y Condiciones</Link>.
        </div>
      </main>
    </>
  )
}
