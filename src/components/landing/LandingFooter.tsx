import Link from "next/link";

const LINKS = {
  Producto: [
    { label: "Cómo funciona", href: "#como-funciona" },
    { label: "Especialidades", href: "#especialidades" },
    { label: "Características", href: "#caracteristicas" },
    { label: "Precios", href: "#precios" },
  ],
  Legal: [
    { label: "Política de privacidad", href: "/privacy" },
    { label: "Términos de servicio", href: "/terms" },
  ],
  Empresa: [
    { label: "Iniciar sesión", href: "/login" },
    { label: "Registrar clínica", href: "/login" },
    { label: "Soporte", href: "mailto:hola@salus-ia.com" },
  ],
};

export function LandingFooter() {
  return (
    <footer className="bg-[#030d1e] border-t border-white/5">
      <div className="max-w-6xl mx-auto px-6 py-14">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10">

          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-lg bg-cyan-400/15 border border-cyan-400/25 flex items-center justify-center">
                <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4">
                  <path d="M15 8C15 8 13.5 6 11.5 6C9.2 6 7.5 7.5 7.5 9.5C7.5 11.5 9.5 12.5 11.5 13.2C13.5 13.9 15.5 15 15.5 17.2C15.5 19.4 13.8 21 11.5 21C9.2 21 7.8 19.5 7.8 19.5"
                    stroke="#22d3ee" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
              <span className="font-bold text-white tracking-tight">
                Salus<span className="text-cyan-400"> IA</span>
              </span>
            </Link>
            <p className="text-white/35 text-sm leading-relaxed max-w-[200px]">
              Gestión clínica inteligente con WhatsApp IA para Honduras y LATAM.
            </p>
            <div className="flex items-center gap-2 mt-4">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-emerald-400 text-xs font-medium">Bot activo 24/7</span>
            </div>
          </div>

          {/* Links */}
          {Object.entries(LINKS).map(([section, items]) => (
            <div key={section}>
              <h3 className="text-white/60 text-xs font-semibold uppercase tracking-widest mb-4">{section}</h3>
              <ul className="space-y-2.5">
                {items.map((item) => (
                  <li key={item.label}>
                    <Link href={item.href}
                      className="text-white/35 text-sm hover:text-white/70 transition-colors">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-white/20 text-xs">
            © 2026 Salus IA · Honduras & LATAM · Todos los derechos reservados
          </p>
          <p className="text-white/15 text-xs">
            Hecho con ❤️ para el sistema de salud de Honduras
          </p>
        </div>
      </div>
    </footer>
  );
}
