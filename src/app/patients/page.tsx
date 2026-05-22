'use client';

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import Sidebar from "@/components/Sidebar";

type AppRole = "ADMIN" | "DOCTOR" | "PHARMACIST" | "RECEPTIONIST";

interface Patient {
  id: string; name: string; phone?: string | null; email?: string | null;
  whatsappPhone?: string | null; dateOfBirth?: string | null;
  gender?: string | null; notes?: string | null; createdAt: string;
}

const INPUT = "w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors";

export default function PatientsPage() {
  const { data: session } = useSession();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [filter, setFilter] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Patient | null>(null);
  const [form, setForm] = useState({ name: "", phone: "", email: "", whatsappPhone: "", dateOfBirth: "", gender: "", notes: "" });
  const [loading, setLoading] = useState(false);

  const loadData = useCallback(async () => {
    const res = await fetch("/api/patients");
    setPatients(await res.json());
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: "", phone: "", email: "", whatsappPhone: "", dateOfBirth: "", gender: "", notes: "" });
    setShowModal(true);
  };

  const openEdit = (p: Patient) => {
    setEditing(p);
    setForm({ name: p.name, phone: p.phone || "", email: p.email || "", whatsappPhone: p.whatsappPhone || "", dateOfBirth: p.dateOfBirth ? p.dateOfBirth.split("T")[0] : "", gender: p.gender || "", notes: p.notes || "" });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    const body = { ...form, phone: form.phone || null, email: form.email || null, whatsappPhone: form.whatsappPhone || null, dateOfBirth: form.dateOfBirth || null, gender: form.gender || null, notes: form.notes || null };
    try {
      if (editing) await fetch("/api/patients", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: editing.id, ...body }) });
      else await fetch("/api/patients", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      setShowModal(false); loadData();
    } finally { setLoading(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar este paciente?")) return;
    await fetch(`/api/patients?id=${id}`, { method: "DELETE" });
    loadData();
  };

  const filtered = filter
    ? patients.filter((p) => p.name.toLowerCase().includes(filter.toLowerCase()) || (p.email || "").toLowerCase().includes(filter.toLowerCase()) || (p.phone || "").includes(filter))
    : patients;

  return (
    <main className="min-h-screen bg-slate-50">
      <Sidebar activePath="/patients" userRole={(session?.user.role ?? "ADMIN") as AppRole} userName={session?.user.name} userEmail={session?.user.email} />

      <div className="ml-[240px] p-8">
        <div className="max-w-[1200px] mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Pacientes</h1>
              <p className="text-slate-500 text-sm mt-1">{patients.length} pacientes registrados</p>
            </div>
            <button onClick={openCreate} className="flex items-center gap-2 bg-blue-600 text-white rounded-xl px-5 py-2.5 text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm shadow-blue-600/20">
              <span className="material-symbols-outlined text-lg">person_add</span>
              Nuevo Paciente
            </button>
          </div>

          <div className="relative">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
            <input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Buscar por nombre, email o teléfono..." className="w-full rounded-xl border border-slate-300 bg-white pl-11 pr-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors shadow-sm" />
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((p) => (
              <div key={p.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 hover:shadow-md hover:border-blue-200 transition-all group">
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-blue-500 text-xl">person</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900 truncate">{p.name}</p>
                    {p.gender && <p className="text-xs text-slate-500">{p.gender}{p.dateOfBirth ? ` · ${new Date(p.dateOfBirth).getFullYear()}` : ""}</p>}
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEdit(p)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                      <span className="material-symbols-outlined text-sm">edit</span>
                    </button>
                    <button onClick={() => handleDelete(p.id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                      <span className="material-symbols-outlined text-sm">delete</span>
                    </button>
                  </div>
                </div>
                <div className="space-y-1.5 text-sm">
                  {p.phone && <div className="flex items-center gap-2 text-slate-600"><span className="material-symbols-outlined text-slate-400 text-sm">phone</span><span>{p.phone}</span></div>}
                  {p.whatsappPhone && <div className="flex items-center gap-2 text-emerald-600"><span className="material-symbols-outlined text-emerald-500 text-sm">chat</span><span>{p.whatsappPhone}</span></div>}
                  {p.email && <div className="flex items-center gap-2 text-slate-600"><span className="material-symbols-outlined text-slate-400 text-sm">mail</span><span className="truncate">{p.email}</span></div>}
                </div>
                {p.notes && <p className="text-xs text-slate-400 mt-3 pt-3 border-t border-slate-100 line-clamp-2">{p.notes}</p>}
                <Link href={`/patients/${p.id}`} className="flex items-center gap-1 text-xs text-blue-600 font-medium mt-3 pt-3 border-t border-slate-100 hover:text-blue-700 transition-colors">
                  Ver historial completo <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </Link>
              </div>
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-16 text-center">
              <span className="material-symbols-outlined text-5xl text-slate-300 mb-3 block">person_search</span>
              <p className="text-slate-500 font-medium">No se encontraron pacientes</p>
              {filter && <p className="text-slate-400 text-sm mt-1">Intenta con otro término de búsqueda</p>}
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-slate-900">{editing ? "Editar Paciente" : "Nuevo Paciente"}</h2>
              <button onClick={() => setShowModal(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"><span className="material-symbols-outlined text-lg">close</span></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input required value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} placeholder="Nombre completo *" className={INPUT} />
              <input value={form.phone} onChange={(e) => setForm({...form, phone: e.target.value})} placeholder="Teléfono" className={INPUT} />
              <input type="email" value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} placeholder="Email" className={INPUT} />
              <input value={form.whatsappPhone} onChange={(e) => setForm({...form, whatsappPhone: e.target.value})} placeholder="WhatsApp (con código país)" className={INPUT} />
              <input type="date" value={form.dateOfBirth} onChange={(e) => setForm({...form, dateOfBirth: e.target.value})} className={INPUT} />
              <select value={form.gender} onChange={(e) => setForm({...form, gender: e.target.value})} className={INPUT}>
                <option value="">Género (opcional)</option>
                <option value="Masculino">Masculino</option>
                <option value="Femenino">Femenino</option>
                <option value="Otro">Otro</option>
              </select>
              <textarea value={form.notes} onChange={(e) => setForm({...form, notes: e.target.value})} placeholder="Notas adicionales" rows={3} className={`${INPUT} resize-none`} />
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 rounded-xl border border-slate-300 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">Cancelar</button>
                <button type="submit" disabled={loading} className="flex-1 rounded-xl bg-blue-600 text-white py-2.5 text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50">{loading ? "Guardando..." : "Guardar"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
