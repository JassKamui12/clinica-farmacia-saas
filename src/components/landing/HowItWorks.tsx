import Link from "next/link";

const STEPS = [
  {
    number: "01",
    icon: "app_registration",
    title: "Registra tu clínica",
    desc: "Crea tu cuenta en 2 minutos. Elige tu especialidad médica, agrega tus servicios y configura tus horarios de atención. Sin instalar nada, sin tarjeta de crédito.",
    detail: "Clínica General, Odontología, Farmacia, Pediatría y más.",
    color: "from-blue-500 to-cyan-500",
    lightBg: "bg-blue-50",
    lightBorder: "border-blue-100",
    lightIcon: "text-blue-600",
  },
  {
    number: "02",
    icon: "qr_code_scanner",
    title: "Conecta tu WhatsApp",
    desc: "Escanea un código QR con tu WhatsApp en 30 segundos. El bot usa tu número de siempre — los pacientes no notan ningún cambio en cómo te escriben.",
    detail: "Compatible con número personal o Business API de Meta.",
    color: "from-emerald-500 to-teal-500",
    lightBg: "bg-emerald-50",
    lightBorder: "border-emerald-100",
    lightIcon: "text-emerald-600",
  },
  {
    number: "03",
    icon: "smart_toy",
    title: "El bot trabaja solo",
    desc: "Comparte tu número con tus pacientes. El asistente IA responde, agenda, registra síntomas y manda recordatorios — las 24 horas, incluso cuando tú duermes.",
    detail: "Tú puedes intervenir en cualquier momento desde el panel.",
    color: "from-violet-500 to-purple-500",
    lightBg: "bg-violet-50",
    lightBorder: "border-violet-100",
    lightIcon: "text-violet-600",
  },
];

export function HowItWorks() {
  return (
    <section id="como-funciona" className="py-24 bg-white">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <span className="inline-block text-sm font-semibold text-[#051125] bg-slate-100 px-3 py-1 rounded-full mb-4 border border-slate-200">
            Así de simple
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-3 tracking-tight">
            En 5 minutos tienes tu<br className="hidden sm:block" /> clínica lista para operar
          </h2>
          <p className="text-slate-500 text-lg max-w-xl mx-auto">
            Sin técnicos, sin instalaciones, sin complicaciones. Si sabes usar WhatsApp,
            puedes usar Salus IA.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {STEPS.map((step, i) => (
            <div key={step.number} className="relative">
              {/* Línea conectora (solo desktop) */}
              {i < STEPS.length - 1 && (
                <div className="hidden lg:block absolute top-10 left-[calc(100%+0px)] w-8 border-t-2 border-dashed border-slate-200 -translate-y-px z-10" />
              )}

              <div className={`rounded-2xl border ${step.lightBorder} ${step.lightBg} p-7`}>
                {/* Número + ícono */}
                <div className="flex items-center gap-4 mb-5">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${step.color} flex items-center justify-center shadow-lg`}>
                    <span className={`material-symbols-outlined text-white text-2xl`}>{step.icon}</span>
                  </div>
                  <span className="text-4xl font-black text-slate-200 leading-none">{step.number}</span>
                </div>

                <h3 className="text-xl font-bold text-slate-900 mb-3">{step.title}</h3>
                <p className="text-slate-500 leading-relaxed text-sm mb-4">{step.desc}</p>
                <p className={`text-xs font-semibold ${step.lightIcon} flex items-center gap-1.5`}>
                  <span className="material-symbols-outlined text-[14px]">check_circle</span>
                  {step.detail}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-14 text-center">
          <Link href="/login"
            className="inline-flex items-center gap-2.5 bg-[#051125] text-white font-bold px-8 py-4 rounded-xl hover:bg-[#1b263b] transition-all text-base shadow-xl shadow-slate-900/20">
            <span className="material-symbols-outlined text-[20px]">rocket_launch</span>
            Empezar ahora — 14 días gratis
          </Link>
          <p className="text-slate-400 text-xs mt-3">Sin tarjeta de crédito · Cancela cuando quieras</p>
        </div>
      </div>
    </section>
  );
}
