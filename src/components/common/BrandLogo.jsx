import logoSrc from "@/assets/img/fivi360_logo.png";
import { cn } from "@/lib/utils";

/**
 * Marca visual FIVI360 (wordmark em imagem).
 */
export function BrandLogo({
  className,
  alt = "FIVI360",
  testId,
  ...imgProps
}) {
  return (
    <img
      src={logoSrc}
      alt={alt}
      data-testid={testId}
      className={cn("h-4 md:h-5 w-auto object-contain", className)}
      {...imgProps}
    />
  );
}
