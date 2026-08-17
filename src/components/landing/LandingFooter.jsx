import { Link } from "react-router-dom";
import { Instagram, Youtube } from "lucide-react";
import { BrandLogo } from "@/components/common/BrandLogo";
import { ACCESS_EARLY_CONFIG } from "@/landing-pages/access-early/config";

const NAV_LINKS = [
  { label: "Recursos", href: "#recursos" },
  { label: "Demo", href: "#demo" },
  { label: "Como funciona", href: "#como-funciona" },
  { label: "Preços", href: "#precos" },
  { label: "FAQ", href: "#faq" },
];

const LEGAL_LINKS = [
  { label: "Termos de Uso", to: "/termos" },
  { label: "Política de Privacidade", to: "/privacidade" },
  { label: "Ajuda", to: "/ajuda" },
];

/** URLs sociais compartilhadas com a LP de acesso antecipado (vazias → ícones disabled). */
const SOCIAL_LINKS = [
  {
    label: "Instagram",
    href: ACCESS_EARLY_CONFIG.instagramUrl,
    icon: Instagram,
    testId: "landing-footer-instagram",
  },
  {
    label: "YouTube",
    href: ACCESS_EARLY_CONFIG.youtubeUrl,
    icon: Youtube,
    testId: "landing-footer-youtube",
  },
];

export function LandingFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-zinc-800 mt-auto" data-testid="landing-footer">
      <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-16 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[minmax(0,2fr)_1fr_1fr_1fr] gap-10 lg:gap-12">
          <div className="space-y-3 sm:col-span-2 lg:col-span-1">
            <BrandLogo className="h-7" />
            <p className="text-sm text-zinc-500 max-w-lg">
              Plataforma para apresentar projetos com imagens panorâmicas 360°.
            </p>
          </div>

          <nav className="space-y-4" aria-label="Navegação">
            <h2 className="text-sm font-medium text-white">Navegação</h2>
            <ul className="space-y-2">
              {NAV_LINKS.map(({ label, href }) => (
                <li key={href}>
                  <a
                    href={href}
                    className="text-sm text-zinc-400 hover:text-white transition-colors"
                  >
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <nav className="space-y-4" aria-label="Termos e políticas">
            <h2 className="text-sm font-medium text-white">Termos e políticas</h2>
            <ul className="space-y-2">
              {LEGAL_LINKS.map(({ label, to }) => (
                <li key={to}>
                  <Link
                    to={to}
                    className="text-sm text-zinc-400 hover:text-white transition-colors"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="space-y-4" data-testid="landing-footer-social">
            <h2 className="text-sm font-medium text-white">Redes sociais</h2>
            <div className="flex items-center gap-3">
              {SOCIAL_LINKS.map(({ label, href, icon, testId }) => (
                <SocialIconLink
                  key={label}
                  href={(href ?? "").trim()}
                  label={label}
                  icon={icon}
                  testId={testId}
                />
              ))}
            </div>
          </div>
        </div>

        <p className="mt-10 text-center text-sm text-zinc-500">
          &copy; {year} FIVI360. Todos os direitos reservados.
        </p>
      </div>
    </footer>
  );
}

/**
 * @param {{
 *   href: string,
 *   label: string,
 *   testId: string,
 *   icon: import("lucide-react").LucideIcon,
 * }} props
 */
function SocialIconLink({ href, label, testId, icon: Icon }) {
  const enabled = Boolean(href);
  const className =
    "inline-flex h-11 w-11 items-center justify-center rounded-full border border-zinc-700 text-white transition-colors";

  if (!enabled) {
    return (
      <button
        type="button"
        disabled
        className={`${className} opacity-40 cursor-not-allowed`}
        data-testid={testId}
        data-enabled="false"
        aria-label={label}
        aria-disabled="true"
        title={`${label} em breve`}
      >
        <Icon className="h-5 w-5" aria-hidden="true" />
      </button>
    );
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`${className} hover:bg-zinc-900 hover:border-zinc-500`}
      data-testid={testId}
      data-enabled="true"
      aria-label={label}
      title={label}
    >
      <Icon className="h-5 w-5" aria-hidden="true" />
    </a>
  );
}
