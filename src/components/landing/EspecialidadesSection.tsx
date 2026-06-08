const ESPECIALIDADES = [
  { icon: "stethoscope",    label: "Clínica General",    color: "text-blue-400",    bg: "bg-blue-400/10",    border: "border-blue-400/20" },
  { icon: "dentistry",      label: "Odontología",         color: "text-cyan-400",    bg: "bg-cyan-400/10",    border: "border-cyan-400/20" },
  { icon: "medication",     label: "Farmacia",            color: "text-emerald-400", bg: "bg-emerald-400/10", border: "border-emerald-400/20" },
  { icon: "child_care",     label: "Pediatría",           color: "text-yellow-400",  bg: "bg-yellow-400/10",  border: "border-yellow-400/20" },
  { icon: "psychology",     label: "Psicología",          color: "text-violet-400",  bg: "bg-violet-400/10",  border: "border-violet-400/20" },
  { icon: "sports_gymnastics", label: "Fisioterapia",     color: "text-orange-400",  bg: "bg-orange-400/10",  border: "border-orange-400/20" },
  { icon: "nutrition",      label: "Nutrición",           color: "text-lime-400",    bg: "bg-lime-400/10",    border: "border-lime-400/20" },
  { icon: "biotech",        label: "Laboratorio",         color: "text-pink-400",    bg: "bg-pink-400/10",    border: "border-pink-400/20" },
  { icon: "pets",           label: "Veterinaria",         color: "text-amber-400",   bg: "bg-amber-400/10",   border: "border-amber-400/20" },
  { icon: "visibility",     label: "Optometría",          color: "text-sky-400",     bg: "bg-sky-400/10",     border: "border-sky-400/20" },
];

export function EspecialidadesSection() {
  return (
    <section id="especialidades" className="py-20 bg-white">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-12">
          <span className="inline-block text-sm font-semibold text-cyan-600 bg-cyan-50 px-3 py-1 rounded-full mb-4 border border-cyan-100">
            10 especialidades médicas
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-3 tracking-tight">
            Un sistema para toda<br className="hidden sm:block" /> el área de salud
          </h2>
          <p className="text-slate-500 text-lg max-w-xl mx-auto">
            Salus IA se adapta automáticamente al tipo de clínica que tienes.
            El bot habla y agenda como lo haría tu recepcionista.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {ESPECIALIDADES.map((e) => (
            <div key={e.label}
              className={`flex flex-col items-center gap-3 rounded-2xl border ${e.border} ${e.bg} p-5 hover:shadow-md transition-all hover:scale-[1.02] cursor-default`}>
              <div className={`w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center`}>
                <span className={`material-symbols-outlined text-[22px] ${e.color}`}>{e.icon}</span>
              </div>
              <span className="text-slate-700 text-sm font-medium text-center leading-tight">{e.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
