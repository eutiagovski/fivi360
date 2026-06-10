/**
 * @param {{ children: import("react").ReactNode }} props
 */
export function PublicPageShell({ children }) {
  return (
    <div className="min-h-screen bg-[#050505] fade-in">
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
      <main className="max-w-7xl mx-auto p-8 md:p-12 lg:p-16">{children}</main>
      <footer className="border-t border-zinc-800 mt-16 p-6">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-sm text-zinc-500">
            Powered by <span className="text-white font-medium">FIVI360</span>
          </p>
        </div>
      </footer>
    </div>
  );
}

/**
 * @param {{ title: string, description?: string, dataTestId?: string }} props
 */
export function PublicPageMessage({ title, description, dataTestId }) {
  return (
    <PublicPageShell>
      <div className="flex flex-col items-center justify-center py-24 text-center">
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
