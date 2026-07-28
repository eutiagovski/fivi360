import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { shouldFinalizeCheckoutSuccess } from "@/config/billing";
import { trackEvent } from "@/services/analytics/analyticsService";

const POLL_INTERVAL_MS = 2000;
const MAX_POLL_MS = 20000;

/**
 * Sincroniza plano e billing após retorno do Stripe Checkout (`?checkout=success`).
 * Só finaliza sucesso quando `users.plan` satisfaz especificamente `requestedPlanId`.
 */
export function useCheckoutSuccessSync({
  checkoutStatus,
  sessionId = null,
  requestedPlanId = null,
  refreshPlan,
  onInvoicesReload,
  toast,
}) {
  const [, setSearchParams] = useSearchParams();
  const [confirming, setConfirming] = useState(false);
  const [confirmMessage, setConfirmMessage] = useState(null);
  const handledRef = useRef(false);

  const clearCheckoutParams = useCallback(() => {
    setSearchParams(
      (prev) => {
        if (
          !prev.has("checkout")
          && !prev.has("session_id")
          && !prev.has("plan")
        ) {
          return prev;
        }

        const next = new URLSearchParams(prev);
        next.delete("checkout");
        next.delete("session_id");
        next.delete("plan");
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
    let finalized = false;

    const finishSuccess = () => {
      if (cancelled || finalized) {
        return;
      }

      finalized = true;
      setConfirming(false);
      setConfirmMessage(null);
      clearCheckoutParams();
      toast({
        title: "Assinatura",
        description: "Assinatura ativada com sucesso.",
      });
    };

    const finishTimeout = () => {
      if (cancelled || finalized) {
        return;
      }

      finalized = true;
      setConfirming(false);
      setConfirmMessage(
        "Pagamento recebido. Sua assinatura pode levar alguns instantes para atualizar.",
      );
      clearCheckoutParams();
    };

    const poll = async () => {
      if (cancelled || finalized) {
        return;
      }

      const context = await refreshPlan();

      if (
        shouldFinalizeCheckoutSuccess({
          checkoutStatus,
          sessionId,
          requestedPlanId,
          context,
        })
      ) {
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
  }, [
    checkoutStatus,
    sessionId,
    requestedPlanId,
    refreshPlan,
    onInvoicesReload,
    toast,
    clearCheckoutParams,
  ]);

  return { confirming, confirmMessage };
}
