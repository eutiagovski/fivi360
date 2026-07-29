export const AuthHeader = ({ logoTestId = "auth-logo" }) => (
  <header className="border-b border-zinc-800 p-6">
    <div className="max-w-md mx-auto">
      <h1
        className="text-xl font-light tracking-tighter text-white text-center"
        data-testid={logoTestId}
      >
        FIVI<span className="font-medium">360</span>
      </h1>
    </div>
  </header>
);
