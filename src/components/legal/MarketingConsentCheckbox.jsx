import { Checkbox } from "@/components/ui/checkbox";

export const MARKETING_CONSENT_LABEL =
  "Quero receber novidades e atualizações do FIVI360.";

/**
 * Checkbox opcional de consentimento de marketing (desmarcado por padrão).
 * Separado do aceite obrigatório de Termos e Privacidade.
 *
 * @param {{
 *   checked: boolean,
 *   onCheckedChange: (checked: boolean) => void,
 *   disabled?: boolean,
 *   id?: string,
 *   testId?: string,
 * }} props
 */
export function MarketingConsentCheckbox({
  checked,
  onCheckedChange,
  disabled = false,
  id = "marketing-consent",
  testId = "marketing-consent-checkbox",
}) {
  return (
    <div className="flex items-start gap-3">
      <Checkbox
        id={id}
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
        data-testid={testId}
        className="mt-0.5 shrink-0 border-zinc-600 data-[state=checked]:bg-white data-[state=checked]:text-black"
      />
      <label
        htmlFor={id}
        className="text-sm text-zinc-400 leading-relaxed cursor-pointer select-none break-words"
      >
        {MARKETING_CONSENT_LABEL}
      </label>
    </div>
  );
}
