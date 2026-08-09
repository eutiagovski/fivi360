/**
 * RC-EMAIL-TEMPLATE-1 — contract tests for transactional email templates.
 *
 * Focus: render contract, dynamic data, CTA URLs, shared layout, escaping.
 * Not pixel-perfect.
 */

process.env.APP_BASE_URL = "https://app.fivi360.com.br";

const {
  APP_URL,
  PRIVACY_URL,
  TERMS_URL,
  escapeHtml,
  buildPrimaryButton,
  buildSummaryCard,
  wrapEmailHtml,
} = require("../../functions/src/emailTemplates/shared");
const {
  buildPaymentSuccessEmail,
} = require("../../functions/src/email/templates/paymentSuccess");
const {
  buildPaymentFailedEmail,
} = require("../../functions/src/email/templates/paymentFailed");
const {
  buildSubscriptionCanceledEmail,
} = require("../../functions/src/email/templates/subscriptionCanceled");
const {
  buildSubscriptionCancellationScheduledEmail,
} = require("../../functions/src/email/templates/subscriptionCancellationScheduled");
const { welcomeEmail } = require("../../functions/src/emailTemplates/welcomeEmail");
const { verifyEmail } = require("../../functions/src/emailTemplates/verifyEmail");
const {
  passwordResetEmail,
} = require("../../functions/src/emailTemplates/passwordResetEmail");
const {
  upgradeRequestedEmail,
} = require("../../functions/src/emailTemplates/upgradeRequestedEmail");
const {
  resolveEmailTemplate,
} = require("../../functions/src/emailTemplates");
const { EMAIL_TYPES } = require("../../functions/src/config/email");

const PROD_PLAN_URL = "https://app.fivi360.com.br/plan";

/** Manual fixture from RC acceptance criteria. */
const PAYMENT_SUCCESS_FIXTURE = {
  name: "Tiago Machado",
  planId: "studio",
  amount: 19900,
  currency: "brl",
  // 2026-08-04 14:14 America/Sao_Paulo ≈ 17:14 UTC
  paidAt: new Date("2026-08-04T17:14:00.000Z"),
  currentPeriodEnd: new Date("2026-09-04T17:14:00.000Z"),
  nextBillingAt: new Date("2026-09-04T17:14:00.000Z"),
};

function assertNoBrokenPlaceholders(html) {
  expect(html).not.toMatch(/undefined/);
  expect(html).not.toMatch(/\[object Object\]/);
}

function assertSharedLayout(html) {
  expect(html).toContain("FIVI360");
  expect(html).toContain(`href="${APP_URL}"`);
  expect(html).toContain(PRIVACY_URL);
  expect(html).toContain(TERMS_URL);
  expect(html).toContain("Política de Privacidade");
  expect(html).toContain("Termos de Uso");
  expect(html).toContain("max-width: 560px");
  expect(html).toContain("Todos os direitos reservados");
  expect(html).toContain("&copy;");
  expect(html).not.toContain("Apresentações 360°");
}

describe("escapeHtml", () => {
  test("escapes HTML-sensitive characters", () => {
    expect(escapeHtml(`<script>alert("x")</script>&'`)).toBe(
      "&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;&amp;&#39;",
    );
  });
});

describe("buildPrimaryButton", () => {
  test("renders full-width centered CTA with safe href", () => {
    const html = buildPrimaryButton("Gerenciar assinatura", PROD_PLAN_URL);
    expect(html).toContain("Gerenciar assinatura");
    expect(html).toContain(`href="${PROD_PLAN_URL}"`);
    expect(html).toContain("width: 100%");
    expect(html).toContain("text-align: center");
    expect(html).toContain("background-color: #1a1a1a");
  });

  test("rejects non-http URLs", () => {
    expect(buildPrimaryButton("Click", "javascript:alert(1)")).toBe("");
  });
});

describe("buildSummaryCard", () => {
  test("renders heading and escaped values", () => {
    const html = buildSummaryCard("Resumo da cobrança", [
      { label: "Plano", value: "Studio" },
      { label: "Valor", value: '<img src=x onerror=alert(1)>' },
    ]);
    expect(html).toContain("Resumo da cobrança");
    expect(html).toContain("Studio");
    expect(html).toContain("&lt;img src=x onerror=alert(1)&gt;");
    expect(html).not.toContain("<img src=x");
  });
});

