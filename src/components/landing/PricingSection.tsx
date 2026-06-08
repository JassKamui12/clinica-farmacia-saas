import Link from "next/link";

const PLANS = [
  {
    name: "Básico",
    price: "L 300",
    usd: "$12 USD",
    desc: "Para consultorios que comienzan.",
    features: ["Bot IA 24/7", "Hasta 100 pacientes", "Agenda automática", "Recordatorios de citas", "1 doctor"],
    cta: "Empezar gratis",
    highlighted: false,
  },
  {
    name: "Clínica",
    price: "L 600",
    usd: "$24 USD",
    desc: "Para clínicas con varios doctores.",
    features: ["Todo lo Básico", "Hasta 400 pacientes", "Recetas digitales", "Seguimiento pacientes", "Hasta 5 doctores", "Soporte prioritario"],
    cta: "Empezar gratis",
    highlighted: true,
    badge: "Más popular",
  },
  {
    name: "Pro",
    price: "L 1,200",
    usd: "$48 USD",
    desc: "Máxima capacidad y control.",
    features: ["Todo lo Clínica", "Pacientes ilimitados", "Inventario farmacia", "Usuarios ilimitados", "Tu propio número WA", "API de integración"],
    cta: "Empezar gratis",
    highlighted: false,
  },
];

export function PricingSection() {
  return (
    <section id="precios" className="py-24 bg-slate-50">
      <div className="max-w-5xl mx-auto px-6">

        <div className="text-center mb-14">
          <span className="inline-block text-xs font-bold text-[#051125] bg-slate-200 border border-slate-300 px-3 py-1 rounded-full uppercase tracking-wide mb-5">
            Precios claros
          </span>
          <h2 className="text-4xl sm:text-5xl font-black text-[#051125] tracking-tight leading-[1.1] mb-4">
            Empieza gratis.<br />
            <span className="text-[#0d9488]">Paga cuando estés listo.</span>
          </h2>
          <p className="text-slate-500 text-lg max-w-md mx-auto">
            14 días de prueba en todos los planes. Sin tarjeta de crédito.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          {PLANS.map((plan) => (
            <div key={plan.name}
              className={`relative rounded-3xl p-7 flex flex-col transition-all ${
                plan.highlighted
                  ? "bg-[#051125] shadow-2xl shadow-[#051125]/30 scale-[1.02]"
                  : "bg-white border border-slate-200 hover:shadow-lg hover:border-slate-300"
              }`}>

              {plan.badge && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <span className="bg-teal-500 text-white text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-wide shadow-lg">
                    {plan.badge}
                  </span>
                </div>
              )}

              <div className="mb-6">
                <h3 className={`font-bold text-base mb-1 ${plan.highlighted ? "text-teal-400" : "text-slate-500"}`}>
                  {plan.name}
                </h3>
                <div className="flex items-baseline gap-1.5 mb-1">
                  <span className={`text-4xl font-black tracking-tight ${plan.highlighted ? "text-white" : "text-[#051125]"}`}>
                    {plan.price}
                  </span>
                  <span className={`text-sm ${plan.highlighted ? "text-white/40" : "text-slate-400"}`}>/mes</span>
                </div>
                <p className={`text-xs ${plan.highlighted ? "text-white/40" : "text-slate-400"}`}>≈ {plan.usd} · {plan.desc}</p>
              </div>

              <ul className="space-y-3 flex-1 mb-7">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2.5">
                    <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${
                      plan.highlighted ? "bg-teal-500/20" : "bg-teal-50"
                    }`}>
                      <span className={`material-symbols-outlined text-[10px] ${plan.highlighted ? "text-teal-400" : "text-teal-600"}`}>check</span>
                    </div>
                    <span className={`text-sm ${plan.highlighted ? "text-white/80" : "text-slate-600"}`}>{f}</span>
                  </li>
                ))}
              </ul>

              <Link href="/login"
                className={`block text-center font-bold py-3.5 rounded-2xl transition-all text-sm ${
                  plan.highlighted
                    ? "bg-teal-500 text-white hover:bg-teal-400"
                    : "bg-[#051125] text-white hover:bg-[#1b263b]"
                }`}>
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>

        {/* Enterprise row */}
        <div className="mt-5 bg-white border border-slate-200 rounded-3xl p-6 flex flex-col sm:flex-row items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-slate-600 text-2xl">corporate_fare</span>
            </div>
            <div>
              <p className="font-bold text-[#051125]">Enterprise — múltiples sucursales</p>
              <p className="text-slate-500 text-sm">Clientes ilimitados · Integraciones · Soporte dedicado · SLA</p>
            </div>
          </div>
          <a href="mailto:ventas@salus-ia.com"
            className="shrink-0 border-2 border-[#051125] text-[#051125] font-bold px-6 py-3 rounded-2xl hover:bg-[#051125] hover:text-white transition-all text-sm">
            Contactar ventas
          </a>
        </div>

        {/* Payment methods */}
        <div className="mt-8 text-center">
          <p className="text-slate-400 text-xs">
            Pago por transferencia bancaria (BAC, Atlántida) · Tarjeta de crédito/débito · PayPal
          </p>
        </div>
      </div>
    </section>
  );
}
