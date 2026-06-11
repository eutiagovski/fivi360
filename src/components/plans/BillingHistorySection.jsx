import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

/**
 * Histórico de cobrança (vazio até integração de billing).
 *
 * @param {{ invoices?: Array<{ date: string, plan: string, status: string, amount: string, invoiceUrl?: string }> }} props
 */
export function BillingHistorySection({ invoices = [] }) {
  const hasInvoices = invoices.length > 0;

  return (
    <div
      className="bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden"
      data-testid="billing-history-section"
    >
      <Table>
        <TableHeader>
          <TableRow className="border-zinc-800 hover:bg-transparent">
            <TableHead className="text-zinc-400 font-medium px-6">Data</TableHead>
            <TableHead className="text-zinc-400 font-medium">Plano</TableHead>
            <TableHead className="text-zinc-400 font-medium">Status</TableHead>
            <TableHead className="text-zinc-400 font-medium">Valor</TableHead>
            <TableHead className="text-zinc-400 font-medium px-6">Fatura</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {!hasInvoices ? (
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
                key={`${invoice.date}-${index}`}
                className="border-zinc-800 hover:bg-zinc-800/30"
                data-testid={`billing-history-row-${index}`}
              >
                <TableCell className="text-zinc-300 px-6">{invoice.date}</TableCell>
                <TableCell className="text-zinc-300">{invoice.plan}</TableCell>
                <TableCell className="text-zinc-300">{invoice.status}</TableCell>
                <TableCell className="text-zinc-300">{invoice.amount}</TableCell>
                <TableCell className="text-zinc-300 px-6">
                  {invoice.invoiceUrl ? (
                    <a
                      href={invoice.invoiceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-white underline-offset-4 hover:underline"
                    >
                      Ver fatura
                    </a>
                  ) : (
                    "—"
                  )}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
