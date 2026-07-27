import { PublicPortfolioHeader } from "@/components/public/PublicPortfolioHeader";
import { PublicPoweredByFooter } from "@/components/public/PublicPoweredByFooter";

function PublicPlatformHeader() {
  return (
    <header className="border-b border-zinc-800 p-6">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <h1
          className="text-2xl font-light tracking-tighter text-white"
          data-testid="public-logo"
        >
          FIVI<span className="font-medium">360</span>
        </h1>
      </div>
    </header>
  );
}

function PublicMinimalHeader() {
  return <header className="border-b border-zinc-800" aria-hidden="true" />;
}

/**
 * @param {{
 *   children: import("react").ReactNode,
 *   office?: import("@/services/users/userService").PublicUserProfile | null,
 *   headerMode?: "office" | "platform" | "minimal",
 * }} props
 */
export function PublicPageShell({
  children,
  office,
  headerMode = "platform",
}) {
  const resolvedHeaderMode = office ? "office" : headerMode;

  return (
    <div className="min-h-screen bg-[#050505] fade-in flex flex-col">
      {resolvedHeaderMode === "office" && (
        <PublicPortfolioHeader user={office} />
      )}
      {resolvedHeaderMode === "platform" && <PublicPlatformHeader />}
      {resolvedHeaderMode === "minimal" && <PublicMinimalHeader />}
      <main className="flex-1 max-w-7xl mx-auto w-full p-8 md:p-12 lg:p-16">
        {children}
      </main>
      <PublicPoweredByFooter />
    </div>
  );
}

/**
 * @param {{
 *   title: string,
 *   description?: string,
 *   dataTestId?: string,
 *   headerMode?: "office" | "platform" | "minimal",
 * }} props
 */
export function PublicPageMessage({
  title,
  description,
  dataTestId,
  headerMode = "platform",
}) {
  return (
    <PublicPageShell headerMode={headerMode}>
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <h1
          className="text-3xl sm:text-4xl font-light tracking-tighter text-white mb-4"
          data-testid={dataTestId}
        >
          {title}
        </h1>
        {description && (
          <p className="text-base text-zinc-400 max-w-md">{description}</p>
        )}
      </div>
    </PublicPageShell>
  );
}
