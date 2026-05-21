import { DefaultSession } from "next-auth";

type AppRole = "ADMIN" | "DOCTOR" | "PHARMACIST" | "RECEPTIONIST";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: AppRole;
      whatsappPhone?: string | null;
      clinicId?: string | null;
    } & DefaultSession["user"];
  }

  interface User {
    role: AppRole;
    whatsappPhone?: string | null;
    clinicId?: string | null;
  }
}
