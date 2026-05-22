'use client';

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";

type AppRole = "ADMIN" | "DOCTOR" | "PHARMACIST" | "RECEPTIONIST";
type AppointmentStatus = "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED" | "NO_SHOW";

interface Appointment {
  id: string; date: string; time: string; status: AppointmentStatus;
  reason?: string | null; notes?: string | null;
  whatsappReminder24h: boolean; whatsappReminder1h: boolean; whatsappConfirmed: boolean;
  patient: { id: string; name: string; whatsappPhone?: string | null };
  doctor: { id: string; name?: string | null; email: string };
}
interface Patient { id: string; name: string; whatsappPhone?: string | null }
interface Doctor { id: string; name?: string | null; email: string; role: string }
interface TimeSlot { time: string; available: boolean }

const statusConfig: Record<AppointmentStatus, { label: string; color: string; bg: string; border: string; icon: string }> = {
  PENDING:   { label: "Pendiente",  color: "text-amber-700",   bg: "bg-amber-50",   border: "border-amber-200",   icon: "schedule" },
  CONFIRMED: { label: "Confirmada", color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200", icon: "check_circle" },
  COMPLETED: { label: "Completada", color: "text-blue-700",    bg: "bg-blue-50",    border: "border-blue-200",    icon: "event_available" },
  CANCELLED: { label: "Cancelada",  color: "text-red-700",     bg: "bg-red-50",     border: "border-red-200",     icon: "cancel" },
  NO_SHOW:   { label: "No asistió", color: "text-slate-600",   bg: "bg-slate-100",  border: "border-slate-200",   icon: "person_off" },
};

const INPUT = "w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors";

export default function AppointmentsPage() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);

  const [selectedDate, setSelectedDate] = useState("");
  const [selectedDoctor, setSelectedDoctor] = useState("");
  const [selectedPatient, setSelectedPatient] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");

  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterDate, setFilterDate] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const loadData = useCallback(async () => {
    const [apptRes, patientRes, doctorRes] = await Promise.all([
      fetch(filterDate ? `/api/appointments?date=${filterDate}` : "/api/appointments"),
      fetch("/api/patients"),
      fetch("/api/users"),
    ]);
    setAppointments(await apptRes.json());
    setPatients(await patientRes.json());
    const allDoctors = (await doctorRes.json()).filter((u: Doctor) => u.role === "DOCTOR");
    setDoctors(allDoctors);
  }, [filterDate]);

  useEffect(() => {
    if (sessionStatus === "unauthenticated") { router.push("/login"); return; }
    if (sessionStatus === "authenticated") { loadData(); }
  }, [sessionStatus, loadData]);

  async function fetchAvailability(date: string, doctorId: string) {
    if (!date || !doctorId) return;
    const res = await fetch(`/api/appointments/availability?date=${date}&doctorId=${doctorId}`);
    const data = await res.json();
    const allSlots = data.availableSlots.map((t: string) => ({ time: t, available: true }));
    data.bookedTimes.forEach((t: string) => {
      const existing = allSlots.find((s: TimeSlot) => s.time === t);
      if (existing) existing.available = false;
    });
    setAvailableSlots(allSlots);
  }

  async function createAppointment() {
    if (!selectedPatient || !selectedDoctor || !selectedDate || !selectedTime) {
      setMessage("Completa todos los campos requeridos"); return;
    }
    setLoading(true); setMessage("");
    const res = await fetch("/api/appointments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ patientId: selectedPatient, doctorId: selectedDoctor, date: selectedDate, time: selectedTime, reason: reason || undefined, notes: notes || undefined }),
    });
    const data = await res.json();
    if (!res.ok) { setMessage(data.error || "Error al crear la cita"); setLoading(false); return; }
    setMessage("Cita creada exitosamente");
    setShowForm(false);
    setSelectedPatient(""); setSelectedDoctor(""); setSelectedDate(""); setSelectedTime(""); setReason(""); setNotes(""); setAvailableSlots([]);
    loadData(); setLoading(false);
  }

  async function updateStatus(id: string, status: AppointmentStatus) {
    setLoading(true);
    const res = await fetch("/api/appointments", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status }) });
    if (res.ok) { setMessage(`Cita ${statusConfig[status].label.toLowerCase()}`); loadData(); }
    setLoading(false);
  }

  async function cancelAppointment(id: string) {
    setLoading(true);
    const res = await fetch(`/api/appointments?id=${id}`, { method: "DELETE" });
    if (res.ok) { setMessage("Cita cancelada"); loadData(); }
    setLoading(false);
  }

  const filteredAppointments = appointments.filter((a) => filterStatus === "all" || a.status === filterStatus);
  const today = new Date().toISOString().split("T")[0];
  const todayAppointments = appointments.filter((a) => a.date.split("T")[0] === today && a.status !== "CANCELLED");
  const pendingCount = appointments.filter((a) => a.status === "PENDING").length;
  const confirmedCount = appointments.filter((a) => a.status === "CONFIRMED").length;

  if (sessionStatus === "loading") return <div className="min-h-screen bg-slate-50 flex items-center justify-center"><p className="text-slate-400">Cargando...</p></div>;

  return (
    <main className="min-h-screen bg-slate-50">
      <Sidebar activePath="/appointments" userRole={(session?.user.role ?? "ADMIN") as AppRole} userName={session?.user.name} userEmail={session?.user.email} />

      <div className="ml-[240px] p-8">
        <div className="max-w-[1400px] mx-auto space-y-6">

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Gestión de Citas</h1>
              <p className="text-slate-500 text-sm mt-1">Programa, confirma y da seguimiento a las citas médicas</p>
            </div>
            <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 bg-blue-600 text-white rounded-xl px-5 py-2.5 text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm shadow-blue-600/20">
              <span className="material-symbols-outlined text-lg">{showForm ? "close" : "add"}</span>
              {showForm ? "Cancelar" : "Nueva Cita"}
            </button>
          </div>

          {message && <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-emerald-700 text-sm">{message}</div>}

          <div className="grid gap-4 lg:grid-cols-4">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Hoy</p>
              <p className="text-3xl font-bold text-slate-900 mt-2">{todayAppointments.length}</p>
            </div>
            <div className="bg-amber-50 rounded-2xl border border-amber-200 p-5">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Pendientes</p>
              <p className="text-3xl font-bold text-amber-600 mt-2">{pendingCount}</p>
            </div>
            <div className="bg-emerald-50 rounded-2xl border border-emerald-200 p-5">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Confirmadas</p>
              <p className="text-3xl font-bold text-emerald-600 mt-2">{confirmedCount}</p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Total</p>
              <p className="text-3xl font-bold text-slate-900 mt-2">{appointments.length}</p>
            </div>
          </div>

          {showForm && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
              <h2 className="text-lg font-bold text-slate-900">Nueva Cita</h2>

              <div className="grid gap-4 lg:grid-cols-3">
                <div>
                  <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">Paciente *</label>
                  <select value={selectedPatient} onChange={(e) => setSelectedPatient(e.target.value)} className={INPUT}>
                    <option value="">Seleccionar paciente</option>
                    {patients.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">Doctor *</label>
                  <select value={selectedDoctor} onChange={(e) => { setSelectedDoctor(e.target.value); if (selectedDate) fetchAvailability(selectedDate, e.target.value); }} className={INPUT}>
                    <option value="">Seleccionar doctor</option>
                    {doctors.map((d) => <option key={d.id} value={d.id}>{d.name || d.email}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">Fecha *</label>
                  <input type="date" min={today} value={selectedDate} onChange={(e) => { setSelectedDate(e.target.value); if (selectedDoctor) fetchAvailability(e.target.value, selectedDoctor); }} className={INPUT} />
                </div>
              </div>

              {availableSlots.length > 0 && (
                <div>
                  <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Horario disponible</label>
                  <div className="grid gap-2 grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10">
                    {availableSlots.map((slot) => (
                      <button key={slot.time} onClick={() => slot.available && setSelectedTime(slot.time)} disabled={!slot.available}
                        className={`rounded-lg px-3 py-2 text-sm font-medium transition-all ${!slot.available ? "bg-slate-100 text-slate-300 cursor-not-allowed line-through" : selectedTime === slot.time ? "bg-blue-600 text-white" : "border border-slate-300 text-slate-600 hover:border-blue-400 hover:text-blue-600"}`}>
                        {slot.time}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">Motivo</label>
                <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Motivo de la consulta" className={INPUT} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">Notas</label>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notas adicionales" rows={2} className={`${INPUT} resize-none`} />
              </div>

              <button onClick={createAppointment} disabled={loading || !selectedPatient || !selectedDoctor || !selectedDate || !selectedTime}
                className="rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                {loading ? "Creando..." : "Confirmar Cita"}
              </button>
            </div>
          )}

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex gap-2 flex-wrap">
              {["all", "PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"].map((s) => (
                <button key={s} onClick={() => setFilterStatus(s)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${filterStatus === s ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
                  {s === "all" ? "Todas" : statusConfig[s as AppointmentStatus]?.label}
                </button>
              ))}
            </div>
            <input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)}
              className="rounded-xl border border-slate-300 bg-white px-4 py-1.5 text-sm text-slate-700 outline-none focus:border-blue-500 transition-colors" />
          </div>

          <div className="space-y-3">
            {filteredAppointments.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-16 text-center">
                <span className="material-symbols-outlined text-5xl text-slate-300 mb-3 block">event_busy</span>
                <p className="text-slate-500 font-medium">No hay citas que mostrar</p>
              </div>
            ) : (
              filteredAppointments.map((appt) => {
                const st = statusConfig[appt.status];
                const dateStr = new Date(appt.date).toLocaleDateString("es-ES", { weekday: "short", month: "short", day: "numeric" });
                return (
                  <div key={appt.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl ${st.bg} border ${st.border} flex items-center justify-center`}>
                        <span className={`material-symbols-outlined ${st.color}`}>{st.icon}</span>
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">{appt.patient.name}</p>
                        <p className="text-sm text-slate-500">{appt.doctor.name || appt.doctor.email}</p>
                        {appt.reason && <p className="text-xs text-slate-400 mt-0.5">{appt.reason}</p>}
                      </div>
                    </div>

                    <div className="flex items-center gap-4 flex-wrap">
                      <div className="text-right">
                        <p className="text-sm font-medium text-slate-600">{dateStr}</p>
                        <p className="text-xl font-bold text-slate-900">{appt.time}</p>
                      </div>
                      <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${st.bg} ${st.border} ${st.color}`}>{st.label}</span>
                      <div className="flex items-center gap-1">
                        {appt.whatsappReminder24h && <span className="material-symbols-outlined text-xs text-emerald-500" title="Recordatorio 24h enviado">notifications</span>}
                        {appt.whatsappConfirmed && <span className="material-symbols-outlined text-xs text-blue-500" title="Confirmado por WhatsApp">verified</span>}
                      </div>
                      {appt.status === "PENDING" && (
                        <div className="flex gap-1">
                          <button onClick={() => updateStatus(appt.id, "CONFIRMED")} className="rounded-lg p-2 text-emerald-600 hover:bg-emerald-50 transition-colors" title="Confirmar">
                            <span className="material-symbols-outlined text-lg">check</span>
                          </button>
                          <button onClick={() => cancelAppointment(appt.id)} className="rounded-lg p-2 text-red-500 hover:bg-red-50 transition-colors" title="Cancelar">
                            <span className="material-symbols-outlined text-lg">close</span>
                          </button>
                        </div>
                      )}
                      {appt.status === "CONFIRMED" && (
                        <button onClick={() => updateStatus(appt.id, "COMPLETED")} className="rounded-lg px-3 py-1.5 text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors">
                          Completar
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
