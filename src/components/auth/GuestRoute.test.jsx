/**
 * RC-LP-ROUTING-1 — GuestRoute (GUEST_ONLY)
 */

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const mockUseAuth = jest.fn();

jest.mock("@/hooks/useAuth", () => ({
  useAuth: (...args) => mockUseAuth(...args),
}));

jest.mock("react-router-dom", () => ({
  Navigate: ({ to }) =>
    require("react").createElement("div", {
      "data-testid": "navigate",
      "data-to": to,
    }),
}), { virtual: true });

jest.mock("./ProtectedRoute", () => ({
  AuthLoadingScreen: () =>
    require("react").createElement("div", { "data-testid": "auth-loading" }, "loading"),
}));

const React = require("react");
const { createRoot } = require("react-dom/client");
const { act } = require("react");
const { GuestRoute } = require("./GuestRoute");
const { PublicRoute } = require("./PublicRoute");

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

describe("GuestRoute — RC-LP-ROUTING-1", () => {
  beforeEach(() => {
    mockUseAuth.mockReset();
  });

  it("shows login children for guests", () => {
    mockUseAuth.mockReturnValue({
      user: null,
      loading: false,
      signUpInProgress: false,
    });

    const mounted = mount(
      React.createElement(
        GuestRoute,
        null,
        React.createElement("div", { "data-testid": "login-page" }, "login"),
      ),
    );

    expect(mounted.container.querySelector('[data-testid="login-page"]')).toBeTruthy();
    expect(mounted.container.querySelector('[data-testid="navigate"]')).toBeNull();
    mounted.unmount();
  });

  it("authenticated user on /login is redirected to /dashboard", () => {
    mockUseAuth.mockReturnValue({
      user: { uid: "u1", emailVerified: true },
      loading: false,
      signUpInProgress: false,
    });

    const mounted = mount(
      React.createElement(
        GuestRoute,
        null,
        React.createElement("div", { "data-testid": "login-page" }, "login"),
      ),
    );

    const nav = mounted.container.querySelector('[data-testid="navigate"]');
    expect(nav).toBeTruthy();
    expect(nav.getAttribute("data-to")).toBe("/dashboard");
    expect(mounted.container.querySelector('[data-testid="login-page"]')).toBeNull();
    mounted.unmount();
  });

  it("PublicRoute alias preserves guest-only behavior", () => {
    mockUseAuth.mockReturnValue({
      user: { uid: "u1", emailVerified: true },
      loading: false,
      signUpInProgress: false,
    });

    const mounted = mount(
      React.createElement(
        PublicRoute,
        null,
        React.createElement("div", { "data-testid": "register-page" }, "register"),
      ),
    );

    expect(
      mounted.container
        .querySelector('[data-testid="navigate"]')
        ?.getAttribute("data-to"),
    ).toBe("/dashboard");
    mounted.unmount();
  });

  it("shows loading while auth initializes", () => {
    mockUseAuth.mockReturnValue({
      user: null,
      loading: true,
      signUpInProgress: false,
    });

    const mounted = mount(
      React.createElement(
        GuestRoute,
        null,
        React.createElement("div", { "data-testid": "login-page" }, "login"),
      ),
    );

    expect(mounted.container.querySelector('[data-testid="auth-loading"]')).toBeTruthy();
    mounted.unmount();
  });
});
