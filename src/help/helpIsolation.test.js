/**
 * RC-HELP-CENTER-FOUNDATION-1 — isolamento do bounded context
 */

const fs = require("fs");
const path = require("path");

function listFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      return listFiles(full);
    }
    return [full];
  });
}

describe("help module isolation — RC-HELP-CENTER-FOUNDATION-1", () => {
  const helpRoot = path.join(__dirname);
  const sources = listFiles(helpRoot).filter(
    (file) => /\.(js|jsx)$/.test(file) && !/\.test\.(js|jsx)$/.test(file),
  );

  it("does not import dashboard, billing, auth, project services or Firebase", () => {
    const forbidden = [
      "@/pages/Dashboard",
      "@/pages/Plan",
      "@/services/billing",
      "@/contexts/AuthContext",
      "@/hooks/useAuth",
      "@/services/projects/projectService",
      "@/config/firebase",
      "firebase/firestore",
      "@/components/auth/ProtectedRoute",
      "@/components/legal/LegalConsentGate",
    ];

    for (const file of sources) {
      const source = fs.readFileSync(file, "utf8");
      for (const pattern of forbidden) {
        expect(source).not.toContain(pattern);
      }
    }
  });
});
