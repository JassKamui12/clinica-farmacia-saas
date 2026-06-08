import Link from "next/link";

const COLUMNS = {
  "Producto": [
    { label: "Cómo funciona", href: "#como-funciona" },
    { label: "Especialidades", href: "#especialidades" },
    { label: "Características", href: "#caracteristicas" },
    { label: "Precios", href: "#precios" },
    { label: "FAQ", href: "#faq" },
  ],
  "Acceso": [
    { label: "Iniciar sesión", href: "/login" },
    { label: "Registrar clínica", href: "/login" },
    { label: "Soporte", href: "mailto:hola@salus-ia.com" },
  ],
  "Legal": [
    { label: "Privacidad", href: "/privacy" },
    { label: "Términos", href: "/terms" },
  ],
};

export function LandingFooter() {
  return (
    <footer className="bg-[#030b1a] border-t border-white/5">
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-12">

          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2.5 mb-5">
              <div className="w-8 h-8 rounded-lg bg-[#051125] border border-white/10 flex items-center justify-center">
                <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4">
                  <path d="M15 8C15 8 13.5 6 11.5 6C9.2 6 7.5 7.5 7.5 9.5C7.5 11.5 9.5 12.5 11.5 13.2C13.5 13.9 15.5 15 15.5 17.2C15.5 19.4 13.8 21 11.5 21C9.2 21 7.8 19.5 7.8 19.5"
                    stroke="#0d9488" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
              <span className="font-bold text-white tracking-tight">
                Salus<span className="text-teal-400"> IA</span>
              </span>
            </Link>
            <p className="text-white/30 text-sm leading-relaxed max-w-[180px] mb-5">
              Gestión clínica inteligente con WhatsApp IA para Honduras y LATAM.
            </p>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-emerald-400/80 text-xs">Bot médico activo 24/7</span>
            </div>
          </div>

          {Object.entries(COLUMNS).map(([title, links]) => (
            <div key={title}>
              <h3 className="text-white/50 text-xs font-semibold uppercase tracking-widest mb-4">{title}</h3>
              <ul className="space-y-3">
                {links.map((l) => (
                  <li key={l.label}>
                    <Link href={l.href}
                      className="text-white/30 text-sm hover:text-white/70 transition-colors">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-white/20 text-xs">© 2026 Salus IA · Honduras & LATAM</p>
          <p className="text-white/10 text-xs">Hecho para el sistema de salud de Honduras 🇭🇳</p>
        </div>
      </div>
    </footer>
  );
}
