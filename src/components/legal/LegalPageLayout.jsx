import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ChevronDown } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { LandingHeader } from "@/components/landing/LandingHeader";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

const CONTAINER_CLASS = "max-w-7xl mx-auto px-6 md:px-12 lg:px-16 w-full min-w-0";
const HEADER_OFFSET = "pt-16";

function TableOfContents({ sections, activeId, onNavigate, className }) {
  return (
    <nav className={cn("flex flex-col gap-1", className)} aria-label="Índice da página">
      {sections.map(({ id, label }) => (
        <a
          key={id}
          href={`#${id}`}
          onClick={(e) => {
            e.preventDefault();
            onNavigate(id);
          }}
          className={cn(
            "text-sm py-2 px-3 rounded-lg transition-colors border-l-2 -ml-px",
            activeId === id
              ? "text-white border-white bg-zinc-900/60"
              : "text-zinc-400 border-transparent hover:text-white hover:bg-zinc-900/40"
          )}
        >
          {label}
        </a>
      ))}
    </nav>
  );
}

export function LegalSection({ id, title, children }) {
  return (
    <section
      id={id}
      className="scroll-mt-6 mb-14 last:mb-8"
      aria-labelledby={`${id}-heading`}
    >
      <h2
        id={`${id}-heading`}
        className="text-lg sm:text-xl font-light text-white mb-5 tracking-tight"
      >
        {title}
      </h2>
      <div className="space-y-4 text-zinc-300 leading-relaxed text-sm sm:text-base [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:space-y-2 [&_a]:text-white [&_a]:underline [&_a]:underline-offset-2 [&_a]:hover:text-zinc-200">
        {children}
      </div>
    </section>
  );
}

/**
 * Layout de leitura focada para páginas legais (termos, privacidade).
 * Header e cabeçalho da página fixos; apenas o artigo com os tópicos rola.
 */
export function LegalPageLayout({ title, sections, children, lastUpdated, version }) {
  const { user } = useAuth();
  const contentRef = useRef(null);
  const [activeId, setActiveId] = useState(sections[0]?.id ?? "");
  const [tocOpen, setTocOpen] = useState(false);

  const scrollToSection = useCallback((id) => {
    const container = contentRef.current;
    const el = document.getElementById(id);
    if (!container || !el) return;

    const offset =
      el.getBoundingClientRect().top -
      container.getBoundingClientRect().top +
      container.scrollTop;

    container.scrollTo({ top: offset, behavior: "smooth" });
    setActiveId(id);
    setTocOpen(false);
  }, []);

  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  useEffect(() => {
    const root = contentRef.current;
    if (!root) return;

    const ids = sections.map((s) => s.id);
    const elements = ids
      .map((id) => document.getElementById(id))
      .filter(Boolean);

    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]?.target?.id) {
          setActiveId(visible[0].target.id);
        }
      },
      {
        root,
        rootMargin: "-12% 0px -60% 0px",
        threshold: [0, 0.25, 0.5, 1],
      }
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [sections]);

  const backTo = user ? "/dashboard" : "/";
  const backLabel = user ? "Voltar ao app" : "Voltar";

  return (
    <div
      className="h-dvh flex flex-col bg-[#050505] text-zinc-300 fade-in overflow-hidden"
      data-testid="legal-page"
    >
      <LandingHeader fixed />

      <main
        className={cn(
          "flex flex-1 flex-col min-h-0 w-full min-w-0 overflow-hidden",
          HEADER_OFFSET
        )}
      >
        <div
          className={cn(
            CONTAINER_CLASS,
            "flex flex-1 flex-col min-h-0 pt-4 sm:pt-6"
          )}
        >
          <div className="shrink-0 min-w-0">
            <Link
              to={backTo}
              className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors mb-4 sm:mb-6"
              data-testid="legal-page-back"
            >
              <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
              {backLabel}
            </Link>

            <header>
              <h1 className="text-2xl sm:text-3xl font-light text-white tracking-tight mb-2 sm:mb-3">
                {title}
              </h1>
              {(lastUpdated || version) && (
                <p className="text-sm text-zinc-500">
                  {lastUpdated ? `Última atualização: ${lastUpdated}` : null}
                  {lastUpdated && version ? (
                    <span className="text-zinc-600"> · </span>
                  ) : null}
                  {version ? (
                    <span data-testid="legal-page-version">Versão {version}</span>
                  ) : null}
                </p>
              )}
            </header>

            <div
              className="border-t border-zinc-800 mt-6 sm:mt-8 pt-6 sm:pt-8"
              role="separator"
              aria-hidden="true"
            />
          </div>

          <div className="flex flex-1 flex-col lg:flex-row min-h-0 gap-4 sm:gap-6 lg:gap-10 xl:gap-14 mt-4 sm:mt-6">
            <div className="shrink-0 min-w-0 lg:hidden -mx-1">
              <Collapsible open={tocOpen} onOpenChange={setTocOpen}>
                <CollapsibleTrigger className="flex w-full items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900/30 px-4 py-3 text-sm font-medium text-white">
                  Índice
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 text-zinc-400 transition-transform duration-200",
                      tocOpen && "rotate-180"
                    )}
                    aria-hidden
                  />
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-2 rounded-xl border border-zinc-800 bg-zinc-900/20 px-2 py-3">
                  <TableOfContents
                    sections={sections}
                    activeId={activeId}
                    onNavigate={scrollToSection}
                  />
                </CollapsibleContent>
              </Collapsible>
            </div>

            <aside className="hidden lg:block shrink-0 min-w-0 w-64 xl:w-72">
              <p className="text-xs uppercase tracking-wider text-zinc-500 mb-4">
                Índice
              </p>
              <TableOfContents
                sections={sections}
                activeId={activeId}
                onNavigate={scrollToSection}
              />
            </aside>

            <article
              ref={contentRef}
              className="flex-1 min-h-0 min-w-0 max-w-3xl lg:max-w-none overflow-y-auto overflow-x-hidden scroll-smooth overscroll-contain pb-8 sm:pb-10"
              data-testid="legal-page-content"
              tabIndex={-1}
            >
              {children}
            </article>
          </div>
        </div>
      </main>
    </div>
  );
}
