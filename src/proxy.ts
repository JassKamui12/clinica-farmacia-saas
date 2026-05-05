import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const roleRoutes: Record<string, string[]> = {
  "/doctor": ["DOCTOR", "ADMIN"],
  "/consultations": ["DOCTOR", "ADMIN"],
  "/triage": ["DOCTOR", "ADMIN"],
  "/followups": ["DOCTOR", "ADMIN"],
  "/patients": ["DOCTOR", "ADMIN"],
  "/appointments": ["DOCTOR", "ADMIN"],
  "/pharmacist": ["PHARMACIST"],
  "/inventory": ["PHARMACIST", "ADMIN"],
  "/prescriptions": ["DOCTOR", "PHARMACIST", "ADMIN"],
  "/admin": ["ADMIN"],
  "/whatsapp": ["DOCTOR", "PHARMACIST", "ADMIN"],
};

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/login") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/auth") ||
    pathname.includes(".")
  ) {
    return;
  }

  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET,
  });

  if (!token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const userRole = token.role as string;

  for (const [route, allowedRoles] of Object.entries(roleRoutes)) {
    if (pathname === route || pathname.startsWith(route + "/")) {
      if (!allowedRoles.includes(userRole)) {
        if (userRole === "DOCTOR") return NextResponse.redirect(new URL("/doctor", request.url));
        if (userRole === "PHARMACIST") return NextResponse.redirect(new URL("/pharmacist", request.url));
        return NextResponse.redirect(new URL("/admin", request.url));
      }
    }
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\..*|api/).*)",
  ],
};
