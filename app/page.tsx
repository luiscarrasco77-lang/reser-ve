export default function Home() {
  return (
    <main className="min-h-screen bg-white">

      {/* NAV */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
        <div className="text-lg font-medium tracking-tight">
          RESER<span className="text-emerald-600">-VE</span>
        </div>
        <div className="hidden md:flex items-center gap-6">
          <a href="#destinos" className="text-sm text-gray-500 hover:text-gray-800">Destinos</a>
          <a href="#posaderos" className="text-sm text-gray-500 hover:text-gray-800">Para posaderos</a>
          <a href="#como-funciona" className="text-sm text-gray-500 hover:text-gray-800">Cómo funciona</a>
          <a href="#posaderos" className="text-sm bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors">
            Registra tu posada
          </a>
        </div>
      </nav>

      {/* HERO */}
      <section className="text-center px-6 pt-16 pb-12 max-w-4xl mx-auto">
        <div className="inline-block text-xs px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 mb-5">
          Venezuela turística — Beta 2026
        </div>
        <h1 className="text-4xl md:text-5xl font-medium tracking-tight leading-tight mb-4">
          Descubre y reserva{" "}
          <span className="text-emerald-600">posadas auténticas</span>{" "}
          en Venezuela
        </h1>
        <p className="text-gray-500 text-lg max-w-xl mx-auto mb-8 leading-relaxed">
          La primera plataforma especializada en alojamientos locales venezolanos.
          Reserva con confianza, paga en USD, y vive Venezuela de verdad.
        </p>
        <div className="flex gap-3 justify-center flex-wrap mb-8">
          <a href="#destinos" className="bg-emerald-600 text-white px-7 py-3 rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium">
            Explorar posadas
          </a>
          <a href="#posaderos" className="border border-gray-200 text-gray-700 px-7 py-3 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium">
            ¿Tienes una posada?
          </a>
        </div>

        {/* SEARCH BAR */}
        <div className="flex flex-wrap gap-3 items-center justify-center bg-gray-50 border border-gray-100 rounded-xl p-4 max-w-2xl mx-auto mb-10">
          <select className="flex-1 min-w-[140px] text-sm px-3 py-2 rounded-lg border border-gray-200 bg-white text-gray-700">
            <option>¿A dónde vas?</option>
            <option>Los Roques</option>
            <option>Mérida</option>
            <option>Mochima</option>
            <option>Morrocoy</option>
            <option>Canaima</option>
          </select>
          <input type="date" className="flex-1 min-w-[130px] text-sm px-3 py-2 rounded-lg border border-gray-200 bg-white text-gray-700" />
          <button className="bg-emerald-600 text-white text-sm px-5 py-2 rounded-lg hover:bg-emerald-700 transition-colors whitespace-nowrap">
            Buscar posadas
          </button>
        </div>

        {/* STATS */}
        <div className="flex justify-center gap-10 flex-wrap">
          <div className="text-center">
            <div className="text-2xl font-medium">+3.4M</div>
            <div className="text-xs text-gray-400 mt-1">turistas en 2025</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-medium">+44%</div>
            <div className="text-xs text-gray-400 mt-1">crecimiento turístico</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-medium">8M</div>
            <div className="text-xs text-gray-400 mt-1">diáspora venezolana</div>
          </div>
        </div>
      </section>

      <hr className="border-gray-100 mx-6" />

      {/* CÓMO FUNCIONA */}
      <section id="como-funciona" className="px-6 py-14 max-w-4xl mx-auto">
        <div className="text-xs text-emerald-600 uppercase tracking-widest mb-2">Cómo funciona</div>
        <h2 className="text-2xl font-medium tracking-tight mb-1">Simple para viajeros, simple para posaderos</h2>
        <p className="text-gray-500 text-sm mb-8">Todo el proceso en minutos, sin tecnicismos.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <div className="text-sm font-medium text-gray-700 mb-4 pb-2 border-b border-gray-100">Para viajeros</div>
            <div className="flex flex-col gap-4">
              {[
                ["Busca tu destino", "Filtra por destino, fechas y tipo de posada en más de 5 regiones."],
                ["Elige con confianza", "Fotos profesionales, reseñas verificadas y toda la info que necesitas."],
                ["Reserva y paga en USD", "Pago seguro via Zelle o Zinli. Confirmación instantánea."],
                ["Disfruta Venezuela", "Llega con todo listo. Sin sorpresas ni gestión manual."],
              ].map(([title, desc], i) => (
                <div key={i} className="flex gap-3">
                  <div className="w-7 h-7 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium flex items-center justify-center flex-shrink-0 mt-0.5">
                    {i + 1}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-800">{title}</div>
                    <div className="text-xs text-gray-500 mt-0.5 leading-relaxed">{desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <div className="text-sm font-medium text-gray-700 mb-4 pb-2 border-b border-gray-100">Para posaderos</div>
            <div className="flex flex-col gap-4">
              {[
                ["Regístra tu posada", "Alta en menos de 10 minutos. Sin tecnicismos, todo en español."],
                ["Te hacemos las fotos", "Enviamos un fotógrafo profesional. Nosotros producimos el contenido."],
                ["Empieza a recibir reservas", "Tu perfil activo 24/7. Los viajeros reservan directamente."],
                ["Cobra en USD", "Recibe pagos via Zelle o Zinli. Sin complicaciones con divisas."],
              ].map(([title, desc], i) => (
                <div key={i} className="flex gap-3">
                  <div className="w-7 h-7 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium flex items-center justify-content-center flex-shrink-0 mt-0.5" style={{display:'flex',alignItems:'center',justifyContent:'center'}}>
                    {i + 1}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-800">{title}</div>
                    <div className="text-xs text-gray-500 mt-0.5 leading-relaxed">{desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <hr className="border-gray-100 mx-6" />

      {/* DESTINOS */}
      <section id="destinos" className="px-6 py-14 max-w-4xl mx-auto">
        <div className="text-xs text-emerald-600 uppercase tracking-widest mb-2">Destinos</div>
        <h2 className="text-2xl font-medium tracking-tight mb-1">Los mejores rincones de Venezuela</h2>
        <p className="text-gray-500 text-sm mb-8">Posadas verificadas en los destinos más buscados.</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[
            { icon: "🏝️", name: "Los Roques", count: "12 posadas", tag: "Más popular" },
            { icon: "⛰️", name: "Mérida", count: "9 posadas", tag: "Los Andes" },
            { icon: "🌊", name: "Mochima", count: "7 posadas", tag: "Costa" },
            { icon: "🌴", name: "Morrocoy", count: "6 posadas", tag: "Costa" },
            { icon: "🌋", name: "Canaima", count: "4 posadas", tag: "Gran Sabana" },
            { icon: "🗺️", name: "Más destinos", count: "Próximamente", tag: "" },
          ].map((d, i) => (
            <div key={i} className="border border-gray-100 rounded-xl p-4 hover:border-emerald-200 hover:bg-emerald-50/30 transition-colors cursor-pointer">
              <div className="text-2xl mb-2">{d.icon}</div>
              <div className="text-sm font-medium text-gray-800">{d.name}</div>
              <div className="text-xs text-gray-400 mt-0.5">{d.count}</div>
              {d.tag && (
                <div className="inline-block text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 mt-2">
                  {d.tag}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      <hr className="border-gray-100 mx-6" />

      {/* POSADEROS */}
      <section id="posaderos" className="px-6 py-14 max-w-4xl mx-auto">
        <div className="bg-gray-50 border border-gray-100 rounded-2xl p-8 flex flex-col md:flex-row gap-8">
          <div className="flex-1">
            <div className="text-xs text-emerald-600 uppercase tracking-widest mb-3">Para posaderos</div>
            <h2 className="text-2xl font-medium tracking-tight mb-3">Tu posada merece estar en el siglo XXI</h2>
            <p className="text-gray-500 text-sm leading-relaxed mb-5">
              Deja de gestionar reservas por WhatsApp. RESER-VE te da visibilidad digital,
              fotos profesionales y pagos en USD — sin complicaciones técnicas.
            </p>
            <div className="flex flex-col gap-3">
              {[
                "Fotografía profesional incluida en el paquete",
                "Perfil activo con visibilidad para la diáspora venezolana",
                "Cobros en USD por Zelle y Zinli",
                "Respaldado por la comunidad Dos Locos de Viaje",
              ].map((f, i) => (
                <div key={i} className="flex items-start gap-2">
                  <div className="w-4 h-4 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                      <path d="M1.5 4l1.5 1.5 3.5-3" stroke="#059669" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                  </div>
                  <span className="text-sm text-gray-600">{f}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="flex-1 max-w-xs">
            <div className="bg-white border border-gray-100 rounded-xl p-5">
              <div className="text-xs text-emerald-600 uppercase tracking-widest mb-1">Paquete digitalización</div>
              <div className="text-3xl font-medium mt-1">$150 <span className="text-sm font-normal text-gray-400">USD único</span></div>
              <p className="text-xs text-gray-500 mt-2 mb-4">Todo lo que necesitas para empezar a recibir reservas.</p>
              <ul className="flex flex-col gap-2 mb-5">
                {[
                  "Sesión fotográfica profesional",
                  "Perfil completo en la plataforma",
                  "Gestión del perfil digital",
                  "1 mes de visibilidad premium",
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-xs text-gray-600">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0"></span>
                    {item}
                  </li>
                ))}
              </ul>
              <button className="w-full bg-emerald-600 text-white text-sm py-2.5 rounded-lg hover:bg-emerald-700 transition-colors">
                Quiero digitalizar mi posada
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-gray-100 px-6 py-6 flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="text-sm text-gray-400">© 2026 RESER-VE · Plataforma de posadas venezolanas</div>
        <div className="flex gap-5">
          <a href="#" className="text-xs text-gray-400 hover:text-gray-600">Sobre nosotros</a>
          <a href="#" className="text-xs text-gray-400 hover:text-gray-600">Contacto</a>
          <a href="#" className="text-xs text-gray-400 hover:text-gray-600">Términos</a>
        </div>
        <div className="text-xs text-gray-300">Impulsado por Dos Locos de Viaje</div>
      </footer>

    </main>
  );
}