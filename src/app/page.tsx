import type { Metadata } from "next";
import { LandingNav } from "@/components/landing/LandingNav";
import { HeroSection } from "@/components/landing/HeroSection";
import { EspecialidadesSection } from "@/components/landing/EspecialidadesSection";
import { ProblemSection } from "@/components/landing/ProblemSection";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { PricingSection } from "@/components/landing/PricingSection";
import { CtaBanner } from "@/components/landing/CtaBanner";
import { FaqSection } from "@/components/landing/FaqSection";
import { LandingFooter } from "@/components/landing/LandingFooter";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://salus-ia.vercel.app";

export const metadata: Metadata = {
  title: "Salus IA — Tu clínica agenda sola por WhatsApp",
  description:
    "Bot IA médico 24/7 que agenda citas por WhatsApp para clínicas, consultorios y farmacias en Honduras y LATAM. Expediente clínico, recetas digitales y más. 14 días gratis.",
  alternates: { canonical: APP_URL },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "SoftwareApplication",
      "@id": `${APP_URL}/#software`,
      name: "Salus IA",
      url: APP_URL,
      applicationCategory: "HealthApplication",
      operatingSystem: "Web, WhatsApp",
      description:
        "Sistema de gestión clínica con WhatsApp IA para clínicas, consultorios y farmacias en Honduras y LATAM.",
      offers: {
        "@type": "AggregateOffer",
        priceCurrency: "HNL",
        lowPrice: "300",
        highPrice: "1200",
        offerCount: 3,
      },
      featureList: [
        "Bot IA 24/7 para agendamiento médico por WhatsApp",
        "Expediente clínico digital",
        "Recetas digitales con seguimiento",
        "Recordatorios automáticos de citas",
        "Inventario de farmacia integrado",
        "10 especialidades médicas",
      ],
      inLanguage: "es",
    },
    {
      "@type": "Organization",
      "@id": `${APP_URL}/#org`,
      name: "Salus IA",
      url: APP_URL,
      logo: `${APP_URL}/favicon.svg`,
      areaServed: ["HN", "GT", "SV", "NI", "CR", "PA", "MX", "CO", "PE"],
      contactPoint: {
        "@type": "ContactPoint",
        email: "hola@salus-ia.com",
        contactType: "customer support",
        availableLanguage: "Spanish",
      },
    },
    {
      "@type": "WebSite",
      "@id": `${APP_URL}/#website`,
      url: APP_URL,
      name: "Salus IA",
      publisher: { "@id": `${APP_URL}/#org` },
      potentialAction: {
        "@type": "RegisterAction",
        target: `${APP_URL}/login`,
        name: "Registrar clínica gratis",
      },
    },
    {
      "@type": "FAQPage",
      "@id": `${APP_URL}/#faq`,
      mainEntity: [
        {
          "@type": "Question",
          name: "¿Necesito saber de tecnología para usar Salus IA?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Para nada. Si sabes usar WhatsApp y puedes llenar un formulario, puedes usar Salus IA. El proceso de registro toma menos de 5 minutos.",
          },
        },
        {
          "@type": "Question",
          name: "¿Los pacientes sabrán que están hablando con una IA?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "El bot responde de forma natural y profesional. Puedes configurarle un nombre personalizado para tu clínica.",
          },
        },
        {
          "@type": "Question",
          name: "¿Los datos de mis pacientes están seguros?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Sí. Los datos se almacenan en servidores cifrados. Solo tú y tu equipo tienen acceso. Cumplimos con estándares de seguridad de datos médicos.",
          },
        },
      ],
    },
    {
      "@type": "HowTo",
      "@id": `${APP_URL}/#howto`,
      name: "Cómo automatizar el agendamiento de citas médicas por WhatsApp con IA",
      totalTime: "PT5M",
      step: [
        {
          "@type": "HowToStep",
          position: 1,
          name: "Registra tu clínica",
          text: "Crea tu cuenta en 2 minutos. Elige tu especialidad y configura servicios y horarios.",
          url: `${APP_URL}/login`,
        },
        {
          "@type": "HowToStep",
          position: 2,
          name: "Conecta tu WhatsApp",
          text: "Escanea un QR con tu WhatsApp. El bot usa tu número de siempre en 30 segundos.",
        },
        {
          "@type": "HowToStep",
          position: 3,
          name: "El bot trabaja solo",
          text: "Comparte tu número con tus pacientes. El bot agenda, registra síntomas y manda recordatorios 24/7.",
        },
      ],
    },
  ],
};

export default function LandingPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <main className="min-h-screen bg-white overflow-x-hidden">
        <LandingNav />
        <HeroSection />
        <EspecialidadesSection />
        <ProblemSection />
        <HowItWorks />
        <FeaturesSection />
        <PricingSection />
        <CtaBanner />
        <FaqSection />
        <LandingFooter />
      </main>
    </>
  );
}
