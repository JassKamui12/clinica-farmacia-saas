"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

const LINKS = [
  { label: "Cómo funciona", href: "#como-funciona" },
  { label: "Especialidades", href: "#especialidades" },
  { label: "Características", href: "#caracteristicas" },
  { label: "Precios", href: "#precios" },
  { label: "Preguntas", href: "#faq" },
];

export function LandingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled
        ? "bg-[#051125]/95 backdrop-blur-md border-b border-white/10 shadow-lg shadow-black/20"
        : "bg-transparent"
    }`}>
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-cyan-400/20 border border-cyan-400/30 flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4">
              <path d="M15 8C15 8 13.5 6 11.5 6C9.2 6 7.5 7.5 7.5 9.5C7.5 11.5 9.5 12.5 11.5 13.2C13.5 13.9 15.5 15 15.5 17.2C15.5 19.4 13.8 21 11.5 21C9.2 21 7.8 19.5 7.8 19.5"
                stroke="#22d3ee" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <span className="font-bold text-white text-lg tracking-tight">
            Salus<span className="text-cyan-400"> IA</span>
          </span>
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-7">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href}
              className="text-sm text-white/60 hover:text-white transition-colors">
              {l.label}
            </a>
          ))}
        </div>

        {/* Desktop CTAs */}
        <div className="hidden md:flex items-center gap-3">
          <Link href="/login"
            className="text-sm text-white/60 hover:text-white transition-colors px-3 py-2">
            Iniciar sesión
          </Link>
          <Link href="/login"
            className="text-sm font-semibold bg-cyan-400 text-[#051125] px-4 py-2 rounded-lg hover:bg-white transition-all shadow-lg shadow-cyan-400/20">
            Probar gratis 14 días →
          </Link>
        </div>

        {/* Hamburger */}
        <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden text-white p-2" aria-label="Menú">
          <div className={`w-5 h-0.5 bg-white transition-all duration-200 ${menuOpen ? "rotate-45 translate-y-1.5" : ""}`} />
          <div className={`w-5 h-0.5 bg-white mt-1.5 transition-all duration-200 ${menuOpen ? "opacity-0" : ""}`} />
          <div className={`w-5 h-0.5 bg-white mt-1.5 transition-all duration-200 ${menuOpen ? "-rotate-45 -translate-y-3" : ""}`} />
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-[#051125]/98 border-t border-white/10 px-6 py-4 space-y-3">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href} onClick={() => setMenuOpen(false)}
              className="block text-white/60 hover:text-white py-2 text-sm">
              {l.label}
            </a>
          ))}
          <div className="pt-3 border-t border-white/10 flex flex-col gap-2">
            <Link href="/login" className="text-center text-white/60 py-2 text-sm">
              Iniciar sesión
            </Link>
            <Link href="/login"
              className="text-center font-semibold bg-cyan-400 text-[#051125] py-3 rounded-lg text-sm">
              Probar gratis 14 días →
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
