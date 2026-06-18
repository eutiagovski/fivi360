import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { PLAN_IDS } from "@/config/planLimits";
import { trackEvent } from "@/services/analytics/analyticsService";

const POLL_INTERVAL_MS = 2000;
const MAX_POLL_MS = 20000;

/**
 * Sincroniza plano e billing após retorno do Stripe Checkout (`?checkout=success`).
 */
export function useCheckoutSuccessSync({
  checkoutStatus,
  refreshPlan,
  onInvoicesReload,
  toast,
}) {
  const [, setSearchParams] = useSearchParams();
  const [confirming, setConfirming] = useState(false);
  const [confirmMessage, setConfirmMessage] = useState(null);
  const handledRef = useRef(false);

  const clearCheckoutParam = useCallback(() => {
    setSearchParams(
      (prev) => {
        if (!prev.has("checkout")) {
          return prev;
        }

        const next = new URLSearchParams(prev);
        next.delete("checkout");
        return next;
      },
      { replace: true },
    );
  }, [setSearchParams]);

  useEffect(() => {
    if (checkoutStatus !== "success" || handledRef.current) {
      return;
    }

    handledRef.current = true;
    setConfirming(true);
    setConfirmMessage("Estamos confirmando sua assinatura...");
    trackEvent("subscription_success");

    let cancelled = false;
    let intervalId = null;
    const startedAt = Date.now();

    const finishSuccess = () => {
      if (cancelled) {
        return;
      }

      setConfirming(false);
      setConfirmMessage(null);
      clearCheckoutParam();
      toast({
        title: "Assinatura",
        description: "Assinatura ativada com sucesso.",
      });
    };

    const finishTimeout = () => {
      if (cancelled) {
        return;
      }

      setConfirming(false);
      setConfirmMessage(
        "Pagamento recebido. Sua assinatura pode levar alguns instantes para atualizar.",
      );
      clearCheckoutParam();
    };

    const poll = async () => {
      if (cancelled) {
        return;
      }

      const context = await refreshPlan();

      if (context?.planId === PLAN_IDS.PROFESSIONAL) {
        if (intervalId) {
          clearInterval(intervalId);
        }

        onInvoicesReload?.();
        finishSuccess();
        return;
      }

      if (Date.now() - startedAt >= MAX_POLL_MS) {
        if (intervalId) {
          clearInterval(intervalId);
        }

        onInvoicesReload?.();
        finishTimeout();
      }
    };

    void poll();
    intervalId = setInterval(() => {
      void poll();
    }, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;

      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [checkoutStatus, refreshPlan, onInvoicesReload, toast, clearCheckoutParam]);

  return { confirming, confirmMessage };
}
