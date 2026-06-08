const ESPECIALIDADES = [
  { icon: "stethoscope",       label: "Clínica General" },
  { icon: "dentistry",         label: "Odontología" },
  { icon: "medication",        label: "Farmacia" },
  { icon: "child_care",        label: "Pediatría" },
  { icon: "psychology",        label: "Psicología" },
  { icon: "sports_gymnastics", label: "Fisioterapia" },
  { icon: "nutrition",         label: "Nutrición" },
  { icon: "biotech",           label: "Laboratorio" },
  { icon: "pets",              label: "Veterinaria" },
  { icon: "visibility",        label: "Optometría" },
];

export function EspecialidadesSection() {
  return (
    <section id="especialidades" className="py-20 bg-slate-50 border-y border-slate-100">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-10">
          <p className="text-slate-400 text-sm font-medium uppercase tracking-widest mb-3">Compatible con</p>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            10 especialidades médicas, un solo sistema
          </h2>
        </div>

        {/* Pills en fila con scroll */}
        <div className="flex flex-wrap justify-center gap-3">
          {ESPECIALIDADES.map((e) => (
            <div key={e.label}
              className="flex items-center gap-2.5 bg-white border border-slate-200 rounded-full px-5 py-2.5 hover:border-teal-300 hover:bg-teal-50 hover:shadow-sm transition-all cursor-default group">
              <span className="material-symbols-outlined text-slate-400 text-[18px] group-hover:text-teal-600 transition-colors">
                {e.icon}
              </span>
              <span className="text-slate-700 text-sm font-medium group-hover:text-teal-700 transition-colors">
                {e.label}
              </span>
            </div>
          ))}
        </div>

        <p className="text-center text-slate-400 text-sm mt-8">
          El bot se adapta automáticamente al vocabulario y flujo de cada especialidad.
        </p>
      </div>
    </section>
  );
}
