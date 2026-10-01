import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Términos y Condiciones',
  description: 'Términos y condiciones de uso de RESER-VE.',
}

const SECCIONES: { t: string; p: string[] }[] = [
  { t: '1. Qué es RESER-VE', p: [
    'RESER-VE es una plataforma que conecta viajeros con posadas y anfitriones locales ("posaderos") en Venezuela. RESER-VE facilita el descubrimiento y la solicitud de reservas, pero no es propietaria ni operadora de las posadas listadas.',
    'La relación de alojamiento se establece directamente entre el viajero y el posadero.',
  ]},
  { t: '2. Reservas y pagos', p: [
    'Al solicitar una reserva, el viajero envía una solicitud que el posadero puede confirmar o rechazar. Una reserva solo es firme cuando el posadero la confirma.',
    'El precio mostrado es el precio final que paga el viajero; RESER-VE no añade comisiones al viajero. El pago se coordina directamente con el posadero mediante el método acordado (Zelle, Pago Móvil, transferencia, efectivo, etc.).',
    'RESER-VE no procesa ni custodia los pagos entre viajero y posadero. Recomendamos verificar los datos del anfitrión antes de transferir.',
  ]},
  { t: '3. Cancelaciones', p: [
    'Cada posada define su propia política de cancelación, indicada en su página. El viajero puede cancelar una solicitud en estado "pendiente" desde su panel de reservas.',
    'Las solicitudes pendientes que no sean respondidas por el posadero en 24 horas se cancelan automáticamente.',
  ]},
  { t: '4. Responsabilidades del posadero', p: [
    'El posadero es responsable de la exactitud de la información publicada (fotos, precios, servicios, disponibilidad) y de la calidad del alojamiento. RESER-VE revisa las posadas antes de publicarlas, pero no garantiza cada estancia.',
    'Paridad de precios: el precio publicado en RESER-VE debe ser igual o mejor que el ofrecido por el posadero en otros canales para la misma posada y fechas. No se permite inflar el precio en la plataforma para trasladar la comisión al viajero.',
  ]},
  { t: '5. Conducta del usuario', p: [
    'Los usuarios se comprometen a proporcionar información veraz, a no usar la plataforma con fines fraudulentos y a tratar con respeto a anfitriones y demás viajeros.',
    'RESER-VE puede suspender cuentas o posadas que incumplan estos términos.',
  ]},
  { t: '6. Reseñas', p: [
    'Solo los viajeros con una reserva confirmada o completada pueden dejar reseñas. Las reseñas deben ser honestas y respetuosas.',
  ]},
  { t: '7. Limitación de responsabilidad', p: [
    'RESER-VE actúa como intermediario tecnológico. No se hace responsable de disputas, daños o incumplimientos derivados de la relación directa entre viajero y posadero, dentro de lo permitido por la ley.',
  ]},
  { t: '8. Cambios', p: [
    'RESER-VE puede actualizar estos términos. El uso continuado de la plataforma implica la aceptación de la versión vigente.',
  ]},
]

export default function TerminosPage() {
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
        <h1>Términos y Condiciones</h1>
        <div className="sub">Última actualización: septiembre 2026</div>
        {SECCIONES.map(s => (
          <section key={s.t}>
            <h2>{s.t}</h2>
            {s.p.map((par, i) => <p key={i}>{par}</p>)}
          </section>
        ))}
        <div className="foot">
          ¿Dudas sobre estos términos? Escríbenos a <a href="mailto:hola@reser-ve.com" style={{ color: 'var(--cacao)' }}>hola@reser-ve.com</a> · Consulta también nuestra <Link href="/privacidad" style={{ color: 'var(--cacao)' }}>Política de Privacidad</Link>.
        </div>
      </main>
    </>
  )
}
