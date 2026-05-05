import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcrypt";
import { prisma } from "@/lib/prisma";
import { decode } from "next-auth/jwt";
import { cookies } from "next/headers";

export const authOptions = {
  adapter: require("@auth/prisma-adapter").PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials: any) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email y contraseña requeridos");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });

        if (!user || !user.passwordHash) {
          throw new Error("Usuario no encontrado");
        }

        const isPasswordValid = await compare(
          credentials.password as string,
          user.passwordHash
        );

        if (!isPasswordValid) {
          throw new Error("Contraseña incorrecta");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          whatsappPhone: user.whatsappPhone,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt" as any,
    maxAge: 30 * 24 * 60 * 60,
  },
  callbacks: {
    async jwt({ token, user }: any) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.whatsappPhone = user.whatsappPhone;
      }
      return token;
    },
    async session({ session, token }: any) {
      if (token && session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.whatsappPhone = token.whatsappPhone;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
};

export type SessionUser = {
  id: string;
  role: "ADMIN" | "DOCTOR" | "PHARMACIST";
  whatsappPhone?: string | null;
  name?: string | null;
  email?: string | null;
  image?: string | null;
};

export async function auth(): Promise<(any & { user: SessionUser }) | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("next-auth.session-token")?.value 
    || cookieStore.get("__Secure-next-auth.session-token")?.value;  
  
  if (!token) return null;
  
  try {
    const decoded = await decode({
      token,
      secret: process.env.NEXTAUTH_SECRET!,
    });
    return decoded as any;
  } catch {
    return null;
  }
}

export default NextAuth(authOptions as any);
