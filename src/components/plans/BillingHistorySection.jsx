import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useInfiniteScrollSentinel } from "@/hooks/useInfiniteScrollSentinel";
import { useInvoicesPage } from "@/hooks/useInvoicesPage";

const actionLinkClassName =
  "text-white underline-offset-4 hover:underline whitespace-nowrap";

/**
 * Histórico de cobrança com faturas Stripe persistidas em Firestore.
 */
export function BillingHistorySection({ invoiceReloadSignal = 0 }) {
  const {
    invoices,
    loadingInitial,
    loadingMore,
    hasMore,
    error,
    loadMore,
    refreshSilent,
  } = useInvoicesPage();

  useEffect(() => {
    if (invoiceReloadSignal > 0) {
      void refreshSilent();
    }
  }, [invoiceReloadSignal, refreshSilent]);

  const sentinelRef = useInfiniteScrollSentinel({
    hasMore,
    loadingMore,
    onLoadMore: loadMore,
  });

  const hasInvoices = invoices.length > 0;

  return (
    <div
      className="bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden"
      data-testid="billing-history-section"
    >
      {error && (
        <p
          className="px-6 py-4 text-sm text-red-400 border-b border-zinc-800"
          data-testid="billing-history-error"
        >
          Não foi possível carregar o histórico de cobrança. Tente recarregar a
          página.
        </p>
      )}

      <Table>
        <TableHeader>
          <TableRow className="border-zinc-800 hover:bg-transparent">
            <TableHead className="text-zinc-400 font-medium px-6">Data</TableHead>
            <TableHead className="text-zinc-400 font-medium">Plano</TableHead>
            <TableHead className="text-zinc-400 font-medium">Status</TableHead>
            <TableHead className="text-zinc-400 font-medium">Valor</TableHead>
            <TableHead className="text-zinc-400 font-medium px-6">Ação</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loadingInitial ? (
            <TableRow className="border-zinc-800 hover:bg-transparent">
              <TableCell
                colSpan={5}
                className="px-6 py-10 text-center"
                data-testid="billing-history-loading"
              >
                <Loader2
                  size={20}
                  className="animate-spin text-zinc-400 mx-auto"
                />
              </TableCell>
            </TableRow>
          ) : !hasInvoices ? (
            <TableRow className="border-zinc-800 hover:bg-transparent">
              <TableCell
                colSpan={5}
                className="px-6 py-10 text-center text-sm text-zinc-500"
                data-testid="billing-history-empty"
              >
                Nenhuma cobrança disponível.
              </TableCell>
            </TableRow>
          ) : (
            invoices.map((invoice, index) => (
              <TableRow
                key={invoice.id}
                className="border-zinc-800 hover:bg-zinc-800/30"
                data-testid={`billing-history-row-${index}`}
              >
                <TableCell className="text-zinc-300 px-6">{invoice.date}</TableCell>
                <TableCell className="text-zinc-300">{invoice.plan}</TableCell>
                <TableCell className="text-zinc-300">{invoice.status}</TableCell>
                <TableCell className="text-zinc-300">{invoice.amount}</TableCell>
                <TableCell className="text-zinc-300 px-6">
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                    {invoice.hostedInvoiceUrl ? (
                      <a
                        href={invoice.hostedInvoiceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={actionLinkClassName}
                        data-testid={`billing-history-invoice-link-${index}`}
                      >
                        Ver fatura
                      </a>
                    ) : null}
                    {invoice.invoicePdf ? (
                      <a
                        href={invoice.invoicePdf}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={actionLinkClassName}
                        data-testid={`billing-history-pdf-link-${index}`}
                      >
                        PDF
                      </a>
                    ) : null}
                    {!invoice.hostedInvoiceUrl && !invoice.invoicePdf ? "—" : null}
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {hasInvoices && (
        <>
          <div ref={sentinelRef} className="h-1" aria-hidden="true" />

          {loadingMore && (
            <div
              className="flex items-center justify-center py-6 border-t border-zinc-800"
              data-testid="billing-history-loading-more"
            >
              <Loader2 size={20} className="animate-spin text-zinc-400" />
            </div>
          )}
        </>
      )}
    </div>
  );
}
