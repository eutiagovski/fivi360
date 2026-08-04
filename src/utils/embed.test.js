/**
 * @jest-environment jsdom
 */

import {
  buildEmbedProjectUrl,
  buildEmbedSnippet,
  escapeHtmlAttribute,
  getAppBaseUrl,
  getMarketingArchitectsUrl,
} from "@/utils/embed";

describe("embed URL helpers — RC-EMBED-PREVIEW-FIX-1", () => {
  const originalAppBase = process.env.REACT_APP_APP_BASE_URL;
  const originalPublic = process.env.REACT_APP_PUBLIC_URL;
  const originalMarketing = process.env.REACT_APP_MARKETING_ARCHITECTS_URL;
  const originalOrigin = window.location.origin;

  afterEach(() => {
    if (originalAppBase === undefined) {
      delete process.env.REACT_APP_APP_BASE_URL;
    } else {
      process.env.REACT_APP_APP_BASE_URL = originalAppBase;
    }

    if (originalPublic === undefined) {
      delete process.env.REACT_APP_PUBLIC_URL;
    } else {
      process.env.REACT_APP_PUBLIC_URL = originalPublic;
    }

    if (originalMarketing === undefined) {
      delete process.env.REACT_APP_MARKETING_ARCHITECTS_URL;
    } else {
      process.env.REACT_APP_MARKETING_ARCHITECTS_URL = originalMarketing;
    }

    window.history.replaceState({}, "", originalOrigin);
  });

  test("usa window.location.origin quando não há REACT_APP_APP_BASE_URL", () => {
    delete process.env.REACT_APP_APP_BASE_URL;
    process.env.REACT_APP_PUBLIC_URL = "https://fivi360.com.br";

    expect(getAppBaseUrl()).toBe(window.location.origin);
    expect(getAppBaseUrl()).not.toBe("https://fivi360.com.br");
  });

  test("usa REACT_APP_APP_BASE_URL quando definida", () => {
    process.env.REACT_APP_APP_BASE_URL = "https://app.fivi360.com.br/";
    process.env.REACT_APP_PUBLIC_URL = "https://fivi360.com.br";
    expect(getAppBaseUrl()).toBe("https://app.fivi360.com.br");
  });

  test("remove barras finais da URL configurada", () => {
    process.env.REACT_APP_APP_BASE_URL = "https://app.fivi360.com.br///";
    expect(getAppBaseUrl()).toBe("https://app.fivi360.com.br");
  });

  test("ignora REACT_APP_PUBLIC_URL para a base do Embed", () => {
    delete process.env.REACT_APP_APP_BASE_URL;
    process.env.REACT_APP_PUBLIC_URL = "https://fivi360.com.br";
    expect(buildEmbedProjectUrl("proj-1")).toBe(
      `${window.location.origin}/embed/proj-1`,
    );
  });

  test("codifica projectId", () => {
    process.env.REACT_APP_APP_BASE_URL = "https://app.fivi360.com.br";
    expect(buildEmbedProjectUrl("a/b c")).toBe(
      "https://app.fivi360.com.br/embed/a%2Fb%20c",
    );
  });

  test("projectId vazio não gera URL", () => {
    process.env.REACT_APP_APP_BASE_URL = "https://app.fivi360.com.br";
    expect(buildEmbedProjectUrl("")).toBe("");
    expect(buildEmbedProjectUrl(null)).toBe("");
    expect(buildEmbedSnippet("")).toBe("");
  });

  test("preview, snippet e nova aba usam o mesmo helper", () => {
    process.env.REACT_APP_APP_BASE_URL = "https://app.fivi360.com.br";
    const url = buildEmbedProjectUrl("proj-1");
    const snippet = buildEmbedSnippet("proj-1", { projectName: "Demo" });

    expect(url).toBe("https://app.fivi360.com.br/embed/proj-1");
    expect(snippet).toContain(`src="${url}"`);
    expect(buildEmbedProjectUrl("proj-1", { imageId: "img-2" })).toBe(
      "https://app.fivi360.com.br/embed/proj-1/image/img-2",
    );
  });

  test("em localhost gera URL local do embed", () => {
    delete process.env.REACT_APP_APP_BASE_URL;
    expect(buildEmbedProjectUrl("local-proj")).toBe(
      `${window.location.origin}/embed/local-proj`,
    );
  });

  test("em produção configurada gera domínio oficial", () => {
    process.env.REACT_APP_APP_BASE_URL = "https://app.fivi360.com.br";
    expect(buildEmbedProjectUrl("prod-proj")).toBe(
      "https://app.fivi360.com.br/embed/prod-proj",
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
