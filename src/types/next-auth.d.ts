import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "ADMIN" | "DOCTOR" | "PHARMACIST";
      whatsappPhone?: string | null;
    } & DefaultSession["user"];
  }

  interface User {
    role: "ADMIN" | "DOCTOR" | "PHARMACIST";
    whatsappPhone?: string | null;
  }
}
