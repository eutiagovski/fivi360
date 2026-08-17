/**
 * RC-LEGAL-DOCS-GOLIVE-1 — version display on legal pages.
 */

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

jest.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ user: null }),
}));

jest.mock("react-router-dom", () => ({
  Link: ({ children, to, ...rest }) =>
    require("react").createElement("a", { href: to, ...rest }, children),
}), { virtual: true });

jest.mock("@/components/landing/LandingHeader", () => ({
  LandingHeader: () => null,
}));

jest.mock("@/components/ui/collapsible", () => {
  const React = require("react");
  return {
    Collapsible: ({ children }) => React.createElement("div", null, children),
    CollapsibleTrigger: ({ children }) =>
      React.createElement("button", { type: "button" }, children),
    CollapsibleContent: ({ children }) => React.createElement("div", null, children),
  };
});

const React = require("react");
const { createRoot } = require("react-dom/client");
const { act } = require("react");
const { LegalPageLayout } = require("./LegalPageLayout");

beforeAll(() => {
  if (typeof global.IntersectionObserver === "undefined") {
    global.IntersectionObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
  }
});

function mount(props) {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => {
    root.render(
      React.createElement(
        LegalPageLayout,
        {
          title: "Política de Privacidade",
          sections: [{ id: "introducao", label: "Introdução" }],
          lastUpdated: "17 de agosto de 2026",
          version: "1.1",
          ...props,
        },
        React.createElement("p", null, "conteúdo"),
      ),
    );
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

describe("LegalPageLayout — RC-LEGAL-DOCS-GOLIVE-1", () => {
  it("shows version next to the update date", () => {
    const mounted = mount();
    expect(mounted.container.textContent).toContain("Última atualização: 17 de agosto de 2026");
    expect(mounted.container.querySelector('[data-testid="legal-page-version"]').textContent)
      .toBe("Versão 1.1");
    mounted.unmount();
  });
});
