const FEATURES = [
  {
    icon: "smart_toy",
    title: "Bot IA que entiende el contexto médico",
    desc: "El asistente conoce terminología médica, entiende síntomas y adapta su tono a cada especialidad. No es un chatbot genérico.",
    badge: "IA Médica",
    badgeColor: "bg-cyan-100 text-cyan-700",
  },
  {
    icon: "calendar_month",
    title: "Agenda citas sin doble-libro",
    desc: "Consulta la disponibilidad real en tiempo real antes de confirmar. Nunca dos pacientes al mismo horario.",
    badge: "Anti-colisión",
    badgeColor: "bg-emerald-100 text-emerald-700",
  },
  {
    icon: "folder_shared",
    title: "Expediente clínico digital",
    desc: "Cada paciente tiene su historia clínica: síntomas, diagnósticos, recetas y seguimiento. Accesible desde cualquier dispositivo.",
    badge: "Historial",
    badgeColor: "bg-blue-100 text-blue-700",
  },
  {
    icon: "medication",
    title: "Recetas digitales con seguimiento",
    desc: "Emite recetas digitales con medicamentos, dosis y vigencia. El bot recuerda al paciente tomar su tratamiento.",
    badge: "Farmacia",
    badgeColor: "bg-violet-100 text-violet-700",
  },
  {
    icon: "notifications_active",
    title: "Recordatorios automáticos de citas",
    desc: "El bot envía recordatorios por WhatsApp 24 horas y 2 horas antes. Reduce las inasistencias hasta un 40%.",
    badge: "Automático",
    badgeColor: "bg-amber-100 text-amber-700",
  },
  {
    icon: "supervisor_account",
    title: "Human takeover — tú controlas",
    desc: "Si necesitas intervenir en cualquier conversación, solo escribe desde el panel. El bot se pausa y tú atiendes directamente.",
    badge: "Control total",
    badgeColor: "bg-slate-100 text-slate-700",
  },
  {
    icon: "group",
    title: "Múltiples doctores y roles",
    desc: "Agrega doctores, recepcionistas y farmacéuticos. Cada uno con acceso solo a lo que necesita.",
    badge: "Multi-rol",
    badgeColor: "bg-pink-100 text-pink-700",
  },
  {
    icon: "inventory_2",
    title: "Inventario de farmacia integrado",
    desc: "Para farmacias: controla stock, precios, alertas de stock bajo y dispensación de medicamentos con receta.",
    badge: "Solo farmacia",
    badgeColor: "bg-orange-100 text-orange-700",
  },
];

export function FeaturesSection() {
  return (
    <section id="caracteristicas" className="py-24 bg-slate-50">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-14">
          <span className="inline-block text-sm font-semibold text-[#051125] bg-slate-200 px-3 py-1 rounded-full mb-4 border border-slate-300">
            Características
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-3 tracking-tight">
            Todo lo que tu clínica necesita,<br className="hidden sm:block" /> en un solo lugar
          </h2>
          <p className="text-slate-500 text-lg max-w-xl mx-auto">
            No es solo un bot. Es el sistema de gestión clínica completo con IA integrada.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {FEATURES.map((f) => (
            <div key={f.title}
              className="bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-lg hover:border-slate-300 transition-all group">
              <div className="flex items-start justify-between mb-4">
                <div className="w-11 h-11 rounded-xl bg-[#051125] flex items-center justify-center group-hover:bg-[#1b263b] transition-colors">
                  <span className="material-symbols-outlined text-white text-[20px]">{f.icon}</span>
                </div>
                <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${f.badgeColor}`}>
                  {f.badge}
                </span>
              </div>
              <h3 className="font-semibold text-slate-900 text-sm mb-2 leading-snug">{f.title}</h3>
              <p className="text-slate-500 text-xs leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
