import Link from "next/link";

export function CtaBanner() {
  return (
    <section className="py-24 bg-[#051125] relative overflow-hidden">
      {/* Radial glow */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse 80% 60% at 50% 100%, rgba(13,148,136,0.15) 0%, transparent 70%)" }} />
      {/* Grid */}
      <div className="absolute inset-0 opacity-[0.04]"
        style={{ backgroundImage: "radial-gradient(#0d9488 1px, transparent 1px)", backgroundSize: "40px 40px" }} />

      <div className="relative max-w-4xl mx-auto px-6 text-center">
        <div className="inline-flex items-center gap-2.5 border border-teal-500/30 bg-teal-500/10 rounded-full px-5 py-2 mb-8">
          <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
          <span className="text-teal-300 text-xs font-semibold uppercase tracking-widest">14 días gratis · Sin tarjeta</span>
        </div>

        <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-[1.1] tracking-tight mb-6">
          El paciente de hoy<br />
          no espera al de mañana.
        </h2>

        <p className="text-white/50 text-lg mb-10 max-w-xl mx-auto leading-relaxed">
          Automatiza tu clínica hoy. El próximo paciente que escriba por WhatsApp
          será atendido en segundos, no mañana.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/login"
            className="inline-flex items-center justify-center gap-2.5 bg-teal-500 text-white font-black px-8 py-4 rounded-2xl hover:bg-teal-400 transition-all text-base shadow-xl shadow-teal-500/20 hover:-translate-y-0.5">
            Crear mi clínica gratis
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
          <a href="mailto:hola@salus-ia.com"
            className="inline-flex items-center justify-center gap-2 border border-white/20 text-white/80 font-semibold px-8 py-4 rounded-2xl hover:bg-white/8 hover:text-white transition-all text-base">
            Hablar con el equipo
          </a>
        </div>

        <p className="text-white/20 text-xs mt-8">
          Sin contrato · Cancela cuando quieras · Soporte en español
        </p>
      </div>
    </section>
  );
}
