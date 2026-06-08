const PROBLEMS = [
  {
    icon: "phone_missed",
    title: "Pierdes pacientes mientras atiendes",
    desc: "Cuando estás en consulta, no puedes responder WhatsApp. Los pacientes escriben a la competencia.",
  },
  {
    icon: "schedule",
    title: "Anotas citas en libretas o Excel",
    desc: "Los doble-libros, las citas olvidadas y los no-shows cuestan tiempo y dinero.",
  },
  {
    icon: "person_off",
    title: "No tienes recepcionista 24/7",
    desc: "Fuera de horario, los pacientes quedan sin respuesta. Pierdes clientes incluso cuando estás dormido.",
  },
  {
    icon: "sms_failed",
    title: "Olvidas mandar recordatorios",
    desc: "Los pacientes no se presentan porque nadie les recordó. El 30% de las inasistencias se evitan con un mensaje.",
  },
];

export function ProblemSection() {
  return (
    <section className="py-20 bg-slate-50">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-12">
          <span className="inline-block text-sm font-semibold text-red-600 bg-red-50 px-3 py-1 rounded-full mb-4 border border-red-100">
            El problema de hoy
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-3 tracking-tight">
            Tu clínica pierde pacientes<br className="hidden sm:block" /> que nunca sabrás que perdiste
          </h2>
          <p className="text-slate-500 text-lg max-w-xl mx-auto">
            Cada mensaje sin respuesta es un paciente que va a otra clínica.
            Y tú ni te enteraste.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {PROBLEMS.map((p) => (
            <div key={p.title} className="bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-md transition-shadow">
              <div className="w-11 h-11 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-red-500 text-[22px]">{p.icon}</span>
              </div>
              <h3 className="font-semibold text-slate-900 text-base mb-2">{p.title}</h3>
              <p className="text-slate-500 text-sm leading-relaxed">{p.desc}</p>
            </div>
          ))}
        </div>

        {/* Transición */}
        <div className="mt-14 text-center">
          <div className="inline-flex items-center gap-3 bg-white border border-slate-200 rounded-2xl px-6 py-4 shadow-sm">
            <span className="material-symbols-outlined text-cyan-500 text-2xl">arrow_downward</span>
            <p className="text-slate-700 font-semibold">
              Salus IA resuelve todo esto automáticamente
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
