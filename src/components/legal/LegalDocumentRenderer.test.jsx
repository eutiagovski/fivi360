/**
 * RC-LEGAL-DOCS-GOLIVE-1 — LegalDocumentRenderer
 */

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

jest.mock("./LegalPageLayout", () => {
  const React = require("react");

  return {
    LegalPageLayout: ({ title, sections, lastUpdated, version, children }) =>
      React.createElement(
        "div",
        { "data-testid": "legal-page" },
        React.createElement("h1", null, title),
        lastUpdated
          ? React.createElement("p", null, `Última atualização: ${lastUpdated}`)
          : null,
        version
          ? React.createElement(
              "p",
              { "data-testid": "legal-page-version" },
              `Versão ${version}`,
            )
          : null,
        React.createElement(
          "nav",
          { "data-testid": "legal-toc", "aria-label": "Índice da página" },
          (sections ?? []).map((section) =>
            React.createElement(
              "a",
              { key: section.id, href: `#${section.id}` },
              section.label,
            ),
          ),
        ),
        React.createElement("div", { "data-testid": "legal-page-content" }, children),
      ),
    LegalSection: ({ id, title, children }) =>
      React.createElement(
        "section",
        { id, "data-testid": `legal-section-${id}` },
        React.createElement("h2", null, title),
        children,
      ),
  };
});

jest.mock("react-router-dom", () => ({
  Link: ({ children, to, ...rest }) =>
    require("react").createElement("a", { href: to, ...rest }, children),
}), { virtual: true });

const React = require("react");
const { createRoot } = require("react-dom/client");
const { act } = require("react");
const { LegalDocumentRenderer } = require("./LegalDocumentRenderer");
const { LEGAL_ENTITY } = require("@/legal/legalEntity");
const { PRIVACY_POLICY_CONTENT } = require("@/legal/privacyPolicyContent");
const {
  emphasis,
  legalEmail,
  legalLink,
  paragraph,
  unorderedList,
} = require("@/legal/legalDocument");

function mount(legalDocument) {
  const host = global.document.createElement("div");
  global.document.body.appendChild(host);
  const root = createRoot(host);

  act(() => {
    root.render(React.createElement(LegalDocumentRenderer, { document: legalDocument }));
  });

  return {
    container: host,
    unmount: () => {
      act(() => {
        root.unmount();
      });
      host.remove();
    },
  };
}

const SAMPLE_DOCUMENT = {
  title: "Documento de teste",
  version: "1.1",
  lastUpdated: "17 de agosto de 2026",
  sections: [
    {
      id: "introducao",
      title: "1. Introdução",
      label: "Introdução",
      blocks: [
        paragraph("Primeiro parágrafo."),
        unorderedList(["item da lista", ["item com ", emphasis("destaque")]]),
        paragraph("Fale com ", legalEmail(), "."),
        paragraph("Veja a ", legalLink("/privacidade", "Política de Privacidade"), "."),
      ],
    },
    {
      id: "contato",
      title: "2. Contato",
      label: "Contato",
      blocks: [paragraph("Seção de contato.")],
    },
  ],
};

describe("LegalDocumentRenderer — RC-LEGAL-DOCS-GOLIVE-1", () => {
  it("builds the table of contents from sections", () => {
    const mounted = mount(SAMPLE_DOCUMENT);
    const toc = mounted.container.querySelector('[data-testid="legal-toc"]');
    const links = [...toc.querySelectorAll("a")].map((el) => ({
      href: el.getAttribute("href"),
      text: el.textContent,
    }));

    expect(links).toEqual([
      { href: "#introducao", text: "Introdução" },
      { href: "#contato", text: "Contato" },
    ]);
    mounted.unmount();
  });

  it("renders paragraphs, lists, links and institutional email", () => {
    const mounted = mount(SAMPLE_DOCUMENT);
    const content = mounted.container.querySelector('[data-testid="legal-page-content"]');

    expect(content.querySelector("p").textContent).toContain("Primeiro parágrafo.");
    expect(content.querySelector("ul li").textContent).toBe("item da lista");
    expect(content.querySelector("a[href='/privacidade']").textContent).toBe(
      "Política de Privacidade",
    );
    expect(
      content.querySelector(`a[href="mailto:${LEGAL_ENTITY.contactEmail}"]`).textContent,
    ).toBe(LEGAL_ENTITY.contactEmail);
    expect(mounted.container.querySelector('[data-testid="legal-page-version"]').textContent)
      .toBe("Versão 1.1");
    mounted.unmount();
  });

  it("renders the privacy policy document through the shared renderer", () => {
    const mounted = mount(PRIVACY_POLICY_CONTENT);

    expect(mounted.container.querySelector("h1").textContent).toBe(
      "Política de Privacidade",
    );
    expect(mounted.container.querySelector('[data-testid="legal-section-pre-lancamento"]'))
      .toBeTruthy();
    expect(
      mounted.container.querySelector(`a[href="mailto:${LEGAL_ENTITY.contactEmail}"]`),
    ).toBeTruthy();
    mounted.unmount();
  });
});
