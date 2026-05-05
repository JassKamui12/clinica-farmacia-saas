import { NextResponse } from "next/server";
import { ZodError } from "zod";

export function apiError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export function apiSuccess(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

export function handleZodError(error: ZodError) {
  return NextResponse.json(
    { error: "Datos inválidos", details: error.issues },
    { status: 400 }
  );
}

export function apiNotFound(message = "Recurso no encontrado") {
  return NextResponse.json({ error: message }, { status: 404 });
}

export function apiForbidden(message = "No autorizado") {
  return NextResponse.json({ error: message }, { status: 403 });
}

export function apiUnauthorized(message = "Se requiere autenticación") {
  return NextResponse.json({ error: message }, { status: 401 });
}

export function apiServerError(error: unknown) {
  console.error("API Error:", error);
  return NextResponse.json(
    { error: "Error interno del servidor" },
    { status: 500 }
  );
}