describe("payment_success template", () => {
  const result = buildPaymentSuccessEmail(PAYMENT_SUCCESS_FIXTURE);

  test("renders HTML and text", () => {
    expect(result.html).toBeTruthy();
    expect(result.text).toBeTruthy();
    expect(result.subject).toBe("Pagamento confirmado — FIVI360 Studio");
  });

  test("includes name, plan, amount, and date", () => {
    expect(result.html).toContain("Tiago Machado");
    expect(result.html).toContain("Studio");
    expect(result.html).toMatch(/R\$\s*199,00/);
    expect(result.html).toMatch(/4 de agosto de 2026/);
    expect(result.text).toContain("Tiago Machado");
    expect(result.text).toContain("Studio");
    expect(result.text).toMatch(/R\$\s*199,00/);
  });

  test("includes CTA with correct URL", () => {
    expect(result.html).toContain("Gerenciar assinatura");
    expect(result.html).toContain(`href="${PROD_PLAN_URL}"`);
    expect(result.text).toContain(`Gerenciar assinatura: ${PROD_PLAN_URL}`);
  });

  test("uses shared brand header, footer, privacy and terms", () => {
    assertSharedLayout(result.html);
    expect(result.html).toMatch(/letter-spacing:\s*0\.14em/);
    expect(result.html).toContain("&#10003;");
  });

  test("production HTML has no localhost and no broken placeholders", () => {
    expect(result.html.toLowerCase()).not.toContain("localhost");
    assertNoBrokenPlaceholders(result.html);
    assertNoBrokenPlaceholders(result.text);
  });

  test("escapes user-controlled name in HTML", () => {
    const injected = buildPaymentSuccessEmail({
      ...PAYMENT_SUCCESS_FIXTURE,
      name: `<img src=x onerror=alert(1)>`,
    });
    expect(injected.html).toContain("&lt;img src=x onerror=alert(1)&gt;");
    expect(injected.html).not.toContain("<img src=x onerror=alert(1)>");
  });

  test("text/plain remains semantically equivalent", () => {
    expect(result.text).toContain("Pagamento confirmado — FIVI360 Studio");
    expect(result.text).toContain("Resumo da cobrança");
    expect(result.text).toContain("Política de Privacidade");
    expect(result.text).toContain("Termos de Uso");
  });
});

describe("other transactional templates share layout", () => {
  const cases = [
    {
      name: "payment_failed",
      result: buildPaymentFailedEmail({
        name: "Tiago",
        planId: "studio",
        amount: 19900,
        currency: "brl",
      }),
      cta: "Atualizar forma de pagamento",
      statusMark: "!",
    },
    {
      name: "subscription_canceled",
      result: buildSubscriptionCanceledEmail({
        name: "Tiago",
        planIdAnterior: "studio",
        canceledAt: new Date("2026-08-04T17:14:00.000Z"),
      }),
      cta: "Reativar assinatura",
    },
    {
      name: "subscription_cancellation_scheduled",
      result: buildSubscriptionCancellationScheduledEmail({
        name: "Tiago",
        planId: "studio",
        currentPeriodEnd: new Date("2026-09-04T17:14:00.000Z"),
      }),
      cta: "Gerenciar assinatura",
    },
    {
      name: "welcome",
      result: welcomeEmail({ name: "Tiago", companyName: "Studio TM" }),
      cta: "Acessar meu painel",
    },
    {
      name: "verify_email",
      result: verifyEmail({
        name: "Tiago",
        verificationLink: "https://app.fivi360.com.br/verify-email/action?oobCode=abc",
      }),
      cta: "Confirmar e-mail",
    },
    {
      name: "password_reset",
      result: passwordResetEmail({
        resetLink: "https://app.fivi360.com.br/reset-password/action?oobCode=abc",
      }),
      cta: "Redefinir senha",
    },
    {
      name: "upgrade_requested",
      result: upgradeRequestedEmail({ name: "Tiago", planName: "Studio" }),
      cta: "Ver planos",
    },
  ];

  test.each(cases)("$name uses shared layout and CTA", ({ result, cta, statusMark }) => {
    expect(result.html).toBeTruthy();
    expect(result.text).toBeTruthy();
    expect(result.subject).toBeTruthy();
    assertSharedLayout(result.html);
    expect(result.html).toContain(cta);
    assertNoBrokenPlaceholders(result.html);
    if (statusMark) {
      expect(result.html).toContain(statusMark);
    }
  });

  test("verify and reset reject missing links", () => {
    expect(() => verifyEmail({})).toThrow(/verificationLink/);
    expect(() => passwordResetEmail({})).toThrow(/resetLink/);
  });

  test("welcome escapes companyName", () => {
    const result = welcomeEmail({
      name: "Tiago",
      companyName: "<b>Evil</b>",
    });
    expect(result.html).toContain("&lt;b&gt;Evil&lt;/b&gt;");
    expect(result.html).not.toContain("<b>Evil</b>");
  });
});

describe("resolveEmailTemplate router", () => {
  test("routes payment_success through shared layout", () => {
    const result = resolveEmailTemplate(
      EMAIL_TYPES.PAYMENT_SUCCESS,
      PAYMENT_SUCCESS_FIXTURE,
    );
    expect(result.subject).toContain("Pagamento confirmado");
    assertSharedLayout(result.html);
  });
});

describe("wrapEmailHtml layout contract", () => {
  test("centers brand and full-width CTA", () => {
    const html = wrapEmailHtml({
      title: "Teste",
      bodyHtml: "<p>corpo</p>",
      ctaLabel: "Ação",
      ctaUrl: "https://fivi360.com.br/plan",
      status: "success",
    });
    expect(html).toContain('align="center"');
    expect(html).toContain("width: 100%");
    expect(html).toContain("Ação");
    expect(html).not.toContain("localhost");
  });
});
