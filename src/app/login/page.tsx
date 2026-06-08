'use client';

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

const RUBROS = [
  { id: "clinica-general",  label: "Clínica General" },
  { id: "odontologia",      label: "Odontología / Dental" },
  { id: "farmacia",         label: "Farmacia" },
  { id: "pediatria",        label: "Pediatría" },
  { id: "psicologia",       label: "Psicología" },
  { id: "fisioterapia",     label: "Fisioterapia" },
  { id: "nutricion",        label: "Nutricionista" },
  { id: "laboratorio",      label: "Laboratorio Clínico" },
  { id: "veterinaria",      label: "Veterinaria" },
  { id: "optometria",       label: "Optometría" },
] as const;

const INPUT = "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all shadow-sm";

const FEATURES = [
  { icon: "smart_toy",      text: "Bot IA que atiende pacientes 24/7 por WhatsApp" },
  { icon: "calendar_month", text: "Agenda citas automáticamente sin intervención" },
  { icon: "folder_shared",  text: "Expediente clínico digital por cada paciente" },
  { icon: "medication",     text: "Recetas digitales con control de seguimiento" },
] as const;

const STATS = [
  { value: "10+", label: "Rubros médicos" },
  { value: "24/7", label: "Bot activo" },
  { value: "HN", label: "Honduras + LATAM" },
] as const;

function SalusLogo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizes = {
    sm: { box: "w-8 h-8 rounded-lg", svg: "w-4 h-4", name: "text-base", tag: "text-[9px]" },
    md: { box: "w-10 h-10 rounded-xl", svg: "w-5 h-5", name: "text-xl", tag: "text-[10px]" },
    lg: { box: "w-14 h-14 rounded-2xl", svg: "w-7 h-7", name: "text-3xl", tag: "text-xs" },
  };
  const s = sizes[size];
  return (
    <div className="flex items-center gap-3">
      <div className={`${s.box} bg-gradient-to-br from-cyan-400/20 to-cyan-600/20 border border-cyan-400/30 flex items-center justify-center shrink-0 shadow-lg shadow-cyan-500/10`}>
        <svg viewBox="0 0 24 24" fill="none" className={s.svg}>
          <path d="M15 8C15 8 13.5 6 11.5 6C9.2 6 7.5 7.5 7.5 9.5C7.5 11.5 9.5 12.5 11.5 13.2C13.5 13.9 15.5 15 15.5 17.2C15.5 19.4 13.8 21 11.5 21C9.2 21 7.8 19.5 7.8 19.5"
            stroke="#22d3ee" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      </div>
      <div>
        <div className="flex items-baseline gap-1.5">
          <span className={`font-bold tracking-tight text-white ${s.name}`}>Salus</span>
          <span className={`font-semibold text-cyan-400/70 uppercase tracking-widest ${s.tag}`}>IA</span>
        </div>
      </div>
    </div>
  );
}

