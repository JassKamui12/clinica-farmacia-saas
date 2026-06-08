import type { Metadata, Viewport } from "next";
import "./globals.css";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://salus-ia.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "Salus — Gestión Clínica con WhatsApp IA",
    template: "%s | Salus",
  },
  description:
    "SaaS para clínicas y consultorios en Honduras y LATAM. Tus pacientes agendan citas por WhatsApp con IA. Expediente clínico, recetas digitales y farmacia integrada.",
  keywords: [
    "clínica", "gestión médica", "WhatsApp", "citas médicas",
    "Honduras", "LATAM", "inteligencia artificial", "software médico",
    "odontología", "farmacia", "expediente clínico", "SaaS salud",
  ],
  authors: [{ name: "Salus" }],
  creator: "Salus",
  applicationName: "Salus",
  openGraph: {
    type: "website",
    locale: "es_HN",
    url: BASE_URL,
    siteName: "Salus",
    title: "Salus — Gestión Clínica con WhatsApp IA",
    description:
      "Tu clínica, en automático. Pacientes agendan citas por WhatsApp con IA. Expediente clínico, recetas y farmacia en un solo lugar.",
    images: [
      {
        url: "/og-image.svg",
        width: 1200,
        height: 630,
        alt: "Salus — Gestión Clínica Inteligente",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Salus — Gestión Clínica con WhatsApp IA",
    description:
      "Tu clínica, en automático. Pacientes agendan citas por WhatsApp con IA.",
    images: ["/og-image.svg"],
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
};

export const viewport: Viewport = {
  themeColor: "#051125",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
        />
      </head>
      <body className="bg-[#f6fafe] text-slate-900 antialiased">
        {children}
      </body>
    </html>
  );
}
