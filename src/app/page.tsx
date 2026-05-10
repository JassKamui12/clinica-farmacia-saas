'use client';

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";

type UserRole = "ADMIN" | "DOCTOR" | "PHARMACIST";

interface Notification {
  id: string;
  title: string;
  content: string;
  role?: string;
  read: boolean;
  createdAt: string;
}

interface User {
  id: string;
  name?: string;
  email: string;
  role: UserRole;
}

interface Patient {
  id: string;
  name: string;
  whatsappPhone?: string | null;
}

interface Product {
  id: string;
  name: string;
  category?: string;
  indications?: string;
  contraindications?: string;
  price: number;
  stock: number;
  isAvailable?: boolean;
}

interface Visit {
  id: string;
  patientId: string;
  patientName: string;
  doctorName: string;
  symptoms?: string;
  diagnosis?: string;
  treatment?: string;
  visitDate: string;
}

interface Prescription {
  id: string;
  patientId: string;
  patientName: string;
  doctorName: string;
  productName: string;
  dosage?: string;
  instructions?: string;
  createdAt: string;
}

interface AiResponse {
  text: string;
  isReal: boolean;
}

const roleLabels: Record<UserRole, string> = {
  ADMIN: "Super Admin",
  DOCTOR: "Doctor",
  PHARMACIST: "Farmacéutico",
};

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [todayAppts, setTodayAppts] = useState(0);
  const [pendingAppts, setPendingAppts] = useState(0);
  const [activeFollowups, setActiveFollowups] = useState(0);

  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserRole, setNewUserRole] = useState<UserRole>("DOCTOR");
  const [patientName, setPatientName] = useState("");
  const [patientPhone, setPatientPhone] = useState("");
  const [productName, setProductName] = useState("");
  const [selectedRole, setSelectedRole] = useState<UserRole>("PHARMACIST");
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [visitSymptoms, setVisitSymptoms] = useState("");
  const [visitDiagnosis, setVisitDiagnosis] = useState("");
  const [visitTreatment, setVisitTreatment] = useState("");
  const [dosage, setDosage] = useState("");
  const [instructions, setInstructions] = useState("");
  const [symptoms, setSymptoms] = useState("");
  const [pharmacyDescription, setPharmacyDescription] = useState("");
  const [aiResult, setAiResult] = useState<AiResponse | null>(null);
  const [pharmacyResult, setPharmacyResult] = useState<AiResponse | null>(null);
  const [statusMessage, setStatusMessage] = useState("");
  const [diagnosisLoading, setDiagnosisLoading] = useState(false);
  const [pharmacyLoading, setPharmacyLoading] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/login"); return; }
    if (status === "authenticated") {
      if (session?.user?.role === "DOCTOR") { router.push("/doctor"); return; }
      if (session?.user?.role === "PHARMACIST") { router.push("/pharmacist"); return; }
      if (session?.user?.role === "ADMIN") { router.push("/admin"); return; }
      loadData();
    }
  }, [status]);

  useEffect(() => {
    if (status === "authenticated") {
      loadNotifications(selectedRole);
    }
  }, [selectedRole, status]);

  async function loadNotifications(role: UserRole) {
    try {
      const res = await fetch(`/api/notifications?role=${role}`);
      if (!res.ok) return;
      setNotifications(await res.json());
    } catch {
      // silently ignore notification fetch failures
    }
  }

  async function loadData() {
    const [userRes, patientRes, productRes, visitRes, prescriptionRes, apptRes, followupRes] = await Promise.all([
      fetch("/api/users"),
      fetch("/api/patients"),
      fetch("/api/products"),
      fetch("/api/visits"),
      fetch("/api/prescriptions"),
      fetch(`/api/appointments?date=${new Date().toISOString().split("T")[0]}`),
      fetch("/api/followups?status=ACTIVE"),
    ]);

    const usersData = await userRes.json();
    const patientsData = await patientRes.json();
    const productsData = await productRes.json();

    setUsers(usersData);
    setPatients(patientsData);
    setProducts(productsData);
    setVisits(await visitRes.json());
    setPrescriptions(await prescriptionRes.json());

    const appts = await apptRes.json();
    setTodayAppts(appts.length);

    const allApptsRes = await fetch("/api/appointments");
    const allAppts = await allApptsRes.json();
    setPendingAppts(allAppts.filter((a: any) => a.status === "PENDING").length);

    setActiveFollowups((await followupRes.json()).length);

    await loadNotifications(selectedRole);

    if (patientsData.length && !selectedPatientId) setSelectedPatientId(patientsData[0].id);
    if (productsData.length && !selectedProductId) setSelectedProductId(productsData[0].id);
    if (usersData.length && !selectedDoctorId) {
      const doc = usersData.find((u: User) => u.role === "DOCTOR");
      setSelectedDoctorId(doc?.id ?? usersData[0]?.id ?? null);
    }
  }

  async function createUser() {
    if (!newUserName.trim() || !newUserEmail.trim()) return;
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newUserName, email: newUserEmail, password: "123456", role: newUserRole }),
    });
    if (res.ok) {
      setNewUserName(""); setNewUserEmail("");
      setStatusMessage("Usuario creado (contraseña: 123456)");
      loadData();
    }
  }

  async function createPatient() {
    if (!patientName.trim()) return;
    const res = await fetch("/api/patients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: patientName, whatsappPhone: patientPhone || null }),
    });
    if (res.ok) {
      setPatientName(""); setPatientPhone("");
      setStatusMessage("Paciente creado");
      loadData();
    }
  }

  async function createProduct() {
    if (!productName.trim()) return;
    const res = await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: productName, category: "General", price: 0, stock: 10, isAvailable: true }),
    });
    if (res.ok) {
      setProductName("");
      setStatusMessage("Producto agregado");
      loadData();
    }
  }

  async function createVisit() {
    if (!selectedPatientId || !visitSymptoms.trim()) return;
    const res = await fetch("/api/visits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ patientId: selectedPatientId, doctorId: selectedDoctorId, symptoms: visitSymptoms, diagnosis: visitDiagnosis, treatment: visitTreatment }),
    });
    if (res.ok) {
      setVisitSymptoms(""); setVisitDiagnosis(""); setVisitTreatment("");
      setStatusMessage("Consulta registrada");
      loadData();
    }
  }

  async function createPrescription() {
    if (!selectedPatientId || !selectedProductId) return;
    const product = products.find((p) => p.id === selectedProductId);
    if (!product) return;
    const res = await fetch("/api/prescriptions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ patientId: selectedPatientId, doctorId: selectedDoctorId, productName: product.name, dosage, instructions }),
    });
    if (res.ok) {
      setDosage(""); setInstructions("");
      setStatusMessage("Receta registrada");
      loadData();
    }
  }

  async function requestDiagnosis() {
    if (!selectedPatientId || !symptoms.trim()) return;
    setDiagnosisLoading(true); setAiResult(null);
    const patient = patients.find((p) => p.id === selectedPatientId);
    const res = await fetch("/api/ai/diagnose", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ patientName: patient?.name ?? "Paciente", symptoms, availableMedications: products.map((p) => ({ name: p.name, indications: p.indications, contraindications: p.contraindications, stock: p.stock, price: p.price })) }),
    });
    setAiResult(await res.json());
    setDiagnosisLoading(false);
  }

  async function requestPharmacySuggestion() {
    if (!pharmacyDescription.trim()) return;
    setPharmacyLoading(true); setPharmacyResult(null);
    const res = await fetch("/api/ai/pharmacy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customerDescription: pharmacyDescription, availableMedications: products.map((p) => ({ name: p.name, category: p.category, indications: p.indications, contraindications: p.contraindications, stock: p.stock, price: p.price })) }),
    });
    setPharmacyResult(await res.json());
    setPharmacyLoading(false);
  }

  const lowStockCount = products.filter((p) => p.stock > 0 && p.stock < 10).length;
  const outOfStockCount = products.filter((p) => p.stock <= 0).length;
  const filteredNotifications = notifications.filter((n) => n.role === selectedRole);
  const recentProducts = products.slice(0, 4);
  const recentActivity = prescriptions.slice(0, 4);

  if (status === "loading") return <div className="min-h-screen bg-[#0A0C10] flex items-center justify-center"><p className="text-slate-400">Cargando...</p></div>;

  const userRole = session?.user?.role as UserRole;
  const isDoctor = userRole === "DOCTOR";
  const isPharmacist = userRole === "PHARMACIST";
  const isAdmin = userRole === "ADMIN";

  return (
    <main className="min-h-screen bg-[#0A0C10] text-slate-200">
      <Sidebar activePath="/" userRole={userRole} userName={session?.user.name} userEmail={session?.user.email} />

      <header className="fixed top-0 right-0 w-[calc(100%-240px)] h-16 border-b border-[#30363D] bg-[#0A0C10]/90 backdrop-blur-md z-40 flex items-center justify-between px-8">
        <div>
          <h2 className="text-lg font-semibold text-slate-100">Bienvenido, {session?.user?.name || session?.user?.email}</h2>
          <p className="text-xs text-slate-500">{roleLabels[userRole]}</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#161B22] border border-[#30363D]">
            <span className={`w-2 h-2 rounded-full ${process.env.WHATSAPP_ACCESS_TOKEN ? "bg-[#00F5A0]" : "bg-amber-400"}`}></span>
            <span className="text-xs text-slate-400">WhatsApp</span>
          </div>
        </div>
      </header>

      <div className="ml-[240px] pt-20 px-8 pb-12">
        <div className="max-w-[1400px] mx-auto space-y-6">
          {statusMessage && (
            <div className="rounded-2xl border border-[#00F5A0]/30 bg-[#00F5A0]/10 p-4 text-[#00F5A0] text-sm">{statusMessage}</div>
          )}

          <div className="grid gap-4 lg:grid-cols-5">
            <StatCard icon="person" label="Pacientes" value={patients.length} color="text-[#00F5A0]" />
            <StatCard icon="medical_services" label="Consultas" value={visits.length} color="text-[#00D9FF]" />
            <StatCard icon="calendar_today" label="Hoy" value={todayAppts} color="text-purple-400" />
            <StatCard icon="pending" label="Pendientes" value={pendingAppts} color="text-amber-400" />
            <StatCard icon="monitor_heart" label="Seguimientos" value={activeFollowups} color="text-pink-400" />
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <div className="rounded-2xl border border-[#30363D] bg-[#161B22] p-5">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-slate-400">Bajo stock</p>
                <span className="material-symbols-outlined text-amber-400">warning</span>
              </div>
              <p className="text-3xl font-bold text-amber-400">{lowStockCount}</p>
              <p className="text-xs text-slate-500 mt-1">Productos con menos de 10 u.</p>
            </div>
            <div className="rounded-2xl border border-[#30363D] bg-[#161B22] p-5">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-slate-400">Agotados</p>
                <span className="material-symbols-outlined text-red-400">error</span>
              </div>
              <p className="text-3xl font-bold text-red-400">{outOfStockCount}</p>
              <p className="text-xs text-slate-500 mt-1">Sin inventario</p>
            </div>
            <div className="rounded-2xl border border-[#30363D] bg-[#161B22] p-5">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-slate-400">Recetas</p>
                <span className="material-symbols-outlined text-[#00D9FF]">prescriptions</span>
              </div>
              <p className="text-3xl font-bold text-[#00D9FF]">{prescriptions.length}</p>
              <p className="text-xs text-slate-500 mt-1">Generadas en total</p>
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <section className="rounded-2xl border border-[#30363D] bg-[#161B22] p-6">
              <h3 className="text-lg font-semibold text-slate-100 mb-4">Registrar consulta</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <SelectField label="Paciente" value={selectedPatientId ?? ""} onChange={(v) => setSelectedPatientId(v || null)}>
                  <option value="">Seleccionar</option>
                  {patients.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </SelectField>
                <SelectField label="Doctor" value={selectedDoctorId ?? ""} onChange={(v) => setSelectedDoctorId(v || null)}>
                  <option value="">Seleccionar</option>
                  {users.filter((u) => u.role === "DOCTOR").map((u) => <option key={u.id} value={u.id}>{u.name || u.email}</option>)}
                </SelectField>
              </div>
              <TextArea label="Síntomas" value={visitSymptoms} onChange={setVisitSymptoms} rows={2} />
              <div className="grid gap-3 sm:grid-cols-2">
                <TextArea label="Diagnóstico" value={visitDiagnosis} onChange={setVisitDiagnosis} rows={2} />
                <TextArea label="Tratamiento" value={visitTreatment} onChange={setVisitTreatment} rows={2} />
              </div>
              <button onClick={createVisit} disabled={!selectedPatientId || !visitSymptoms.trim()} className="mt-2 rounded-xl bg-[#00F5A0] px-5 py-2.5 text-sm font-semibold text-[#0A0C10] hover:bg-[#00e293] transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                Guardar consulta
              </button>
            </section>

            <section className="rounded-2xl border border-[#30363D] bg-[#161B22] p-6">
              <h3 className="text-lg font-semibold text-slate-100 mb-4">Prescribir producto</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <SelectField label="Producto" value={selectedProductId ?? ""} onChange={(v) => setSelectedProductId(v || null)}>
                  <option value="">Seleccionar</option>
                  {products.map((p) => <option key={p.id} value={p.id}>{p.name} (Stock: {p.stock})</option>)}
                </SelectField>
                <SelectField label="Doctor" value={selectedDoctorId ?? ""} onChange={(v) => setSelectedDoctorId(v || null)}>
                  <option value="">Seleccionar</option>
                  {users.filter((u) => u.role === "DOCTOR").map((u) => <option key={u.id} value={u.id}>{u.name || u.email}</option>)}
                </SelectField>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <InputField label="Dosis" value={dosage} onChange={setDosage} placeholder="Ej: 500mg cada 8h" />
                <InputField label="Instrucciones" value={instructions} onChange={setInstructions} placeholder="Ej: Tomar con alimentos" />
              </div>
              <button onClick={createPrescription} disabled={!selectedPatientId || !selectedProductId} className="mt-2 rounded-xl bg-[#00D9FF] px-5 py-2.5 text-sm font-semibold text-[#0A0C10] hover:bg-[#00c8ee] transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                Guardar receta
              </button>
            </section>
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <section className="rounded-2xl border border-[#30363D] bg-[#161B22] p-6">
              <h3 className="text-lg font-semibold text-slate-100 mb-4">Diagnóstico IA</h3>
              <SelectField label="Paciente" value={selectedPatientId ?? ""} onChange={(v) => setSelectedPatientId(v || null)}>
                <option value="">Seleccionar</option>
                {patients.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </SelectField>
              <TextArea label="Síntomas" value={symptoms} onChange={setSymptoms} placeholder="Describe los síntomas..." rows={3} />
              <div className="flex gap-2 mt-2">
                <button onClick={requestDiagnosis} disabled={diagnosisLoading || !selectedPatientId || !symptoms.trim()} className="rounded-xl bg-purple-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-purple-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                  {diagnosisLoading ? "Consultando..." : "Solicitar diagnóstico"}
                </button>
                <button onClick={() => setAiResult(null)} className="rounded-xl border border-[#30363D] px-5 py-2.5 text-sm font-semibold text-slate-300 hover:border-[#00F5A0] hover:text-[#00F5A0] transition-colors">
                  Limpiar
                </button>
              </div>
              {aiResult && (
                <div className="mt-4 rounded-xl border border-purple-500/30 bg-purple-500/5 p-4">
                  <p className="text-sm font-semibold text-purple-400 mb-2">Resultado IA</p>
                  <p className="text-sm text-slate-300 whitespace-pre-line">{aiResult.text}</p>
                </div>
              )}
            </section>

            <section className="rounded-2xl border border-[#30363D] bg-[#161B22] p-6">
              <h3 className="text-lg font-semibold text-slate-100 mb-4">Asistente de Farmacia</h3>
              <TextArea label="Descripción del caso" value={pharmacyDescription} onChange={setPharmacyDescription} placeholder="Describe los síntomas del cliente..." rows={3} />
              <button onClick={requestPharmacySuggestion} disabled={pharmacyLoading || !pharmacyDescription.trim()} className="mt-2 rounded-xl bg-[#00F5A0] px-5 py-2.5 text-sm font-semibold text-[#0A0C10] hover:bg-[#00e293] transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                {pharmacyLoading ? "Consultando..." : "Pedir sugerencia"}
              </button>
              {pharmacyResult && (
                <div className="mt-4 rounded-xl border border-[#00F5A0]/30 bg-[#00F5A0]/5 p-4">
                  <p className="text-sm font-semibold text-[#00F5A0] mb-2">Sugerencia de IA</p>
                  <p className="text-sm text-slate-300 whitespace-pre-line">{pharmacyResult.text}</p>
                </div>
              )}
            </section>
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <section className="rounded-2xl border border-[#30363D] bg-[#161B22] p-6">
              <h3 className="text-lg font-semibold text-slate-100 mb-4">Inventario destacado</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                {recentProducts.map((p) => (
                  <div key={p.id} className="rounded-xl border border-[#30363D] bg-[#0A0C10] p-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-semibold text-slate-100 text-sm">{p.name}</p>
                      <span className="text-xs text-[#00F5A0] font-bold">${p.price.toFixed(2)}</span>
                    </div>
                    <p className="text-xs text-slate-500 mb-2">{p.category || "General"}</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 rounded-full bg-[#161B22] overflow-hidden">
                        <div className={`h-full rounded-full ${p.stock > 20 ? "bg-[#00F5A0]" : p.stock > 0 ? "bg-amber-400" : "bg-red-400"}`} style={{ width: `${Math.min(100, p.stock * 4)}%` }} />
                      </div>
                      <span className="text-xs text-slate-400">{p.stock}u</span>
                    </div>
                  </div>
                ))}
              </div>
              <Link href="/inventory" className="mt-4 block text-center text-sm text-[#00F5A0] hover:underline">Ver inventario completo →</Link>
            </section>

            <section className="rounded-2xl border border-[#30363D] bg-[#161B22] p-6">
              <h3 className="text-lg font-semibold text-slate-100 mb-4">Recetas recientes</h3>
              {recentActivity.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-8">Sin recetas aún</p>
              ) : (
                <div className="space-y-2">
                  {recentActivity.map((rx) => (
                    <div key={rx.id} className="rounded-xl border border-[#30363D] bg-[#0A0C10] p-3 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-100">{rx.patientName}</p>
                        <p className="text-xs text-slate-500">{rx.productName} {rx.dosage && `· ${rx.dosage}`}</p>
                      </div>
                      <p className="text-xs text-slate-600">{new Date(rx.createdAt).toLocaleDateString()}</p>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          {(isAdmin || isPharmacist) && (
            <section className="rounded-2xl border border-[#30363D] bg-[#161B22] p-6">
              <h3 className="text-lg font-semibold text-slate-100 mb-4">Gestión rápida</h3>
              <div className="grid gap-4 lg:grid-cols-3">
                <div className="space-y-3">
                  <p className="text-sm font-medium text-slate-300">Crear usuario</p>
                  <InputField label="Nombre" value={newUserName} onChange={setNewUserName} />
                  <InputField label="Email" value={newUserEmail} onChange={setNewUserEmail} />
                  <SelectField label="Rol" value={newUserRole} onChange={(v) => setNewUserRole(v as UserRole)}>
                    <option value="DOCTOR">Doctor</option>
                    <option value="PHARMACIST">Farmacéutico</option>
                    <option value="ADMIN">Admin</option>
                  </SelectField>
                  <button onClick={createUser} className="w-full rounded-xl bg-[#00F5A0] px-4 py-2 text-sm font-semibold text-[#0A0C10] hover:bg-[#00e293] transition-colors">Crear usuario</button>
                </div>
                <div className="space-y-3">
                  <p className="text-sm font-medium text-slate-300">Crear paciente</p>
                  <InputField label="Nombre" value={patientName} onChange={setPatientName} />
                  <InputField label="WhatsApp (opcional)" value={patientPhone} onChange={setPatientPhone} placeholder="+50688888888" />
                  <button onClick={createPatient} disabled={!patientName.trim()} className="w-full rounded-xl bg-[#00D9FF] px-4 py-2 text-sm font-semibold text-[#0A0C10] hover:bg-[#00c8ee] transition-colors disabled:opacity-50">Crear paciente</button>
                </div>
                <div className="space-y-3">
                  <p className="text-sm font-medium text-slate-300">Crear producto</p>
                  <InputField label="Nombre" value={productName} onChange={setProductName} />
                  <button onClick={createProduct} disabled={!productName.trim()} className="w-full rounded-xl bg-purple-500 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-600 transition-colors disabled:opacity-50">Crear producto</button>
                </div>
              </div>
            </section>
          )}

          <section className="rounded-2xl border border-[#30363D] bg-[#161B22] p-6">
            <h3 className="text-lg font-semibold text-slate-100 mb-4">Notificaciones</h3>
            <div className="flex gap-2 mb-4">
              {(["DOCTOR", "PHARMACIST", "ADMIN"] as UserRole[]).map((role) => (
                <button key={role} onClick={() => setSelectedRole(role)} className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all ${selectedRole === role ? "bg-[#00F5A0] text-[#0A0C10]" : "border border-[#30363D] text-slate-400 hover:text-slate-200"}`}>
                  {roleLabels[role]}
                </button>
              ))}
            </div>
            {filteredNotifications.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-4">Sin notificaciones</p>
            ) : (
              <div className="space-y-2">
                {filteredNotifications.slice(0, 5).map((n) => (
                  <div key={n.id} className={`rounded-xl p-3 border ${n.read ? "border-[#30363D] bg-[#0A0C10]" : "border-[#00F5A0]/30 bg-[#00F5A0]/5"}`}>
                    <p className="text-sm font-medium text-slate-100">{n.title}</p>
                    <p className="text-xs text-slate-400 mt-1">{n.content}</p>
                    <p className="text-xs text-slate-600 mt-2">{new Date(n.createdAt).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-[#30363D] bg-[#161B22] p-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="material-symbols-outlined text-[#25D366] text-2xl">chat</span>
              <div>
                <h3 className="text-lg font-semibold text-slate-100">WhatsApp + IA</h3>
                <p className="text-xs text-slate-500">Integración con Meta Cloud API</p>
              </div>
            </div>
            <div className="grid gap-4 lg:grid-cols-3">
              <div className="rounded-xl border border-[#30363D] bg-[#0A0C10] p-4">
                <p className="text-sm font-medium text-slate-300 mb-2">Webhook</p>
                <code className="text-xs text-[#00F5A0] bg-[#161B22] px-2 py-1 rounded block">/api/whatsapp/webhook</code>
                <p className="text-xs text-slate-500 mt-2">URL para configurar en Meta Developers</p>
              </div>
              <div className="rounded-xl border border-[#30363D] bg-[#0A0C10] p-4">
                <p className="text-sm font-medium text-slate-300 mb-2">Plantillas configuradas</p>
                <div className="flex flex-wrap gap-1">
                  {["confirmar_cita", "recordatorio_24h", "recordatorio_1h", "seguimiento", "receta_lista"].map((t) => (
                    <span key={t} className="text-xs bg-[#161B22] text-slate-400 px-2 py-1 rounded">{t}</span>
                  ))}
                </div>
              </div>
              <div className="rounded-xl border border-[#30363D] bg-[#0A0C10] p-4">
                <p className="text-sm font-medium text-slate-300 mb-2">Flujos del Bot</p>
                <div className="space-y-1 text-xs text-slate-400">
                  <p>1️⃣ Agendar cita</p>
                  <p>2️⃣ Consultar cita</p>
                  <p>3️⃣ Seguimiento tratamiento</p>
                  <p>4️⃣ Consultar receta</p>
                  <p>5️⃣ Hablar con humano</p>
                </div>
              </div>
            </div>
            <p className="text-xs text-slate-600 mt-4">Configura las variables WHATSAPP_* en tu .env para activar la integración.</p>
          </section>
        </div>
      </div>
    </main>
  );
}

function StatCard({ icon, label, value, color }: { icon: string; label: string; value: number; color: string }) {
  return (
    <div className="rounded-2xl border border-[#30363D] bg-[#161B22] p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs uppercase tracking-widest text-slate-500">{label}</p>
        <span className={`material-symbols-outlined ${color}`}>{icon}</span>
      </div>
      <p className={`text-3xl font-bold ${color}`}>{value}</p>
    </div>
  );
}

function SelectField({ label, value, onChange, children }: { label: string; value: string; onChange: (v: string) => void; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs text-slate-500 mb-1">{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded-xl border border-[#30363D] bg-[#0A0C10] px-3 py-2 text-sm text-slate-200 outline-none focus:border-[#00F5A0]">
        {children}
      </select>
    </div>
  );
}

function InputField({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <label className="block text-xs text-slate-500 mb-1">{label}</label>
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full rounded-xl border border-[#30363D] bg-[#0A0C10] px-3 py-2 text-sm text-slate-200 outline-none focus:border-[#00F5A0]" />
    </div>
  );
}

function TextArea({ label, value, onChange, placeholder, rows }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; rows?: number }) {
  return (
    <div>
      <label className="block text-xs text-slate-500 mb-1">{label}</label>
      <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={rows || 2} className="w-full rounded-xl border border-[#30363D] bg-[#0A0C10] px-3 py-2 text-sm text-slate-200 outline-none focus:border-[#00F5A0] resize-none" />
    </div>
  );
}
