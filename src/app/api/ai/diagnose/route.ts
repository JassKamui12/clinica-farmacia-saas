import { NextRequest, NextResponse } from "next/server";
import { suggestClinicalDiagnosis } from "../../../../lib/clinicaAi";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const result = await suggestClinicalDiagnosis(body);
  return NextResponse.json(result);
}
