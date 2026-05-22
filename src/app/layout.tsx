import type { Metadata } from "next";
import ClientProviders from "@/components/ClientProviders";
import "./globals.css";

export const metadata: Metadata = {
  title: "Clínica + Farmacia SaaS",
  description: "SaaS con IA para clínica y farmacia integrada con WhatsApp.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
        />
      </head>
      <body className="bg-slate-50 text-slate-900 font-sans antialiased">
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}