function LoginContent() {
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Mostrar errores de OAuth de Google
  useEffect(() => {
    const e = searchParams.get("error");
    if (e === "google-cancelado") setError("Inicio de sesión con Google cancelado.");
    else if (e === "google-csrf") setError("Error de seguridad. Intenta de nuevo.");
    else if (e === "google-no-configurado") setError("Google Sign-In no está configurado aún.");
    else if (e === "google-error") setError("Error al conectar con Google. Intenta de nuevo.");
    else if (e === "cuenta-inactiva") setError("Tu cuenta está inactiva. Contacta soporte.");
  }, [searchParams]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [clinicName, setClinicName] = useState("");
  const [rubroId, setRubroId] = useState("clinica-general");
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setLoading(true);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error ?? "Credenciales incorrectas"); setLoading(false); return; }
    window.location.href = data.redirectTo ?? "/dashboard/inicio";
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setLoading(true);
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clinicName, rubroId, email: regEmail, password: regPassword, name: regName }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error ?? "Error al registrar"); setLoading(false); return; }
    window.location.href = data.redirectTo ?? "/dashboard/inicio";
  }

  return (
    <div className="min-h-screen flex">

      {/* ── Panel izquierdo: hero ── */}
      <div
        className="hidden lg:flex flex-col justify-between w-[52%] p-14 relative overflow-hidden"
        style={{ background: "linear-gradient(150deg, #051125 0%, #0c1f3d 55%, #0e2a4a 100%)" }}
      >
        {/* Orbes decorativos */}
        <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full opacity-[0.07]"
          style={{ background: "radial-gradient(circle, #22d3ee, transparent 70%)" }} />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full opacity-[0.07]"
          style={{ background: "radial-gradient(circle, #22d3ee, transparent 70%)" }} />
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: "radial-gradient(#22d3ee 1px, transparent 1px)", backgroundSize: "32px 32px" }} />

        {/* Logo */}
        <div className="relative z-10">
          <SalusLogo size="lg" />
          <div className="mt-12 max-w-md">
            <h2 className="text-white text-4xl font-bold leading-[1.15] tracking-tight">
              Tu clínica,<br />
              <span className="text-transparent bg-clip-text"
                style={{ backgroundImage: "linear-gradient(90deg, #22d3ee, #67e8f9)" }}>
                en automático.
              </span>
            </h2>
            <p className="text-white/50 text-base leading-relaxed mt-4">
              Tus pacientes agendan citas por WhatsApp con IA. Tú te enfocas en atenderlos.
            </p>
          </div>

          {/* Stats */}
          <div className="mt-10 flex items-center gap-8">
            {STATS.map((s) => (
              <div key={s.value}>
                <p className="text-white font-bold text-2xl tracking-tight">{s.value}</p>
                <p className="text-white/30 text-xs mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Features */}
        <div className="relative z-10 space-y-3">
          {FEATURES.map((f) => (
            <div key={f.icon} className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/8 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-cyan-400 text-[16px]">{f.icon}</span>
              </div>
              <span className="text-white/50 text-sm">{f.text}</span>
            </div>
          ))}
          <p className="text-white/20 text-xs pt-3">© 2026 Salus IA · Honduras y LATAM</p>
        </div>
      </div>

      {/* ── Panel derecho: formulario ── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 bg-slate-50 overflow-y-auto">

        {/* Logo mobile */}
        <div className="lg:hidden mb-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#051125] flex items-center justify-center shadow-lg">
              <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
                <path d="M15 8C15 8 13.5 6 11.5 6C9.2 6 7.5 7.5 7.5 9.5C7.5 11.5 9.5 12.5 11.5 13.2C13.5 13.9 15.5 15 15.5 17.2C15.5 19.4 13.8 21 11.5 21C9.2 21 7.8 19.5 7.8 19.5"
                  stroke="#22d3ee" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <div>
              <div className="flex items-baseline gap-1">
                <span className="text-slate-900 font-bold text-xl tracking-tight">Salus</span>
                <span className="text-cyan-500 text-[10px] font-semibold uppercase tracking-widest">IA</span>
              </div>
            </div>
          </div>
        </div>

        <div className="w-full max-w-[400px]">
          {/* Header */}
          <div className="mb-7">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              {mode === "login" ? "Bienvenido de vuelta" : "Crea tu clínica"}
            </h1>
            <p className="text-slate-500 text-sm mt-1.5">
              {mode === "login"
                ? "Accede al panel de tu clínica"
                : "14 días de prueba gratis, sin tarjeta de crédito"}
            </p>
          </div>

          {/* Error */}
          {error && (
            <div role="alert" className="mb-5 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-red-700 text-sm flex items-center gap-2.5">
              <span className="material-symbols-outlined text-[18px] shrink-0">error</span>
              {error}
            </div>
          )}

          {/* Card formulario */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm shadow-slate-200/80 p-7">
            {mode === "login" ? (
              <form onSubmit={handleLogin} className="space-y-4" noValidate>
                {/* Google Sign-In */}
                <a href="/api/auth/google"
                  className="flex items-center justify-center gap-3 w-full border border-slate-200 rounded-xl py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all">
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Continuar con Google
                </a>

                {/* Divider */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-slate-100" />
                  <span className="text-xs text-slate-400 font-medium">o con email</span>
                  <div className="flex-1 h-px bg-slate-100" />
                </div>

                <div>
                  <label htmlFor="email" className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                    Correo electrónico
                  </label>
                  <input id="email" type="email" value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={INPUT} placeholder="admin@miclinica.com"
                    required autoComplete="email" />
                </div>
                <div>
                  <label htmlFor="password" className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                    Contraseña
                  </label>
                  <input id="password" type="password" value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={INPUT} placeholder="••••••••"
                    required autoComplete="current-password" />
                </div>

                <button type="submit" disabled={loading}
                  className="w-full rounded-xl py-3 text-sm font-semibold text-white transition-all disabled:opacity-50 mt-1 shadow-md shadow-cyan-900/20"
                  style={{ background: "linear-gradient(135deg, #051125 0%, #1b263b 100%)" }}>
                  {loading ? "Iniciando sesión..." : "Iniciar sesión"}
                </button>

                <p className="text-center text-sm text-slate-500 pt-1">
                  ¿No tienes cuenta?{" "}
                  <button type="button" onClick={() => { setMode("register"); setError(""); }}
                    className="text-cyan-600 hover:text-cyan-700 font-semibold hover:underline">
                    Registrar clínica
                  </button>
                </p>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="space-y-4" noValidate>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                    Nombre de la clínica
                  </label>
                  <input type="text" value={clinicName}
                    onChange={(e) => setClinicName(e.target.value)}
                    className={INPUT} placeholder="Clínica San José" required />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                    Tipo de clínica
                  </label>
                  <select value={rubroId}
                    onChange={(e) => setRubroId(e.target.value)}
                    className={INPUT}>
                    {RUBROS.map((r) => (
                      <option key={r.id} value={r.id}>{r.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                    Tu nombre completo
                  </label>
                  <input type="text" value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    className={INPUT} placeholder="Dr. Juan Pérez" required />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                    Correo electrónico
                  </label>
                  <input type="email" value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    className={INPUT} placeholder="admin@miclinica.com" required />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                    Contraseña
                  </label>
                  <input type="password" value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className={INPUT} placeholder="Mínimo 6 caracteres"
                    required minLength={6} />
                </div>

                <button type="submit" disabled={loading}
                  className="w-full rounded-xl py-3 text-sm font-semibold text-white transition-all disabled:opacity-50 mt-1 shadow-md shadow-cyan-900/20"
                  style={{ background: "linear-gradient(135deg, #051125 0%, #1b263b 100%)" }}>
                  {loading ? "Creando tu clínica..." : "Crear clínica gratis"}
                </button>

                <p className="text-center text-sm text-slate-500 pt-1">
                  ¿Ya tienes cuenta?{" "}
                  <button type="button" onClick={() => { setMode("login"); setError(""); }}
                    className="text-cyan-600 hover:text-cyan-700 font-semibold hover:underline">
                    Iniciar sesión
                  </button>
                </p>
              </form>
            )}
          </div>

          <p className="text-center text-xs text-slate-400 mt-6">
            Al continuar aceptas los términos de servicio de Salus IA
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  );
}
