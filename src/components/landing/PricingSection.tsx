import Link from "next/link";

const PLANS = [
  {
    key: "basico",
    name: "Básico",
    price: "L 300",
    usd: "~$12 USD",
    period: "/mes",
    desc: "Para consultorios que están comenzando a automatizar.",
    features: [
      "Bot IA 24/7 por WhatsApp",
      "Hasta 100 pacientes",
      "Agenda de citas automática",
      "Expediente clínico básico",
      "Recordatorios 24h antes",
      "1 doctor / usuario",
      "Soporte por email",
    ],
    cta: "Empezar gratis",
    href: "/login",
    highlighted: false,
    badge: null,
  },
  {
    key: "clinica",
    name: "Clínica",
    price: "L 600",
    usd: "~$24 USD",
    period: "/mes",
    desc: "Para clínicas en crecimiento con varios doctores.",
    features: [
      "Todo lo del plan Básico",
      "Hasta 400 pacientes",
      "Recetas digitales",
      "Seguimiento de tratamientos",
      "Recordatorios pre y post cita",
      "Hasta 5 doctores",
      "Human takeover desde panel",
      "Soporte prioritario",
    ],
    cta: "Empezar gratis",
    href: "/login",
    highlighted: true,
    badge: "Más popular",
  },
  {
    key: "pro",
    name: "Pro",
    price: "L 1,200",
    usd: "~$48 USD",
    period: "/mes",
    desc: "Para clínicas consolidadas con más capacidad.",
    features: [
      "Todo lo del plan Clínica",
      "Pacientes ilimitados",
      "Inventario de farmacia",
      "Reportes y estadísticas",
      "Tu propio número WhatsApp",
      "Usuarios ilimitados",
      "API de integración",
      "Chat de soporte",
    ],
    cta: "Empezar gratis",
    href: "/login",
    highlighted: false,
    badge: null,
  },
  {
    key: "enterprise",
    name: "Enterprise",
    price: "Contactar",
    usd: null,
    period: null,
    desc: "Para cadenas y clínicas con múltiples sucursales.",
    features: [
      "Todo lo del plan Pro",
      "Múltiples sucursales",
      "Bot personalizado avanzado",
      "Integración con sistemas externos",
      "Soporte dedicado",
      "SLA garantizado",
    ],
    cta: "Contactar ventas",
    href: "mailto:ventas@salus-ia.com",
    highlighted: false,
    badge: null,
  },
];

export function PricingSection() {
  return (
    <section id="precios" className="py-24 bg-white">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-6">
          <span className="inline-block text-sm font-semibold text-cyan-600 bg-cyan-50 px-3 py-1 rounded-full mb-4 border border-cyan-100">
            Precios transparentes
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4 tracking-tight">
            Empieza gratis,<br />paga cuando estés listo
          </h2>
          <p className="text-slate-500 text-lg max-w-xl mx-auto">
            Todos los planes incluyen <strong className="text-slate-700">14 días de prueba gratuita</strong> sin restricciones.
            Sin tarjeta de crédito.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5 items-start mt-12">
          {PLANS.map((plan) => (
            <div key={plan.key}
              className={`relative rounded-2xl p-6 border flex flex-col transition-all ${
                plan.highlighted
                  ? "bg-[#051125] border-cyan-400/30 shadow-2xl shadow-black/20 lg:-mt-4"
                  : plan.key === "enterprise"
                  ? "bg-slate-900 border-slate-700"
                  : "bg-white border-slate-200 hover:border-slate-300 hover:shadow-lg"
              }`}>

              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-cyan-400 text-[#051125] text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap shadow-lg">
                    {plan.badge}
                  </span>
                </div>
              )}

              <div className="mb-5">
                <h3 className={`font-bold text-lg mb-1 ${plan.highlighted || plan.key === "enterprise" ? "text-white" : "text-slate-900"}`}>
                  {plan.name}
                </h3>
                <div className="flex items-baseline gap-1.5 mb-1">
                  <span className={`font-bold ${
                    plan.price === "Contactar"
                      ? "text-xl text-slate-300"
                      : `text-3xl ${plan.highlighted ? "text-cyan-400" : plan.key === "enterprise" ? "text-white" : "text-slate-900"}`
                  }`}>
                    {plan.price}
                  </span>
                  {plan.period && (
                    <span className={`text-sm ${plan.highlighted || plan.key === "enterprise" ? "text-white/40" : "text-slate-400"}`}>
                      {plan.period}
                    </span>
                  )}
                </div>
                {plan.usd && (
                  <p className={`text-xs ${plan.highlighted ? "text-cyan-400/60" : "text-slate-400"}`}>{plan.usd}</p>
                )}
                <p className={`text-sm mt-2 ${plan.highlighted || plan.key === "enterprise" ? "text-white/55" : "text-slate-500"}`}>
                  {plan.desc}
                </p>
              </div>

              <ul className="space-y-2.5 mb-6 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5">
                    <span className={`material-symbols-outlined text-[16px] mt-0.5 shrink-0 ${
                      plan.highlighted ? "text-cyan-400" : plan.key === "enterprise" ? "text-slate-400" : "text-emerald-500"
                    }`}>check_circle</span>
                    <span className={`text-sm ${plan.highlighted || plan.key === "enterprise" ? "text-white/75" : "text-slate-600"}`}>
                      {f}
                    </span>
                  </li>
                ))}
              </ul>

              <Link href={plan.href}
                className={`block text-center font-semibold py-3 rounded-xl transition-all text-sm ${
                  plan.highlighted
                    ? "bg-cyan-400 text-[#051125] hover:bg-white"
                    : plan.key === "enterprise"
                    ? "bg-white/10 text-white hover:bg-white/20 border border-white/20"
                    : "bg-[#051125] text-white hover:bg-[#1b263b]"
                }`}>
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>

        <div className="mt-10 text-center">
          <div className="inline-flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 shadow-sm">
            <span className="material-symbols-outlined text-slate-500 text-2xl">payments</span>
            <div className="text-left">
              <p className="text-sm font-semibold text-slate-700">Pago flexible en Honduras y LATAM</p>
              <p className="text-xs text-slate-400">Transferencia BAC/Atlántida · Tarjeta de crédito/débito · PayPal</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
