/**
 * Serviço de faturas Stripe persistidas em `invoices/{invoiceId}`.
 *
 * @see functions/src/stripeWebhook.js
 */

import {
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { db } from "@/config/firebase";
import {
  formatBillingDate,
  formatInvoiceAmount,
  getInvoiceStatusLabel,
} from "@/config/billing";
import { getPlanLimits } from "@/config/planLimits";
import { toAppDate, toMillis } from "@/services/firebase/dates";

/**
 * @typedef {Object} Invoice
 * @property {string} id
 * @property {string | null} userId
 * @property {string | null} provider
 * @property {string | null} providerInvoiceId
 * @property {string | null} providerSubscriptionId
 * @property {string | null} providerCustomerId
 * @property {string | null} planId
 * @property {string | null} status
 * @property {number | null} amount
 * @property {string | null} currency
 * @property {string | null} hostedInvoiceUrl
 * @property {string | null} invoicePdf
 * @property {Date | null} paidAt
 * @property {Date | null} failedAt
 * @property {Date | null} createdAt
 * @property {Date | null} updatedAt
 */

/**
 * @typedef {Object} BillingInvoiceRow
 * @property {string} id
 * @property {string} date
 * @property {string} plan
 * @property {string} status
 * @property {string} amount
 * @property {string | null} hostedInvoiceUrl
 * @property {string | null} invoicePdf
 */

/**
 * @param {unknown} value
 * @returns {number | null}
 */
function timestampToMillis(value) {
  const ms = toMillis(value);
  return ms > 0 ? ms : null;
}

/**
 * Data efetiva para exibição e ordenação: paidAt → failedAt → createdAt.
 *
 * @param {Invoice} invoice
 * @returns {Invoice["paidAt"]}
 */
export function getInvoiceEffectiveAt(invoice) {
  return invoice.paidAt ?? invoice.failedAt ?? invoice.createdAt ?? null;
}

/**
 * @param {Invoice[]} invoices
 * @returns {Invoice[]}
 */
export function sortInvoicesByEffectiveAt(invoices) {
  return [...invoices].sort((left, right) => {
    const leftMs = timestampToMillis(getInvoiceEffectiveAt(left)) ?? 0;
    const rightMs = timestampToMillis(getInvoiceEffectiveAt(right)) ?? 0;
    return rightMs - leftMs;
  });
}

/**
 * @param {string} id
 * @param {Record<string, unknown>} data
 * @returns {Invoice}
 */
function mapInvoiceDoc(id, data) {
  return {
    id,
    userId: typeof data.userId === "string" ? data.userId : null,
    provider: typeof data.provider === "string" ? data.provider : null,
    providerInvoiceId:
      typeof data.providerInvoiceId === "string" ? data.providerInvoiceId : id,
    providerSubscriptionId:
      typeof data.providerSubscriptionId === "string"
        ? data.providerSubscriptionId
        : null,
    providerCustomerId:
      typeof data.providerCustomerId === "string"
        ? data.providerCustomerId
        : null,
    planId: typeof data.planId === "string" ? data.planId : null,
    status: typeof data.status === "string" ? data.status : null,
    amount: typeof data.amount === "number" ? data.amount : null,
    currency: typeof data.currency === "string" ? data.currency : null,
    hostedInvoiceUrl:
      typeof data.hostedInvoiceUrl === "string" ? data.hostedInvoiceUrl : null,
    invoicePdf: typeof data.invoicePdf === "string" ? data.invoicePdf : null,
    paidAt: toAppDate(data.paidAt),
    failedAt: toAppDate(data.failedAt),
    createdAt: toAppDate(data.createdAt),
    updatedAt: toAppDate(data.updatedAt),
  };
}

/**
 * Lista faturas do usuário logado, ordenadas por paidAt / failedAt / createdAt (desc).
 *
 * @param {string} userId
 * @returns {Promise<Invoice[]>}
 */
export async function getInvoicesByUserId(userId) {
  const invoicesQuery = query(
    collection(db, "invoices"),
    where("userId", "==", userId),
  );

  const snapshot = await getDocs(invoicesQuery);
  const invoices = snapshot.docs.map((docSnap) =>
    mapInvoiceDoc(docSnap.id, docSnap.data()),
  );

  return sortInvoicesByEffectiveAt(invoices);
}

/**
 * @param {Invoice} invoice
 * @returns {BillingInvoiceRow}
 */
export function mapInvoiceToBillingRow(invoice) {
  const planLimits = invoice.planId ? getPlanLimits(invoice.planId) : null;

  return {
    id: invoice.id,
    date: formatBillingDate(getInvoiceEffectiveAt(invoice)),
    plan: planLimits?.displayName ?? invoice.planId ?? "—",
    status: getInvoiceStatusLabel(invoice.status),
    amount: formatInvoiceAmount(invoice.amount, invoice.currency),
    hostedInvoiceUrl: invoice.hostedInvoiceUrl,
    invoicePdf: invoice.invoicePdf,
  };
}

/**
 * @param {Invoice[]} invoices
 * @returns {BillingInvoiceRow[]}
 */
export function mapInvoicesToBillingRows(invoices) {
  return invoices.map(mapInvoiceToBillingRow);
}
