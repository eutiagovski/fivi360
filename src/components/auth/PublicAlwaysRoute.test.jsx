/**
 * RC-LP-ROUTING-1 — PublicAlwaysRoute / LandingRoute
 */

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const React = require("react");
const { createRoot } = require("react-dom/client");
const { act } = require("react");

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

describe("PublicAlwaysRoute — RC-LP-ROUTING-1", () => {
  it("renders children for guests without waiting on auth", () => {
    const { PublicAlwaysRoute } = require("./PublicAlwaysRoute");
    const mounted = mount(
      React.createElement(
        PublicAlwaysRoute,
        null,
        React.createElement("div", { "data-testid": "public-page" }, "home"),
      ),
    );

    expect(mounted.container.querySelector('[data-testid="public-page"]')).toBeTruthy();
    expect(mounted.container.querySelector('[data-testid="auth-loading"]')).toBeNull();
    mounted.unmount();
  });

  it("LandingRoute alias also renders children (no dashboard redirect)", () => {
    const { LandingRoute } = require("./LandingRoute");
    const mounted = mount(
      React.createElement(
        LandingRoute,
        null,
        React.createElement("div", { "data-testid": "landing-page" }, "landing"),
      ),
    );

    expect(
      mounted.container.querySelector('[data-testid="landing-page"]')?.textContent,
    ).toBe("landing");
    expect(mounted.container.querySelector('[data-testid="navigate"]')).toBeNull();
    mounted.unmount();
  });
});
