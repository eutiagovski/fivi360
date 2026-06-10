import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const SIZE_MAX_WIDTH = {
  sm: "max-w-sm sm:max-w-sm",
  md: "max-w-md sm:max-w-md",
  lg: "max-w-lg sm:max-w-lg",
};

/** Largura, margem mobile, padding e radius — referência: EditImageDialog / UploadImageDialog */
export const APP_MODAL_CONTENT_BASE =
  "bg-zinc-900 border-zinc-800 text-white w-[calc(100%-2rem)] max-h-[90dvh] overflow-hidden p-4 sm:p-6 rounded-2xl";

/** Footer de ações: centralizado no mobile, à direita no desktop */
export const APP_MODAL_FOOTER_CLASSES =
  "shrink-0 mt-4 flex flex-row flex-wrap justify-center items-center gap-2 w-full sm:mt-0 sm:justify-end sm:flex-nowrap sm:gap-2";

export function appModalContentClassName(size = "md", className) {
  return cn(APP_MODAL_CONTENT_BASE, SIZE_MAX_WIDTH[size], "gap-0", className);
}

/** Mesmo padrão visual do AppModal para AlertDialog (confirmações) */
export function appAlertContentClassName(size = "lg", className) {
  return cn(APP_MODAL_CONTENT_BASE, SIZE_MAX_WIDTH[size], "gap-4", className);
}

/**
 * Modal padrão do FIVI360 (estrutura, largura, scroll e footer).
 * Referência visual: modais de hotspot (HotspotFormDialog).
 */
export function AppModal({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  size = "md",
  className,
  bodyClassName,
  testId,
  dismissLocked = false,
  contentProps,
}) {
  const handleOpenChange = (nextOpen) => {
    if (!nextOpen && dismissLocked) {
      return;
    }
    onOpenChange?.(nextOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        {...contentProps}
        className={cn(
          appModalContentClassName(size),
          contentProps?.className,
          className,
        )}
        data-testid={testId}
        onPointerDownOutside={(event) => {
          if (dismissLocked) {
            event.preventDefault();
          }
          contentProps?.onPointerDownOutside?.(event);
        }}
        onEscapeKeyDown={(event) => {
          if (dismissLocked) {
            event.preventDefault();
          }
          contentProps?.onEscapeKeyDown?.(event);
        }}
      >
        <div className="flex min-h-0 min-w-0 flex-col overflow-hidden">
          <DialogHeader className="shrink-0 space-y-1.5 text-left">
            <DialogTitle className="pr-8 text-white font-medium tracking-tight break-words">
              {title}
            </DialogTitle>
            {description ? (
              <DialogDescription className="text-sm text-zinc-400 break-words">
                {description}
              </DialogDescription>
            ) : null}
          </DialogHeader>

          <div
            className={cn(
              "min-w-0 flex-1 overflow-x-hidden overflow-y-auto py-2",
              bodyClassName,
            )}
          >
            {children}
          </div>

          {footer ? <AppModalFooter>{footer}</AppModalFooter> : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Footer padrão: ações centralizadas no mobile, alinhadas à direita no desktop.
 */
export function AppModalFooter({ children, className }) {
  return (
    <DialogFooter
      className={cn(APP_MODAL_FOOTER_CLASSES, className)}
    >
      {children}
    </DialogFooter>
  );
}
