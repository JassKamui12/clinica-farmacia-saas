import { chat, ChatMessage } from "./claude";

export interface PharmacyProductSummary {
  name: string;
  category?: string;
  indications?: string;
  contraindications?: string;
  stock: number;
  price: number;
}

export interface ClinicalContext {
  patientName: string;
  age?: number;
  gender?: string;
  symptoms: string;
  findings?: string;
  history?: string;
  availableMedications: PharmacyProductSummary[];
}

export async function suggestClinicalDiagnosis(context: ClinicalContext) {
  const systemPrompt = `Eres un asistente médico experto que ayuda a generar diagnósticos y tratamientos seguros para una clínica con farmacia integrada. Usa la información del paciente y la lista de medicamentos disponibles. Devuelve solo el diagnóstico y las recomendaciones de tratamiento en un formato claro.`;

  const messages: ChatMessage[] = [
    {
      role: "user",
      content: `Paciente: ${context.patientName}
Edad: ${context.age ?? "no especificada"}
Género: ${context.gender ?? "no especificado"}
Síntomas: ${context.symptoms}
Hallazgos: ${context.findings ?? "no disponibles"}
Antecedentes: ${context.history ?? "no disponibles"}

Medicamentos disponibles:
${context.availableMedications
  .map((product, index) =>
    `${index + 1}. ${product.name} - Stock: ${product.stock}. Indicaciones: ${product.indications ?? "no disponibles"}.`
  )
  .join("\n")}

Genera un posible diagnóstico y sugiere el tratamiento con los medicamentos que existen en inventario. Identifica la mejor opción práctica.`,
    },
  ];

  return await chat(systemPrompt, messages);
}

export interface PharmacySuggestionContext {
  customerDescription: string;
  availableMedications: PharmacyProductSummary[];
}

export async function suggestPharmacyTreatment(context: PharmacySuggestionContext) {
  const systemPrompt = `Eres un asistente de farmacia que recomienda medicación y cuidados según la descripción de un cliente. Debes sugerir solo productos que estén en stock y explicar brevemente su uso. Si el producto no es adecuado, menciona alternativas o sugiere consulta médica.`;

  const messages: ChatMessage[] = [
    {
      role: "user",
      content: `Cliente describe: ${context.customerDescription}

Medicamentos disponibles:
${context.availableMedications
  .map((product, index) =>
    `${index + 1}. ${product.name} - Stock: ${product.stock}. Indicaciones: ${product.indications ?? "no disponibles"}.`
  )
  .join("\n")}

Recomienda los medicamentos más adecuados y explica por qué son una buena elección en este caso. Describe cuándo derivar al médico.`,
    },
  ];

  return await chat(systemPrompt, messages);
}
