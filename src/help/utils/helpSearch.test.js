/**
 * RC-HELP-CENTER-FOUNDATION-1 — busca local
 */

const { searchHelpArticles, normalizeHelpQuery } = require("./helpSearch");
const { getListedHelpArticles } = require("../content/articles");

describe("help search — RC-HELP-CENTER-FOUNDATION-1", () => {
  const articles = getListedHelpArticles();

  it("normalizes accents for matching", () => {
    expect(normalizeHelpQuery("  Equiretangular ")).toBe("equiretangular");
  });

  it("finds articles by title", () => {
    const results = searchHelpArticles("primeiro projeto", { articles });
    expect(results.some((article) => article.slug === "criando-seu-primeiro-projeto")).toBe(
      true,
    );
  });

  it("finds articles by keyword", () => {
    const results = searchHelpArticles("equiretangular", { articles });
    expect(
      results.some(
        (article) => article.slug === "o-que-e-uma-imagem-360-equiretangular",
      ),
    ).toBe(true);
  });

  it("finds articles by category name", () => {
    const results = searchHelpArticles("hotspots", { articles });
    expect(results.some((article) => article.category === "hotspots")).toBe(true);
  });

  it("returns an empty list when nothing matches", () => {
    expect(searchHelpArticles("xyzzy-nao-existe", { articles })).toEqual([]);
  });

  it("returns an empty list for a blank query", () => {
    expect(searchHelpArticles("   ", { articles })).toEqual([]);
  });
});
