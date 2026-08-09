/**
 * Local HTML preview for transactional emails (no Resend send).
 *
 * Usage (from repo root):
 *   node functions/scripts/preview-emails.js
 *
 * Writes fixtures to functions/email-previews/*.html
 * Open the files in a browser to review desktop/mobile layout.
 */

process.env.APP_BASE_URL = process.env.APP_BASE_URL || "https://app.fivi360.com.br";

const fs = require("fs");
const path = require("path");

const {
  buildPaymentSuccessEmail,
} = require("../src/email/templates/paymentSuccess");
const {
  buildPaymentFailedEmail,
} = require("../src/email/templates/paymentFailed");
const {
  buildSubscriptionCanceledEmail,
} = require("../src/email/templates/subscriptionCanceled");
const {
  buildSubscriptionCancellationScheduledEmail,
} = require("../src/email/templates/subscriptionCancellationScheduled");
const { welcomeEmail } = require("../src/emailTemplates/welcomeEmail");
const { verifyEmail } = require("../src/emailTemplates/verifyEmail");
const { passwordResetEmail } = require("../src/emailTemplates/passwordResetEmail");
const { upgradeRequestedEmail } = require("../src/emailTemplates/upgradeRequestedEmail");

const OUT_DIR = path.join(__dirname, "..", "email-previews");

const FIXTURES = {
  "payment-success": buildPaymentSuccessEmail({
    name: "Tiago Machado",
    planId: "studio",
    amount: 19900,
    currency: "brl",
    paidAt: new Date("2026-08-04T17:14:00.000Z"),
    currentPeriodEnd: new Date("2026-09-04T17:14:00.000Z"),
    nextBillingAt: new Date("2026-09-04T17:14:00.000Z"),
  }),
  "payment-failed": buildPaymentFailedEmail({
    name: "Tiago Machado",
    planId: "studio",
    amount: 19900,
    currency: "brl",
    nextPaymentAttempt: new Date("2026-08-06T17:14:00.000Z"),
    currentPeriodEnd: new Date("2026-09-04T17:14:00.000Z"),
  }),
  "subscription-canceled": buildSubscriptionCanceledEmail({
    name: "Tiago Machado",
    planIdAnterior: "studio",
    canceledAt: new Date("2026-08-04T17:14:00.000Z"),
  }),
  "subscription-cancellation-scheduled": buildSubscriptionCancellationScheduledEmail({
    name: "Tiago Machado",
    planId: "studio",
    currentPeriodEnd: new Date("2026-09-04T17:14:00.000Z"),
  }),
  welcome: welcomeEmail({
    name: "Tiago Machado",
    companyName: "Studio Exemplo",
  }),
  "verify-email": verifyEmail({
    name: "Tiago Machado",
    verificationLink:
      "https://app.fivi360.com.br/verify-email/action?mode=verifyEmail&oobCode=preview-code",
  }),
  "password-reset": passwordResetEmail({
    resetLink:
      "https://app.fivi360.com.br/reset-password/action?mode=resetPassword&oobCode=preview-code",
  }),
  "upgrade-requested": upgradeRequestedEmail({
    name: "Tiago Machado",
    planName: "Studio",
  }),
};

fs.mkdirSync(OUT_DIR, { recursive: true });

const indexRows = [];

for (const [slug, result] of Object.entries(FIXTURES)) {
  const htmlPath = path.join(OUT_DIR, `${slug}.html`);
  const textPath = path.join(OUT_DIR, `${slug}.txt`);
  fs.writeFileSync(htmlPath, result.html, "utf8");
  fs.writeFileSync(textPath, result.text, "utf8");
  indexRows.push(
    `<li><a href="./${slug}.html">${slug}</a> — ${result.subject}</li>`,
  );
  console.log(`Wrote ${htmlPath}`);
}

const indexHtml = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <title>FIVI360 email previews</title>
  <style>
    body { font-family: Arial, Helvetica, sans-serif; max-width: 640px; margin: 40px auto; padding: 0 16px; color: #1a1a1a; }
    a { color: #1a1a1a; }
  </style>
</head>
<body>
  <h1>FIVI360 — previews de e-mail</h1>
  <p>Fixtures fictícios. Não envia e-mail real.</p>
  <ul>
    ${indexRows.join("\n    ")}
  </ul>
</body>
</html>`;

fs.writeFileSync(path.join(OUT_DIR, "index.html"), indexHtml, "utf8");
console.log(`Index: ${path.join(OUT_DIR, "index.html")}`);
