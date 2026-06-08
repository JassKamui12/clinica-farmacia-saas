const BEFORE_AFTER = [
  {
    before: { icon: "phone_missed",  text: "Los pacientes escriben mientras operas. Sin respuesta, se van a otra clínica." },
    after:  { icon: "smart_toy",     text: "El bot responde en segundos, las 24 horas. Ningún mensaje sin respuesta." },
  },
  {
    before: { icon: "book_5",        text: "Las citas en libreta o Excel generan doble-libros y confusión." },
    after:  { icon: "calendar_month",text: "El sistema verifica disponibilidad en tiempo real. Sin colisiones." },
  },
  {
    before: { icon: "person_off",    text: "Sin recepcionista nocturna, los pacientes quedan sin atención." },
    after:  { icon: "support_agent", text: "El bot trabaja de noche, fines de semana y feriados sin costo extra." },
  },
  {
    before: { icon: "notifications_off", text: "Los pacientes olvidan sus citas. Inasistencias que nadie recordó evitar." },
    after:  { icon: "notifications_active", text: "Recordatorios automáticos 24h y 2h antes por WhatsApp." },
  },
];

export function ProblemSection() {
  return (
    <section className="py-24 bg-white">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-start">

          {/* Left: headline */}
          <div className="lg:sticky lg:top-28">
            <span className="inline-block text-xs font-bold text-red-500 bg-red-50 border border-red-100 px-3 py-1 rounded-full uppercase tracking-wide mb-5">
              El problema real
            </span>
            <h2 className="text-4xl sm:text-5xl font-black text-[#051125] leading-[1.1] tracking-tight mb-6">
              Cada mensaje sin respuesta<br />
              <span className="text-red-400">es un paciente perdido.</span>
            </h2>
            <p className="text-slate-500 text-lg leading-relaxed mb-8">
              Y lo peor: nunca sabrás cuántos se fueron porque nadie les respondió.
              El 60% de los pacientes no llaman dos veces.
            </p>
            <div className="flex items-center gap-3 p-4 bg-teal-50 border border-teal-100 rounded-2xl">
              <span className="material-symbols-outlined text-teal-600 text-2xl shrink-0">check_circle</span>
              <p className="text-teal-800 text-sm font-medium">
                Salus IA soluciona todo esto desde el primer día, sin técnicos.
              </p>
            </div>
          </div>

          {/* Right: before/after cards */}
          <div className="space-y-4">
            {BEFORE_AFTER.map((item, i) => (
              <div key={i} className="grid grid-cols-2 gap-3">
                {/* Antes */}
                <div className="rounded-2xl border border-red-100 bg-red-50/50 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-7 h-7 rounded-lg bg-red-100 flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-red-500 text-[15px]">{item.before.icon}</span>
                    </div>
                    <span className="text-[10px] font-bold text-red-400 uppercase tracking-wide">Antes</span>
                  </div>
                  <p className="text-slate-600 text-xs leading-relaxed">{item.before.text}</p>
                </div>
                {/* Después */}
                <div className="rounded-2xl border border-teal-100 bg-teal-50/50 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-7 h-7 rounded-lg bg-teal-100 flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-teal-600 text-[15px]">{item.after.icon}</span>
                    </div>
                    <span className="text-[10px] font-bold text-teal-600 uppercase tracking-wide">Con Salus</span>
                  </div>
                  <p className="text-slate-700 text-xs leading-relaxed font-medium">{item.after.text}</p>
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>
    </section>
  );
}
