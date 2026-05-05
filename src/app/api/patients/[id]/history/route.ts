import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: patientId } = await params;

    const [patient, visits, prescriptions, appointments, followUps, triageReports] = await Promise.all([
      prisma.patient.findUnique({ where: { id: patientId } }),
      prisma.clinicalVisit.findMany({
        where: { patientId },
        include: { doctor: { select: { name: true, email: true } } },
        orderBy: { visitDate: "desc" },
      }),
      prisma.prescription.findMany({
        where: { patientId },
        include: { doctor: { select: { name: true, email: true } } },
        orderBy: { createdAt: "desc" },
      }),
      prisma.appointment.findMany({
        where: { patientId },
        include: { doctor: { select: { name: true, email: true } } },
        orderBy: { date: "desc" },
        take: 10,
      }),
      prisma.patientFollowUp.findMany({
        where: { patientId },
        include: { prescription: true },
        orderBy: { createdAt: "desc" },
      }),
      prisma.triageReport.findMany({
        where: { patientId },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    if (!patient) {
      return NextResponse.json({ error: "Paciente no encontrado" }, { status: 404 });
    }

    const totalVisits = visits.length;
    const lastVisit = visits[0]?.visitDate || null;
    const lastDiagnosis = visits[0]?.diagnosis || null;
    const activeFollowUps = followUps.filter((f) => f.status === "ACTIVE").length;

    return NextResponse.json({
      patient,
      visits,
      prescriptions,
      appointments,
      followUps,
      triageReports,
      summary: { totalVisits, lastVisit, lastDiagnosis, activeFollowUps },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
