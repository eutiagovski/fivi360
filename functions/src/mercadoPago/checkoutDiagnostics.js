const { logger } = require("firebase-functions");
const { fetchMercadoPagoAccountInfo } = require("./account");
const { fetchMercadoPagoPreapprovalPlan } = require("./plan");
const { maskEmailForLog } = require("./preapproval");

class CheckoutDiagnosticError extends Error {
  constructor(message) {
    super(message);
    this.name = "CheckoutDiagnosticError";
  }
}

/**
 * @param {{
 *   tokenAccount: Awaited<ReturnType<typeof fetchMercadoPagoAccountInfo>>,
 *   planInfo: Awaited<ReturnType<typeof fetchMercadoPagoPreapprovalPlan>>,
 * }} params
 */
function validateCheckoutConsistency({ tokenAccount, planInfo }) {
  const tokenAccountId = String(tokenAccount.accountId || "").trim();
  const collectorId = String(planInfo.collectorId || "").trim();

  if (collectorId && tokenAccountId && collectorId !== tokenAccountId) {
    throw new CheckoutDiagnosticError("Plano Mercado Pago pertence a outra conta.");
  }

  if (tokenAccount.environment === "sandbox" && planInfo.looksLikeProduction) {
    throw new CheckoutDiagnosticError(
      "Plano Mercado Pago parece ser de produção; use plano criado com vendedor teste no ambiente sandbox.",
    );
  }

  if (tokenAccount.environment === "sandbox" && !tokenAccount.isTestAccount) {
    logger.warn(
      "createSubscriptionCheckout: Token sandbox pertence à conta real; para testes de pagamento use vendedor teste.",
      {
        accountId: tokenAccountId,
        isTestAccount: tokenAccount.isTestAccount,
        environment: tokenAccount.environment,
      },
    );
  }
}

/**
 * @param {{
 *   tokenAccount: Awaited<ReturnType<typeof fetchMercadoPagoAccountInfo>>,
 *   planInfo: Awaited<ReturnType<typeof fetchMercadoPagoPreapprovalPlan>>,
 * }} params
 * @returns {{
 *   collectorMatchesToken: boolean,
 *   planIsActive: boolean,
 *   amountGreaterThanZero: boolean,
 *   currencyIsBrl: boolean,
 *   recurrenceIsMonthly: boolean,
 *   planTokenConsistent: boolean,
 * }}
 */
function auditPlanTokenConsistency({ tokenAccount, planInfo }) {
  const tokenAccountId = String(tokenAccount.accountId || "").trim();
  const collectorId = String(planInfo.collectorId || "").trim();
  const { autoRecurring } = planInfo;

  const collectorMatchesToken =
    Boolean(collectorId && tokenAccountId) && collectorId === tokenAccountId;
  const planIsActive = planInfo.status === "active";
  const amountGreaterThanZero =
    typeof autoRecurring.transactionAmount === "number" &&
    autoRecurring.transactionAmount > 0;
  const currencyIsBrl = autoRecurring.currencyId === "BRL";
  const recurrenceIsMonthly =
    autoRecurring.frequencyType === "months" && autoRecurring.frequency === 1;
  const planTokenConsistent =
    collectorMatchesToken &&
    planIsActive &&
    amountGreaterThanZero &&
    currencyIsBrl &&
    recurrenceIsMonthly;

  return {
    collectorMatchesToken,
    planIsActive,
    amountGreaterThanZero,
    currencyIsBrl,
    recurrenceIsMonthly,
    planTokenConsistent,
  };
}

/**
 * Consulta conta e plano no Mercado Pago, valida consistência e registra diagnóstico.
 *
 * @param {{
 *   accessToken: string,
 *   mpPlanId: string,
 *   planId: string,
 *   checkoutUrl: string,
 *   payerEmail?: string,
 * }} params
 */
async function diagnoseCheckoutOrigin({
  accessToken,
  mpPlanId,
  planId,
  checkoutUrl,
  payerEmail,
}) {
  const tokenAccount = await fetchMercadoPagoAccountInfo(accessToken);

  logger.info("createSubscriptionCheckout: token account", {
    accountId: tokenAccount.accountId,
    email: maskEmailForLog(tokenAccount.email),
    nickname: tokenAccount.nickname,
    isTestAccount: tokenAccount.isTestAccount,
    environment: tokenAccount.environment,
  });

  const planInfo = await fetchMercadoPagoPreapprovalPlan(accessToken, mpPlanId);

  /** @type {Record<string, unknown>} */
  const planLog = {
    planId: planInfo.mpPlanId,
    collector_id: planInfo.collectorId,
    status: planInfo.status,
    reason: planInfo.reason,
    init_point: planInfo.initPoint,
    auto_recurring: planInfo.autoRecurring,
  };

  if (planInfo.paymentMethodsAllowed !== null && planInfo.paymentMethodsAllowed !== undefined) {
    planLog.payment_methods_allowed = planInfo.paymentMethodsAllowed;
  }

  logger.info("createSubscriptionCheckout: Mercado Pago plan", planLog);

  validateCheckoutConsistency({ tokenAccount, planInfo });

  const audit = auditPlanTokenConsistency({ tokenAccount, planInfo });

  logger.info("createSubscriptionCheckout: plan/token audit", {
    ...audit,
    transactionAmount: planInfo.autoRecurring.transactionAmount,
    currencyId: planInfo.autoRecurring.currencyId,
    frequency: planInfo.autoRecurring.frequency,
    frequencyType: planInfo.autoRecurring.frequencyType,
  });

  const payerEmailNormalized = String(payerEmail || "")
    .trim()
    .toLowerCase();
  const sellerEmailNormalized = String(tokenAccount.email || "")
    .trim()
    .toLowerCase();
  const payerMatchesSeller =
    Boolean(payerEmailNormalized && sellerEmailNormalized) &&
    payerEmailNormalized === sellerEmailNormalized;

  if (payerMatchesSeller) {
    logger.warn("createSubscriptionCheckout: payer email matches seller token email", {
      payerEmail: maskEmailForLog(payerEmail),
      sellerEmail: maskEmailForLog(tokenAccount.email),
    });
  }

  const likelyBlockedBySameBuyerSeller = payerMatchesSeller
    ? true
    : audit.planTokenConsistent
      ? "provavel — plano/token consistentes; se o botão estiver desabilitado, use comprador teste diferente do vendedor no Mercado Pago"
      : false;

  logger.info("createSubscriptionCheckout: checkout testing instruction", {
    instruction:
      "Checkout deve ser testado com conta comprador teste diferente da conta vendedora.",
    payerEmail: payerEmail ? maskEmailForLog(payerEmail) : null,
    sellerAccountId: tokenAccount.accountId,
    sellerEmail: maskEmailForLog(tokenAccount.email),
    payerMatchesSeller,
    likelyBlockedBySameBuyerSeller,
  });

  logger.info("createSubscriptionCheckout: checkout URL", {
    checkoutUrl,
    planId,
    mpPlanId,
    accountId: tokenAccount.accountId,
    collector_id: planInfo.collectorId,
    planTokenConsistent: audit.planTokenConsistent,
  });

  return { tokenAccount, planInfo, audit };
}

module.exports = {
  CheckoutDiagnosticError,
  auditPlanTokenConsistency,
  diagnoseCheckoutOrigin,
};
