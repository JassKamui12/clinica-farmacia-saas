'use client';

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";

interface Patient {
  id: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  whatsappPhone?: string | null;
  dateOfBirth?: string | null;
  gender?: string | null;
  notes?: string | null;
  createdAt: string;
}

export default function PatientsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [filter, setFilter] = useState("");

  const loadData = useCallback(async () => {
    const res = await fetch("/api/patients");
    setPatients(await res.json());
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/login"); return; }
    if (status === "authenticated") { loadData(); }
  }, [status, loadData]);

  const filtered = filter
    ? patients.filter((p) =>
        p.name.toLowerCase().includes(filter.toLowerCase()) ||
        (p.email || "").toLowerCase().includes(filter.toLowerCase()) ||
        (p.phone || "").includes(filter)
      )
    : patients;

  if (status === "loading") return <div className="min-h-screen bg-[#0A0C10] flex items-center justify-center"><p className="text-slate-400">Cargando...</p></div>;

  return (
    <main className="min-h-screen bg-[#0A0C10] text-slate-200">
      <Sidebar activePath="/patients" userRole={session?.user.role as "ADMIN" | "DOCTOR" | "PHARMACIST"} userName={session?.user.name} userEmail={session?.user.email} />

      <div className="ml-[240px] p-8">
        <div className="max-w-[1200px] mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-100">Pacientes</h1>
              <p className="text-slate-500 mt-1">{patients.length} pacientes registrados</p>
            </div>
            <Link href="/" className="rounded-2xl border border-[#30363D] px-5 py-2.5 text-sm text-slate-300 hover:border-[#00F5A0] hover:text-[#00F5A0] transition-colors">
              ← Volver
            </Link>
          </div>

          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Buscar por nombre, email o teléfono..."
            className="w-full rounded-2xl border border-[#30363D] bg-[#161B22] px-5 py-3 text-sm text-slate-200 outline-none focus:border-[#00F5A0]"
          />

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((p) => (
              <Link key={p.id} href={`/patients/${p.id}`} className="rounded-2xl border border-[#30363D] bg-[#161B22] p-5 hover:border-[#00F5A0]/30 transition-colors group">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-[#00F5A0]/10 flex items-center justify-center">
                    <span className="material-symbols-outlined text-[#00F5A0] text-2xl">person</span>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-100">{p.name}</p>
                    {p.gender && <p className="text-xs text-slate-500">{p.gender}</p>}
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  {p.phone && (
                    <div className="flex items-center gap-2 text-slate-400">
                      <span className="material-symbols-outlined text-xs">phone</span>
                      <span>{p.phone}</span>
                    </div>
                  )}
                  {p.whatsappPhone && (
                    <div className="flex items-center gap-2 text-[#25D366]">
                      <span className="material-symbols-outlined text-xs">chat</span>
                      <span>{p.whatsappPhone}</span>
                    </div>
                  )}
                  {p.email && (
                    <div className="flex items-center gap-2 text-slate-400">
                      <span className="material-symbols-outlined text-xs">mail</span>
                      <span className="truncate">{p.email}</span>
                    </div>
                  )}
                </div>
                {p.notes && <p className="text-xs text-slate-600 mt-4 pt-3 border-t border-[#30363D]">{p.notes}</p>}
                <p className="text-xs text-[#00D9FF] mt-4 pt-3 border-t border-[#30363D] group-hover:underline">Ver historial completo →</p>
              </Link>
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="rounded-2xl border border-[#30363D] bg-[#161B22] p-12 text-center">
              <span className="material-symbols-outlined text-5xl text-slate-600 mb-3">person_off</span>
              <p className="text-slate-500">No se encontraron pacientes</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
