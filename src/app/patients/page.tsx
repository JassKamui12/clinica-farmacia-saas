'use client';

import { useEffect, useState, useCallback } from "react";
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
  const router = useRouter();
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

  useEffect(() => {
    loadData();
  }, [loadData]);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: "", phone: "", email: "", whatsappPhone: "", dateOfBirth: "", gender: "", notes: "" });
    setShowModal(true);
  };

  const openEdit = (p: Patient) => {
    setEditing(p);
    setForm({
      name: p.name,
      phone: p.phone || "",
      email: p.email || "",
      whatsappPhone: p.whatsappPhone || "",
      dateOfBirth: p.dateOfBirth ? p.dateOfBirth.split("T")[0] : "",
      gender: p.gender || "",
      notes: p.notes || "",
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const body = {
      ...form,
      phone: form.phone || null,
      email: form.email || null,
      whatsappPhone: form.whatsappPhone || null,
      dateOfBirth: form.dateOfBirth || null,
      gender: form.gender || null,
      notes: form.notes || null,
    };
    try {
      if (editing) {
        await fetch("/api/patients", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: editing.id, ...body }) });
      } else {
        await fetch("/api/patients", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      }
      setShowModal(false);
      loadData();
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar paciente?")) return;
    await fetch(`/api/patients?id=${id}`, { method: "DELETE" });
    loadData();
  };

  const filtered = filter
    ? patients.filter((p) =>
        p.name.toLowerCase().includes(filter.toLowerCase()) ||
        (p.email || "").toLowerCase().includes(filter.toLowerCase()) ||
        (p.phone || "").includes(filter)
      )
    : patients;

  return (
    <main className="min-h-screen bg-[#0A0C10] text-slate-200">
      <Sidebar activePath="/patients" userRole="DOCTOR" userName="Dr. Desarrollo" userEmail="dev@mediflow.com" />

      <div className="ml-[240px] p-8">
        <div className="max-w-[1200px] mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-100">Pacientes</h1>
              <p className="text-slate-500 mt-1">{patients.length} pacientes registrados</p>
            </div>
            <div className="flex gap-3">
              <button onClick={openCreate} className="rounded-2xl bg-gradient-to-r from-[#00F5A0] to-[#00D9FF] px-5 py-2.5 text-sm font-bold text-[#0A0C10] hover:opacity-90 transition-all">
                + Nuevo Paciente
              </button>
              <Link href="/" className="rounded-2xl border border-[#30363D] px-5 py-2.5 text-sm text-slate-300 hover:border-[#00F5A0] hover:text-[#00F5A0] transition-colors">
                ← Volver
              </Link>
            </div>
          </div>

          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Buscar por nombre, email o teléfono..."
            className="w-full rounded-2xl border border-[#30363D] bg-[#161B22] px-5 py-3 text-sm text-slate-200 outline-none focus:border-[#00F5A0]"
          />

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((p) => (
              <div key={p.id} className="rounded-2xl border border-[#30363D] bg-[#161B22] p-5 hover:border-[#00F5A0]/30 transition-colors group">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-[#00F5A0]/10 flex items-center justify-center">
                    <span className="material-symbols-outlined text-[#00F5A0] text-2xl">person</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-slate-100">{p.name}</p>
                    {p.gender && <p className="text-xs text-slate-500">{p.gender}</p>}
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(p)} className="p-1.5 text-slate-500 hover:text-[#00D9FF] transition-colors">
                      <span className="material-symbols-outlined text-sm">edit</span>
                    </button>
                    <button onClick={() => handleDelete(p.id)} className="p-1.5 text-slate-500 hover:text-red-400 transition-colors">
                      <span className="material-symbols-outlined text-sm">delete</span>
                    </button>
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
                <Link href={`/patients/${p.id}`} className="block text-xs text-[#00D9FF] mt-4 pt-3 border-t border-[#30363D] group-hover:underline">Ver historial completo →</Link>
              </div>
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

      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-[#161B22] border border-[#30363D] rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-slate-100 mb-4">{editing ? "Editar Paciente" : "Nuevo Paciente"}</h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input required value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} placeholder="Nombre completo" className="w-full rounded-xl border border-[#30363D] bg-[#0A0C10] px-4 py-2.5 text-sm text-slate-200 outline-none focus:border-[#00F5A0]" />
              <input value={form.phone} onChange={(e) => setForm({...form, phone: e.target.value})} placeholder="Teléfono" className="w-full rounded-xl border border-[#30363D] bg-[#0A0C10] px-4 py-2.5 text-sm text-slate-200 outline-none focus:border-[#00F5A0]" />
              <input type="email" value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} placeholder="Email" className="w-full rounded-xl border border-[#30363D] bg-[#0A0C10] px-4 py-2.5 text-sm text-slate-200 outline-none focus:border-[#00F5A0]" />
              <input value={form.whatsappPhone} onChange={(e) => setForm({...form, whatsappPhone: e.target.value})} placeholder="WhatsApp" className="w-full rounded-xl border border-[#30363D] bg-[#0A0C10] px-4 py-2.5 text-sm text-slate-200 outline-none focus:border-[#00F5A0]" />
              <input type="date" value={form.dateOfBirth} onChange={(e) => setForm({...form, dateOfBirth: e.target.value})} className="w-full rounded-xl border border-[#30363D] bg-[#0A0C10] px-4 py-2.5 text-sm text-slate-200 outline-none focus:border-[#00F5A0]" />
              <select value={form.gender} onChange={(e) => setForm({...form, gender: e.target.value})} className="w-full rounded-xl border border-[#30363D] bg-[#0A0C10] px-4 py-2.5 text-sm text-slate-200 outline-none focus:border-[#00F5A0]">
                <option value="">Género</option>
                <option value="Masculino">Masculino</option>
                <option value="Femenino">Femenino</option>
                <option value="Otro">Otro</option>
              </select>
              <textarea value={form.notes} onChange={(e) => setForm({...form, notes: e.target.value})} placeholder="Notas" rows={3} className="w-full rounded-xl border border-[#30363D] bg-[#0A0C10] px-4 py-2.5 text-sm text-slate-200 outline-none focus:border-[#00F5A0] resize-none" />
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 rounded-xl border border-[#30363D] py-2.5 text-sm text-slate-400 hover:border-slate-400 transition-colors">Cancelar</button>
                <button type="submit" disabled={loading} className="flex-1 rounded-xl bg-gradient-to-r from-[#00F5A0] to-[#00D9FF] py-2.5 text-sm font-bold text-[#0A0C10] hover:opacity-90 disabled:opacity-50">
                  {loading ? "Guardando..." : "Guardar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
