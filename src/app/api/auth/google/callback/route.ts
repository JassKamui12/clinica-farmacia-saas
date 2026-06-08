import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { prisma } from "@/lib/prisma";
import { signToken, buildSetCookieHeader } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const stateParam = searchParams.get("state");
  const errorParam = searchParams.get("error");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? new URL(req.url).origin;

  if (errorParam || !code) {
    return NextResponse.redirect(`${appUrl}/login?error=google-cancelado`);
  }

  // Protección CSRF con state cookie
  const stateCookie = req.cookies.get("oauth_state")?.value;
  if (!stateCookie || !stateParam || stateCookie !== stateParam) {
    return NextResponse.redirect(`${appUrl}/login?error=google-csrf`);
  }

  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return NextResponse.redirect(`${appUrl}/login?error=google-no-configurado`);
  }

  try {
    const redirectUri = `${appUrl}/api/auth/google/callback`;

    const client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      redirectUri
    );

    const { tokens } = await client.getToken(code);
    client.setCredentials(tokens);

    const oauth2 = google.oauth2({ version: "v2", auth: client });
    const { data: profile } = await oauth2.userinfo.get();

    if (!profile.email) {
      return NextResponse.redirect(`${appUrl}/login?error=google-sin-email`);
    }

    const email = profile.email.toLowerCase();

    // Buscar usuario existente
    const existing = await prisma.user.findUnique({
      where: { email },
      select: { id: true, clinicId: true, role: true, isSuperAdmin: true, tokenVersion: true, isActive: true, logoUrl: true },
    });

    let userId: string;
    let clinicId: string | null;
    let role: string;
    let isSuperAdmin: boolean;
    let tokenVersion: number;

    if (existing) {
      if (!existing.isActive) {
        return NextResponse.redirect(`${appUrl}/login?error=cuenta-inactiva`);
      }

      userId = existing.id;
      clinicId = existing.clinicId;
      role = existing.role;
      isSuperAdmin = existing.isSuperAdmin;
      tokenVersion = existing.tokenVersion;

      // Sincronizar foto de Google si aún no tiene una
      if (profile.picture && !existing.logoUrl) {
        await prisma.user.update({
          where: { id: existing.id },
          data: { logoUrl: profile.picture },
        });
      }
    } else {
      // Nuevo usuario — crear sin clinicId, necesitará completar onboarding
      const newUser = await prisma.user.create({
        data: {
          email,
          name: profile.name ?? email.split("@")[0],
          logoUrl: profile.picture ?? null,
          role: "ADMIN",
          isSuperAdmin: false,
        },
      });

      userId = newUser.id;
      clinicId = null;
      role = "ADMIN";
      isSuperAdmin = false;
      tokenVersion = 0;
    }

    const jwtToken = await signToken({ userId, clinicId, role, isSuperAdmin, tokenVersion });

    // Limpiar la cookie de state
    const res = NextResponse.redirect(
      isSuperAdmin
        ? `${appUrl}/super-admin/panel`
        : clinicId
        ? `${appUrl}/dashboard/inicio`
        : `${appUrl}/onboarding` // usuario nuevo sin clínica
    );

    res.headers.append("Set-Cookie", buildSetCookieHeader(jwtToken));
    res.cookies.delete("oauth_state");
    return res;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[Google OAuth] Error:", msg);

    // Detectar redirect_uri_mismatch específicamente
    if (msg.includes("redirect_uri_mismatch") || msg.includes("redirect URI")) {
      return NextResponse.redirect(`${appUrl}/login?error=google-redirect-uri`);
    }
    if (msg.includes("invalid_grant") || msg.includes("code was already redeemed")) {
      return NextResponse.redirect(`${appUrl}/login?error=google-code-used`);
    }
    return NextResponse.redirect(`${appUrl}/login?error=google-error&detail=${encodeURIComponent(msg.slice(0, 80))}`);
  }
}
