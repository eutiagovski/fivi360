/**
 * Serviço de billing via Mercado Pago — placeholders até integração.
 *
 * Integração futura (via Cloud Functions / backend):
 * - createCheckoutSession → assinatura recorrente / preapproval Mercado Pago
 * - createBillingPortalSession → página própria ou link externo de gestão
 * - cancelSubscription → cancelamento ao final do período
 * - getBillingSummary / getInvoices → agrega Firestore + Mercado Pago
 *
 * @see src/config/billing.js
 * @see docs/mercado-pago-billing-plan.md
 */

import { BILLING_NOT_ACTIVE_MESSAGE } from "@/config/billing";

const NOT_ACTIVE = { ok: false, message: BILLING_NOT_ACTIVE_MESSAGE };

/**
 * Inicia checkout para o plano informado.
 * @param {string} planId — ex.: "professional" | "enterprise"
 * @returns {Promise<{ ok: false, message: string } | { ok: true, url: string }>}
 */
export async function createCheckoutSession(planId) {
  void planId;
  return NOT_ACTIVE;
}

/**
 * Abre portal de gestão de assinatura.
 * @returns {Promise<{ ok: false, message: string } | { ok: true, url: string }>}
 */
export async function createBillingPortalSession() {
  return NOT_ACTIVE;
}

/**
 * Solicita cancelamento ao final do período (ou imediato, conforme política MP).
 * @returns {Promise<{ ok: false, message: string }>}
 */
export async function cancelSubscription() {
  return NOT_ACTIVE;
}

/**
 * Resumo de billing para a UI (Firestore + Mercado Pago quando ativo).
 * @returns {Promise<{ ok: false, message: string } | { ok: true, summary: object }>}
 */
export async function getBillingSummary() {
  return NOT_ACTIVE;
}

/**
 * Lista faturas/cobranças do usuário.
 * @returns {Promise<{ ok: false, message: string, invoices: [] }>}
 */
export async function getInvoices() {
  return { ...NOT_ACTIVE, invoices: [] };
}
