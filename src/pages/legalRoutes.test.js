/**
 * RC-LEGAL-DOCS-GOLIVE-1 — rotas públicas dos documentos legais.
 */

const fs = require("fs");
const path = require("path");

describe("legal routes — RC-LEGAL-DOCS-GOLIVE-1", () => {
  const appSource = fs.readFileSync(
    path.join(__dirname, "../App.js"),
    "utf8",
  );

  it("keeps /termos and /privacidade as public legal pages", () => {
    expect(appSource).toMatch(
      /path="\/termos"\s+element=\{<TermsOfUse \/>\}/,
    );
    expect(appSource).toMatch(
      /path="\/privacidade"\s+element=\{<PrivacyPolicy \/>\}/,
    );
    expect(appSource).toMatch(/PUBLIC_ALWAYS — legais/);
  });

  it("does not wrap legal pages in ProtectedRoute or GuestRoute", () => {
    const legalBlock = appSource.slice(
      appSource.indexOf("PUBLIC_ALWAYS — legais"),
      appSource.indexOf("PUBLIC_ALWAYS — Home institucional"),
    );

    expect(legalBlock).toContain("TermsOfUse");
    expect(legalBlock).toContain("PrivacyPolicy");
    expect(legalBlock).not.toMatch(/ProtectedRoute/);
    expect(legalBlock).not.toMatch(/GuestRoute/);
    expect(legalBlock).not.toMatch(/LegalConsentGate/);
  });
});
