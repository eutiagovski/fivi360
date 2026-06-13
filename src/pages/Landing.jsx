import { useEffect } from "react";
import { LandingLayout } from "@/components/landing/LandingLayout";
import { LandingHeader } from "@/components/landing/LandingHeader";
import { LandingHero } from "@/components/landing/LandingHero";
import { LandingFeatures } from "@/components/landing/LandingFeatures";
import { LandingShowcase } from "@/components/landing/LandingShowcase";
import { LandingHowItWorks } from "@/components/landing/LandingHowItWorks";
import { LandingPortfolio } from "@/components/landing/LandingPortfolio";
import { LandingPricing } from "@/components/landing/LandingPricing";
import { LandingFaq } from "@/components/landing/LandingFaq";
import { LandingFinalCta } from "@/components/landing/LandingFinalCta";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { trackEvent } from "@/services/analytics/analyticsService";

export function Landing() {
  useEffect(() => {
    trackEvent("view_landing");
  }, []);

  return (
    <LandingLayout header={<LandingHeader />} footer={<LandingFooter />}>
      <LandingHero />
      <LandingFeatures />
      <LandingShowcase />
      <LandingHowItWorks />
      <LandingPortfolio />
      <LandingPricing />
      <LandingFaq />
      <LandingFinalCta />
    </LandingLayout>
  );
}
