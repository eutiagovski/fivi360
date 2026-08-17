/**
 * RC-LEGAL-DOCS-GOLIVE-1 — TermsOfUse page is a thin renderer wrapper.
 */

const fs = require("fs");
const path = require("path");

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

jest.mock("@/components/legal/LegalDocumentRenderer", () => ({
  LegalDocumentRenderer: ({ document }) =>
    require("react").createElement("div", {
      "data-testid": "legal-document-renderer",
      "data-title": document.title,
      "data-version": document.version,
    }),
}));

const React = require("react");
const { createRoot } = require("react-dom/client");
const { act } = require("react");
const { TermsOfUse } = require("./TermsOfUse");
const { TERMS_OF_USE_CONTENT } = require("@/legal/termsOfUseContent");

function mount() {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => {
    root.render(React.createElement(TermsOfUse));
  });
  return {
    container,
    unmount: () => {
      act(() => {
        root.unmount();
      });
      container.remove();
    },
  };
}

describe("TermsOfUse — RC-LEGAL-DOCS-GOLIVE-1", () => {
  it("uses the shared legal renderer with structured terms content", () => {
    const mounted = mount();
    const node = mounted.container.querySelector(
      '[data-testid="legal-document-renderer"]',
    );

    expect(node).toBeTruthy();
    expect(node.getAttribute("data-title")).toBe(TERMS_OF_USE_CONTENT.title);
    expect(node.getAttribute("data-version")).toBe("1.1");
    mounted.unmount();
  });

  it("does not hardcode legal copy in the page file", () => {
    const source = fs.readFileSync(path.join(__dirname, "TermsOfUse.jsx"), "utf8");

    expect(source).toMatch(/LegalDocumentRenderer/);
    expect(source).toMatch(/TERMS_OF_USE_CONTENT/);
    expect(source).not.toMatch(/49\.712\.355/);
    expect(source).not.toMatch(/LegalSection/);
    expect(source).not.toMatch(/contato@fivi360\.com\.br/);
  });
});
