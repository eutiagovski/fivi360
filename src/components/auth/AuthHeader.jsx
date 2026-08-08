import { BrandLogo } from "@/components/common/BrandLogo";

export const AuthHeader = ({ logoTestId = "auth-logo" }) => (
  <header className="border-b border-zinc-800 p-6">
    <div className="max-w-md mx-auto flex justify-center">
      <BrandLogo testId={logoTestId} className="h-7" />
    </div>
  </header>
);
