const FEATURES_MAIN = [
  {
    icon: "smart_toy",
    title: "IA especializada en salud",
    desc: "El bot entiende terminología médica y adapta su lenguaje según la especialidad. No es un chatbot genérico — conoce la diferencia entre una consulta de control y una urgencia.",
    wide: true,
  },
  {
    icon: "folder_shared",
    title: "Expediente clínico digital",
    desc: "Historial completo por paciente: síntomas, diagnósticos, recetas y seguimiento. Accesible desde cualquier dispositivo.",
    wide: false,
  },
  {
    icon: "medication",
    title: "Recetas digitales",
    desc: "Emite recetas con medicamentos y dosis. El bot recuerda al paciente tomar su tratamiento.",
    wide: false,
  },
  {
    icon: "notifications_active",
    title: "Recordatorios automáticos",
    desc: "WhatsApp 24h y 2h antes. Reduce inasistencias hasta un 40% sin que hagas nada.",
    wide: false,
  },
  {
    icon: "supervisor_account",
    title: "Human takeover",
    desc: "Toma el control de cualquier conversación desde el panel. El bot se pausa mientras tú atiendes.",
    wide: false,
  },
  {
    icon: "inventory_2",
    title: "Farmacia integrada",
    desc: "Para farmacias: stock, precios, alertas de stock bajo y dispensación con receta obligatoria.",
    wide: true,
  },
];

export function FeaturesSection() {
  return (
    <section id="caracteristicas" className="py-24 bg-white">
      <div className="max-w-6xl mx-auto px-6">

        <div className="flex flex-col lg:flex-row items-start justify-between gap-6 mb-14">
          <div>
            <span className="inline-block text-xs font-bold text-teal-700 bg-teal-50 border border-teal-100 px-3 py-1 rounded-full uppercase tracking-wide mb-5">
              Características
            </span>
            <h2 className="text-4xl sm:text-5xl font-black text-[#051125] tracking-tight leading-[1.1]">
              Todo en un<br />solo lugar.
            </h2>
          </div>
          <p className="text-slate-500 text-lg leading-relaxed max-w-sm lg:pt-14">
            No es solo un bot. Es el sistema de gestión clínica completo con IA nativa para el sector salud.
          </p>
        </div>

        {/* Grid asimétrico: dos columnas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {FEATURES_MAIN.map((f, i) => (
            <div key={i}
              className={`rounded-3xl border border-slate-100 bg-slate-50 hover:bg-white hover:border-slate-200 hover:shadow-lg transition-all p-7 group ${
                f.wide ? "md:col-span-2" : "md:col-span-1"
              }`}>
              <div className="w-12 h-12 rounded-2xl bg-[#051125] flex items-center justify-center mb-5 group-hover:bg-[#1b263b] transition-colors shadow-sm">
                <span className="material-symbols-outlined text-white text-[22px]">{f.icon}</span>
              </div>
              <h3 className="font-bold text-[#051125] text-lg mb-2">{f.title}</h3>
              <p className="text-slate-500 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
