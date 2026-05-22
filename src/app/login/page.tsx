'use client';

import { useState } from "react";
import { signIn } from "next-auth/react";

export default function LoginPage() {
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"DOCTOR" | "PHARMACIST">("DOCTOR");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const result = await signIn("credentials", { email, password, redirect: false });
    if (result?.error) { setError(result.error); setLoading(false); return; }
    window.location.href = "/";
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setSuccess(""); setLoading(true);
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, role }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error || "Error al registrar"); setLoading(false); return; }
    setSuccess("Cuenta creada. Inicia sesión.");
    setName(""); setEmail(""); setPassword(""); setLoading(false);
    setTimeout(() => setIsRegister(false), 1500);
  }

  const inputCls = "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">

        {/* Brand */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-blue-600 mx-auto flex items-center justify-center mb-4 shadow-lg shadow-blue-600/30">
            <span className="material-symbols-outlined text-3xl text-white">medical_services</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">MediFlow Pro</h1>
          <p className="text-slate-500 text-sm mt-1">
            {isRegister ? "Crea tu cuenta de acceso" : "Accede a tu panel clínico"}
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          {isRegister ? (
            <form onSubmit={handleRegister} className="space-y-4">
              {error && (
                <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-red-700 text-sm">
                  {error}
                </div>
              )}
              {success && (
                <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-emerald-700 text-sm">
                  {success}
                </div>
              )}
              <div>
                <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">Nombre completo</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} className={inputCls} placeholder="Dr. Juan Pérez" required />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} placeholder="tu@clinica.com" required />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">Contraseña</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className={inputCls} placeholder="Mínimo 6 caracteres" required minLength={6} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">Rol</label>
                <select value={role} onChange={(e) => setRole(e.target.value as any)} className={inputCls}>
                  <option value="DOCTOR">Doctor</option>
                  <option value="PHARMACIST">Farmacéutico</option>
                </select>
              </div>
              <button type="submit" disabled={loading} className="w-full rounded-xl bg-blue-600 text-white py-3 text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 shadow-sm shadow-blue-600/20">
                {loading ? "Creando cuenta..." : "Crear cuenta"}
              </button>
              <p className="text-center text-sm text-slate-500">
                ¿Ya tienes cuenta?{" "}
                <button type="button" onClick={() => setIsRegister(false)} className="text-blue-600 hover:underline font-medium">
                  Iniciar sesión
                </button>
              </p>
            </form>
          ) : (
            <form onSubmit={handleLogin} className="space-y-4">
              {error && (
                <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-red-700 text-sm">
                  {error}
                </div>
              )}
              <div>
                <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} placeholder="tu@clinica.com" required />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">Contraseña</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className={inputCls} placeholder="••••••••" required />
              </div>
              <button type="submit" disabled={loading} className="w-full rounded-xl bg-blue-600 text-white py-3 text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 shadow-sm shadow-blue-600/20">
                {loading ? "Iniciando sesión..." : "Iniciar sesión"}
              </button>
              <p className="text-center text-sm text-slate-500">
                ¿No tienes cuenta?{" "}
                <button type="button" onClick={() => setIsRegister(true)} className="text-blue-600 hover:underline font-medium">
                  Regístrate aquí
                </button>
              </p>
            </form>
          )}
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          MediFlow Pro · Gestión clínica con IA
        </p>
      </div>
    </div>
  );
}
