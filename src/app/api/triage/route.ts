import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY || "",
  baseURL: "https://api.deepseek.com",
});

const TRIAGE_SYSTEM_PROMPT = `Eres un asistente de triaje médico para una clínica. Tu tarea es analizar los síntomas reportados por pacientes y generar un reporte estructurado de triaje.

IMPORTANTE: No diagnostiques ni prescribas medicamentos. Solo evalúa la urgencia y genera preguntas de seguimiento.

Analiza los síntomas y responde SOLO con un JSON válido en este formato exacto:
{
  "urgency": "LOW" | "MEDIUM" | "HIGH" | "EMERGENCY",
  "summary": "Resumen clínico conciso en español (2-3 oraciones)",
  "confidence": 0.85,
  "redFlags": "Lista de señales de alerta separadas por comas, o vacío si no hay",
  "suggestedQuestions": "Preguntas de seguimiento que el bot debería hacer al paciente, separadas por punto y coma",
  "recommendation": "Recomendación de acción: 'monitoreo en casa', 'cita próxima semana', 'cita hoy', o 'urgencias inmediatamente'"
}

Criterios de urgencia:
- LOW: Síntomas leves, resfriado común, molestias menores, consulta general
- MEDIUM: Dolor moderado, fiebre persistente, síntomas que requieren evaluación en 24-48h
- HIGH: Dolor severo, dificultad para respirar moderada, síntomas que requieren evaluación hoy
- EMERGENCY: Dolor de pecho, dificultad severa para respirar, pérdida de consciencia, sangrado activo, signos de ACV`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { symptoms, patientId, phone } = body;

    if (!symptoms) {
      return NextResponse.json(
        { error: "Los síntomas son obligatorios" },
        { status: 400 }
      );
    }

    const deepseekResponse = await openai.chat.completions.create({
      model: "deepseek-chat",
      max_tokens: 1024,
      messages: [
        { role: "system", content: TRIAGE_SYSTEM_PROMPT },
        {
          role: "user",
          content: `Síntomas reportados por el paciente: "${symptoms}"\n\nGenera el reporte de triaje en JSON.`,
        },
      ],
    });

    const responseText = deepseekResponse.choices[0]?.message?.content || "";

    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json(
        { error: "Respuesta de IA inválida" },
        { status: 500 }
      );
    }

    const triageData = JSON.parse(jsonMatch[0]);

    const report = await prisma.triageReport.create({
      data: {
        patientId: patientId || null,
        phone: phone || "unknown",
        symptoms,
        aiSummary: triageData.summary,
        urgency: triageData.urgency,
        aiConfidence: triageData.confidence,
        redFlags: triageData.redFlags || null,
        suggestedQuestions: triageData.suggestedQuestions || null,
      },
       include: {
         Patient: { select: { name: true, whatsappPhone: true } },
       },
    });

    if (triageData.urgency === "EMERGENCY" || triageData.urgency === "HIGH") {
      await prisma.notification.create({
        data: {
          title: `🚨 Triage ${triageData.urgency === "EMERGENCY" ? "EMERGENCIA" : "URGENTE"}`,
          content: `Paciente ${report.Patient?.name || phone}: ${triageData.summary}`,
          channel: "in_app",
          role: "DOCTOR",
        },
      });
    }

    return NextResponse.json({
      ...triageData,
      reportId: report.id,
      patientName: report.Patient?.name,
    });
  } catch (error: any) {
    console.error("Triage API Error:", error);
    return NextResponse.json(
      { error: error.message || "Error al procesar el triaje" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const urgency = searchParams.get("urgency");
  const limit = parseInt(searchParams.get("limit") || "50");

  const where: any = {};
  if (status) where.status = status;
  if (urgency) where.urgency = urgency;

  const reports = await prisma.triageReport.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      Patient: { select: { name: true, whatsappPhone: true } },
    },
  });

  return NextResponse.json(reports);
}
