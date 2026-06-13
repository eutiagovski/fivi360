import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
  getInvoicesByUserId,
  mapInvoicesToBillingRows,
} from "@/services/billing/invoiceService";
import {
  INVOICES_INITIAL_PAGE_SIZE,
  INVOICES_LOAD_MORE_PAGE_SIZE,
} from "@/utils/paginationConstants";

/**
 * Lista paginada de faturas para a página de planos (scroll infinito, 5 em 5).
 * Ordenação global por paidAt → failedAt → createdAt (desc).
 */
export function useInvoicesPage() {
  const { user } = useAuth();
  const [allInvoices, setAllInvoices] = useState([]);
  const [visibleCount, setVisibleCount] = useState(INVOICES_INITIAL_PAGE_SIZE);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);

  const hasMore = visibleCount < allInvoices.length;

  const loadMore = useCallback(() => {
    if (!hasMore || loadingMore || loadingInitial) {
      return;
    }

    setLoadingMore(true);

    setVisibleCount((current) =>
      Math.min(current + INVOICES_LOAD_MORE_PAGE_SIZE, allInvoices.length),
    );

    setLoadingMore(false);
  }, [allInvoices.length, hasMore, loadingInitial, loadingMore]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!user?.uid) {
        if (!cancelled) {
          setAllInvoices([]);
          setVisibleCount(INVOICES_INITIAL_PAGE_SIZE);
          setLoadingInitial(false);
        }
        return;
      }

      if (!cancelled) {
        setLoadingInitial(true);
        setError(null);
      }

      try {
        const invoices = await getInvoicesByUserId(user.uid);

        if (!cancelled) {
          setAllInvoices(invoices);
          setVisibleCount(INVOICES_INITIAL_PAGE_SIZE);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err);
          setAllInvoices([]);
          setVisibleCount(INVOICES_INITIAL_PAGE_SIZE);
        }
      } finally {
        if (!cancelled) {
          setLoadingInitial(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [user?.uid]);

  const visibleInvoices = useMemo(
    () => allInvoices.slice(0, visibleCount),
    [allInvoices, visibleCount],
  );

  const billingRows = useMemo(
    () => mapInvoicesToBillingRows(visibleInvoices),
    [visibleInvoices],
  );

  return {
    invoices: billingRows,
    loadingInitial,
    loadingMore,
    hasMore,
    error,
    loadMore,
  };
}
