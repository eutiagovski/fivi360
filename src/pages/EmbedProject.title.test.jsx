/**
 * RC-EMBED-UX-POLISH-2 — título do ambiente no Viewer Embed
 */

jest.mock("react-router-dom", () => ({
  useParams: () => ({ projectId: "proj-1", imageId: "img-1" }),
  useNavigate: () => jest.fn(),
  Navigate: () => null,
  Link: ({ to, children, ...props }) =>
    require("react").createElement("a", { href: to, ...props }, children),
}), { virtual: true });

jest.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: jest.fn() }),
}));

jest.mock("@/services/embed/embedPublicService", () => ({
  fetchPublicEmbeddedProject: jest.fn(),
}));

jest.mock("@/components/viewer/PanoramaViewer", () => ({
  PanoramaViewer: (props) =>
    require("react").createElement("div", {
      "data-testid": "panorama-viewer-mock",
      "data-fullscreen": String(props.showFullscreenCtrl === true),
    }),
}));

jest.mock("@/components/embed/EmbedPoweredByBrand", () => ({
  EmbedPoweredByBrand: () =>
    require("react").createElement("div", {
      "data-testid": "embed-brand-mock",
    }),
}));

jest.mock("@/components/viewer/HotspotInfoDialog", () => ({
  HotspotInfoDialog: () => null,
}));

const React = require("react");
const { createRoot } = require("react-dom/client");
const { act } = require("react");
const {
  fetchPublicEmbeddedProject,
} = require("@/services/embed/embedPublicService");
const { EmbedProjectPage } = require("./EmbedProject");

describe("EmbedProjectPage — RC-EMBED-UX-POLISH-2 title", () => {
  /** @type {HTMLElement} */
  let container;
  /** @type {ReturnType<typeof createRoot>} */
  let root;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    jest.clearAllMocks();
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    container.remove();
  });

  async function renderLoaded(name) {
    fetchPublicEmbeddedProject.mockResolvedValue({
      id: "proj-1",
      name: "Projeto",
      initialImageId: "img-1",
      images: [
        {
          id: "img-1",
          name,
          panoramaUrl: "https://cdn.test/p.jpg",
          order: 0,
          hotspots: [],
        },
        {
          id: "img-2",
          name: "Outro",
          panoramaUrl: "https://cdn.test/p2.jpg",
          order: 1,
          hotspots: [],
        },
      ],
      embedSettings: {
        enabled: true,
        initialImageId: "img-1",
        allowFullscreen: true,
        allowNavigation: true,
        showBranding: true,
      },
    });

    await act(async () => {
      root.render(React.createElement(EmbedProjectPage));
    });
    await act(async () => {
      await Promise.resolve();
    });
  }

  test("título fica no topo-esquerdo e não ocupa a faixa dos controles", async () => {
    await renderLoaded("Sala");

    const wrap = container.querySelector(
      '[data-testid="embed-environment-title-wrap"]',
    );
    const title = container.querySelector(
      '[data-testid="embed-environment-name"]',
    );

    expect(wrap).toBeTruthy();
    expect(wrap.className).toContain("left-3");
    expect(wrap.className).toContain("top-3");
    expect(wrap.className).toContain("pointer-events-none");
    expect(wrap.className).toContain("max-w-[min(70%,calc(100%-5.5rem))]");
    expect(wrap.className).not.toContain("right-3");
    expect(title.className).toContain("line-clamp-2");
  });

  test("nome longo usa truncamento em no máximo duas linhas", async () => {
    const longName =
      "Ambiente de estar integrado com cozinha americana e varanda gourmet muito ampla para eventos";
    await renderLoaded(longName);

    const title = container.querySelector(
      '[data-testid="embed-environment-name"]',
    );
    expect(title.textContent).toBe(longName);
    expect(title.className).toMatch(/line-clamp-2/);
    expect(title.getAttribute("title")).toBe(longName);
  });
});
