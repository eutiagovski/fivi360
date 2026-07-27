import { PublicSocialLinks } from "@/components/public/PublicSocialLinks";
import { resolvePublicDisplayName } from "@/utils/publicSeo";

/**
 * @param {{ user: import("@/services/users/userService").PublicUserProfile | null | undefined }} props
 */
export function PublicPortfolioHeader({ user }) {
  const displayName = resolvePublicDisplayName(user) || "Portfólio";
  const bio = user?.bio ?? "";
  const hasBio = bio.trim().length > 0;
  const logoUrl = user?.companyLogo?.trim() || "";

  return (
    <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-16 mt-24 mb-6 sm:mt-12">
        <div className="mx-auto flex max-w-7xl flex-col items-start text-start justify-start mt-12">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={displayName}
              className="mb-6 max-h-14 sm:max-h-16 w-auto object-contain"
              data-testid="portfolio-office-logo"
            />
          ) : null}

          <h1
            className="text-4xl sm:text-5xl lg:text-6xl font-light tracking-tighter text-white mb-6"
            data-testid="portfolio-user-name"
          >
            {displayName}
          </h1>

          {hasBio ? (
            <p
              className="text-lg text-zinc-300 leading-relaxed whitespace-pre-wrap   mb-6"
              data-testid="portfolio-company-bio"
            >
              {bio}
            </p>
          ) : null}

          {user ? (
            <PublicSocialLinks
              user={user}
              testIdPrefix="portfolio-social"
              variant="portfolio"
            />
          ) : null}
        </div>
      </div>
  );
}
