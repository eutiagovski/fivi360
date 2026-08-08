/**
 * RC-LP-PRELAUNCH-STRUCTURE-1 — AccessEarlyLandingPage structure
 */

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const fs = require("fs");
const path = require("path");

jest.mock("@/hooks/usePageSeo", () => ({
  usePageSeo: jest.fn(),
}));

jest.mock("@/components/landing/LandingDemoExperience", () => ({
  LandingDemoExperience: (props) =>
    require("react").createElement("div", {
      "data-testid": props.testId || "landing-demo-viewer",
      "data-demo-project-id": props.projectId,
      "data-fullscreen": String(Boolean(props.showFullscreenCtrl)),
    }),
}));

jest.mock("./services/prelaunchLeadService", () => ({
  submitPrelaunchLead: jest.fn(),
}));

jest.mock("react-router-dom", () => ({
  Link: ({ children, to, ...rest }) =>
    require("react").createElement("a", { href: to, ...rest }, children),
  useLocation: () => ({
    pathname: "/lp/acesso-antecipado",
    search:
      "?utm_source=instagram&utm_medium=stories&utm_campaign=prelaunch_2026&utm_content=editorial_01",
  }),
  useNavigate: () => jest.fn(),
}), { virtual: true });

jest.mock("@/components/ui/button", () => ({
  Button: ({ children, asChild, ...rest }) =>
    asChild
      ? children
      : require("react").createElement("button", rest, children),
}));

jest.mock("@/components/ui/checkbox", () => {
  const React = require("react");
  return {
    Checkbox: ({ checked, onCheckedChange, id, disabled, ...rest }) =>
      React.createElement("input", {
        type: "checkbox",
        id,
        checked: Boolean(checked),
        disabled,
        onChange: (e) => onCheckedChange?.(e.target.checked),
        ...rest,
      }),
  };
});

jest.mock("@/components/ui/select", () => {
  const React = require("react");
  const { ACCESS_EARLY_PROFESSIONS } = require("./config");
  return {
    Select: ({ value, onValueChange, disabled }) =>
      React.createElement(
        "select",
        {
          "data-testid": "access-early-profession-select",
          value: value || "",
          disabled,
          onChange: (e) => onValueChange?.(e.target.value),
        },
        ACCESS_EARLY_PROFESSIONS.map((item) =>
          React.createElement("option", { key: item.id, value: item.id }, item.label),
        ),
      ),
    SelectTrigger: () => null,
    SelectValue: () => null,
    SelectContent: () => null,
    SelectItem: () => null,
  };
});

jest.mock("@/components/ui/sheet", () => {
  const React = require("react");
  return {
    Sheet: ({ children }) => React.createElement("div", null, children),
    SheetTrigger: ({ children }) => children,
    SheetContent: ({ children }) =>
      React.createElement("div", { "data-testid": "sheet-content" }, children),
    SheetHeader: ({ children }) => React.createElement("div", null, children),
    SheetTitle: ({ children }) => React.createElement("div", null, children),
  };
});

const React = require("react");
const { createRoot } = require("react-dom/client");
const { act } = require("react");
const { AccessEarlyLandingPage } = require("./AccessEarlyLandingPage");
const { ACCESS_EARLY_CONFIG } = require("./config");
const { FIVI360_DEMO_PROJECT } = require("@/config/demoProject");
const { usePageSeo } = require("@/hooks/usePageSeo");

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

describe("AccessEarlyLandingPage — RC-LP-PRELAUNCH-STRUCTURE-1", () => {
  it("renders hero, CTAs, benefits, steps, form, footer", () => {
    const mounted = mount(React.createElement(AccessEarlyLandingPage));
    const c = mounted.container;

    expect(c.querySelector('[data-testid="access-early-hero"]')).toBeTruthy();
    expect(
      c.querySelector('[data-testid="access-early-hero-cta"]')?.textContent,
    ).toMatch(/Quero acesso antecipado/);
    expect(c.querySelector('[data-testid="access-early-video-section"]')).toBeTruthy();
    expect(c.querySelector('[data-testid="access-early-demo-section"]')).toBeTruthy();
    expect(c.querySelector('[data-testid="access-early-benefits-section"]')).toBeTruthy();
    expect(c.querySelectorAll('[data-testid^="access-early-benefit-"]').length).toBe(3);
    expect(c.querySelectorAll('[data-testid^="access-early-step-"]').length).toBe(3);
    expect(c.querySelector('[data-testid="access-early-form"]')).toBeTruthy();
    expect(c.querySelector('[data-testid="access-early-footer-privacy"]')).toBeTruthy();
    expect(c.querySelector('[data-testid="access-early-footer-terms"]')).toBeTruthy();
    mounted.unmount();
  });

  it("shows video placeholder when videoUrl is empty (no broken iframe)", () => {
    expect(ACCESS_EARLY_CONFIG.videoUrl).toBe("");
    const mounted = mount(React.createElement(AccessEarlyLandingPage));
    expect(
      mounted.container.querySelector('[data-testid="access-early-video-placeholder"]'),
    ).toBeTruthy();
    expect(mounted.container.querySelector("iframe")).toBeNull();
    mounted.unmount();
  });

  it("demo viewer uses shared FIVI360_DEMO_PROJECT (not embed)", () => {
    const mounted = mount(React.createElement(AccessEarlyLandingPage));
    const viewer = mounted.container.querySelector(
      '[data-testid="access-early-demo-viewer"]',
    );
    expect(viewer?.getAttribute("data-demo-project-id")).toBe(
      FIVI360_DEMO_PROJECT.projectId,
    );
    expect(viewer?.getAttribute("data-fullscreen")).toBe("true");
    mounted.unmount();
  });

  it("preserves query params and sets SEO", () => {
    const mounted = mount(React.createElement(AccessEarlyLandingPage));
    const root = mounted.container.querySelector(
      '[data-testid="access-early-landing"]',
    );
    expect(root.getAttribute("data-search")).toContain("utm_source=instagram");
    expect(usePageSeo).toHaveBeenCalledWith(
      expect.objectContaining({
        title: expect.stringContaining("FIVI360"),
        description: expect.any(String),
      }),
    );
    mounted.unmount();
  });

  it("does not import LegalConsentGate, Auth, or embed commercial path", () => {
    const source = fs.readFileSync(
      path.join(__dirname, "AccessEarlyLandingPage.jsx"),
      "utf8",
    );
    const demoSource = fs.readFileSync(
      path.join(__dirname, "sections/AccessEarlyDemo.jsx"),
      "utf8",
    );
    expect(source).not.toMatch(/from\s+["'][^"']*LegalConsentGate/);
    expect(source).not.toMatch(/from\s+["'][^"']*useAuth/);
    expect(demoSource).not.toMatch(/\/embed\//);
    expect(demoSource).toMatch(/FIVI360_DEMO_PROJECT/);
    expect(demoSource).toMatch(/LandingDemoExperience/);
  });

  it("conversion section reuses AccessEarlyForm (success navigates away)", () => {
    const conversion = fs.readFileSync(
      path.join(__dirname, "sections/AccessEarlyConversion.jsx"),
      "utf8",
    );
    expect(conversion).toMatch(/AccessEarlyForm/);
    expect(conversion).not.toMatch(/AccessEarlySuccess/);
  });
});
