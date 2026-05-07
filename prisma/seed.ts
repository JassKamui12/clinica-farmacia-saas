import { PrismaClient } from "../src/generated/prisma/client";
import { hash } from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("🗑️  Limpiando base de datos...");
  await prisma.$transaction([
    prisma.whatsAppSession.deleteMany(),
    prisma.patientFollowUp.deleteMany(),
    prisma.whatsAppMessage.deleteMany(),
    prisma.appointment.deleteMany(),
    prisma.notification.deleteMany(),
    prisma.aiRecommendation.deleteMany(),
    prisma.prescription.deleteMany(),
    prisma.clinicalVisit.deleteMany(),
    prisma.pharmacyProduct.deleteMany(),
    prisma.patient.deleteMany(),
    prisma.session.deleteMany(),
    prisma.account.deleteMany(),
    prisma.user.deleteMany(),
  ]);

  console.log("👤 Creando usuarios...");
  const adminHash = await hash("admin123", 12);
  const doctorHash = await hash("doctor123", 12);
  const pharmHash = await hash("pharm123", 12);

  const admin = await prisma.user.create({
    data: {
      id: "admin-001",
      email: "admin@clinica.com",
      passwordHash: adminHash,
      name: "Admin Principal",
      role: "ADMIN",
      whatsappPhone: "+50688888888",
      updatedAt: new Date(),
    },
  });

  const doctor1 = await prisma.user.create({
    data: {
      id: "doctor-001",
      email: "doctor@clinica.com",
      passwordHash: doctorHash,
      name: "Dra. María González",
      role: "DOCTOR",
      whatsappPhone: "+50688888889",
      updatedAt: new Date(),
    },
  });

  const doctor2 = await prisma.user.create({
    data: {
      id: "doctor-002",
      email: "doctor2@clinica.com",
      passwordHash: doctorHash,
      name: "Dr. Carlos Ramírez",
      role: "DOCTOR",
      whatsappPhone: "+50688888890",
      updatedAt: new Date(),
    },
  });

  const pharmacist = await prisma.user.create({
    data: {
      id: "pharmacist-001",
      email: "farmacia@clinica.com",
      passwordHash: pharmHash,
      name: "Lic. Ana Mora",
      role: "PHARMACIST",
      whatsappPhone: "+50688888891",
      updatedAt: new Date(),
    },
  });

  console.log("👥 Creando pacientes...");
  const patient1 = await prisma.patient.create({
    data: {
      id: "patient-001",
      name: "Juan Pérez",
      phone: "+50687654321",
      whatsappPhone: "+50687654321",
      email: "juan@email.com",
      dateOfBirth: new Date("1985-03-15"),
      gender: "Masculino",
      updatedAt: new Date(),
    },
  });

  const patient2 = await prisma.patient.create({
    data: {
      id: "patient-002",
      name: "María López",
      phone: "+50687654322",
      whatsappPhone: "+50687654322",
      email: "maria@email.com",
      dateOfBirth: new Date("1990-07-22"),
      gender: "Femenino",
      updatedAt: new Date(),
    },
  });

  const patient3 = await prisma.patient.create({
    data: {
      id: "patient-003",
      name: "Pedro Sánchez",
      phone: "+50687654323",
      whatsappPhone: "+50687654323",
      email: "pedro@email.com",
      dateOfBirth: new Date("1978-11-08"),
      gender: "Masculino",
      updatedAt: new Date(),
    },
  });

  const patient4 = await prisma.patient.create({
    data: {
      id: "patient-004",
      name: "Sofía Herrera",
      phone: "+50687654324",
      whatsappPhone: "+50687654324",
      email: "sofia@email.com",
      dateOfBirth: new Date("1995-01-30"),
      gender: "Femenino",
      updatedAt: new Date(),
    },
  });

  console.log("💊 Creando productos de farmacia...");
  const products = await Promise.all([
    prisma.pharmacyProduct.create({
      data: {
        name: "Paracetamol 500mg",
        category: "Analgésico",
        indications: "Dolor leve a moderado, fiebre",
        contraindications: "Insuficiencia hepática severa",
        price: 3.50,
        stock: 150,
        isAvailable: true,
      },
    }),
    prisma.pharmacyProduct.create({
      data: {
        name: "Ibuprofeno 400mg",
        category: "Antiinflamatorio",
        indications: "Dolor, inflamación, fiebre",
        contraindications: "Úlcera gástrica activa, embarazo 3er trimestre",
        price: 5.00,
        stock: 120,
        isAvailable: true,
      },
    }),
    prisma.pharmacyProduct.create({
      data: {
        name: "Amoxicilina 500mg",
        category: "Antibiótico",
        indications: "Infecciones bacterianas",
        contraindications: "Alergia a penicilinas",
        price: 8.50,
        stock: 80,
        isAvailable: true,
      },
    }),
    prisma.pharmacyProduct.create({
      data: {
        name: "Omeprazol 20mg",
        category: "Gastrointestinal",
        indications: "Reflujo gastroesofágico, gastritis",
        contraindications: "Hipersensibilidad al omeprazol",
        price: 6.00,
        stock: 90,
        isAvailable: true,
      },
    }),
    prisma.pharmacyProduct.create({
      data: {
        name: "Loratadina 10mg",
        category: "Antihistamínico",
        indications: "Alergias, rinitis, urticaria",
        contraindications: "Hipersensibilidad",
        price: 4.00,
        stock: 5,
        isAvailable: true,
      },
    }),
    prisma.pharmacyProduct.create({
      data: {
        name: "Metformina 850mg",
        category: "Antidiabético",
        indications: "Diabetes tipo 2",
        contraindications: "Insuficiencia renal severa",
        price: 7.00,
        stock: 60,
        isAvailable: true,
      },
    }),
    prisma.pharmacyProduct.create({
      data: {
        name: "Losartán 50mg",
        category: "Antihipertensivo",
        indications: "Hipertensión arterial",
        contraindications: "Embarazo, estenosis arterial renal bilateral",
        price: 9.00,
        stock: 0,
        isAvailable: false,
      },
    }),
  ]);

  console.log("📋 Creando consultas médicas...");
  const visit1 = await prisma.clinicalVisit.create({
    data: {
      patientId: patient1.id,
      doctorId: doctor1.id,
      visitDate: new Date("2025-04-20"),
      symptoms: "Dolor de cabeza frecuente, fiebre baja",
      diagnosis: "Migraña tensional",
      treatment: "Paracetamol 500mg cada 8 horas por 5 días",
      notes: "Recomendar descanso y reducción de estrés",
    },
  });

  const visit2 = await prisma.clinicalVisit.create({
    data: {
      patientId: patient2.id,
      doctorId: doctor2.id,
      visitDate: new Date("2025-04-22"),
      symptoms: "Dolor abdominal, náuseas",
      diagnosis: "Gastritis aguda",
      treatment: "Omeprazol 20mg en ayunas por 14 días",
      notes: "Dieta blanda, evitar irritantes gástricos",
    },
  });

  console.log("💊 Creando recetas...");
  const rx1 = await prisma.prescription.create({
    data: {
      patientId: patient1.id,
      doctorId: doctor1.id,
      productName: "Paracetamol 500mg",
      dosage: "500mg cada 8 horas",
      instructions: "Tomar con agua, no exceder 3g diarios",
      notes: "5 días de tratamiento",
      whatsappSent: false,
    },
  });

  const rx2 = await prisma.prescription.create({
    data: {
      patientId: patient2.id,
      doctorId: doctor2.id,
      productName: "Omeprazol 20mg",
      dosage: "20mg una vez al día",
      instructions: "Tomar en ayunas 30 min antes del desayuno",
      notes: "14 días de tratamiento",
      whatsappSent: false,
    },
  });

  console.log("📅 Creando citas...");
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);

  await prisma.appointment.create({
    data: {
      patientId: patient3.id,
      doctorId: doctor1.id,
      date: tomorrow,
      time: "09:00",
      status: "CONFIRMED",
      reason: "Control de presión arterial",
      whatsappReminder24h: false,
      whatsappReminder1h: false,
      whatsappConfirmed: true,
    },
  });

  await prisma.appointment.create({
    data: {
      patientId: patient4.id,
      doctorId: doctor2.id,
      date: nextWeek,
      time: "14:30",
      status: "PENDING",
      reason: "Consulta general",
      whatsappReminder24h: false,
      whatsappReminder1h: false,
      whatsappConfirmed: false,
    },
  });

  await prisma.appointment.create({
    data: {
      patientId: patient1.id,
      doctorId: doctor1.id,
      date: nextWeek,
      time: "10:00",
      status: "PENDING",
      reason: "Seguimiento migraña",
      whatsappReminder24h: false,
      whatsappReminder1h: false,
      whatsappConfirmed: false,
    },
  });

  console.log("📱 Creando seguimientos...");
  await prisma.patientFollowUp.create({
    data: {
      patientId: patient1.id,
      prescriptionId: rx1.id,
      startDate: new Date(),
      nextCheckIn: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      status: "ACTIVE",
      adherenceScore: 100,
      notes: "Seguimiento post-consulta migraña",
    },
  });

  await prisma.patientFollowUp.create({
    data: {
      patientId: patient2.id,
      prescriptionId: rx2.id,
      startDate: new Date(),
      nextCheckIn: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      status: "ACTIVE",
      adherenceScore: 100,
      notes: "Seguimiento gastritis",
    },
  });

  console.log("🔔 Creando notificaciones...");
  await prisma.notification.create({
    data: {
      title: "Stock bajo: Loratadina",
      content: "Solo quedan 5 unidades de Loratadina 10mg",
      channel: "in_app",
      role: "PHARMACIST",
      read: false,
    },
  });

  await prisma.notification.create({
    data: {
      title: "Cita confirmada",
      content: "Juan Pérez confirmó su cita para mañana a las 09:00",
      channel: "in_app",
      role: "DOCTOR",
      userId: doctor1.id,
      read: false,
    },
  });

  await prisma.notification.create({
    data: {
      title: "Producto agotado",
      content: "Losartán 50mg se encuentra sin stock",
      channel: "in_app",
      role: "PHARMACIST",
      read: false,
    },
  });

  console.log("✅ Seed completado exitosamente!");
  console.log("");
  console.log("📋 Credenciales de prueba:");
  console.log("   Admin:    admin@clinica.com / admin123");
  console.log("   Doctor:   doctor@clinica.com / doctor123");
  console.log("   Doctor 2: doctor2@clinica.com / doctor123");
  console.log("   Farmacia: farmacia@clinica.com / pharm123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
