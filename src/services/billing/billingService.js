/**
 * Serviço de billing via Mercado Pago — fundação para integração futura.
 *
 * Leitura: users.plan, subscriptions/{uid}, invoices (por userId).
 * Escrita/checkout/webhooks: Cloud Functions (sprint futura).
 *
 * @see src/config/billing.js
 * @see docs/billing-foundation.md
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import {
  isPaidPlan,
  isSubscriptionActive,
  mapInvoiceToDisplayRow,
  normalizeInvoice,
  normalizeSubscription,
  normalizeUserPlan,
  PAYMENTS_COMING_SOON_MESSAGE,
} from "@/config/billing";
import { db } from "@/config/firebase";
import { createSubscriptionCheckout } from "@/services/billing/subscriptionCheckoutService";

export {
  isPaidPlan,
  isSubscriptionActive,
  normalizeUserPlan,
};

/**
 * Plano atual do usuário a partir de `users/{uid}.plan`.
 *
 * @param {{ plan?: unknown } | null | undefined} user
 * @returns {import("@/config/billing").UserPlan}
 */
export function getCurrentPlan(user) {
  return normalizeUserPlan(user?.plan);
}

/**
 * Assinatura em `subscriptions/{uid}` — null se não existir (Starter implícito).
 *
 * @param {string} userId
 * @returns {Promise<import("@/config/billing").Subscription | null>}
 */
export async function getSubscription(userId) {
  if (!userId) {
    return null;
  }

  const snapshot = await getDoc(doc(db, "subscriptions", userId));

  if (!snapshot.exists()) {
    return null;
  }

  return normalizeSubscription(snapshot.data());
}

/**
 * Faturas do usuário em `invoices` (ordenadas por createdAt desc).
 *
 * @param {string} userId
 * @returns {Promise<import("@/config/billing").Invoice[]>}
 */
export async function getInvoices(userId) {
  if (!userId) {
    return [];
  }

  const invoicesQuery = query(
    collection(db, "invoices"),
    where("userId", "==", userId),
    orderBy("createdAt", "desc"),
  );

  const snapshot = await getDocs(invoicesQuery);

  return snapshot.docs.map((docSnap) =>
    normalizeInvoice(docSnap.id, docSnap.data()),
  );
}

/**
 * Faturas formatadas para a tabela de histórico na UI.
 *
 * @param {string} userId
 * @returns {Promise<Array<{ date: string, plan: string, status: string, amount: string, invoiceUrl?: string }>>}
 */
export async function getInvoiceDisplayRows(userId) {
  const invoices = await getInvoices(userId);
  return invoices.map(mapInvoiceToDisplayRow);
}

/**
 * Inicia checkout de assinatura no Mercado Pago.
 *
 * @param {string} planId
 * @returns {Promise<{ ok: true, checkoutUrl: string }>}
 */
export async function requestUpgrade(planId) {
  const { checkoutUrl } = await createSubscriptionCheckout(planId);
  return { ok: true, checkoutUrl };
}

/**
 * Solicita cancelamento de assinatura — placeholder até integração Mercado Pago.
 *
 * @returns {Promise<{ ok: false, message: string }>}
 */
export async function requestCancelSubscription() {
  return { ok: false, message: PAYMENTS_COMING_SOON_MESSAGE };
}
