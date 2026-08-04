/**
 * RC-PLAN-USAGE-BILLING-DISPLAY-1 — próxima cobrança / mapper billing.
 */

import {
  BILLING_STATUS,
  formatBillingDate,
  getCancelAtPeriodEndAccessMessage,
  getSubscriptionPeriodDisplay,
  getSubscriptionPeriodEndDate,
  NEXT_BILLING_UNAVAILABLE_LABEL,
  normalizeBilling,
} from "@/config/billing";

describe("RC-PLAN-USAGE-BILLING-DISPLAY-1 — next billing display", () => {
  const periodEnd = new Date("2026-09-15T15:00:00.000Z");

  test("normalizeBilling mapeia currentPeriodEnd e nextBillingAt para Date", () => {
    const fromPeriodEnd = normalizeBilling({
      provider: "stripe",
      subscriptionStatus: "active",
      currentPeriodEnd: periodEnd,
    });

    expect(fromPeriodEnd.currentPeriodEnd).toEqual(periodEnd);
    expect(fromPeriodEnd.nextInvoiceDate).toEqual(periodEnd);

    const fromAlias = normalizeBilling({
      provider: "stripe",
      subscriptionStatus: "active",
      nextBillingAt: { seconds: Math.floor(periodEnd.getTime() / 1000), nanoseconds: 0 },
    });

    expect(fromAlias.currentPeriodEnd).toBeInstanceOf(Date);
    expect(fromAlias.nextInvoiceDate).toBeInstanceOf(Date);
    expect(fromAlias.nextInvoiceDate?.getTime()).toBe(periodEnd.getTime());
  });

  test("normalizeBilling aceita Timestamp-like, Date e epoch ms", () => {
    const asDate = normalizeBilling({
      provider: "stripe",
      currentPeriodEnd: periodEnd,
    });
    const asEpoch = normalizeBilling({
      provider: "stripe",
      currentPeriodEnd: periodEnd.getTime(),
    });
    const asTimestamp = normalizeBilling({
      provider: "stripe",
      currentPeriodEnd: { toDate: () => periodEnd },
    });

    expect(asDate.currentPeriodEnd).toEqual(periodEnd);
    expect(asEpoch.currentPeriodEnd).toEqual(periodEnd);
    expect(asTimestamp.currentPeriodEnd).toEqual(periodEnd);
  });

  test("active exibe próxima cobrança", () => {
    const billing = normalizeBilling({
      provider: "stripe",
      subscriptionStatus: BILLING_STATUS.ACTIVE,
      currentPeriodEnd: periodEnd,
    });
    const display = getSubscriptionPeriodDisplay(billing);

    expect(display.visible).toBe(true);
    expect(display.label).toBe("Próxima cobrança");
    expect(display.value).toBe(formatBillingDate(periodEnd));
    expect(display.value).toMatch(/setembro/i);
    expect(display.value).toMatch(/2026/);
  });

  test("trialing usa período de teste", () => {
    const billing = normalizeBilling({
      provider: "stripe",
      subscriptionStatus: BILLING_STATUS.TRIALING,
      currentPeriodEnd: periodEnd,
    });
    const display = getSubscriptionPeriodDisplay(billing);

    expect(display.label).toBe("Período de teste até");
    expect(display.value).toBe(formatBillingDate(periodEnd));
  });

  test("cancelAtPeriodEnd exibe acesso até, não renovação", () => {
    const billing = normalizeBilling({
      provider: "stripe",
      subscriptionStatus: BILLING_STATUS.ACTIVE,
      cancelAtPeriodEnd: true,
      currentPeriodEnd: periodEnd,
    });
    const display = getSubscriptionPeriodDisplay(billing);

    expect(display.label).toBe("Acesso disponível até");
    expect(display.value).toBe(formatBillingDate(periodEnd));
    expect(
      getCancelAtPeriodEndAccessMessage(display.value),
    ).toContain("permanece disponível até");
  });

  test("canceled não exibe próxima cobrança", () => {
    const billing = normalizeBilling({
      provider: "stripe",
      subscriptionStatus: BILLING_STATUS.CANCELED,
      currentPeriodEnd: periodEnd,
    });
    const display = getSubscriptionPeriodDisplay(billing);

    expect(display.visible).toBe(false);
  });

  test("past_due / unpaid não inventam data de cobrança", () => {
    const pastDue = getSubscriptionPeriodDisplay(
      normalizeBilling({
        provider: "stripe",
        subscriptionStatus: BILLING_STATUS.PAST_DUE,
        currentPeriodEnd: periodEnd,
      }),
    );
    const unpaid = getSubscriptionPeriodDisplay(
      normalizeBilling({
        provider: "stripe",
        subscriptionStatus: BILLING_STATUS.UNPAID,
      }),
    );

    expect(pastDue.visible).toBe(true);
    expect(pastDue.value).toBe(NEXT_BILLING_UNAVAILABLE_LABEL);
    expect(unpaid.value).toBe(NEXT_BILLING_UNAVAILABLE_LABEL);
  });

  test("data ausente usa fallback neutro", () => {
    const billing = normalizeBilling({
      provider: "stripe",
      subscriptionStatus: BILLING_STATUS.ACTIVE,
    });
    const display = getSubscriptionPeriodDisplay(billing);

    expect(getSubscriptionPeriodEndDate(billing)).toBeNull();
    expect(display.value).toBe(NEXT_BILLING_UNAVAILABLE_LABEL);
  });

  test("data inválida não quebra formatação", () => {
    expect(formatBillingDate(null)).toBe("—");
    expect(formatBillingDate("not-a-date")).toBe("—");
    expect(formatBillingDate(Number.NaN)).toBe("—");
    expect(getSubscriptionPeriodEndDate(null)).toBeNull();
  });

  test("timezone America/Sao_Paulo não desloca o dia civil da data", () => {
    // 15/09/2026 00:30 UTC → ainda 14/09 à noite em SP; usamos meio-dia UTC
    // para ancorar o dia civil esperado na UI BR.
    const middayUtc = new Date("2026-09-15T12:00:00.000Z");
    const label = formatBillingDate(middayUtc);

    expect(label).toMatch(/15/);
    expect(label).toMatch(/setembro/i);
    expect(label).toMatch(/2026/);
  });
});
