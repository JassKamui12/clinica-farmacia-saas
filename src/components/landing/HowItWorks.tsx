import Link from "next/link";

const STEPS = [
  {
    n: "01",
    icon: "app_registration",
    title: "Registra tu clínica",
    desc: "Elige tu especialidad, agrega tus servicios y horarios de atención. Sin instalar nada, sin tarjeta.",
    time: "2 minutos",
    color: "bg-[#051125]",
  },
  {
    n: "02",
    icon: "qr_code_scanner",
    title: "Conecta tu WhatsApp",
    desc: "Escanea un QR con tu teléfono. El bot usa tu número actual. Tus pacientes no notan el cambio.",
    time: "30 segundos",
    color: "bg-teal-600",
  },
  {
    n: "03",
    icon: "auto_awesome",
    title: "El bot trabaja solo",
    desc: "Comparte tu número. La IA atiende, agenda citas, registra síntomas y manda recordatorios 24/7.",
    time: "De ahí en adelante",
    color: "bg-emerald-600",
  },
];

export function HowItWorks() {
  return (
    <section id="como-funciona" className="py-24 bg-slate-50">
      <div className="max-w-6xl mx-auto px-6">

        <div className="text-center mb-16">
          <span className="inline-block text-xs font-bold text-[#051125] bg-slate-200 border border-slate-300 px-3 py-1 rounded-full uppercase tracking-wide mb-5">
            Así de simple
          </span>
          <h2 className="text-4xl sm:text-5xl font-black text-[#051125] tracking-tight leading-[1.1] mb-4">
            De cero a bot activo<br className="hidden sm:block" />
            <span className="text-[#0d9488]"> en 5 minutos.</span>
          </h2>
          <p className="text-slate-500 text-lg max-w-lg mx-auto">
            Sin técnicos. Sin instalaciones. Si sabes usar WhatsApp, puedes configurar Salus IA.
          </p>
        </div>

        {/* Timeline horizontal */}
        <div className="relative">
          {/* Línea conectora */}
          <div className="hidden lg:block absolute top-[52px] left-[calc(16.66%+24px)] right-[calc(16.66%+24px)] h-px bg-gradient-to-r from-[#051125] via-teal-400 to-emerald-500 opacity-20" />

          <div className="grid lg:grid-cols-3 gap-8">
            {STEPS.map((step, i) => (
              <div key={i} className="relative">
                {/* Paso */}
                <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
                  <div className={`w-14 h-14 rounded-2xl ${step.color} flex items-center justify-center mb-5 shadow-lg`}>
                    <span className="material-symbols-outlined text-white text-2xl">{step.icon}</span>
                  </div>
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-5xl font-black text-slate-100 leading-none">{step.n}</span>
                    <h3 className="text-xl font-bold text-[#051125]">{step.title}</h3>
                  </div>
                  <p className="text-slate-500 leading-relaxed mb-4">{step.desc}</p>
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400">
                    <span className="material-symbols-outlined text-[14px]">timer</span>
                    {step.time}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-16 bg-white rounded-3xl border border-slate-200 p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-sm">
          <div>
            <p className="font-bold text-[#051125] text-xl mb-1">¿Listo para automatizar tu clínica?</p>
            <p className="text-slate-500 text-sm">14 días gratis. Sin tarjeta. Sin compromiso.</p>
          </div>
          <Link href="/login"
            className="shrink-0 inline-flex items-center gap-2 bg-[#051125] text-white font-bold px-7 py-3.5 rounded-2xl hover:bg-[#1b263b] transition-all shadow-lg shadow-[#051125]/20 hover:-translate-y-0.5">
            <span className="material-symbols-outlined text-[18px]">rocket_launch</span>
            Empezar ahora
          </Link>
        </div>
      </div>
    </section>
  );
}
