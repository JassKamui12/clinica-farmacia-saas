import { NextResponse } from "next/server";
import { buildClearCookieHeader } from "@/lib/auth";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.headers.append("Set-Cookie", buildClearCookieHeader());
  return res;
}
