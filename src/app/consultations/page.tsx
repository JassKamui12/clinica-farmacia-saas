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
}

interface Product {
  id: string;
  name: string;
  category?: string | null;
  price: number;
  stock: number;
  isAvailable: boolean;
}

interface Visit {
  id: string;
  visitDate: string;
  symptoms?: string | null;
  diagnosis?: string | null;
  treatment?: string | null;
  doctorName: string;
}

interface Appointment {
  id: string;
  date: string;
  time: string;
  status: string;
  reason?: string | null;
  notes?: string | null;
  patient: { id: string; name: string; whatsappPhone?: string | null };
  doctor: { name?: string | null; email: string };
}

export default function ConsultationsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const doctorId = session?.user?.id || "";
  const [patients, setPatients] = useState<Patient[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [todayAppointments, setTodayAppointments] = useState<Appointment[]>([]);

  const [selectedPatientId, setSelectedPatientId] = useState<string>("");
  const [selectedPatientHistory, setSelectedPatientHistory] = useState<Visit[]>([]);
  const [showNewPatientForm, setShowNewPatientForm] = useState(false);
  const [showConsultationForm, setShowConsultationForm] = useState(false);

  const [newPatientName, setNewPatientName] = useState("");
  const [newPatientPhone, setNewPatientPhone] = useState("");
  const [newPatientWhatsapp, setNewPatientWhatsapp] = useState("");
  const [newPatientEmail, setNewPatientEmail] = useState("");
  const [newPatientGender, setNewPatientGender] = useState("");
  const [newPatientDob, setNewPatientDob] = useState("");

  const [symptoms, setSymptoms] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [treatment, setTreatment] = useState("");
  const [visitNotes, setVisitNotes] = useState("");

  const [selectedProductId, setSelectedProductId] = useState("");
  const [dosage, setDosage] = useState("");
  const [instructions, setInstructions] = useState("");
  const [prescriptionNotes, setPrescriptionNotes] = useState("");
  const [prescriptionQty, setPrescriptionQty] = useState(1);
  const [showPrescription, setShowPrescription] = useState(false);

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const loadData = useCallback(async () => {
    const today = new Date().toISOString().split("T")[0];
    const [patientsRes, productsRes, apptsRes] = await Promise.all([
      fetch("/api/patients"),
      fetch("/api/products"),
      fetch(`/api/appointments?date=${today}`),
    ]);
    setPatients(await patientsRes.json());
    setProducts(await productsRes.json());
    setTodayAppointments((await apptsRes.json()).filter((a: Appointment) => a.status !== "CANCELLED"));
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (!session) return <div className="min-h-screen bg-[#0A0C10] flex items-center justify-center"><p className="text-slate-400">Cargando...</p></div>;

  async function loadPatientHistory(patientId: string) {
    if (!patientId) { setSelectedPatientHistory([]); return; }
    const res = await fetch(`/api/patients/${patientId}/history`);
    const data = await res.json();
    setSelectedPatientHistory(data.visits || []);
  }

  async function createPatient() {
    if (!newPatientName.trim()) return;
    setLoading(true);
    const res = await fetch("/api/patients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: newPatientName,
        phone: newPatientPhone || null,
        whatsappPhone: newPatientWhatsapp || null,
        email: newPatientEmail || null,
        gender: newPatientGender || null,
        dateOfBirth: newPatientDob || null,
      }),
    });
    if (res.ok) {
      setMessage("✅ Paciente creado");
      setShowNewPatientForm(false);
      setNewPatientName(""); setNewPatientPhone(""); setNewPatientWhatsapp("");
      setNewPatientEmail(""); setNewPatientGender(""); setNewPatientDob("");
      loadData();
    }
    setLoading(false);
  }

  async function saveVisit() {
    if (!selectedPatientId || !symptoms.trim()) return;
    setLoading(true);
    const res = await fetch("/api/visits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        patientId: selectedPatientId,
        doctorId: doctorId,
        symptoms, diagnosis, treatment, notes: visitNotes,
      }),
    });
    if (res.ok) {
      const visit = await res.json();
      setMessage("✅ Consulta guardada");
      setSymptoms(""); setDiagnosis(""); setTreatment(""); setVisitNotes("");
      loadPatientHistory(selectedPatientId);
      if (!showPrescription) {
        setShowConsultationForm(false);
      }
    }
    setLoading(false);
  }

  async function savePrescription() {
    if (!selectedPatientId || !selectedProductId) return;
    const product = products.find((p) => p.id === selectedProductId);
    if (!product) return;
    setLoading(true);
    const res = await fetch("/api/prescriptions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        patientId: selectedPatientId,
        doctorId: doctorId,
        productName: product.name,
        dosage, instructions, notes: prescriptionNotes,
        quantity: prescriptionQty,
        totalPrice: product.price * prescriptionQty,
      }),
    });
    if (res.ok) {
      setMessage("✅ Receta enviada a farmacia");
      setDosage(""); setInstructions(""); setPrescriptionNotes("");
      setSelectedProductId(""); setPrescriptionQty(1);
      setShowPrescription(false);
      setShowConsultationForm(false);
    }
    setLoading(false);
  }

  function selectAppointmentPatient(appt: Appointment) {
    setSelectedPatientId(appt.patient.id);
    setShowConsultationForm(true);
    loadPatientHistory(appt.patient.id);
  }

  const selectedPatient = patients.find((p) => p.id === selectedPatientId);

  return (
    <main className="min-h-screen bg-[#0A0C10] text-slate-200">
      <Sidebar activePath="/consultations" userRole={session?.user.role as "ADMIN" | "DOCTOR" | "PHARMACIST"} userName={session?.user.name} userEmail={session?.user.email} />

      <div className="ml-[240px] p-8">
        <div className="max-w-[1400px] mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-100">Workspace de Consultas</h1>
              <p className="text-slate-500 mt-1">Selecciona un paciente o agenda una nueva consulta</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowNewPatientForm(!showNewPatientForm)} className="rounded-2xl border border-[#30363D] px-5 py-2.5 text-sm text-slate-300 hover:border-[#00F5A0] hover:text-[#00F5A0] transition-colors">
                + Nuevo Paciente
              </button>
            </div>
          </div>

          {message && <div className="rounded-2xl border border-[#00F5A0]/30 bg-[#00F5A0]/10 p-4 text-[#00F5A0] text-sm">{message}</div>}

          <div className="grid gap-6 xl:grid-cols-3">
            <div className="space-y-4">
              <div className="rounded-2xl border border-[#30363D] bg-[#161B22] p-5">
                <h3 className="text-lg font-semibold text-slate-100 mb-3">Paciente</h3>
                <select
                  value={selectedPatientId}
                  onChange={(e) => { setSelectedPatientId(e.target.value); loadPatientHistory(e.target.value); }}
                  className="w-full rounded-xl border border-[#30363D] bg-[#0A0C10] px-4 py-2.5 text-sm text-slate-200 outline-none focus:border-[#00F5A0]"
                >
                  <option value="">Seleccionar paciente...</option>
                  {patients.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>

                {selectedPatient && (
                  <div className="mt-4 rounded-xl bg-[#0A0C10] p-4 space-y-2">
                    <p className="font-semibold text-slate-100">{selectedPatient.name}</p>
                    {selectedPatient.whatsappPhone && <p className="text-xs text-slate-500">WhatsApp: {selectedPatient.whatsappPhone}</p>}
                    {selectedPatient.gender && <p className="text-xs text-slate-500">Género: {selectedPatient.gender}</p>}
                    {selectedPatient.notes && <p className="text-xs text-amber-400 mt-2">⚠️ {selectedPatient.notes}</p>}
                    <Link href={`/patients/${selectedPatient.id}`} className="text-xs text-[#00D9FF] hover:underline">Ver historial completo →</Link>
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-[#30363D] bg-[#161B22] p-5">
                <h3 className="text-lg font-semibold text-slate-100 mb-3">Citas de Hoy</h3>
                {todayAppointments.length === 0 ? (
                  <p className="text-sm text-slate-500">Sin citas hoy</p>
                ) : (
                  <div className="space-y-2">
                    {todayAppointments.map((appt) => (
                      <button
                        key={appt.id}
                        onClick={() => selectAppointmentPatient(appt)}
                        className="w-full rounded-xl bg-[#0A0C10] border border-[#30363D] p-3 text-left hover:border-[#00F5A0] transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-slate-100">{appt.patient.name}</p>
                          <span className="text-sm font-bold text-slate-300">{appt.time}</span>
                        </div>
                        {appt.reason && <p className="text-xs text-slate-500 mt-1">{appt.reason}</p>}
                        <span className={`text-xs px-2 py-0.5 rounded-full mt-1 inline-block ${
                          appt.status === "CONFIRMED" ? "bg-[#00F5A0]/10 text-[#00F5A0]" : "bg-amber-400/10 text-amber-400"
                        }`}>{appt.status === "CONFIRMED" ? "Confirmada" : "Pendiente"}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {selectedPatientHistory.length > 0 && (
                <div className="rounded-2xl border border-[#30363D] bg-[#161B22] p-5">
                  <h3 className="text-sm font-semibold text-slate-100 mb-3">Historial Reciente ({selectedPatientHistory.length})</h3>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {selectedPatientHistory.slice(0, 5).map((v) => (
                      <div key={v.id} className="rounded-lg bg-[#0A0C10] p-3">
                        <p className="text-xs text-slate-500">{new Date(v.visitDate).toLocaleDateString("es-ES")}</p>
                        {v.diagnosis && <p className="text-xs text-purple-400 mt-1">Dx: {v.diagnosis}</p>}
                        {v.treatment && <p className="text-xs text-slate-400">Tx: {v.treatment}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="xl:col-span-2 space-y-4">
              {!showConsultationForm ? (
                <button
                  onClick={() => { if (!selectedPatientId) { setMessage("Selecciona un paciente primero"); return; } setShowConsultationForm(true); }}
                  disabled={!selectedPatientId}
                  className="w-full rounded-2xl border-2 border-dashed border-[#30363D] bg-[#161B22] p-12 text-center hover:border-[#00F5A0] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="material-symbols-outlined text-5xl text-slate-600 mb-3">note_add</span>
                  <p className="text-lg font-semibold text-slate-400">Iniciar Nueva Consulta</p>
                  <p className="text-sm text-slate-600 mt-1">Selecciona un paciente para comenzar</p>
                </button>
              ) : (
                <div className="rounded-2xl border border-[#00F5A0]/30 bg-[#161B22] p-6 space-y-5">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-slate-100">Nueva Consulta</h2>
                    <button onClick={() => setShowConsultationForm(false)} className="text-slate-500 hover:text-slate-300">
                      <span className="material-symbols-outlined">close</span>
                    </button>
                  </div>

                  <div>
                    <label className="block text-sm text-slate-400 mb-2">Síntomas *</label>
                    <textarea value={symptoms} onChange={(e) => setSymptoms(e.target.value)} placeholder="Describe los síntomas del paciente..." rows={3} className="w-full rounded-xl border border-[#30363D] bg-[#0A0C10] px-4 py-2.5 text-sm text-slate-200 outline-none focus:border-[#00F5A0] resize-none" />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm text-slate-400 mb-2">Diagnóstico</label>
                      <textarea value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} placeholder="Diagnóstico clínico..." rows={3} className="w-full rounded-xl border border-[#30363D] bg-[#0A0C10] px-4 py-2.5 text-sm text-slate-200 outline-none focus:border-[#00F5A0] resize-none" />
                    </div>
                    <div>
                      <label className="block text-sm text-slate-400 mb-2">Tratamiento</label>
                      <textarea value={treatment} onChange={(e) => setTreatment(e.target.value)} placeholder="Plan de tratamiento..." rows={3} className="w-full rounded-xl border border-[#30363D] bg-[#0A0C10] px-4 py-2.5 text-sm text-slate-200 outline-none focus:border-[#00F5A0] resize-none" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-slate-400 mb-2">Notas adicionales</label>
                    <textarea value={visitNotes} onChange={(e) => setVisitNotes(e.target.value)} placeholder="Observaciones..." rows={2} className="w-full rounded-xl border border-[#30363D] bg-[#0A0C10] px-4 py-2.5 text-sm text-slate-200 outline-none focus:border-[#00F5A0] resize-none" />
                  </div>

                  <div className="flex gap-3">
                    <button onClick={saveVisit} disabled={loading || !symptoms.trim()} className="rounded-2xl bg-[#00F5A0] px-6 py-2.5 text-sm font-semibold text-[#0A0C10] hover:bg-[#00e293] transition-colors disabled:opacity-50">
                      {loading ? "Guardando..." : "Guardar Consulta"}
                    </button>
                    <button onClick={() => setShowPrescription(true)} className="rounded-2xl bg-[#00D9FF] px-6 py-2.5 text-sm font-semibold text-[#0A0C10] hover:bg-[#00c8ee] transition-colors">
                      + Agregar Receta
                    </button>
                  </div>

                  {showPrescription && (
                    <div className="rounded-xl border border-[#00D9FF]/30 bg-[#00D9FF]/5 p-5 space-y-4">
                      <h3 className="text-lg font-semibold text-[#00D9FF]">Prescripción</h3>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <label className="block text-sm text-slate-400 mb-2">Producto *</label>
                          <select value={selectedProductId} onChange={(e) => setSelectedProductId(e.target.value)} className="w-full rounded-xl border border-[#30363D] bg-[#0A0C10] px-4 py-2.5 text-sm text-slate-200 outline-none focus:border-[#00D9FF]">
                            <option value="">Seleccionar...</option>
                            {products.filter((p) => p.stock > 0).map((p) => (
                              <option key={p.id} value={p.id}>{p.name} (Stock: {p.stock}) - ${p.price.toFixed(2)}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm text-slate-400 mb-2">Cantidad</label>
                          <input type="number" min={1} value={prescriptionQty} onChange={(e) => setPrescriptionQty(parseInt(e.target.value))} className="w-full rounded-xl border border-[#30363D] bg-[#0A0C10] px-4 py-2.5 text-sm text-slate-200 outline-none focus:border-[#00D9FF]" />
                        </div>
                      </div>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <label className="block text-sm text-slate-400 mb-2">Dosis</label>
                          <input value={dosage} onChange={(e) => setDosage(e.target.value)} placeholder="Ej: 500mg cada 8h" className="w-full rounded-xl border border-[#30363D] bg-[#0A0C10] px-4 py-2.5 text-sm text-slate-200 outline-none focus:border-[#00D9FF]" />
                        </div>
                        <div>
                          <label className="block text-sm text-slate-400 mb-2">Instrucciones</label>
                          <input value={instructions} onChange={(e) => setInstructions(e.target.value)} placeholder="Ej: Tomar con alimentos" className="w-full rounded-xl border border-[#30363D] bg-[#0A0C10] px-4 py-2.5 text-sm text-slate-200 outline-none focus:border-[#00D9FF]" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm text-slate-400 mb-2">Notas de receta</label>
                        <textarea value={prescriptionNotes} onChange={(e) => setPrescriptionNotes(e.target.value)} placeholder="Observaciones adicionales..." rows={2} className="w-full rounded-xl border border-[#30363D] bg-[#0A0C10] px-4 py-2.5 text-sm text-slate-200 outline-none focus:border-[#00D9FF] resize-none" />
                      </div>
                      <div className="flex gap-3">
                        <button onClick={savePrescription} disabled={loading || !selectedProductId} className="rounded-2xl bg-[#00D9FF] px-6 py-2.5 text-sm font-semibold text-[#0A0C10] hover:bg-[#00c8ee] transition-colors disabled:opacity-50">
                          {loading ? "Enviando..." : "Enviar a Farmacia"}
                        </button>
                        <button onClick={() => setShowPrescription(false)} className="rounded-2xl border border-[#30363D] px-6 py-2.5 text-sm text-slate-400 hover:text-slate-200 transition-colors">Cancelar</button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {showNewPatientForm && (
            <div className="rounded-2xl border border-[#30363D] bg-[#161B22] p-6 space-y-4">
              <h2 className="text-xl font-semibold text-slate-100">Registrar Nuevo Paciente</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <label className="block text-sm text-slate-400 mb-2">Nombre *</label>
                  <input value={newPatientName} onChange={(e) => setNewPatientName(e.target.value)} className="w-full rounded-xl border border-[#30363D] bg-[#0A0C10] px-4 py-2.5 text-sm text-slate-200 outline-none focus:border-[#00F5A0]" />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-2">Teléfono</label>
                  <input value={newPatientPhone} onChange={(e) => setNewPatientPhone(e.target.value)} placeholder="+506..." className="w-full rounded-xl border border-[#30363D] bg-[#0A0C10] px-4 py-2.5 text-sm text-slate-200 outline-none focus:border-[#00F5A0]" />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-2">WhatsApp</label>
                  <input value={newPatientWhatsapp} onChange={(e) => setNewPatientWhatsapp(e.target.value)} placeholder="+506..." className="w-full rounded-xl border border-[#30363D] bg-[#0A0C10] px-4 py-2.5 text-sm text-slate-200 outline-none focus:border-[#00F5A0]" />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-2">Email</label>
                  <input type="email" value={newPatientEmail} onChange={(e) => setNewPatientEmail(e.target.value)} className="w-full rounded-xl border border-[#30363D] bg-[#0A0C10] px-4 py-2.5 text-sm text-slate-200 outline-none focus:border-[#00F5A0]" />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-2">Género</label>
                  <select value={newPatientGender} onChange={(e) => setNewPatientGender(e.target.value)} className="w-full rounded-xl border border-[#30363D] bg-[#0A0C10] px-4 py-2.5 text-sm text-slate-200 outline-none focus:border-[#00F5A0]">
                    <option value="">Seleccionar</option>
                    <option value="M">Masculino</option>
                    <option value="F">Femenino</option>
                    <option value="O">Otro</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-2">Fecha de nacimiento</label>
                  <input type="date" value={newPatientDob} onChange={(e) => setNewPatientDob(e.target.value)} className="w-full rounded-xl border border-[#30363D] bg-[#0A0C10] px-4 py-2.5 text-sm text-slate-200 outline-none focus:border-[#00F5A0]" />
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={createPatient} disabled={loading || !newPatientName.trim()} className="rounded-2xl bg-[#00F5A0] px-6 py-2.5 text-sm font-semibold text-[#0A0C10] hover:bg-[#00e293] transition-colors disabled:opacity-50">
                  {loading ? "Creando..." : "Crear Paciente"}
                </button>
                <button onClick={() => setShowNewPatientForm(false)} className="rounded-2xl border border-[#30363D] px-6 py-2.5 text-sm text-slate-400 hover:text-slate-200 transition-colors">Cancelar</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
