import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/**
 * Exibe título e descrição de um hotspot informativo ao clicar no viewer.
 */
export function HotspotInfoDialog({ hotspot, open, onOpenChange }) {
  if (!hotspot) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="bg-zinc-900 border-zinc-800 text-white sm:max-w-md"
        data-testid="hotspot-info-dialog"
      >
        <DialogHeader>
          <DialogTitle className="text-white font-medium tracking-tight">
            {hotspot.title}
          </DialogTitle>
        </DialogHeader>
        {hotspot.description ? (
          <p className="text-sm text-zinc-300 whitespace-pre-wrap">
            {hotspot.description}
          </p>
        ) : (
          <p className="text-sm text-zinc-500">Sem descrição.</p>
        )}
      </DialogContent>
    </Dialog>
  );
}
