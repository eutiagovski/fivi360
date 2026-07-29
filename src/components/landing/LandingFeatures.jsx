import {
  Briefcase,
  Eye,
  FolderKanban,
  LayoutDashboard,
  MapPin,
  Orbit,
  Share2,
  Upload,
} from "lucide-react";
import { SectionHeader } from "@/components/common/SectionHeader";
import {
  LANDING_FEATURES,
  LANDING_FEATURES_SECTION,
} from "@/config/landingContent";

const ICON_MAP = {
  Orbit,
  MapPin,
  FolderKanban,
  Share2,
  Briefcase,
  Eye,
  Upload,
  LayoutDashboard,
};

export function LandingFeatures() {
  return (
    <section id="recursos" className="scroll-mt-20 py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-16">
        <div className="text-center mb-12">
          <SectionHeader
            title={LANDING_FEATURES_SECTION.title}
            subtitle={LANDING_FEATURES_SECTION.subtitle}
            dataTestId="landing-features-title"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {LANDING_FEATURES.map((feature, index) => {
            const Icon = ICON_MAP[feature.icon] ?? Orbit;

            return (
              <div
                key={feature.title}
                className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 card-hover"
                data-testid={`landing-feature-card-${index}`}
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 p-2 bg-zinc-800 rounded-xl">
                    <Icon className="h-5 w-5 text-zinc-300" strokeWidth={1.5} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-medium text-white mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-zinc-400 leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
