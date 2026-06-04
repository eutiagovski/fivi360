export function LandingLayout({ header, children, footer }) {
  return (
    <div className="min-h-screen bg-[#050505] flex flex-col fade-in" data-testid="landing-page">
      {header}
      <main className="flex-1">{children}</main>
      {footer}
    </div>
  );
}
