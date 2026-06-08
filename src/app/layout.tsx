import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Clinica SaaS",
  description: "Gestión clínica inteligente con WhatsApp IA para Honduras y LATAM.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
        />
      </head>
      <body className="bg-[#f6fafe] text-slate-900 antialiased">
        {children}
      </body>
    </html>
  );
}
