import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Check, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { UPGRADE_PATH } from "@/components/plans/UpgradePrompt";

const FEATURE_COPY = {
  hotspots: {
    title: "Recurso Premium",
    message:
      "Hotspots interativos estão disponíveis apenas no plano Professional.",
    benefits: [
      "Hotspots de informação",
      "Hotspots de navegação",
      "Tours virtuais completos",
    ],
  },
  portfolio: {
    title: "Recurso Premium",
    message:
      "O Portfólio Público está disponível apenas no plano Professional.",
    benefits: [
      "Página pública do escritório",
      "Compartilhamento profissional",
      "Exposição dos projetos",
    ],
  },
};

/**
 * Modal de recurso premium (Starter → upgrade).
 *
 * @param {{
 *   open: boolean,
 *   onOpenChange: (open: boolean) => void,
 *   feature: 'hotspots' | 'portfolio',
 * }} props
 */
export function PremiumFeatureModal({ open, onOpenChange, feature }) {
  const navigate = useNavigate();
  const copy = FEATURE_COPY[feature];

  const handleUpgrade = () => {
    onOpenChange(false);
    navigate(UPGRADE_PATH);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="bg-zinc-900 border-zinc-800 text-white sm:max-w-md"
        data-testid={`premium-modal-${feature}`}
      >
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles size={20} className="text-amber-400" />
            <DialogTitle className="text-white">{copy.title}</DialogTitle>
          </div>
          <DialogDescription className="text-zinc-400 text-left">
            {copy.message}
          </DialogDescription>
        </DialogHeader>

        <ul className="space-y-3 py-2">
          {copy.benefits.map((benefit) => (
            <li key={benefit} className="flex items-start gap-3 text-sm text-zinc-300">
              <div className="mt-0.5 p-0.5 bg-white rounded-full flex-shrink-0">
                <Check size={12} className="text-black" />
              </div>
              {benefit}
            </li>
          ))}
        </ul>

        <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-2">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            data-testid="premium-modal-dismiss"
            className="w-full sm:w-auto px-6 py-2.5 rounded-full text-sm font-medium bg-zinc-800 border border-zinc-700 text-white hover:bg-zinc-700 transition-colors"
          >
            Agora não
          </button>
          <button
            type="button"
            onClick={handleUpgrade}
            data-testid="premium-modal-upgrade"
            className="w-full sm:w-auto px-6 py-2.5 rounded-full text-sm font-medium bg-white text-black hover:bg-zinc-200 transition-colors btn-scale"
          >
            Fazer Upgrade
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
