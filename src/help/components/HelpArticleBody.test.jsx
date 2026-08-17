/**
 * RC-HELP-CENTER-FOUNDATION-1 — renderer de blocos e vídeo
 */

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

jest.mock("@/hooks/usePageSeo", () => ({
  usePageSeo: jest.fn(),
}));

jest.mock("react-router-dom", () => ({
  Link: ({ children, to, ...rest }) =>
    require("react").createElement("a", { href: to, ...rest }, children),
}), { virtual: true });

const React = require("react");
const { createRoot } = require("react-dom/client");
const { act } = require("react");
const { HelpArticleBody } = require("./HelpArticleBody");
const { HelpVideoSlot } = require("./HelpVideoSlot");
const {
  heading,
  note,
  paragraph,
  steps,
  tip,
  unorderedList,
  warning,
} = require("../utils/helpBlocks");

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

describe("HelpArticleBody — RC-HELP-CENTER-FOUNDATION-1", () => {
  it("renders supported blocks without HTML injection", () => {
    const mounted = mount(
      React.createElement(HelpArticleBody, {
        blocks: [
          heading("Título"),
          paragraph("Um parágrafo."),
          unorderedList(["Item A", "Item B"]),
          steps([{ title: "Passo", content: "Faça isso." }]),
          note("Nota"),
          tip("Dica"),
          warning("Aviso"),
        ],
      }),
    );

    expect(mounted.container.querySelector("h2")?.textContent).toBe("Título");
    expect(mounted.container.textContent).toContain("Um parágrafo.");
    expect(mounted.container.textContent).toContain("Item A");
    expect(mounted.container.querySelector('[data-testid="help-steps"]')).toBeTruthy();
    expect(mounted.container.querySelector('[data-testid="help-block-note"]')).toBeTruthy();
    expect(mounted.container.querySelector('[data-testid="help-block-tip"]')).toBeTruthy();
    expect(mounted.container.querySelector('[data-testid="help-block-warning"]')).toBeTruthy();
    expect(mounted.container.innerHTML).not.toMatch(/dangerouslySetInnerHTML/);
    mounted.unmount();
  });
});

describe("HelpVideoSlot — RC-HELP-CENTER-FOUNDATION-1", () => {
  it("does not render iframe or placeholder when videoUrl is empty", () => {
    const empty = mount(React.createElement(HelpVideoSlot, { videoUrl: "" }));
    expect(empty.container.querySelector('[data-testid="help-article-video"]')).toBeNull();
    expect(empty.container.querySelector("iframe")).toBeNull();
    empty.unmount();

    const missing = mount(React.createElement(HelpVideoSlot, { videoUrl: null }));
    expect(missing.container.querySelector('[data-testid="help-article-video"]')).toBeNull();
    missing.unmount();
  });

  it("reserves a video area without YouTube iframe when videoUrl is set", () => {
    const mounted = mount(
      React.createElement(HelpVideoSlot, {
        videoUrl: "https://example.com/future-video",
      }),
    );

    expect(mounted.container.querySelector('[data-testid="help-article-video"]')).toBeTruthy();
    expect(mounted.container.querySelector("iframe")).toBeNull();
    mounted.unmount();
  });
});
