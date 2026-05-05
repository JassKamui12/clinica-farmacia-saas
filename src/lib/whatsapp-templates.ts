export const WHATSAPP_TEMPLATES = {
  CITAS: {
    CONFIRMAR: {
      name: "confirmar_cita",
      language: "es",
      build: (patientName: string, date: string, time: string, doctorName: string) => ({
        templateName: "confirmar_cita",
        language: "es",
        components: [
          {
            type: "body",
            parameters: [
              { type: "text", text: patientName },
              { type: "text", text: date },
              { type: "text", text: time },
              { type: "text", text: doctorName },
            ],
          },
        ],
      }),
    },
    RECORDATORIO_24H: {
      name: "recordatorio_cita_24h",
      language: "es",
      build: (patientName: string, date: string, time: string, doctorName: string) => ({
        templateName: "recordatorio_cita_24h",
        language: "es",
        components: [
          {
            type: "body",
            parameters: [
              { type: "text", text: patientName },
              { type: "text", text: date },
              { type: "text", text: time },
              { type: "text", text: doctorName },
            ],
          },
        ],
      }),
    },
    RECORDATORIO_1H: {
      name: "recordatorio_cita_1h",
      language: "es",
      build: (patientName: string, time: string) => ({
        templateName: "recordatorio_cita_1h",
        language: "es",
        components: [
          {
            type: "body",
            parameters: [
              { type: "text", text: patientName },
              { type: "text", text: time },
            ],
          },
        ],
      }),
    },
    CANCELAR: {
      name: "cancelar_cita",
      language: "es",
      build: (patientName: string, date: string) => ({
        templateName: "cancelar_cita",
        language: "es",
        components: [
          {
            type: "body",
            parameters: [
              { type: "text", text: patientName },
              { type: "text", text: date },
            ],
          },
        ],
      }),
    },
  },
  SEGUIMIENTO: {
    CHECK_IN: {
      name: "seguimiento_tratamiento",
      language: "es",
      build: (patientName: string, medication: string) => ({
        templateName: "seguimiento_tratamiento",
        language: "es",
        components: [
          {
            type: "body",
            parameters: [
              { type: "text", text: patientName },
              { type: "text", text: medication },
            ],
          },
        ],
      }),
    },
    ALERTA_DOCTOR: {
      name: "alerta_seguimiento",
      language: "es",
      build: (patientName: string, reason: string) => ({
        templateName: "alerta_seguimiento",
        language: "es",
        components: [
          {
            type: "body",
            parameters: [
              { type: "text", text: patientName },
              { type: "text", text: reason },
            ],
          },
        ],
      }),
    },
  },
  RECETAS: {
    RECETA_LISTA: {
      name: "receta_lista",
      language: "es",
      build: (patientName: string, medication: string, doctorName: string) => ({
        templateName: "receta_lista",
        language: "es",
        components: [
          {
            type: "body",
            parameters: [
              { type: "text", text: patientName },
              { type: "text", text: medication },
              { type: "text", text: doctorName },
            ],
          },
        ],
      }),
    },
  },
};

export function buildAppointmentConfirmation(patientName: string, date: string, time: string, doctorName: string) {
  return `Hola ${patientName}, tu cita ha sido confirmada:\n\n📅 Fecha: ${date}\n⏰ Hora: ${time}\n👨‍⚕️ Doctor: ${doctorName}\n\nResponde "confirmo" o "cancelo" para gestionar tu cita.`;
}

export function build24hReminder(patientName: string, date: string, time: string, doctorName: string) {
  return `Hola ${patientName}, recordatorio: tienes una cita mañana.\n\n📅 Fecha: ${date}\n⏰ Hora: ${time}\n👨‍⚕️ Doctor: ${doctorName}\n\n¿Confirmas tu asistencia? Responde "confirmo" o "cancelo".`;
}

export function build1hReminder(patientName: string, time: string) {
  return `Hola ${patientName}, tu cita es en 1 hora.\n\n⏰ Hora: ${time}\n\n¡Te esperamos!`;
}

export function buildFollowUpCheckIn(patientName: string, medication: string) {
  return `Hola ${patientName}, ¿cómo te sientes con tu tratamiento de ${medication}?\n\nResponde:\n1️⃣ Todo bien, sin problemas\n2️⃣ Algunas molestias leves\n3️⃣ Efectos adversos, necesito ayuda\n4️⃣ No he podido tomar el medicamento`;
}

export function buildPrescriptionReady(patientName: string, medication: string, doctorName: string) {
  return `Hola ${patientName}, el Dr/Dra. ${doctorName} ha generado una nueva receta:\n\n💊 Medicamento: ${medication}\n\nPuedes pasar por la farmacia para retirarla.`;
}

export const BOT_MENU = `🏥 *MediFlow Pro* - Asistente Virtual

¿En qué puedo ayudarte? Responde con el número:

1️⃣ Agendar una cita
2️⃣ Consultar mi próxima cita
3️⃣ Evaluación de síntomas (IA)
4️⃣ Seguimiento de tratamiento
5️⃣ Consultar mi receta
6️⃣ Hablar con un humano

_Este es un servicio automatizado con IA._`;
