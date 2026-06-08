import { PrismaClient } from "../src/generated/prisma/client";
import { hash } from "bcrypt";

const prisma = new PrismaClient();

const RUBROS = [
  {
    rubroId: "clinica-general",
    nombre: "Clínica General",
    descripcion: "Medicina general y consulta externa",
    promptTemplate: "Eres el asistente de una clínica de medicina general. Ayudas a agendar citas y resuelves dudas básicas de salud. Siempre recomienda consultar al médico para diagnósticos.",
  },
  {
    rubroId: "odontologia",
    nombre: "Odontología",
    descripcion: "Clínica dental y odontología general y especializada",
    promptTemplate: "Eres el asistente de una clínica dental. Ayudas a agendar citas para limpiezas, extracciones, ortodoncia y emergencias dentales.",
  },
  {
    rubroId: "farmacia",
    nombre: "Farmacia",
    descripcion: "Farmacia con venta de medicamentos y dispensación de recetas",
    promptTemplate: "Eres el asistente de una farmacia. Ayudas a verificar disponibilidad de medicamentos, precios y a procesar pedidos. Para medicamentos controlados se requiere receta médica.",
  },
  {
    rubroId: "pediatria",
    nombre: "Pediatría",
    descripcion: "Consulta médica especializada en niños y adolescentes",
    promptTemplate: "Eres el asistente de un consultorio pediátrico. Ayudas a agendar citas para revisiones, vacunas y consultas de niños y adolescentes.",
  },
  {
    rubroId: "psicologia",
    nombre: "Psicología",
    descripcion: "Consulta psicológica y salud mental",
    promptTemplate: "Eres el asistente de un consultorio de psicología. Ayudas a agendar sesiones y brindas información sobre los servicios. Mantén la confidencialidad y empatía.",
  },
  {
    rubroId: "fisioterapia",
    nombre: "Fisioterapia",
    descripcion: "Fisioterapia y rehabilitación física",
    promptTemplate: "Eres el asistente de un centro de fisioterapia. Ayudas a agendar sesiones de rehabilitación, masajes terapéuticos y tratamientos físicos.",
  },
  {
    rubroId: "nutricion",
    nombre: "Nutricionista",
    descripcion: "Consulta nutricional y planes alimentarios",
    promptTemplate: "Eres el asistente de un consultorio nutricional. Ayudas a agendar consultas para planes alimentarios, control de peso y orientación nutricional.",
  },
  {
    rubroId: "laboratorio",
    nombre: "Laboratorio Clínico",
    descripcion: "Laboratorio de análisis clínicos y toma de muestras",
    promptTemplate: "Eres el asistente de un laboratorio clínico. Ayudas a agendar citas para toma de muestras, explicas preparación para exámenes y tiempo de resultados.",
  },
  {
    rubroId: "veterinaria",
    nombre: "Veterinaria",
    descripcion: "Clínica veterinaria para mascotas",
    promptTemplate: "Eres el asistente de una clínica veterinaria. Ayudas a agendar consultas, vacunaciones y servicios para mascotas. Pregunta siempre por el nombre y especie del paciente.",
  },
  {
    rubroId: "optometria",
    nombre: "Optometría",
    descripcion: "Consulta visual y optometría",
    promptTemplate: "Eres el asistente de un consultorio de optometría. Ayudas a agendar exámenes visuales, adaptar lentes y resolver dudas sobre salud visual.",
  },
];

