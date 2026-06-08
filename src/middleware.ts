import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "./lib/auth";

const COOKIE_NAME = "clinica_session";

// Rutas que no requieren autenticación
const PUBLIC_PATHS = [
  "/",           // landing page
  "/login",
  "/register",
  "/privacy",
  "/terms",
  "/api/auth/login",
  "/api/auth/register",
  "/api/whatsapp/webhook", // webhook de Meta — sin auth
];

const SUPER_ADMIN_PATHS = ["/super-admin"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isPublic = PUBLIC_PATHS.some((p) =>
    p === "/" ? pathname === "/" : pathname.startsWith(p)
  );
  const isStatic =
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/og-image") ||
    pathname.includes(".");

  if (isPublic || isStatic) return NextResponse.next();

  const token = request.cookies.get(COOKIE_NAME)?.value;

  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const session = await verifyToken(token);

  if (!session) {
    const res = NextResponse.redirect(new URL("/login", request.url));
    res.cookies.delete(COOKIE_NAME);
    return res;
  }

  if (SUPER_ADMIN_PATHS.some((p) => pathname.startsWith(p)) && !session.isSuperAdmin) {
    return NextResponse.redirect(new URL("/dashboard/inicio", request.url));
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-user-id", session.userId);
  requestHeaders.set("x-clinic-id", session.clinicId ?? "");
  requestHeaders.set("x-user-role", session.role);
  requestHeaders.set("x-super-admin", session.isSuperAdmin ? "1" : "0");

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
