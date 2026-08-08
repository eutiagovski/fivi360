import { useLocation } from "react-router-dom";
import { usePageSeo } from "@/hooks/usePageSeo";
import { useAccessEarlyForm } from "./hooks/useAccessEarlyForm";
import { ACCESS_EARLY_SEO } from "./content";
import {
  AccessEarlyHeader,
  AccessEarlyHero,
  AccessEarlyVideo,
  AccessEarlyDemo,
  AccessEarlyBenefits,
  AccessEarlyHowItWorks,
  AccessEarlyTransition,
  AccessEarlyConversion,
  AccessEarlyFooter,
} from "./sections";

/**
 * Landing Page de acesso antecipado — estrutura de conversão.
 *
 * PUBLIC_ALWAYS — sem Auth, sem LegalConsentGate, sem perfil Firestore.
 * Viewer demo reutiliza FIVI360_DEMO_PROJECT (mesmo da Home), sem /embed.
 */
export function AccessEarlyLandingPage() {
  const location = useLocation();
  const form = useAccessEarlyForm();

  usePageSeo({
    title: ACCESS_EARLY_SEO.title,
    description: ACCESS_EARLY_SEO.description,
  });

  return (
    <div
      className="min-h-screen bg-[#050505] text-white flex flex-col fade-in"
      data-testid="access-early-landing"
      data-pathname={location.pathname}
      data-search={location.search}
    >
      <AccessEarlyHeader />

      <main className="flex-1">
        <AccessEarlyHero />
        <AccessEarlyVideo />
        <AccessEarlyDemo />
        {/* <AccessEarlyBenefits />
        <AccessEarlyHowItWorks />
        <AccessEarlyTransition /> */}
        <AccessEarlyConversion form={form} />
      </main>

      <AccessEarlyFooter />
    </div>
  );
}
