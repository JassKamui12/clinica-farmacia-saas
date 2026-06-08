"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

const LINKS = [
  { label: "Cómo funciona", href: "#como-funciona" },
  { label: "Especialidades", href: "#especialidades" },
  { label: "Precios", href: "#precios" },
  { label: "FAQ", href: "#faq" },
];

function SalusLogo() {
  return (
    <Link href="/" className="flex items-center gap-2.5">
      <div className="w-8 h-8 rounded-lg bg-[#051125] flex items-center justify-center">
        <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4">
          <path d="M15 8C15 8 13.5 6 11.5 6C9.2 6 7.5 7.5 7.5 9.5C7.5 11.5 9.5 12.5 11.5 13.2C13.5 13.9 15.5 15 15.5 17.2C15.5 19.4 13.8 21 11.5 21C9.2 21 7.8 19.5 7.8 19.5"
            stroke="#0d9488" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      </div>
      <span className="font-bold text-[#051125] text-lg tracking-tight">
        Salus<span className="text-[#0d9488]"> IA</span>
      </span>
    </Link>
  );
}

export function LandingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-200 ${
      scrolled ? "bg-white/90 backdrop-blur-sm border-b border-slate-100 shadow-sm" : "bg-transparent"
    }`}>
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <SalusLogo />

        <div className="hidden md:flex items-center gap-8">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href}
              className="text-sm text-slate-500 hover:text-slate-900 transition-colors font-medium">
              {l.label}
            </a>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3">
          <Link href="/login"
            className="text-sm text-slate-600 hover:text-slate-900 transition-colors font-medium px-3 py-2">
            Iniciar sesión
          </Link>
          <Link href="/login"
            className="text-sm font-semibold bg-[#051125] text-white px-5 py-2.5 rounded-xl hover:bg-[#1b263b] transition-all shadow-sm">
            Empezar gratis →
          </Link>
        </div>

        <button onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden p-2 rounded-lg hover:bg-slate-100 transition-colors" aria-label="Menú">
          <div className={`w-5 h-0.5 bg-slate-700 transition-all duration-200 ${menuOpen ? "rotate-45 translate-y-1.5" : ""}`} />
          <div className={`w-5 h-0.5 bg-slate-700 mt-1.5 transition-all duration-200 ${menuOpen ? "opacity-0" : ""}`} />
          <div className={`w-5 h-0.5 bg-slate-700 mt-1.5 transition-all duration-200 ${menuOpen ? "-rotate-45 -translate-y-3" : ""}`} />
        </button>
      </div>

      {menuOpen && (
        <div className="md:hidden bg-white border-t border-slate-100 px-6 py-5 space-y-4">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href} onClick={() => setMenuOpen(false)}
              className="block text-slate-600 hover:text-slate-900 py-1.5 text-sm font-medium">
              {l.label}
            </a>
          ))}
          <div className="pt-4 border-t border-slate-100 flex flex-col gap-3">
            <Link href="/login" className="text-center text-slate-600 py-2 text-sm">Iniciar sesión</Link>
            <Link href="/login"
              className="text-center font-semibold bg-[#051125] text-white py-3 rounded-xl text-sm">
              Empezar gratis →
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
