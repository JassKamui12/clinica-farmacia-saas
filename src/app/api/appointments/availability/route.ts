import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const doctorId = searchParams.get("doctorId");
  const date = searchParams.get("date");

  if (!doctorId || !date) {
    return NextResponse.json(
      { error: "doctorId y date son requeridos" },
      { status: 400 }
    );
  }

  const appointmentDate = new Date(date);
  if (isNaN(appointmentDate.getTime())) {
    return NextResponse.json({ error: "Fecha inválida" }, { status: 400 });
  }

  const bookedAppointments = await prisma.appointment.findMany({
    where: {
      doctorId,
      date: appointmentDate,
      status: { not: "CANCELLED" },
    },
    select: { time: true },
  });

  const bookedTimes = new Set(bookedAppointments.map((a) => a.time));

  const availableSlots: string[] = [];
  for (let hour = 8; hour <= 17; hour++) {
    for (const minute of ["00", "30"]) {
      const time = `${hour.toString().padStart(2, "0")}:${minute}`;
      if (!bookedTimes.has(time)) {
        availableSlots.push(time);
      }
    }
  }

  return NextResponse.json({
    doctorId,
    date,
    availableSlots,
    bookedTimes: Array.from(bookedTimes),
  });
}
