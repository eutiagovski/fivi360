/**
 * RC-LP-PRELAUNCH-STRUCTURE-1 — AccessEarlyVideo
 */

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const React = require("react");
const { createRoot } = require("react-dom/client");
const { act } = require("react");
const { AccessEarlyVideo } = require("./AccessEarlyVideo");

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
      act(() => root.unmount());
      container.remove();
    },
  };
}

describe("AccessEarlyVideo — RC-LP-PRELAUNCH-STRUCTURE-1", () => {
  it("renders placeholder without iframe when videoUrl empty", () => {
    const mounted = mount(React.createElement(AccessEarlyVideo, { videoUrl: "" }));
    expect(
      mounted.container.querySelector('[data-testid="access-early-video-placeholder"]'),
    ).toBeTruthy();
    expect(mounted.container.querySelector("iframe")).toBeNull();
    mounted.unmount();
  });

  it("renders iframe with title and without autoplay when configured", () => {
    const url = "https://www.youtube.com/embed/abc123";
    const mounted = mount(
      React.createElement(AccessEarlyVideo, { videoUrl: url }),
    );
    const iframe = mounted.container.querySelector("iframe");
    expect(iframe).toBeTruthy();
    expect(iframe.getAttribute("title")).toMatch(/FIVI360/i);
    expect(iframe.getAttribute("src")).toBe(url);
    expect(iframe.getAttribute("src")).not.toMatch(/autoplay=1/);
    expect(iframe.getAttribute("loading")).toBe("lazy");
    expect(iframe.hasAttribute("allowFullScreen")).toBe(true);
    mounted.unmount();
  });
});
