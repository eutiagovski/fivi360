/**
 * RC-HELP-CENTER-FOUNDATION-1 — catálogo de conteúdo
 */

const {
  HELP_ARTICLES,
  getHelpArticle,
  getHelpArticleBySlug,
  getHelpArticlesByCategory,
  getListedHelpArticles,
  getRelatedHelpArticles,
} = require("./index");
const { HELP_CATEGORIES } = require("../categories");
const { SOFTWARE_GUIDES } = require("../softwareGuides");

describe("help catalog — RC-HELP-CENTER-FOUNDATION-1", () => {
  it("defines the initial categories", () => {
    expect(HELP_CATEGORIES.map((category) => category.slug)).toEqual([
      "primeiros-passos",
      "projetos",
      "imagens-360",
      "hotspots",
      "compartilhamento",
      "incorporacao",
      "portfolio",
      "planos-e-armazenamento",
      "conta-e-configuracoes",
    ]);
  });

  it("keeps unique article slugs", () => {
    const slugs = HELP_ARTICLES.map((article) => article.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("resolves an article by category and slug", () => {
    const article = getHelpArticle(
      "primeiros-passos",
      "criando-seu-primeiro-projeto",
    );

    expect(article).toBeTruthy();
    expect(article.title).toBe("Criando seu primeiro projeto");
    expect(getHelpArticle("projetos", "criando-seu-primeiro-projeto")).toBeUndefined();
  });

  it("lists category articles without unlisted software stubs", () => {
    const listed = getHelpArticlesByCategory("imagens-360");
    const all = getHelpArticlesByCategory("imagens-360", { includeUnlisted: true });

    expect(listed.some((article) => article.slug === "sketchup-enscape")).toBe(
      false,
    );
    expect(all.some((article) => article.slug === "sketchup-enscape")).toBe(true);
    expect(
      listed.some(
        (article) => article.slug === "como-exportar-uma-imagem-360-do-seu-software",
      ),
    ).toBe(true);
  });

  it("prepares software export guides as coming soon", () => {
    expect(SOFTWARE_GUIDES).toHaveLength(9);
    expect(SOFTWARE_GUIDES.map((guide) => guide.name)).toEqual([
      "SketchUp + Enscape",
      "SketchUp + V-Ray",
      "Revit + Enscape",
      "Revit + Twinmotion",
      "3ds Max + Corona",
      "3ds Max + V-Ray",
      "Lumion",
      "D5 Render",
      "Twinmotion",
    ]);

    const sketchup = getHelpArticleBySlug("sketchup-enscape");
    expect(sketchup.status).toBe("coming-soon");
    expect(sketchup.listed).toBe(false);
    expect(sketchup.videoUrl).toBe("");
  });

  it("resolves related articles by slug", () => {
    const article = getHelpArticleBySlug("o-que-e-o-fivi360");
    const related = getRelatedHelpArticles(article);

    expect(related.map((item) => item.slug)).toEqual(
      article.relatedArticles,
    );
  });

  it("does not invent unlisted visibility — uses private, shared and public", () => {
    const visibility = getHelpArticleBySlug("visibilidade-do-projeto");
    const body = JSON.stringify(visibility.blocks);

    expect(body).toMatch(/Privado/);
    expect(body).toMatch(/Compartilhado/);
    expect(body).toMatch(/Público/);
    expect(body).not.toMatch(/Unlisted/i);
  });

  it("keeps listed articles without a video URL", () => {
    const withVideo = getListedHelpArticles().filter((article) =>
      Boolean(article.videoUrl),
    );
    expect(withVideo).toEqual([]);
  });
});
