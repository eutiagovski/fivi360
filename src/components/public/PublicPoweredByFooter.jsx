const FIVI360_URL = "https://fivi360.com.br";

export function PublicPoweredByFooter() {
  return (
    <footer className="border-t border-zinc-800/60 mt-16 py-6">
      <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-16 text-center">
        <a
          href={FIVI360_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block text-[11px] leading-none tracking-wide text-zinc-600 hover:text-zinc-400 transition-colors"
          data-testid="public-powered-by"
        >
          Powered by <span className="text-zinc-500">FIVI360</span>
        </a>
      </div>
    </footer>
  );
}
