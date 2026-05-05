'use client';

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"DOCTOR" | "PHARMACIST">("DOCTOR");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    router.push("/");
    router.refresh();
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, role }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Error al registrar usuario");
      setLoading(false);
      return;
    }

    setSuccess("Cuenta creada exitosamente. Inicia sesión.");
    setName("");
    setEmail("");
    setPassword("");
    setLoading(false);
    setTimeout(() => setIsRegister(false), 1500);
  }

  return (
    <div className="min-h-screen bg-[#0A0C10] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primaryContainer mx-auto flex items-center justify-center mb-4">
            <span className="material-symbols-outlined text-3xl text-[#0A0C10]">medical_services</span>
          </div>
          <h1 className="text-3xl font-bold text-[#00F5A0]">MediFlow Pro</h1>
          <p className="text-slate-500 mt-2 text-sm">
            {isRegister ? "Crea tu cuenta" : "Inicia sesión para continuar"}
          </p>
        </div>

        {isRegister ? (
          <form onSubmit={handleRegister} className="space-y-4">
            {error && (
              <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-red-400 text-sm">
                {error}
              </div>
            )}
            {success && (
              <div className="rounded-2xl border border-[#00F5A0]/30 bg-[#00F5A0]/10 p-4 text-[#00F5A0] text-sm">
                {success}
              </div>
            )}

            <div>
              <label className="block text-sm text-slate-400 mb-2">Nombre completo</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-2xl border border-[#30363D] bg-[#161B22] px-4 py-3 text-on-surface outline-none focus:border-[#00F5A0] transition-colors"
                placeholder="Dr. Juan Pérez"
                required
              />
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-2xl border border-[#30363D] bg-[#161B22] px-4 py-3 text-on-surface outline-none focus:border-[#00F5A0] transition-colors"
                placeholder="tu@email.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-2">Contraseña</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-2xl border border-[#30363D] bg-[#161B22] px-4 py-3 text-on-surface outline-none focus:border-[#00F5A0] transition-colors"
                placeholder="Mínimo 6 caracteres"
                required
                minLength={6}
              />
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-2">Rol</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as "DOCTOR" | "PHARMACIST")}
                className="w-full rounded-2xl border border-[#30363D] bg-[#161B22] px-4 py-3 text-on-surface outline-none focus:border-[#00F5A0] transition-colors"
              >
                <option value="DOCTOR">Doctor</option>
                <option value="PHARMACIST">Farmacéutico</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-gradient-to-r from-[#00F5A0] to-[#00D9FF] px-6 py-3 text-sm font-bold text-[#0A0C10] shadow-[0_20px_45px_-20px_rgba(0,245,160,0.5)] hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Creando cuenta..." : "Crear cuenta"}
            </button>

            <p className="text-center text-sm text-slate-500">
              ¿Ya tienes cuenta?{" "}
              <button
                type="button"
                onClick={() => setIsRegister(false)}
                className="text-[#00F5A0] hover:underline font-medium"
              >
                Iniciar sesión
              </button>
            </p>
          </form>
        ) : (
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-red-400 text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm text-slate-400 mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-2xl border border-[#30363D] bg-[#161B22] px-4 py-3 text-on-surface outline-none focus:border-[#00F5A0] transition-colors"
                placeholder="tu@email.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-2">Contraseña</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-2xl border border-[#30363D] bg-[#161B22] px-4 py-3 text-on-surface outline-none focus:border-[#00F5A0] transition-colors"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-gradient-to-r from-[#00F5A0] to-[#00D9FF] px-6 py-3 text-sm font-bold text-[#0A0C10] shadow-[0_20px_45px_-20px_rgba(0,245,160,0.5)] hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Iniciando sesión..." : "Iniciar sesión"}
            </button>

            <p className="text-center text-sm text-slate-500">
              ¿No tienes cuenta?{" "}
              <button
                type="button"
                onClick={() => setIsRegister(true)}
                className="text-[#00F5A0] hover:underline font-medium"
              >
                Regístrate aquí
              </button>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
