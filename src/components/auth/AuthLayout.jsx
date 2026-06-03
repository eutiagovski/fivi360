import { AuthHeader } from "./AuthHeader";

export const AuthLayout = ({ children, pageTestId, logoTestId }) => (
  <div
    className="min-h-screen bg-[#050505] flex flex-col fade-in"
    data-testid={pageTestId}
  >
    <AuthHeader logoTestId={logoTestId} />
    <main className="flex-1 flex items-center justify-center p-8 md:p-12">
      <div className="w-full max-w-md">{children}</div>
    </main>
  </div>
);