async function main() {
  console.log("Limpiando base de datos...");
  await prisma.$transaction([
    prisma.auditLog.deleteMany(),
    prisma.notification.deleteMany(),
    prisma.whatsAppMessage.deleteMany(),
    prisma.whatsAppSession.deleteMany(),
    prisma.pharmacySaleItem.deleteMany(),
    prisma.pharmacySale.deleteMany(),
    prisma.patientFollowUp.deleteMany(),
    prisma.prescription.deleteMany(),
    prisma.clinicalVisit.deleteMany(),
    prisma.appointment.deleteMany(),
    prisma.workingHours.deleteMany(),
    prisma.pharmacyProduct.deleteMany(),
    prisma.patient.deleteMany(),
    prisma.user.deleteMany(),
    prisma.clinic.deleteMany(),
    prisma.rubroConfig.deleteMany(),
  ]);

  // ── 1. Rubros ────────────────────────────────────────────────────────────────
  console.log("Creando rubros...");
  for (const rubro of RUBROS) {
    await prisma.rubroConfig.create({ data: rubro });
  }

  // ── 2. Super-admin ───────────────────────────────────────────────────────────
  console.log("Creando super-admin...");
  const superAdminHash = await hash("superadmin123", 12);
  await prisma.user.create({
    data: {
      email: "superadmin@clinicasaas.com",
      passwordHash: superAdminHash,
      name: "Super Admin",
      role: "ADMIN",
      isSuperAdmin: true,
    },
  });

  // ── 3. Clínica demo (clinica-general) ────────────────────────────────────────
  console.log("Creando clínica demo...");
  const trialEndsAt = new Date();
  trialEndsAt.setDate(trialEndsAt.getDate() + 14);

  const clinic = await prisma.clinic.create({
    data: {
      name: "Clínica San José",
      rubroId: "clinica-general",
      slug: "san-jose",
      city: "Tegucigalpa",
      plan: "trial",
      trialEndsAt,
      aiName: "Asistente Médico",
    },
  });

  // ── 4. Clínica demo (farmacia) ───────────────────────────────────────────────
  console.log("Creando farmacia demo...");
  const farmacia = await prisma.clinic.create({
    data: {
      name: "Farmacia La Salud",
      rubroId: "farmacia",
      slug: "la-salud",
      city: "San Pedro Sula",
      plan: "basico",
      aiName: "Asistente de Farmacia",
    },
  });

  // ── 5. Usuarios de la clínica ────────────────────────────────────────────────
  console.log("Creando usuarios...");
  const adminHash = await hash("admin123", 12);
  const doctorHash = await hash("doctor123", 12);
  const pharmHash = await hash("pharm123", 12);

  const admin = await prisma.user.create({
    data: {
      clinicId: clinic.id,
      email: "admin@sanjose.com",
      passwordHash: adminHash,
      name: "Administrador Clínica",
      role: "ADMIN",
    },
  });

  const doctor1 = await prisma.user.create({
    data: {
      clinicId: clinic.id,
      email: "dra.maria@sanjose.com",
      passwordHash: doctorHash,
      name: "Dra. María González",
      role: "DOCTOR",
      specialty: "Medicina General",
      licenseNumber: "CMH-12345",
    },
  });

  const doctor2 = await prisma.user.create({
    data: {
      clinicId: clinic.id,
      email: "dr.carlos@sanjose.com",
      passwordHash: doctorHash,
      name: "Dr. Carlos Ramírez",
      role: "DOCTOR",
      specialty: "Medicina Interna",
      licenseNumber: "CMH-67890",
    },
  });

  const recepcionista = await prisma.user.create({
    data: {
      clinicId: clinic.id,
      email: "recepcion@sanjose.com",
      passwordHash: adminHash,
      name: "Ana Recepcionista",
      role: "RECEPTIONIST",
    },
  });

  const farmaciaAdmin = await prisma.user.create({
    data: {
      clinicId: farmacia.id,
      email: "admin@lasalud.com",
      passwordHash: pharmHash,
      name: "Farmacéutica Principal",
      role: "PHARMACIST",
    },
  });

  // ── 6. Horarios de trabajo ───────────────────────────────────────────────────
  console.log("Creando horarios...");
  const workDays = [1, 2, 3, 4, 5]; // Lunes a Viernes
  for (const day of workDays) {
    await prisma.workingHours.createMany({
      data: [
        { clinicId: clinic.id, userId: doctor1.id, dayOfWeek: day, startTime: "08:00", endTime: "12:00" },
        { clinicId: clinic.id, userId: doctor1.id, dayOfWeek: day, startTime: "14:00", endTime: "17:00" },
        { clinicId: clinic.id, userId: doctor2.id, dayOfWeek: day, startTime: "09:00", endTime: "13:00" },
        { clinicId: clinic.id, userId: doctor2.id, dayOfWeek: day, startTime: "15:00", endTime: "18:00" },
      ],
    });
  }

  // ── 7. Pacientes ─────────────────────────────────────────────────────────────
  console.log("Creando pacientes...");
  const patient1 = await prisma.patient.create({
    data: {
      clinicId: clinic.id,
      name: "Juan Pérez",
      phone: "+50487654321",
      whatsappPhone: "50487654321@s.whatsapp.net",
      realPhone: "+504 8765-4321",
      email: "juan.perez@email.com",
      dateOfBirth: new Date("1985-03-15"),
      gender: "Masculino",
      bloodType: "O+",
      allergies: "Penicilina",
    },
  });

  const patient2 = await prisma.patient.create({
    data: {
      clinicId: clinic.id,
      name: "María López",
      phone: "+50487654322",
      whatsappPhone: "50487654322@s.whatsapp.net",
      realPhone: "+504 8765-4322",
      email: "maria.lopez@email.com",
      dateOfBirth: new Date("1990-07-22"),
      gender: "Femenino",
      bloodType: "A+",
    },
  });

  const patient3 = await prisma.patient.create({
    data: {
      clinicId: clinic.id,
      name: "Pedro Sánchez",
      phone: "+50487654323",
      whatsappPhone: "50487654323@s.whatsapp.net",
      realPhone: "+504 8765-4323",
      gender: "Masculino",
      dateOfBirth: new Date("1978-11-08"),
    },
  });

  const patient4 = await prisma.patient.create({
    data: {
      clinicId: clinic.id,
      name: "Sofía Herrera",
      phone: "+50487654324",
      realPhone: "+504 8765-4324",
      gender: "Femenino",
      dateOfBirth: new Date("1995-01-30"),
    },
  });

  // ── 8. Expedientes clínicos ───────────────────────────────────────────────────
  console.log("Creando expedientes...");
  const visit1 = await prisma.clinicalVisit.create({
    data: {
      clinicId: clinic.id,
      patientId: patient1.id,
      doctorId: doctor1.id,
      visitDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      symptoms: "Dolor de cabeza frecuente, fiebre baja 37.8°C",
      diagnosis: "Migraña tensional",
      treatment: "Paracetamol 500mg cada 8 horas por 5 días. Reposo.",
      notes: "Recomendar reducción de estrés. Control en 2 semanas.",
    },
  });

  const visit2 = await prisma.clinicalVisit.create({
    data: {
      clinicId: clinic.id,
      patientId: patient2.id,
      doctorId: doctor2.id,
      visitDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      symptoms: "Dolor abdominal epigástrico, náuseas, acidez",
      diagnosis: "Gastritis aguda",
      treatment: "Omeprazol 20mg en ayunas por 14 días. Dieta blanda.",
      notes: "Evitar irritantes gástricos. Evitar AINEs.",
    },
  });

  // ── 9. Recetas ────────────────────────────────────────────────────────────────
  console.log("Creando recetas...");
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);

  await prisma.prescription.create({
    data: {
      clinicId: clinic.id,
      patientId: patient1.id,
      doctorId: doctor1.id,
      visitId: visit1.id,
      medications: [
        { nombre: "Paracetamol 500mg", dosis: "500mg", frecuencia: "Cada 8 horas", duracion: "5 días", cantidad: 15 },
      ],
      diagnosis: "Migraña tensional",
      notes: "No exceder 3g diarios de paracetamol",
      status: "ACTIVE",
      expiresAt,
    },
  });

  await prisma.prescription.create({
    data: {
      clinicId: clinic.id,
      patientId: patient2.id,
      doctorId: doctor2.id,
      visitId: visit2.id,
      medications: [
        { nombre: "Omeprazol 20mg", dosis: "20mg", frecuencia: "Una vez al día", duracion: "14 días", cantidad: 14 },
      ],
      diagnosis: "Gastritis aguda",
      status: "ACTIVE",
      expiresAt,
    },
  });

  // ── 10. Citas ─────────────────────────────────────────────────────────────────
  console.log("Creando citas...");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 7);

  await prisma.appointment.createMany({
    data: [
      {
        clinicId: clinic.id,
        patientId: patient1.id,
        doctorId: doctor1.id,
        date: today,
        time: "09:00",
        service: "Control",
        status: "CONFIRMED",
        reason: "Control de migraña tensional",
        source: "whatsapp",
        whatsappConfirmed: true,
      },
      {
        clinicId: clinic.id,
        patientId: patient3.id,
        doctorId: doctor1.id,
        date: today,
        time: "10:30",
        service: "Consulta general",
        status: "PENDING",
        reason: "Control de presión arterial",
        source: "manual",
      },
      {
        clinicId: clinic.id,
        patientId: patient4.id,
        doctorId: doctor2.id,
        date: tomorrow,
        time: "14:30",
        service: "Primera consulta",
        status: "PENDING",
        reason: "Consulta general",
        source: "whatsapp",
      },
      {
        clinicId: clinic.id,
        patientId: patient2.id,
        doctorId: doctor2.id,
        date: nextWeek,
        time: "09:00",
        service: "Control",
        status: "PENDING",
        reason: "Seguimiento gastritis",
        source: "manual",
      },
    ],
  });

  // ── 11. Farmacia: productos ───────────────────────────────────────────────────
  console.log("Creando inventario farmacia...");
  await prisma.pharmacyProduct.createMany({
    data: [
      { clinicId: farmacia.id, name: "Paracetamol 500mg", category: "analgesico", price: 3.5, stock: 150, minStock: 20, unit: "caja", requiresPrescription: false },
      { clinicId: farmacia.id, name: "Ibuprofeno 400mg", category: "analgesico", price: 5.0, stock: 120, minStock: 20, unit: "caja", requiresPrescription: false },
      { clinicId: farmacia.id, name: "Amoxicilina 500mg", category: "antibiotico", price: 8.5, stock: 80, minStock: 10, unit: "caja", requiresPrescription: true },
      { clinicId: farmacia.id, name: "Omeprazol 20mg", category: "gastro", price: 6.0, stock: 90, minStock: 15, unit: "caja", requiresPrescription: false },
      { clinicId: farmacia.id, name: "Loratadina 10mg", category: "antihistaminico", price: 4.0, stock: 5, minStock: 20, unit: "caja", requiresPrescription: false },
      { clinicId: farmacia.id, name: "Metformina 850mg", category: "antidiabetico", price: 7.0, stock: 60, minStock: 10, unit: "caja", requiresPrescription: true },
      { clinicId: farmacia.id, name: "Losartán 50mg", category: "antihipertensivo", price: 9.0, stock: 0, minStock: 10, unit: "caja", requiresPrescription: true, isAvailable: false },
      { clinicId: farmacia.id, name: "Vitamina C 500mg", category: "vitamina", price: 2.5, stock: 200, minStock: 30, unit: "frasco", requiresPrescription: false },
    ],
  });

  console.log("\nSeed completado exitosamente!");
  console.log("\nCredenciales:");
  console.log("  Super Admin:   superadmin@clinicasaas.com / superadmin123");
  console.log("  Admin Clinica: admin@sanjose.com / admin123");
  console.log("  Doctora:       dra.maria@sanjose.com / doctor123");
  console.log("  Doctor:        dr.carlos@sanjose.com / doctor123");
  console.log("  Recepcion:     recepcion@sanjose.com / admin123");
  console.log("  Farmacia:      admin@lasalud.com / pharm123");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
