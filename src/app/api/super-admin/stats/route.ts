import { NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    await requireSuperAdmin();

    const [totalClinics, activeClinics, trialClinics, totalPatients, totalAppointments] =
      await Promise.all([
        prisma.clinic.count(),
        prisma.clinic.count({ where: { isActive: true } }),
        prisma.clinic.count({ where: { plan: "trial" } }),
        prisma.patient.count(),
        prisma.appointment.count(),
      ]);

    const clinicsByRubro = await prisma.clinic.groupBy({
      by: ["rubroId"],
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
    });

    return NextResponse.json({
      totalClinics,
      activeClinics,
      trialClinics,
      totalPatients,
      totalAppointments,
      clinicsByRubro: clinicsByRubro.map((r) => ({ rubroId: r.rubroId, count: r._count.id })),
    });
  } catch (e: unknown) {
    const status = (e as { status?: number }).status ?? 500;
    return NextResponse.json({ error: (e as Error).message }, { status });
  }
}
