import Link from "next/link";

export function CtaBanner() {
  return (
    <section className="py-20 bg-[#051125] relative overflow-hidden">
      <div className="absolute inset-0 opacity-[0.05]"
        style={{ backgroundImage: "radial-gradient(#22d3ee 1px, transparent 1px)", backgroundSize: "32px 32px" }} />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-48 rounded-full blur-3xl opacity-10"
        style={{ background: "radial-gradient(circle, #22d3ee, transparent 70%)" }} />

      <div className="relative max-w-3xl mx-auto px-6 text-center">
        <div className="inline-flex items-center gap-2 bg-cyan-400/10 border border-cyan-400/20 rounded-full px-4 py-1.5 mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
          <span className="text-cyan-400 text-xs font-semibold tracking-wide uppercase">
            14 días gratis · Sin tarjeta
          </span>
        </div>

        <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4 tracking-tight leading-[1.15]">
          Tu clínica merece un<br />
          <span className="text-transparent bg-clip-text"
            style={{ backgroundImage: "linear-gradient(90deg, #22d3ee, #67e8f9)" }}>
            recepcionista IA 24/7
          </span>
        </h2>

        <p className="text-white/50 text-lg mb-8 max-w-lg mx-auto">
          Únete a clínicas en Honduras y LATAM que ya automatizan su agenda con Salus IA.
          Empieza hoy, gratis.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/login"
            className="inline-flex items-center justify-center gap-2 bg-cyan-400 text-[#051125] font-bold px-7 py-4 rounded-xl hover:bg-white transition-all text-base shadow-xl shadow-cyan-400/20">
            Crear mi clínica gratis
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
          <a href="mailto:hola@salus-ia.com"
            className="inline-flex items-center justify-center gap-2 border border-white/20 text-white font-medium px-7 py-4 rounded-xl hover:bg-white/5 transition-all text-base">
            <span className="material-symbols-outlined text-[18px]">mail</span>
            Hablar con ventas
          </a>
        </div>

        <p className="text-white/25 text-xs mt-5">
          Sin tarjeta · Sin contrato · Cancela cuando quieras
        </p>
      </div>
    </section>
  );
}
