/**
 * RC-HELP-CENTER-FOUNDATION-1 — rota pública /ajuda
 */

const fs = require("fs");
const path = require("path");

describe("help routes — RC-HELP-CENTER-FOUNDATION-1", () => {
  const appSource = fs.readFileSync(
    path.join(__dirname, "../App.js"),
    "utf8",
  );

  it("keeps /ajuda as PUBLIC_ALWAYS with HelpCenterApp", () => {
    expect(appSource).toMatch(/path="\/ajuda\/\*"/);
    expect(appSource).toMatch(/HelpCenterApp/);
    expect(appSource).toMatch(/PUBLIC_ALWAYS — Central de Ajuda/);
  });

  it("does not wrap /ajuda in ProtectedRoute, GuestRoute or LegalConsentGate", () => {
    const helpBlock = appSource.slice(
      appSource.indexOf("PUBLIC_ALWAYS — Central de Ajuda"),
      appSource.indexOf("PUBLIC_ALWAYS — Home institucional"),
    );

    expect(helpBlock).toContain("HelpCenterApp");
    expect(helpBlock).toContain("PublicAlwaysRoute");
    expect(helpBlock).not.toMatch(/ProtectedRoute/);
    expect(helpBlock).not.toMatch(/GuestRoute/);
    expect(helpBlock).not.toMatch(/LegalConsentGate/);
  });

  it("redirects legacy /help to /ajuda without ProtectedRoute", () => {
    expect(appSource).toMatch(
      /path="\/help"\s+element=\{<Navigate to="\/ajuda" replace \/>\}/,
    );
    expect(appSource).not.toMatch(
      /path="\/help"\s+element=\{<ProtectedRoute>/,
    );
  });
});
