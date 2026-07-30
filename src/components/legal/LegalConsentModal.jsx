import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { LegalConsentCheckbox } from "@/components/legal/LegalConsentCheckbox";
import { MarketingConsentCheckbox } from "@/components/legal/MarketingConsentCheckbox";

const CONSENT_REQUIRED_MESSAGE =
  "Você precisa aceitar os Termos de Uso e a Política de Privacidade para continuar.";

/**
 * Modal obrigatório de aceite legal (usuários antigos ou primeiro acesso Google).
 *
 * @param {{
 *   open: boolean,
 *   onAccept: (payload: { marketingConsent: boolean }) => Promise<void>,
 *   onSignOut: () => Promise<void>,
 *   isSubmitting?: boolean,
 *   errorMessage?: string | null,
 *   showMarketingConsent?: boolean,
 * }} props
 */
export function LegalConsentModal({
  open,
  onAccept,
  onSignOut,
  isSubmitting = false,
  errorMessage = null,
  showMarketingConsent = false,
}) {
  const [accepted, setAccepted] = useState(false);
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [error, setError] = useState(null);
  const displayError = errorMessage || error;

  const handleAccept = async () => {
    if (!accepted) {
      setError(CONSENT_REQUIRED_MESSAGE);
      return;
    }

    setError(null);

    try {
      await onAccept({
        marketingConsent: showMarketingConsent ? marketingConsent === true : false,
      });
      setAccepted(false);
      setMarketingConsent(false);
    } catch {
      setError("Não foi possível registrar o aceite. Tente novamente.");
    }
  };

  const handleSignOut = async () => {
    setError(null);

    try {
      await onSignOut();
      setAccepted(false);
      setMarketingConsent(false);
    } catch {
      setError("Não foi possível sair da conta. Tente novamente.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent
        className="bg-zinc-900 border-zinc-800 text-white sm:max-w-md [&>button]:hidden"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        data-testid="legal-consent-modal"
      >
        <DialogHeader>
          <DialogTitle className="text-white text-left">
            Atualização dos Termos e Política de Privacidade
          </DialogTitle>
          <DialogDescription className="text-zinc-400 text-left">
            Para continuar usando o FIVI360, leia e aceite os Termos de Uso e a
            Política de Privacidade.
          </DialogDescription>
        </DialogHeader>

        {displayError && (
          <div
            role="alert"
            className="rounded-xl border border-red-900/50 bg-red-950/30 px-4 py-3 text-sm text-red-300"
            data-testid="legal-consent-modal-error"
          >
            {displayError}
          </div>
        )}

        <div className="space-y-4">
          <LegalConsentCheckbox
            id="legal-consent-modal"
            checked={accepted}
            onCheckedChange={(value) => {
              setAccepted(value === true);
              if (error) {
                setError(null);
              }
            }}
            disabled={isSubmitting}
            testId="legal-consent-modal-checkbox"
          />

          {showMarketingConsent && (
            <div
              className="border-t border-zinc-800 pt-4"
              data-testid="legal-consent-modal-marketing-section"
            >
              <MarketingConsentCheckbox
                id="legal-consent-modal-marketing"
                checked={marketingConsent}
                onCheckedChange={(value) => {
                  setMarketingConsent(value === true);
                }}
                disabled={isSubmitting}
                testId="legal-consent-modal-marketing-checkbox"
              />
            </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-col gap-2 sm:gap-2">
          <button
            type="button"
            onClick={handleAccept}
            disabled={isSubmitting || !accepted}
            data-testid="legal-consent-accept-btn"
            className="w-full px-8 py-3 bg-white text-black rounded-full font-medium btn-scale hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Salvando..." : "Aceitar e continuar"}
          </button>
          <button
            type="button"
            onClick={handleSignOut}
            disabled={isSubmitting}
            data-testid="legal-consent-signout-btn"
            className="w-full px-8 py-3 rounded-full font-medium text-sm bg-zinc-800 border border-zinc-700 text-white hover:bg-zinc-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Sair
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export { CONSENT_REQUIRED_MESSAGE };
