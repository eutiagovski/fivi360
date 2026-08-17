import { Link } from "react-router-dom";
import {
  SOFTWARE_GUIDES,
  isSoftwareGuideComingSoon,
} from "@/help/content/softwareGuides";
import { helpArticlePath } from "@/help/utils/helpPaths";

const SOFTWARE_CATEGORY = "imagens-360";

export function HelpSoftwareExportGrid() {
  return (
    <ul
      className="grid grid-cols-1 gap-3 sm:grid-cols-2"
      data-testid="help-software-export-grid"
    >
      {SOFTWARE_GUIDES.map((guide) => {
        const comingSoon = isSoftwareGuideComingSoon(guide);

        return (
          <li key={guide.id}>
            <Link
              to={helpArticlePath({ category: SOFTWARE_CATEGORY, slug: guide.slug })}
              data-testid={`help-software-card-${guide.slug}`}
              className="flex h-full items-start justify-between gap-3 rounded-2xl border border-zinc-800 bg-[#0c0c0c] p-4 transition-colors hover:border-zinc-600"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-white">{guide.name}</p>
                <p className="mt-1 text-xs text-zinc-500">
                  Exportação de panorama 360°
                </p>
              </div>
              {comingSoon ? (
                <span
                  className="shrink-0 rounded-full border border-zinc-700 px-2.5 py-1 text-[10px] uppercase tracking-wider text-zinc-400"
                  data-testid={`help-software-coming-soon-${guide.slug}`}
                >
                  Em breve
                </span>
              ) : null}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
