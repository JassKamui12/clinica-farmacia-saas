'use client';

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";

type AppRole = "ADMIN" | "DOCTOR" | "PHARMACIST" | "RECEPTIONIST";

interface Patient {
  id: string; name: string; phone?: string | null; email?: string | null;
  whatsappPhone?: string | null; dateOfBirth?: string | null; gender?: string | null; notes?: string | null;
}
interface Product { id: string; name: string; category?: string | null; price: number; stock: number; isAvailable: boolean }
interface Visit { id: string; visitDate: string; symptoms?: string | null; diagnosis?: string | null; treatment?: string | null; doctorName: string }
interface Appointment {
  id: string; date: string; time: string; status: string; reason?: string | null; notes?: string | null;
  patient: { id: string; name: string; whatsappPhone?: string | null };
  doctor: { name?: string | null; email: string };
}

const INPUT = "w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors";

export default function ConsultationsPage() {
  const { data: session } = useSession();
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
      fetch("/api/patients"), fetch("/api/products"), fetch(`/api/appointments?date=${today}`),
    ]);
    setPatients(await patientsRes.json());
    setProducts(await productsRes.json());
    setTodayAppointments((await apptsRes.json()).filter((a: Appointment) => a.status !== "CANCELLED"));
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  if (!session) return <div className="min-h-screen bg-slate-50 flex items-center justify-center"><p className="text-slate-400">Cargando...</p></div>;

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
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newPatientName, phone: newPatientPhone || null, whatsappPhone: newPatientWhatsapp || null, email: newPatientEmail || null, gender: newPatientGender || null, dateOfBirth: newPatientDob || null }),
    });
    if (res.ok) {
      setMessage("Paciente creado");
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
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ patientId: selectedPatientId, doctorId, symptoms, diagnosis, treatment, notes: visitNotes }),
    });
    if (res.ok) {
      setMessage("Consulta guardada");
      setSymptoms(""); setDiagnosis(""); setTreatment(""); setVisitNotes("");
      loadPatientHistory(selectedPatientId);
      if (!showPrescription) setShowConsultationForm(false);
    }
    setLoading(false);
  }

  async function savePrescription() {
    if (!selectedPatientId || !selectedProductId) return;
    const product = products.find((p) => p.id === selectedProductId);
    if (!product) return;
    setLoading(true);
    const res = await fetch("/api/prescriptions", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ patientId: selectedPatientId, doctorId, productName: product.name, dosage, instructions, notes: prescriptionNotes, quantity: prescriptionQty, totalPrice: product.price * prescriptionQty }),
    });
    if (res.ok) {
      setMessage("Receta enviada a farmacia");
      setDosage(""); setInstructions(""); setPrescriptionNotes(""); setSelectedProductId(""); setPrescriptionQty(1);
      setShowPrescription(false); setShowConsultationForm(false);
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
    <main className="min-h-screen bg-slate-50">
      <Sidebar activePath="/consultations" userRole={(session?.user.role ?? "ADMIN") as AppRole} userName={session?.user.name} userEmail={session?.user.email} />

      <div className="ml-[240px] p-8">
        <div className="max-w-[1400px] mx-auto space-y-6">

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Workspace de Consultas</h1>
              <p className="text-slate-500 text-sm mt-1">Selecciona un paciente o inicia una nueva consulta</p>
            </div>
            <button onClick={() => setShowNewPatientForm(!showNewPatientForm)}
              className="flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 hover:border-blue-400 hover:text-blue-600 transition-colors">
              <span className="material-symbols-outlined text-lg">person_add</span>
              Nuevo Paciente
            </button>
          </div>

          {message && <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-emerald-700 text-sm">{message}</div>}

          <div className="grid gap-6 xl:grid-cols-3">
            {/* Left panel */}
            <div className="space-y-4">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                <h3 className="text-base font-semibold text-slate-900 mb-3">Paciente</h3>
                <select value={selectedPatientId} onChange={(e) => { setSelectedPatientId(e.target.value); loadPatientHistory(e.target.value); }} className={INPUT}>
                  <option value="">Seleccionar paciente...</option>
                  {patients.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>

                {selectedPatient && (
                  <div className="mt-4 rounded-xl bg-slate-50 border border-slate-200 p-4 space-y-1.5">
                    <p className="font-semibold text-slate-900">{selectedPatient.name}</p>
                    {selectedPatient.whatsappPhone && <p className="text-xs text-emerald-600">WhatsApp: {selectedPatient.whatsappPhone}</p>}
                    {selectedPatient.gender && <p className="text-xs text-slate-500">Género: {selectedPatient.gender}</p>}
                    {selectedPatient.notes && (
                      <div className="rounded-lg bg-amber-50 border border-amber-200 p-2 mt-2">
                        <p className="text-xs text-amber-700">{selectedPatient.notes}</p>
                      </div>
                    )}
                    <Link href={`/patients/${selectedPatient.id}`} className="text-xs text-blue-600 hover:underline font-medium block mt-2">Ver historial completo →</Link>
                  </div>
                )}
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                <h3 className="text-base font-semibold text-slate-900 mb-3">Citas de Hoy</h3>
                {todayAppointments.length === 0 ? (
                  <p className="text-sm text-slate-400">Sin citas programadas hoy</p>
                ) : (
                  <div className="space-y-2">
                    {todayAppointments.map((appt) => (
                      <button key={appt.id} onClick={() => selectAppointmentPatient(appt)}
                        className="w-full rounded-xl bg-slate-50 border border-slate-200 p-3 text-left hover:border-blue-300 hover:bg-blue-50 transition-colors">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-slate-900">{appt.patient.name}</p>
                          <span className="text-sm font-bold text-slate-700">{appt.time}</span>
                        </div>
                        {appt.reason && <p className="text-xs text-slate-500 mt-1">{appt.reason}</p>}
                        <span className={`text-xs px-2 py-0.5 rounded-full mt-1 inline-block font-medium ${appt.status === "CONFIRMED" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-amber-50 text-amber-700 border border-amber-200"}`}>
                          {appt.status === "CONFIRMED" ? "Confirmada" : "Pendiente"}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {selectedPatientHistory.length > 0 && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                  <h3 className="text-sm font-semibold text-slate-900 mb-3">Historial Reciente ({selectedPatientHistory.length})</h3>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {selectedPatientHistory.slice(0, 5).map((v) => (
                      <div key={v.id} className="rounded-lg bg-slate-50 border border-slate-200 p-3">
                        <p className="text-xs text-slate-500">{new Date(v.visitDate).toLocaleDateString("es-ES")}</p>
                        {v.diagnosis && <p className="text-xs text-violet-700 mt-1 font-medium">Dx: {v.diagnosis}</p>}
                        {v.treatment && <p className="text-xs text-slate-600">Tx: {v.treatment}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right panel */}
            <div className="xl:col-span-2 space-y-4">
              {!showConsultationForm ? (
                <button
                  onClick={() => { if (!selectedPatientId) { setMessage("Selecciona un paciente primero"); return; } setShowConsultationForm(true); }}
                  disabled={!selectedPatientId}
                  className="w-full rounded-2xl border-2 border-dashed border-slate-300 bg-white p-12 text-center hover:border-blue-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                  <span className="material-symbols-outlined text-5xl text-slate-300 mb-3 block">note_add</span>
                  <p className="text-lg font-semibold text-slate-500">Iniciar Nueva Consulta</p>
                  <p className="text-sm text-slate-400 mt-1">Selecciona un paciente para comenzar</p>
                </button>
              ) : (
                <div className="bg-white rounded-2xl border border-blue-200 shadow-sm p-6 space-y-5">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold text-slate-900">Nueva Consulta</h2>
                    <button onClick={() => setShowConsultationForm(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                      <span className="material-symbols-outlined">close</span>
                    </button>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">Síntomas *</label>
                    <textarea value={symptoms} onChange={(e) => setSymptoms(e.target.value)} placeholder="Describe los síntomas del paciente..." rows={3} className={`${INPUT} resize-none`} />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">Diagnóstico</label>
                      <textarea value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} placeholder="Diagnóstico clínico..." rows={3} className={`${INPUT} resize-none`} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">Tratamiento</label>
                      <textarea value={treatment} onChange={(e) => setTreatment(e.target.value)} placeholder="Plan de tratamiento..." rows={3} className={`${INPUT} resize-none`} />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">Notas adicionales</label>
                    <textarea value={visitNotes} onChange={(e) => setVisitNotes(e.target.value)} placeholder="Observaciones..." rows={2} className={`${INPUT} resize-none`} />
                  </div>

                  <div className="flex gap-3">
                    <button onClick={saveVisit} disabled={loading || !symptoms.trim()} className="rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors disabled:opacity-50">
                      {loading ? "Guardando..." : "Guardar Consulta"}
                    </button>
                    <button onClick={() => setShowPrescription(true)} className="rounded-xl bg-violet-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-violet-700 transition-colors">
                      + Agregar Receta
                    </button>
                  </div>

                  {showPrescription && (
                    <div className="rounded-xl border border-violet-200 bg-violet-50 p-5 space-y-4">
                      <h3 className="text-base font-semibold text-violet-800">Prescripción</h3>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">Producto *</label>
                          <select value={selectedProductId} onChange={(e) => setSelectedProductId(e.target.value)} className={INPUT}>
                            <option value="">Seleccionar...</option>
                            {products.filter((p) => p.stock > 0).map((p) => (
                              <option key={p.id} value={p.id}>{p.name} (Stock: {p.stock}) — L {p.price.toFixed(2)}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">Cantidad</label>
                          <input type="number" min={1} value={prescriptionQty} onChange={(e) => setPrescriptionQty(parseInt(e.target.value))} className={INPUT} />
                        </div>
                      </div>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">Dosis</label>
                          <input value={dosage} onChange={(e) => setDosage(e.target.value)} placeholder="Ej: 500mg cada 8h" className={INPUT} />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">Instrucciones</label>
                          <input value={instructions} onChange={(e) => setInstructions(e.target.value)} placeholder="Ej: Tomar con alimentos" className={INPUT} />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">Notas de receta</label>
                        <textarea value={prescriptionNotes} onChange={(e) => setPrescriptionNotes(e.target.value)} placeholder="Observaciones adicionales..." rows={2} className={`${INPUT} resize-none`} />
                      </div>
                      <div className="flex gap-3">
                        <button onClick={savePrescription} disabled={loading || !selectedProductId} className="rounded-xl bg-violet-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-violet-700 transition-colors disabled:opacity-50">
                          {loading ? "Enviando..." : "Enviar a Farmacia"}
                        </button>
                        <button onClick={() => setShowPrescription(false)} className="rounded-xl border border-slate-300 px-6 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">Cancelar</button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {showNewPatientForm && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
              <h2 className="text-lg font-bold text-slate-900">Registrar Nuevo Paciente</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {[
                  { label: "Nombre *", value: newPatientName, onChange: setNewPatientName, placeholder: "" },
                  { label: "Teléfono", value: newPatientPhone, onChange: setNewPatientPhone, placeholder: "+504..." },
                  { label: "WhatsApp", value: newPatientWhatsapp, onChange: setNewPatientWhatsapp, placeholder: "+504..." },
                  { label: "Email", value: newPatientEmail, onChange: setNewPatientEmail, placeholder: "" },
                ].map((f) => (
                  <div key={f.label}>
                    <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">{f.label}</label>
                    <input value={f.value} onChange={(e) => f.onChange(e.target.value)} placeholder={f.placeholder} className={INPUT} />
                  </div>
                ))}
                <div>
                  <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">Género</label>
                  <select value={newPatientGender} onChange={(e) => setNewPatientGender(e.target.value)} className={INPUT}>
                    <option value="">Seleccionar</option>
                    <option value="Masculino">Masculino</option>
                    <option value="Femenino">Femenino</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">Fecha de nacimiento</label>
                  <input type="date" value={newPatientDob} onChange={(e) => setNewPatientDob(e.target.value)} className={INPUT} />
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={createPatient} disabled={loading || !newPatientName.trim()} className="rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors disabled:opacity-50">
                  {loading ? "Creando..." : "Crear Paciente"}
                </button>
                <button onClick={() => setShowNewPatientForm(false)} className="rounded-xl border border-slate-300 px-6 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">Cancelar</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
