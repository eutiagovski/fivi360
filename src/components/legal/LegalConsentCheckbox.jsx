import { Link } from "react-router-dom";
import { Checkbox } from "@/components/ui/checkbox";

/**
 * Checkbox de aceite dos Termos e Política de Privacidade.
 *
 * @param {{
 *   checked: boolean,
 *   onCheckedChange: (checked: boolean) => void,
 *   disabled?: boolean,
 *   id?: string,
 *   testId?: string,
 * }} props
 */
export function LegalConsentCheckbox({
  checked,
  onCheckedChange,
  disabled = false,
  id = "legal-consent",
  testId = "legal-consent-checkbox",
}) {
  return (
    <div className="flex items-start gap-3">
      <Checkbox
        id={id}
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
        data-testid={testId}
        className="mt-0.5 border-zinc-600 data-[state=checked]:bg-white data-[state=checked]:text-black"
      />
      <label
        htmlFor={id}
        className="text-sm text-zinc-400 leading-relaxed cursor-pointer select-none"
      >
        Li e aceito os{" "}
        <Link
          to="/termos"
          target="_blank"
          rel="noopener noreferrer"
          className="text-white hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          Termos de Uso
        </Link>{" "}
        e a{" "}
        <Link
          to="/privacidade"
          target="_blank"
          rel="noopener noreferrer"
          className="text-white hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          Política de Privacidade
        </Link>
        .
      </label>
    </div>
  );
}
