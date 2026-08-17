/**
 * RC-HELP-CENTER-FOUNDATION-1 — páginas da Central de Ajuda
 */

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

jest.mock("@/hooks/usePageSeo", () => ({
  usePageSeo: jest.fn(),
}));

const mockUseParams = jest.fn(() => ({}));

jest.mock("react-router-dom", () => ({
  Link: ({ children, to, ...rest }) =>
    require("react").createElement("a", { href: to, ...rest }, children),
  useParams: () => mockUseParams(),
}), { virtual: true });

const React = require("react");
const { createRoot } = require("react-dom/client");
const { act } = require("react");
const { HelpHomePage } = require("./HelpHomePage");
const { HelpArticlePage } = require("./HelpArticlePage");
const { HELP_CONTACT_EMAIL } = require("../config/help");
const { HELP_CATEGORIES } = require("../content/categories");
const { SOFTWARE_GUIDES } = require("../content/softwareGuides");

function setInputValue(element, value) {
  const prototype = Object.getPrototypeOf(element);
  const descriptor = Object.getOwnPropertyDescriptor(prototype, "value");
  const lastValue = element.value;
  if (descriptor?.set) {
    descriptor.set.call(element, value);
  } else {
    element.value = value;
  }
  const tracker = element._valueTracker;
  if (tracker) {
    tracker.setValue(lastValue);
  }
  element.dispatchEvent(new Event("input", { bubbles: true }));
  element.dispatchEvent(new Event("change", { bubbles: true }));
}

function mount(element) {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => {
    root.render(element);
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

describe("HelpCenter pages — RC-HELP-CENTER-FOUNDATION-1", () => {
  beforeEach(() => {
    mockUseParams.mockReturnValue({});
  });

  it("renders the home, search and categories", () => {
    const mounted = mount(React.createElement(HelpHomePage));

    expect(mounted.container.querySelector('[data-testid="help-home"]')).toBeTruthy();
    expect(mounted.container.querySelector('[data-testid="help-home-title"]')?.textContent).toBe(
      "Como podemos ajudar?",
    );
    expect(mounted.container.querySelector('[data-testid="help-search-input"]')).toBeTruthy();
    expect(mounted.container.querySelector('[data-testid="help-category-grid"]')).toBeTruthy();

    for (const category of HELP_CATEGORIES) {
      expect(
        mounted.container.querySelector(
          `[data-testid="help-category-card-${category.slug}"]`,
        ),
      ).toBeTruthy();
    }

    mounted.unmount();
  });

  it("shows matching results while typing, including keyword matches", () => {
    const mounted = mount(React.createElement(HelpHomePage));
    const input = mounted.container.querySelector('[data-testid="help-search-input"]');

    act(() => {
      setInputValue(input, "equiretangular");
    });

    expect(mounted.container.querySelector('[data-testid="help-search-results"]')).toBeTruthy();
    expect(
      mounted.container.querySelector(
        '[data-testid="help-search-result-o-que-e-uma-imagem-360-equiretangular"]',
      ),
    ).toBeTruthy();

    mounted.unmount();
  });

  it("shows an empty state when search has no matches", () => {
    const mounted = mount(React.createElement(HelpHomePage));
    const input = mounted.container.querySelector('[data-testid="help-search-input"]');

    act(() => {
      setInputValue(input, "xyzzy-nao-existe");
    });

    expect(mounted.container.querySelector('[data-testid="help-search-empty"]')).toBeTruthy();
    expect(mounted.container.querySelector('[data-testid="help-search-results"]')).toBeNull();
    mounted.unmount();
  });

  it("renders an article by slug with breadcrumb and related articles", () => {
    mockUseParams.mockReturnValue({
      categorySlug: "primeiros-passos",
      articleSlug: "o-que-e-o-fivi360",
    });

    const mounted = mount(React.createElement(HelpArticlePage));

    expect(mounted.container.querySelector('[data-testid="help-article-page"]')).toBeTruthy();
    expect(mounted.container.querySelector('[data-testid="help-article-title"]')?.textContent).toBe(
      "O que é o FIVI360?",
    );
    expect(mounted.container.querySelector('[data-testid="help-breadcrumb"]')).toBeTruthy();
    expect(mounted.container.querySelector('[data-testid="help-related-articles"]')).toBeTruthy();
    expect(
      mounted.container.querySelector('[data-testid="help-related-criando-sua-conta"]'),
    ).toBeTruthy();
    expect(mounted.container.querySelector("iframe")).toBeNull();
    expect(mounted.container.querySelector('[data-testid="help-article-video"]')).toBeNull();
    expect(mounted.container.querySelector('[data-testid="help-support-cta"]')).toBeTruthy();
    expect(
      mounted.container.querySelector('[data-testid="help-support-email"]')?.textContent,
    ).toBe(HELP_CONTACT_EMAIL);

    mounted.unmount();
  });

  it("renders software export cards as coming soon", () => {
    mockUseParams.mockReturnValue({
      categorySlug: "imagens-360",
      articleSlug: "como-exportar-uma-imagem-360-do-seu-software",
    });

    const mounted = mount(React.createElement(HelpArticlePage));

    expect(
      mounted.container.querySelector('[data-testid="help-software-export-grid"]'),
    ).toBeTruthy();

    for (const guide of SOFTWARE_GUIDES) {
      expect(
        mounted.container.querySelector(`[data-testid="help-software-card-${guide.slug}"]`),
      ).toBeTruthy();
      expect(
        mounted.container.querySelector(
          `[data-testid="help-software-coming-soon-${guide.slug}"]`,
        )?.textContent,
      ).toMatch(/Em breve/);
    }

    mounted.unmount();
  });

  it("shows the internal 404 for an unknown article", () => {
    mockUseParams.mockReturnValue({
      categorySlug: "primeiros-passos",
      articleSlug: "artigo-que-nao-existe",
    });

    const mounted = mount(React.createElement(HelpArticlePage));

    expect(mounted.container.querySelector('[data-testid="help-not-found"]')).toBeTruthy();
    expect(mounted.container.querySelector('[data-testid="help-not-found-home"]')).toBeTruthy();
    expect(mounted.container.querySelector('[data-testid="help-search-input"]')).toBeTruthy();
    expect(mounted.container.querySelector('[data-testid="not-found-page"]')).toBeNull();

    mounted.unmount();
  });

  it("exposes institutional links in the help footer", () => {
    const mounted = mount(React.createElement(HelpHomePage));

    expect(mounted.container.querySelector('[data-testid="help-footer-terms"]')?.getAttribute("href")).toBe(
      "/termos",
    );
    expect(
      mounted.container.querySelector('[data-testid="help-footer-privacy"]')?.getAttribute("href"),
    ).toBe("/privacidade");
    expect(
      mounted.container.querySelector('[data-testid="help-footer-contact"]')?.getAttribute("href"),
    ).toBe(`mailto:${HELP_CONTACT_EMAIL}`);
    expect(
      mounted.container.querySelector('[data-testid="help-header-back"]')?.getAttribute("href"),
    ).toBe("/");

    mounted.unmount();
  });
});
