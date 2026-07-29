import {
  buildImageDescription,
  buildImageTitle,
  buildPortfolioDescription,
  buildPortfolioTitle,
  buildProjectDescription,
  buildProjectTitle,
  resolvePublicDisplayName,
} from "./publicSeo";

describe("resolvePublicDisplayName", () => {
  it("prefers companyName over displayName", () => {
    expect(
      resolvePublicDisplayName({
        companyName: " Panema Arquitetura ",
        displayName: "João Silva",
      }),
    ).toBe("Panema Arquitetura");
  });

  it("falls back to displayName", () => {
    expect(resolvePublicDisplayName({ displayName: "João Silva" })).toBe(
      "João Silva",
    );
  });
});

describe("buildPortfolioTitle", () => {
  it("uses company name with portfolio suffix", () => {
    expect(
      buildPortfolioTitle({ companyName: "Panema Arquitetura" }),
    ).toBe("Panema Arquitetura | Portfólio Público");
  });

  it("uses display name when company is missing", () => {
    expect(buildPortfolioTitle({ displayName: "João Silva" })).toBe(
      "João Silva | Portfólio Público",
    );
  });

  it("falls back to portfolio suffix only", () => {
    expect(buildPortfolioTitle({})).toBe("Portfólio Público");
  });
});

describe("buildPortfolioDescription", () => {
  it("uses bio when available", () => {
    expect(
      buildPortfolioDescription({
        companyName: "Panema Arquitetura",
        bio: "Escritório especializado em interiores.",
      }),
    ).toBe("Escritório especializado em interiores.");
  });

  it("falls back to office-based copy without bio", () => {
    expect(buildPortfolioDescription({ companyName: "Panema Arquitetura" })).toBe(
      "Conheça os projetos de Panema Arquitetura em visualização 360°.",
    );
  });
});

describe("buildProjectTitle", () => {
  it("combines project and office names", () => {
    expect(
      buildProjectTitle(
        { title: "Casa Aurora" },
        { companyName: "Panema Arquitetura" },
      ),
    ).toBe("Casa Aurora | Panema Arquitetura");
  });
});

describe("buildProjectDescription", () => {
  it("uses project description when available", () => {
    expect(
      buildProjectDescription(
        { title: "Casa Aurora", description: "Residência de alto padrão." },
        { companyName: "Panema Arquitetura" },
      ),
    ).toBe("Residência de alto padrão.");
  });

  it("falls back when project has no description", () => {
    expect(
      buildProjectDescription(
        { title: "Casa Aurora" },
        { companyName: "Panema Arquitetura" },
      ),
    ).toBe("Explore Casa Aurora por Panema Arquitetura em visualização 360°.");
  });
});

describe("buildImageTitle", () => {
  it("combines image and office names", () => {
    expect(
      buildImageTitle(
        { title: "Sala de estar" },
        { companyName: "Panema Arquitetura" },
      ),
    ).toBe("Sala de estar | Panema Arquitetura");
  });
});

describe("buildImageDescription", () => {
  it("builds office-based fallback", () => {
    expect(
      buildImageDescription(
        { title: "Sala de estar" },
        { companyName: "Panema Arquitetura" },
      ),
    ).toBe("Visualize Sala de estar em 360° por Panema Arquitetura.");
  });
});
