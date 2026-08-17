import { LEGAL_VERSIONS } from "@/config/legal";
import {
  flattenLegalDocument,
  getLegalTocSections,
} from "@/legal/legalDocument";
import { LEGAL_ENTITY } from "@/legal/legalEntity";
import { PRIVACY_POLICY_CONTENT } from "@/legal/privacyPolicyContent";
import { TERMS_OF_USE_CONTENT } from "@/legal/termsOfUseContent";

const privacyText = flattenLegalDocument(PRIVACY_POLICY_CONTENT);
const termsText = flattenLegalDocument(TERMS_OF_USE_CONTENT);

describe("legal content — RC-LEGAL-DOCS-GOLIVE-1", () => {
  it("centralizes legal identity", () => {
    expect(LEGAL_ENTITY.productName).toBe("FIVI360");
    expect(LEGAL_ENTITY.legalName).toBe("49.712.355 INOVA SIMPLES (I.S.)");
    expect(LEGAL_ENTITY.cnpj).toBe("49.712.355/0001-00");
    expect(LEGAL_ENTITY.contactEmail).toBe("contato@fivi360.com.br");
  });

  it("bumps both documents to 1.1 with publication date", () => {
    expect(LEGAL_VERSIONS).toEqual({
      termsVersion: "1.1",
      privacyVersion: "1.1",
    });
    expect(PRIVACY_POLICY_CONTENT.version).toBe(LEGAL_VERSIONS.privacyVersion);
    expect(TERMS_OF_USE_CONTENT.version).toBe(LEGAL_VERSIONS.termsVersion);
    expect(PRIVACY_POLICY_CONTENT.lastUpdated).toBe("17 de agosto de 2026");
    expect(TERMS_OF_USE_CONTENT.lastUpdated).toBe("17 de agosto de 2026");
  });

  it("builds table of contents from sections", () => {
    const privacyToc = getLegalTocSections(PRIVACY_POLICY_CONTENT);
    const termsToc = getLegalTocSections(TERMS_OF_USE_CONTENT);

    expect(privacyToc[0]).toEqual({
      id: "introducao",
      label: "Introdução e âmbito",
    });
    expect(privacyToc.map((item) => item.id)).toContain("pre-lancamento");
    expect(termsToc.map((item) => item.id)).toContain("processamento-imagens");
    expect(termsToc.map((item) => item.label)).toContain("Política de Privacidade");
  });
});

describe("privacy policy 1.1 — required statements", () => {
  it("identifies the controller, CNPJ and institutional email", () => {
    expect(privacyText).toContain("49.712.355 INOVA SIMPLES (I.S.)");
    expect(privacyText).toContain("49.712.355/0001-00");
    expect(privacyText).toContain(LEGAL_ENTITY.contactEmail);
  });

  it("covers prelaunch, WhatsApp, campaign origin, Embed and majority", () => {
    expect(privacyText).toMatch(/pré-lançamento/i);
    expect(privacyText).toContain("WhatsApp");
    expect(privacyText).toMatch(/UTMs|origem da campanha/i);
    expect(privacyText).toContain("Embed");
    expect(privacyText).toContain("18 anos");
    expect(privacyText).toMatch(/marketing/i);
  });

  it("names current processors without describing GA4 or YouTube as active", () => {
    expect(privacyText).toContain("Resend");
    expect(privacyText).toContain("Firebase");
    expect(privacyText).toContain("Google Sign-In");
    expect(privacyText).toContain("Google Fonts");
    expect(privacyText).toMatch(/Stripe/);
  });

  it("directs account deletion to email and keeps marketing optional", () => {
    expect(privacyText).toContain(LEGAL_ENTITY.contactEmail);
    expect(privacyText).toMatch(/exclusão da conta/i);
    expect(privacyText).toMatch(/opt-in|consentimento específico/i);
  });
});

describe("terms of use 1.1 — required statements", () => {
  it("covers majority, ownership, processing, publication surfaces and billing", () => {
    expect(termsText).toContain("18 anos");
    expect(termsText).toMatch(/continua dono/i);
    expect(termsText).toMatch(/processar|converter|comprimir/i);
    expect(termsText).toContain("Share");
    expect(termsText).toMatch(/[Pp]ortfólio/);
    expect(termsText).toContain("Embed");
    expect(termsText).toMatch(/página de planos vigente/i);
    expect(termsText).toMatch(/quando planos pagos e cobrança forem disponibilizados/i);
    expect(termsText).toContain("Política de Privacidade");
    expect(termsText).toContain(LEGAL_ENTITY.contactEmail);
  });
});

describe("legal content 1.1 — retired statements", () => {
  it.each([
    ["privacy", privacyText],
    ["terms", termsText],
  ])("does not restore outdated claims in %s", (_label, text) => {
    expect(text).not.toMatch(/backups técnicos de curto prazo/i);
    expect(text).not.toMatch(/pelas configurações/i);
    expect(text).not.toMatch(/nesta versão não há cobrança online integrada/i);
    expect(text).not.toMatch(/\bGA4\b/);
    expect(text).not.toMatch(/Google Analytics/);
    expect(text).not.toMatch(/YouTube/);
    expect(text).not.toMatch(/plano manual/i);
  });
});
