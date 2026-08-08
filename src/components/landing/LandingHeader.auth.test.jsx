/**
 * RC-LP-ROUTING-1 — LandingHeader CTAs by auth state
 */

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const mockUseAuth = jest.fn();

jest.mock("@/hooks/useAuth", () => ({
  useAuth: (...args) => mockUseAuth(...args),
}));

jest.mock("react-router-dom", () => ({
  Link: ({ children, to, ...rest }) =>
    require("react").createElement("a", { href: to, ...rest }, children),
}), { virtual: true });

jest.mock("@/services/analytics/analyticsService", () => ({
  trackEvent: jest.fn(),
}));

jest.mock("@/components/ui/button", () => ({
  Button: ({ children, asChild, ...rest }) =>
    asChild
      ? children
      : require("react").createElement("button", rest, children),
}));

jest.mock("@/components/ui/sheet", () => ({
  Sheet: ({ children }) => require("react").createElement("div", null, children),
  SheetTrigger: ({ children }) => children,
  SheetContent: ({ children }) =>
    require("react").createElement("div", { "data-testid": "sheet-content" }, children),
  SheetHeader: ({ children }) => require("react").createElement("div", null, children),
  SheetTitle: ({ children }) => require("react").createElement("div", null, children),
}));

const React = require("react");
const { createRoot } = require("react-dom/client");
const { act } = require("react");
const { LandingHeader } = require("./LandingHeader");

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

describe("LandingHeader — RC-LP-ROUTING-1", () => {
  beforeEach(() => {
    mockUseAuth.mockReset();
  });

  it("guest sees Entrar and Começar grátis", () => {
    mockUseAuth.mockReturnValue({ user: null, loading: false });

    const mounted = mount(React.createElement(LandingHeader));

    expect(
      mounted.container.querySelector('[data-testid="landing-header-login-btn"]'),
    ).toBeTruthy();
    expect(
      mounted.container.querySelector('[data-testid="landing-header-register-btn"]'),
    ).toBeTruthy();
    expect(
      mounted.container.querySelector('[data-testid="landing-header-dashboard-btn"]'),
    ).toBeNull();
    mounted.unmount();
  });

  it("authenticated user sees Ir para o Dashboard", () => {
    mockUseAuth.mockReturnValue({
      user: { uid: "u1", email: "a@example.com" },
      loading: false,
    });

    const mounted = mount(React.createElement(LandingHeader));

    expect(
      mounted.container.querySelector('[data-testid="landing-header-dashboard-btn"]'),
    ).toBeTruthy();
    expect(
      mounted.container.querySelector('[data-testid="landing-header-login-btn"]'),
    ).toBeNull();
    expect(
      mounted.container.querySelector('[data-testid="landing-header-register-btn"]'),
    ).toBeNull();
    mounted.unmount();
  });
});
