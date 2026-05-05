import { NextRequest, NextResponse } from "next/server";
import { suggestPharmacyTreatment } from "../../../../lib/clinicaAi";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const result = await suggestPharmacyTreatment(body);
  return NextResponse.json(result);
}
