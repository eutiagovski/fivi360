import { useEffect, useState } from "react";
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
import {
  ACCESS_EARLY_CONTENT,
  ACCESS_EARLY_FORM_ANCHOR,
  scrollToAccessEarlyForm,
} from "../content";
import { BrandLogo } from "@/components/common/BrandLogo";

const NAV_LINKS = [
  { label: "Como funciona", href: "#como-funciona" },
  { label: "Experimente", href: "#experimente" },
  { label: "Acesso antecipado", href: `#${ACCESS_EARLY_FORM_ANCHOR}` },
];

const primaryBtnClass =
  "bg-white text-black rounded-full px-5 py-2.5 font-medium btn-scale hover:bg-zinc-200 h-auto text-sm";

/**
 * Header mínimo da campanha — logo + âncoras + CTA.
 */
export function AccessEarlyHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const closeMobile = () => setMobileOpen(false);

  const onCta = () => {
    closeMobile();
    scrollToAccessEarlyForm();
  };

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full border-b transition-colors duration-200",
        scrolled
          ? "backdrop-blur-xl bg-[#050505]/80 border-zinc-800"
          : "bg-[#050505]/40 border-transparent",
      )}
      data-testid="access-early-header"
    >
      <div className="max-w-6xl mx-auto px-6 md:px-10 h-14 flex items-center gap-4 py-4 ">
        <div className="flex flex-1 items-center justify-start min-w-0">
          <a
            href="#topo"
            className="inline-flex items-center shrink-0"
            data-testid="access-early-logo"
          >
            <BrandLogo className="h-4 md:h-5" />
          </a>
        </div>

        <nav
          className="hidden md:flex items-center justify-center gap-6 shrink-0"
          aria-label="Navegação da campanha"
        >
          {NAV_LINKS.map(({ label, href }) => (
            <a
              key={href}
              href={href}
              className="text-sm text-zinc-400 hover:text-white transition-colors"
            >
              {label}
            </a>
          ))}
        </nav>

        <div className="flex flex-1 items-center justify-end min-w-0">
          <div className="hidden md:block">
            <Button
              type="button"
              className={primaryBtnClass}
              onClick={onCta}
              data-testid="access-early-header-cta"
            >
              {ACCESS_EARLY_CONTENT.hero.cta}
            </Button>
          </div>

          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden text-zinc-400 hover:text-white"
                aria-label="Abrir menu"
                data-testid="access-early-mobile-menu-btn"
              >
                <Menu className="h-5 w-5" aria-hidden="true" />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="bg-[#050505] border-zinc-800 w-full sm:max-w-sm"
            >
              <SheetHeader>
                <SheetTitle className="text-left">
                  <BrandLogo className="h-4" />
                </SheetTitle>
              </SheetHeader>
              <div className="mt-8 flex flex-col gap-5">
                {NAV_LINKS.map(({ label, href }) => (
                  <a
                    key={href}
                    href={href}
                    onClick={closeMobile}
                    className="text-base text-zinc-300 hover:text-white"
                  >
                    {label}
                  </a>
                ))}
                <Button
                  type="button"
                  className={cn(primaryBtnClass, "w-full")}
                  onClick={onCta}
                  data-testid="access-early-header-cta-mobile"
                >
                  {ACCESS_EARLY_CONTENT.hero.cta}
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
