'use client';

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";

type AppointmentStatus = "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED" | "NO_SHOW";

interface Appointment {
  id: string;
  date: string;
  time: string;
  status: AppointmentStatus;
  reason?: string | null;
  notes?: string | null;
  whatsappReminder24h: boolean;
  whatsappReminder1h: boolean;
  whatsappConfirmed: boolean;
  patient: { id: string; name: string; whatsappPhone?: string | null };
  doctor: { id: string; name?: string | null; email: string };
}

interface Patient {
  id: string;
  name: string;
  whatsappPhone?: string | null;
}

interface Doctor {
  id: string;
  name?: string | null;
  email: string;
  role: string;
}

interface TimeSlot {
  time: string;
  available: boolean;
}

const statusLabels: Record<AppointmentStatus, { label: string; color: string; bg: string }> = {
  PENDING: { label: "Pendiente", color: "text-amber-400", bg: "bg-amber-400/10" },
  CONFIRMED: { label: "Confirmada", color: "text-[#00F5A0]", bg: "bg-[#00F5A0]/10" },
  COMPLETED: { label: "Completada", color: "text-blue-400", bg: "bg-blue-400/10" },
  CANCELLED: { label: "Cancelada", color: "text-red-400", bg: "bg-red-400/10" },
  NO_SHOW: { label: "No asistió", color: "text-slate-500", bg: "bg-slate-500/10" },
};

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
    if (sessionStatus === "unauthenticated") {
      router.push("/login");
      return;
    }
    if (sessionStatus === "authenticated") {
      loadData();
    }
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
      setMessage("Completa todos los campos requeridos");
      return;
    }

    setLoading(true);
    setMessage("");

    const res = await fetch("/api/appointments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        patientId: selectedPatient,
        doctorId: selectedDoctor,
        date: selectedDate,
        time: selectedTime,
        reason: reason || undefined,
        notes: notes || undefined,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      setMessage(data.error || "Error al crear la cita");
      setLoading(false);
      return;
    }

    setMessage("✅ Cita creada exitosamente");
    setShowForm(false);
    setSelectedPatient("");
    setSelectedDoctor("");
    setSelectedDate("");
    setSelectedTime("");
    setReason("");
    setNotes("");
    setAvailableSlots([]);
    loadData();
    setLoading(false);
  }

  async function updateStatus(id: string, status: AppointmentStatus) {
    setLoading(true);
    const res = await fetch("/api/appointments", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });

    if (res.ok) {
      setMessage(`Cita ${statusLabels[status].label.toLowerCase()}`);
      loadData();
    }
    setLoading(false);
  }

  async function cancelAppointment(id: string) {
    setLoading(true);
    const res = await fetch(`/api/appointments?id=${id}`, { method: "DELETE" });
    if (res.ok) {
      setMessage("Cita cancelada");
      loadData();
    }
    setLoading(false);
  }

  const filteredAppointments = appointments.filter((a) => {
    if (filterStatus === "all") return true;
    return a.status === filterStatus;
  });

  const today = new Date().toISOString().split("T")[0];
  const todayAppointments = appointments.filter((a) => a.date.split("T")[0] === today && a.status !== "CANCELLED");
  const pendingCount = appointments.filter((a) => a.status === "PENDING").length;
  const confirmedCount = appointments.filter((a) => a.status === "CONFIRMED").length;

  if (sessionStatus === "loading") {
    return (
      <div className="min-h-screen bg-[#0A0C10] flex items-center justify-center">
        <p className="text-slate-400">Cargando...</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#0A0C10] text-slate-200">
      <Sidebar activePath="/appointments" userRole={session?.user.role as "ADMIN" | "DOCTOR" | "PHARMACIST"} userName={session?.user.name} userEmail={session?.user.email} />

      <div className="ml-[240px] p-8">
        <div className="max-w-[1400px] mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-100">Gestión de Citas</h1>
              <p className="text-slate-500 mt-1">Programa, confirma y da seguimiento a las citas médicas</p>
            </div>
            <button
              onClick={() => setShowForm(!showForm)}
              className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#00F5A0] to-[#00D9FF] px-5 py-2.5 text-sm font-bold text-[#0A0C10] shadow-[0_20px_45px_-20px_rgba(0,245,160,0.7)] hover:opacity-90 transition-all"
            >
              <span className="material-symbols-outlined text-lg">{showForm ? "close" : "add"}</span>
              {showForm ? "Cancelar" : "Nueva Cita"}
            </button>
          </div>

          {message && (
            <div className="rounded-2xl border border-[#00F5A0]/30 bg-[#00F5A0]/10 p-4 text-[#00F5A0] text-sm">
              {message}
            </div>
          )}

          <div className="grid gap-4 lg:grid-cols-4">
            <div className="rounded-2xl border border-[#30363D] bg-[#161B22] p-5">
              <p className="text-xs uppercase tracking-widest text-slate-500">Hoy</p>
              <p className="text-3xl font-bold text-slate-100 mt-2">{todayAppointments.length}</p>
              <p className="text-sm text-slate-500 mt-1">Citas programadas</p>
            </div>
            <div className="rounded-2xl border border-[#30363D] bg-[#161B22] p-5">
              <p className="text-xs uppercase tracking-widest text-slate-500">Pendientes</p>
              <p className="text-3xl font-bold text-amber-400 mt-2">{pendingCount}</p>
              <p className="text-sm text-slate-500 mt-1">Esperando confirmación</p>
            </div>
            <div className="rounded-2xl border border-[#30363D] bg-[#161B22] p-5">
              <p className="text-xs uppercase tracking-widest text-slate-500">Confirmadas</p>
              <p className="text-3xl font-bold text-[#00F5A0] mt-2">{confirmedCount}</p>
              <p className="text-sm text-slate-500 mt-1">Listas para atender</p>
            </div>
            <div className="rounded-2xl border border-[#30363D] bg-[#161B22] p-5">
              <p className="text-xs uppercase tracking-widest text-slate-500">Total</p>
              <p className="text-3xl font-bold text-slate-100 mt-2">{appointments.length}</p>
              <p className="text-sm text-slate-500 mt-1">Todas las citas</p>
            </div>
          </div>

          {showForm && (
            <div className="rounded-2xl border border-[#30363D] bg-[#161B22] p-6 space-y-5">
              <h2 className="text-xl font-semibold text-slate-100">Nueva Cita</h2>

              <div className="grid gap-4 lg:grid-cols-3">
                <div>
                  <label className="block text-sm text-slate-400 mb-2">Paciente *</label>
                  <select
                    value={selectedPatient}
                    onChange={(e) => setSelectedPatient(e.target.value)}
                    className="w-full rounded-xl border border-[#30363D] bg-[#0A0C10] px-4 py-2.5 text-slate-200 outline-none focus:border-[#00F5A0]"
                  >
                    <option value="">Seleccionar paciente</option>
                    {patients.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-slate-400 mb-2">Doctor *</label>
                  <select
                    value={selectedDoctor}
                    onChange={(e) => {
                      setSelectedDoctor(e.target.value);
                      if (selectedDate) fetchAvailability(selectedDate, e.target.value);
                    }}
                    className="w-full rounded-xl border border-[#30363D] bg-[#0A0C10] px-4 py-2.5 text-slate-200 outline-none focus:border-[#00F5A0]"
                  >
                    <option value="">Seleccionar doctor</option>
                    {doctors.map((d) => (
                      <option key={d.id} value={d.id}>{d.name || d.email}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-slate-400 mb-2">Fecha *</label>
                  <input
                    type="date"
                    min={today}
                    value={selectedDate}
                    onChange={(e) => {
                      setSelectedDate(e.target.value);
                      if (selectedDoctor) fetchAvailability(e.target.value, selectedDoctor);
                    }}
                    className="w-full rounded-xl border border-[#30363D] bg-[#0A0C10] px-4 py-2.5 text-slate-200 outline-none focus:border-[#00F5A0]"
                  />
                </div>
              </div>

              {availableSlots.length > 0 && (
                <div>
                  <label className="block text-sm text-slate-400 mb-2">Horario disponible</label>
                  <div className="grid gap-2 grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10">
                    {availableSlots.map((slot) => (
                      <button
                        key={slot.time}
                        onClick={() => slot.available && setSelectedTime(slot.time)}
                        disabled={!slot.available}
                        className={`rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                          !slot.available
                            ? "bg-[#0A0C10] text-slate-700 cursor-not-allowed line-through"
                            : selectedTime === slot.time
                              ? "bg-[#00F5A0] text-[#0A0C10]"
                              : "border border-[#30363D] text-slate-300 hover:border-[#00F5A0] hover:text-[#00F5A0]"
                        }`}
                      >
                        {slot.time}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm text-slate-400 mb-2">Motivo</label>
                <input
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Motivo de la consulta"
                  className="w-full rounded-xl border border-[#30363D] bg-[#0A0C10] px-4 py-2.5 text-slate-200 outline-none focus:border-[#00F5A0]"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-2">Notas</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Notas adicionales"
                  rows={2}
                  className="w-full rounded-xl border border-[#30363D] bg-[#0A0C10] px-4 py-2.5 text-slate-200 outline-none focus:border-[#00F5A0]"
                />
              </div>

              <button
                onClick={createAppointment}
                disabled={loading || !selectedPatient || !selectedDoctor || !selectedDate || !selectedTime}
                className="rounded-2xl bg-[#00F5A0] px-6 py-2.5 text-sm font-semibold text-[#0A0C10] hover:bg-[#00e293] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Creando..." : "Confirmar Cita"}
              </button>
            </div>
          )}

          <div className="flex items-center gap-4">
            <div className="flex gap-2">
              {["all", "PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"].map((s) => (
                <button
                  key={s}
                  onClick={() => setFilterStatus(s)}
                  className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
                    filterStatus === s
                      ? "bg-[#00F5A0] text-[#0A0C10]"
                      : "border border-[#30363D] text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {s === "all" ? "Todas" : statusLabels[s as AppointmentStatus]?.label}
                </button>
              ))}
            </div>

            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="rounded-xl border border-[#30363D] bg-[#161B22] px-4 py-1.5 text-sm text-slate-200 outline-none focus:border-[#00F5A0]"
            />
          </div>

          <div className="space-y-3">
            {filteredAppointments.length === 0 ? (
              <div className="rounded-2xl border border-[#30363D] bg-[#161B22] p-12 text-center">
                <span className="material-symbols-outlined text-5xl text-slate-600 mb-4">event_busy</span>
                <p className="text-slate-400">No hay citas que mostrar</p>
              </div>
            ) : (
              filteredAppointments.map((appointment) => {
                const status = statusLabels[appointment.status];
                const dateObj = new Date(appointment.date);
                const dateStr = dateObj.toLocaleDateString("es-ES", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                });

                return (
                  <div
                    key={appointment.id}
                    className="rounded-2xl border border-[#30363D] bg-[#161B22] p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:border-[#30363D]/80 transition-colors"
                  >
                    <div className="flex items-center gap-5">
                      <div className={`w-12 h-12 rounded-xl ${status.bg} flex items-center justify-center`}>
                        <span className={`material-symbols-outlined ${status.color}`}>
                          {appointment.status === "CONFIRMED" ? "check_circle" :
                           appointment.status === "CANCELLED" ? "cancel" :
                           appointment.status === "COMPLETED" ? "event_available" :
                           "schedule"}
                        </span>
                      </div>
                      <div>
                        <p className="font-semibold text-slate-100">{appointment.patient.name}</p>
                        <p className="text-sm text-slate-500">
                          {appointment.doctor.name || appointment.doctor.email}
                        </p>
                        {appointment.reason && (
                          <p className="text-xs text-slate-600 mt-1">{appointment.reason}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-sm font-medium text-slate-300">{dateStr}</p>
                        <p className="text-lg font-bold text-slate-100">{appointment.time}</p>
                      </div>

                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${status.bg} ${status.color}`}>
                        {status.label}
                      </span>

                      <div className="flex items-center gap-1">
                        {appointment.whatsappReminder24h && (
                          <span className="material-symbols-outlined text-xs text-[#00F5A0]" title="Recordatorio 24h enviado">notifications</span>
                        )}
                        {appointment.whatsappConfirmed && (
                          <span className="material-symbols-outlined text-xs text-[#00D9FF]" title="Confirmado por WhatsApp">verified</span>
                        )}
                      </div>

                      {appointment.status === "PENDING" && (
                        <div className="flex gap-1">
                          <button
                            onClick={() => updateStatus(appointment.id, "CONFIRMED")}
                            className="rounded-lg p-2 text-[#00F5A0] hover:bg-[#00F5A0]/10 transition-colors"
                            title="Confirmar"
                          >
                            <span className="material-symbols-outlined text-lg">check</span>
                          </button>
                          <button
                            onClick={() => cancelAppointment(appointment.id)}
                            className="rounded-lg p-2 text-red-400 hover:bg-red-400/10 transition-colors"
                            title="Cancelar"
                          >
                            <span className="material-symbols-outlined text-lg">close</span>
                          </button>
                        </div>
                      )}

                      {appointment.status === "CONFIRMED" && (
                        <button
                          onClick={() => updateStatus(appointment.id, "COMPLETED")}
                          className="rounded-lg px-3 py-1.5 text-xs font-medium bg-[#00F5A0]/10 text-[#00F5A0] hover:bg-[#00F5A0]/20 transition-colors"
                        >
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
