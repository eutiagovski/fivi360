import { HelpFooter } from "@/help/components/HelpFooter";
import { HelpHeader } from "@/help/components/HelpHeader";

/**
 * Shell da Central de Ajuda. Isolado do Layout autenticado.
 *
 * @param {{ children: import("react").ReactNode, withSidebar?: boolean, sidebar?: import("react").ReactNode }} props
 */
export function HelpLayout({ children, sidebar }) {
  return (
    <div
      className="flex min-h-dvh flex-col bg-[#050505] text-zinc-300 fade-in"
      data-testid="help-layout"
    >
      <HelpHeader />
      <main className="mx-auto flex w-full min-w-0 max-w-7xl flex-1 flex-col px-4 py-8 sm:px-6 sm:py-10 md:px-10 lg:px-16">
        {sidebar ? (
          <div className="flex flex-1 flex-col gap-8 lg:flex-row lg:gap-12">
            <div className="w-full shrink-0 lg:w-60 xl:w-64">{sidebar}</div>
            <div className="min-w-0 flex-1">{children}</div>
          </div>
        ) : (
          children
        )}
      </main>
      <HelpFooter />
    </div>
  );
}
