/**
 * RC-LP-ROUTING-1 — matriz de classificação e wiring em App.js
 */

const fs = require("fs");
const path = require("path");

describe("App routing architecture — RC-LP-ROUTING-1", () => {
  const appSource = fs.readFileSync(
    path.join(__dirname, "../../App.js"),
    "utf8",
  );

  it("Home / is PUBLIC_ALWAYS (PublicAlwaysRoute, no guest redirect)", () => {
    expect(appSource).toMatch(
      /path="\/"\s+element=\{<PublicAlwaysRoute><Landing/,
    );
    expect(appSource).not.toMatch(
      /path="\/"\s+element=\{<LandingRoute>.*Navigate/,
    );
  });

  it("/lp/acesso-antecipado is PUBLIC_ALWAYS", () => {
    expect(appSource).toMatch(/path="\/lp\/acesso-antecipado"/);
    expect(appSource).toMatch(/AccessEarlyLandingPage/);
    expect(appSource).toMatch(
      /PublicAlwaysRoute>\s*\n?\s*<AccessEarlyLandingPage/,
    );
  });

  it("/lp/acesso-antecipado/sucesso is PUBLIC_ALWAYS", () => {
    expect(appSource).toMatch(/path="\/lp\/acesso-antecipado\/sucesso"/);
    expect(appSource).toMatch(/AccessEarlySuccessPage/);
    expect(appSource).toMatch(
      /PublicAlwaysRoute>\s*\n?\s*<AccessEarlySuccessPage/,
    );
  });

  it("/ajuda is PUBLIC_ALWAYS", () => {
    expect(appSource).toMatch(/path="\/ajuda\/\*"/);
    expect(appSource).toMatch(/HelpCenterApp/);
    expect(appSource).toMatch(
      /PublicAlwaysRoute>\s*\n?\s*<HelpCenterApp/,
    );
  });

  it("/login and /register remain GUEST_ONLY", () => {
    expect(appSource).toMatch(
      /path="\/login"\s+element=\{<GuestRoute><Login/,
    );
    expect(appSource).toMatch(
      /path="\/register"\s+element=\{<GuestRoute><SignUp/,
    );
  });

  it("private routes stay behind ProtectedRoute", () => {
    expect(appSource).toMatch(
      /path="\/dashboard"\s+element=\{<ProtectedRoute>/,
    );
    expect(appSource).toMatch(
      /path="\/projects\/:id"\s+element=\{<ProtectedRoute>/,
    );
    expect(appSource).toMatch(
      /path="\/settings"\s+element=\{<ProtectedRoute>/,
    );
  });

  it("share, embed and portfolio stay without GuestRoute/ProtectedRoute", () => {
    expect(appSource).toMatch(
      /path="\/share\/project\/:projectId"\s+element=\{<PublicSharedProject/,
    );
    expect(appSource).toMatch(
      /path="\/embed\/:projectId"\s+element=\{<EmbedProjectPage/,
    );
    expect(appSource).toMatch(
      /path="\/u\/:slug"\s+element=\{<PublicPortfolio/,
    );
  });

  it("LP route does not wrap LegalConsentGate in App.js", () => {
    const lpBlock = appSource.slice(
      appSource.indexOf("/lp/acesso-antecipado"),
      appSource.indexOf("PRIVATE"),
    );
    expect(lpBlock).not.toMatch(/LegalConsentGate/);
    expect(lpBlock).not.toMatch(/ProtectedRoute/);
    expect(lpBlock).not.toMatch(/GuestRoute/);
  });
});
