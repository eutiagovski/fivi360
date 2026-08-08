/**
 * RC-LP-ROUTING-1 — ProtectedRoute remains PRIVATE + LegalConsentGate
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

jest.mock("@/components/legal/LegalConsentGate", () => ({
  LegalConsentGate: ({ children }) =>
    require("react").createElement(
      "div",
      { "data-testid": "legal-consent-gate" },
      children,
    ),
}));

const React = require("react");
const { createRoot } = require("react-dom/client");
const { act } = require("react");
const { ProtectedRoute } = require("./ProtectedRoute");

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

describe("ProtectedRoute — RC-LP-ROUTING-1 PRIVATE", () => {
  beforeEach(() => {
    mockUseAuth.mockReset();
  });

  it("unauthenticated users go to /login (dashboard/settings/projects stay private)", () => {
    mockUseAuth.mockReturnValue({
      user: null,
      loading: false,
      signUpInProgress: false,
    });

    const mounted = mount(
      React.createElement(
        ProtectedRoute,
        null,
        React.createElement("div", { "data-testid": "private-page" }, "dashboard"),
      ),
    );

    expect(
      mounted.container
        .querySelector('[data-testid="navigate"]')
        ?.getAttribute("data-to"),
    ).toBe("/login");
    expect(mounted.container.querySelector('[data-testid="private-page"]')).toBeNull();
    expect(
      mounted.container.querySelector('[data-testid="legal-consent-gate"]'),
    ).toBeNull();
    mounted.unmount();
  });

  it("authenticated verified users pass through LegalConsentGate", () => {
    mockUseAuth.mockReturnValue({
      user: {
        uid: "u1",
        emailVerified: true,
        usesPasswordAuth: true,
      },
      loading: false,
      signUpInProgress: false,
    });

    const mounted = mount(
      React.createElement(
        ProtectedRoute,
        null,
        React.createElement("div", { "data-testid": "private-page" }, "settings"),
      ),
    );

    expect(
      mounted.container.querySelector('[data-testid="legal-consent-gate"]'),
    ).toBeTruthy();
    expect(
      mounted.container.querySelector('[data-testid="private-page"]')?.textContent,
    ).toBe("settings");
    mounted.unmount();
  });
});
