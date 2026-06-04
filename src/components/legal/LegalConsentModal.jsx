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

const CONSENT_REQUIRED_MESSAGE =
  "Você precisa aceitar os Termos de Uso e a Política de Privacidade para continuar.";

/**
 * Modal obrigatório de aceite legal (usuários antigos ou primeiro acesso Google).
 *
 * @param {{
 *   open: boolean,
 *   onAccept: () => Promise<void>,
 *   onSignOut: () => Promise<void>,
 *   isSubmitting?: boolean,
 * }} props
 */
export function LegalConsentModal({
  open,
  onAccept,
  onSignOut,
  isSubmitting = false,
}) {
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState(null);

  const handleAccept = async () => {
    if (!accepted) {
      setError(CONSENT_REQUIRED_MESSAGE);
      return;
    }

    setError(null);

    try {
      await onAccept();
      setAccepted(false);
    } catch {
      setError("Não foi possível registrar o aceite. Tente novamente.");
    }
  };

  const handleSignOut = async () => {
    setError(null);

    try {
      await onSignOut();
      setAccepted(false);
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

        {error && (
          <div
            role="alert"
            className="rounded-xl border border-red-900/50 bg-red-950/30 px-4 py-3 text-sm text-red-300"
            data-testid="legal-consent-modal-error"
          >
            {error}
          </div>
        )}

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

        <DialogFooter className="flex-col sm:flex-col gap-2 sm:gap-2">
          <button
            type="button"
            onClick={handleAccept}
            disabled={isSubmitting}
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
