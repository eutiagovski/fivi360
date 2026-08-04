import {
  buildEmbedProjectUrl,
  buildEmbedSnippet,
  escapeHtmlAttribute,
  getAppBaseUrl,
  getMarketingArchitectsUrl,
} from "@/utils/embed";

describe("embed snippet helpers", () => {
  const originalAppBase = process.env.REACT_APP_APP_BASE_URL;
  const originalPublic = process.env.REACT_APP_PUBLIC_URL;
  const originalMarketing = process.env.REACT_APP_MARKETING_ARCHITECTS_URL;

  afterEach(() => {
    process.env.REACT_APP_APP_BASE_URL = originalAppBase;
    process.env.REACT_APP_PUBLIC_URL = originalPublic;
    process.env.REACT_APP_MARKETING_ARCHITECTS_URL = originalMarketing;
  });

  test("getAppBaseUrl usa REACT_APP_APP_BASE_URL", () => {
    process.env.REACT_APP_APP_BASE_URL = "https://app.fivi360.com.br/";
    expect(getAppBaseUrl()).toBe("https://app.fivi360.com.br");
  });

  test("gera URL correta", () => {
    process.env.REACT_APP_APP_BASE_URL = "https://app.fivi360.com.br";
    expect(buildEmbedProjectUrl("proj-1")).toBe(
      "https://app.fivi360.com.br/embed/proj-1",
    );
    expect(buildEmbedProjectUrl("proj-1", { imageId: "img-2" })).toBe(
      "https://app.fivi360.com.br/embed/proj-1/image/img-2",
    );
  });

  test("gera código responsivo com atributos obrigatórios", () => {
    process.env.REACT_APP_APP_BASE_URL = "https://app.fivi360.com.br";
    const snippet = buildEmbedSnippet("abc123", {
      projectName: 'Sala "Principal" & Escada',
    });

    expect(snippet).toContain("aspect-ratio:16/9");
    expect(snippet).toContain('loading="lazy"');
    expect(snippet).toContain('allow="fullscreen"');
    expect(snippet).toContain("allowfullscreen");
    expect(snippet).toContain(
      'src="https://app.fivi360.com.br/embed/abc123"',
    );
    expect(snippet).toContain(
      'title="Visualização 360° — Sala &quot;Principal&quot; &amp; Escada"',
    );
  });

  test("escapeHtmlAttribute", () => {
    expect(escapeHtmlAttribute('<script>"x"&')).toBe(
      "&lt;script&gt;&quot;x&quot;&amp;",
    );
  });

  test("getMarketingArchitectsUrl usa env ou fallback da home", () => {
    process.env.REACT_APP_MARKETING_ARCHITECTS_URL =
      "https://fivi360.com.br/para-arquitetos";
    expect(getMarketingArchitectsUrl()).toBe(
      "https://fivi360.com.br/para-arquitetos",
    );

    delete process.env.REACT_APP_MARKETING_ARCHITECTS_URL;
    expect(getMarketingArchitectsUrl()).toBe("https://fivi360.com.br");
  });
});
