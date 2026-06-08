'use client';

import { useState } from "react";

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

const INPUT = "w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all";

const FEATURES = [
  { icon: "calendar_month",  text: "Citas agendadas automáticamente por WhatsApp" },
  { icon: "folder_shared",   text: "Expediente clínico digital por paciente" },
  { icon: "medication",      text: "Recetas digitales con seguimiento" },
  { icon: "chat",            text: "Bot IA conectado a tu número de WhatsApp" },
] as const;

export default function LoginPage() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Login fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Register fields
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
      {/* Panel izquierdo — hero */}
      <div
        className="hidden lg:flex flex-col justify-between w-[52%] p-12 relative overflow-hidden"
        style={{ background: "linear-gradient(145deg, #051125 0%, #1b263b 60%, #1a3a6a 100%)" }}
      >
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #60a5fa 0%, transparent 70%)" }} />
        <div className="absolute bottom-0 -left-24 w-80 h-80 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #34d399 0%, transparent 70%)" }} />

        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-12">
            <div className="w-14 h-14 rounded-2xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center">
              <span className="material-symbols-outlined text-3xl text-blue-300">medical_services</span>
            </div>
            <div>
              <h1 className="text-white font-bold text-2xl tracking-tight">Clinica SaaS</h1>
              <p className="text-blue-300/70 text-xs uppercase tracking-widest mt-0.5">Honduras · LATAM</p>
            </div>
          </div>
          <div className="max-w-sm">
            <h2 className="text-white text-4xl font-bold leading-tight mb-4">
              Gestión clínica con WhatsApp IA
            </h2>
            <p className="text-blue-200/70 text-base leading-relaxed">
              Tus pacientes agendan citas por WhatsApp. Tu clínica se administra sola.
            </p>
          </div>
        </div>

        <div className="relative z-10 space-y-4">
          {FEATURES.map((f) => (
            <div key={f.icon} className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-blue-300 text-[18px]">{f.icon}</span>
              </div>
              <span className="text-blue-100/80 text-sm">{f.text}</span>
            </div>
          ))}
          <p className="text-blue-300/30 text-xs pt-4">Clinica SaaS · Gestión clínica inteligente</p>
        </div>
      </div>

      {/* Panel derecho — formulario */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-10 bg-[#f6fafe]">

        {/* Logo mobile */}
        <div className="flex items-center gap-3 mb-8 lg:hidden">
          <div className="w-11 h-11 rounded-2xl bg-[#051125] flex items-center justify-center">
            <span className="material-symbols-outlined text-2xl text-white">medical_services</span>
          </div>
          <div>
            <h1 className="text-slate-900 font-bold text-xl">Clinica SaaS</h1>
            <p className="text-slate-400 text-xs">Gestión clínica con IA</p>
          </div>
        </div>

        <div className="w-full max-w-[420px]">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-slate-900">
              {mode === "login" ? "Iniciar sesión" : "Registrar clínica"}
            </h2>
            <p className="text-slate-500 text-sm mt-1">
              {mode === "login"
                ? "Accede al panel de tu clínica"
                : "Crea tu cuenta y empieza el período de prueba de 14 días"}
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-7">
            {error && (
              <div role="alert" className="mb-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-red-700 text-sm flex items-center gap-2">
                <span className="material-symbols-outlined text-base shrink-0">error</span>
                {error}
              </div>
            )}

            {mode === "login" ? (
              <form onSubmit={handleLogin} className="space-y-4" noValidate>
                <div>
                  <label htmlFor="email" className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
                    Correo electrónico
                  </label>
                  <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                    className={INPUT} placeholder="admin@miclinica.com" required autoComplete="email" />
                </div>
                <div>
                  <label htmlFor="password" className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
                    Contraseña
                  </label>
                  <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                    className={INPUT} placeholder="••••••••" required autoComplete="current-password" />
                </div>
                <button type="submit" disabled={loading}
                  className="w-full rounded-xl bg-[#051125] text-white py-3 text-sm font-semibold hover:bg-[#1b263b] transition-colors disabled:opacity-50 mt-2">
                  {loading ? "Iniciando sesión..." : "Iniciar sesión"}
                </button>
                <p className="text-center text-sm text-slate-500 pt-1">
                  ¿No tienes cuenta?{" "}
                  <button type="button" onClick={() => { setMode("register"); setError(""); }}
                    className="text-blue-600 hover:underline font-semibold">
                    Registrar clínica
                  </button>
                </p>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="space-y-4" noValidate>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
                    Nombre de la clínica
                  </label>
                  <input type="text" value={clinicName} onChange={(e) => setClinicName(e.target.value)}
                    className={INPUT} placeholder="Clínica San José" required />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
                    Tipo de clínica
                  </label>
                  <select value={rubroId} onChange={(e) => setRubroId(e.target.value)} className={INPUT}>
                    {RUBROS.map((r) => (
                      <option key={r.id} value={r.id}>{r.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
                    Tu nombre
                  </label>
                  <input type="text" value={regName} onChange={(e) => setRegName(e.target.value)}
                    className={INPUT} placeholder="Dr. Juan Pérez" required />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
                    Correo electrónico
                  </label>
                  <input type="email" value={regEmail} onChange={(e) => setRegEmail(e.target.value)}
                    className={INPUT} placeholder="admin@miclinica.com" required />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
                    Contraseña
                  </label>
                  <input type="password" value={regPassword} onChange={(e) => setRegPassword(e.target.value)}
                    className={INPUT} placeholder="Mínimo 6 caracteres" required minLength={6} />
                </div>
                <button type="submit" disabled={loading}
                  className="w-full rounded-xl bg-[#051125] text-white py-3 text-sm font-semibold hover:bg-[#1b263b] transition-colors disabled:opacity-50 mt-2">
                  {loading ? "Creando cuenta..." : "Crear clínica gratis"}
                </button>
                <p className="text-center text-sm text-slate-500 pt-1">
                  ¿Ya tienes cuenta?{" "}
                  <button type="button" onClick={() => { setMode("login"); setError(""); }}
                    className="text-blue-600 hover:underline font-semibold">
                    Iniciar sesión
                  </button>
                </p>
              </form>
            )}
          </div>
          <p className="text-center text-xs text-slate-400 mt-6">
            Clinica SaaS · Gestión clínica inteligente para Honduras y LATAM
          </p>
        </div>
      </div>
    </div>
  );
}
