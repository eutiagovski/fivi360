export const AuthCard = ({ title, subtitle, titleTestId, children }) => (
  <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-8 md:p-10">
    <div className="text-center mb-8">
      <h2
        className="text-3xl sm:text-4xl font-light tracking-tight text-white mb-2"
        data-testid={titleTestId}
      >
        {title}
      </h2>
      {subtitle && <p className="text-zinc-400">{subtitle}</p>}
    </div>
    {children}
  </div>
);
