import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { trackEvent } from "@/services/analytics/analyticsService";
import { BrandLogo } from "@/components/common/BrandLogo";

const NAV_LINKS = [
  { label: "Recursos", href: "#recursos" },
  { label: "Demo", href: "#demo" },
  { label: "Como funciona", href: "#como-funciona" },
  { label: "Preços", href: "#precos" },
  { label: "FAQ", href: "#faq" },
];

const primaryBtnClass =
  "bg-white text-black rounded-full px-6 py-3 font-medium btn-scale hover:bg-zinc-200 h-auto";

const secondaryBtnClass =
  "border border-zinc-700 text-white rounded-full px-6 py-3 hover:bg-zinc-900 bg-transparent h-auto";

function NavLinks({ className, onNavigate }) {
  return (
    <nav className={cn("flex items-center gap-6", className)} aria-label="Navegação principal">
      {NAV_LINKS.map(({ label, href }) => (
        <a
          key={href}
          href={href}
          onClick={onNavigate}
          className="text-sm text-zinc-400 hover:text-white transition-colors"
        >
          {label}
        </a>
      ))}
    </nav>
  );
}

function GuestAuthButtons({ className, onNavigate }) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <Button variant="outline" className={secondaryBtnClass} asChild>
        <Link to="/login" onClick={onNavigate} data-testid="landing-header-login-btn">
          Entrar
        </Link>
      </Button>
      <Button className={primaryBtnClass} asChild>
        <Link
          to="/register"
          onClick={() => {
            onNavigate?.();
            trackEvent("click_cta_start", { cta_location: "header" });
          }}
          data-testid="landing-header-register-btn"
        >
          Começar grátis
        </Link>
      </Button>
    </div>
  );
}

function AuthenticatedAuthButtons({ className, onNavigate }) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <Button className={primaryBtnClass} asChild>
        <Link
          to="/dashboard"
          onClick={onNavigate}
          data-testid="landing-header-dashboard-btn"
        >
          Ir para o Dashboard
        </Link>
      </Button>
    </div>
  );
}

function AuthButtons({ className, onNavigate, isAuthenticated }) {
  if (isAuthenticated) {
    return (
      <AuthenticatedAuthButtons className={className} onNavigate={onNavigate} />
    );
  }

  return <GuestAuthButtons className={className} onNavigate={onNavigate} />;
}

export function LandingHeader({ fixed = false }) {
  const { user } = useAuth();
  const isAuthenticated = Boolean(user);
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const closeMobile = () => setMobileOpen(false);

  return (
    <header
      className={cn(
        "top-0 z-50 w-full border-b transition-colors duration-200",
        fixed ? "fixed left-0 right-0" : "sticky",
        scrolled
          ? "backdrop-blur-xl bg-[#050505]/80 border-zinc-800"
          : "bg-[#050505]/40 border-transparent"
      )}
    >
      <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-16 h-16 flex items-center justify-between gap-4">
        <Link
          to="/"
          className="inline-flex items-center shrink-0"
          data-testid="landing-logo"
        >
          <BrandLogo className="h-4" />
        </Link>

        <NavLinks className="hidden lg:flex" />

        <div className="hidden lg:flex">
          <AuthButtons isAuthenticated={isAuthenticated} />
        </div>

        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden text-zinc-400 hover:text-white"
              aria-label={mobileOpen ? "Fechar menu" : "Abrir menu"}
              aria-expanded={mobileOpen}
              data-testid="landing-mobile-menu-btn"
            >
              <Menu className="h-5 w-5" aria-hidden="true" />
            </Button>
          </SheetTrigger>
          <SheetContent
            side="right"
            className="bg-[#050505] border-zinc-800 w-full sm:max-w-sm"
            aria-label="Menu de navegação"
          >
            <SheetHeader>
              <SheetTitle className="text-left">
                <BrandLogo className="h-7" />
              </SheetTitle>
            </SheetHeader>
            <div className="mt-8 flex flex-col gap-6">
              <NavLinks className="flex-col items-start gap-4" onNavigate={closeMobile} />
              <AuthButtons
                className="flex-col w-full gap-3"
                onNavigate={closeMobile}
                isAuthenticated={isAuthenticated}
              />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
