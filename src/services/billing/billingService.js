/**
 * Serviço de billing agnóstico ao provedor — placeholders até integração.
 *
 * Integração futura (via Cloud Functions / backend):
 *
 * Stripe:
 * - createCheckoutSession → Stripe Checkout
 * - createBillingPortalSession → Stripe Customer Portal
 *
 * Mercado Pago:
 * - createCheckoutSession → assinatura/preapproval ou checkout MP
 * - createBillingPortalSession → página própria ou link externo de gestão
 *
 * @see src/config/billing.js
 * @see docs/billing-provider-plan.md
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
 * Abre portal de gestão de cobrança do provedor ativo.
 * @returns {Promise<{ ok: false, message: string } | { ok: true, url: string }>}
 */
export async function createBillingPortalSession() {
  return NOT_ACTIVE;
}

/**
 * Solicita cancelamento ao final do período (ou imediato, conforme provedor).
 * @returns {Promise<{ ok: false, message: string }>}
 */
export async function cancelSubscription() {
  return NOT_ACTIVE;
}

/**
 * Resumo de billing para a UI (Firestore + provedor quando ativo).
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
