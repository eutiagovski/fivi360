/**
 * RC-SEC-PROJECT-PRIVATE-ROUTE-1 — viewer interno bloqueia imagem de terceiro
 */

jest.mock("@/hooks/useAuth", () => ({
  useAuth: jest.fn(),
}));

jest.mock("@/services/images/imageService", () => ({
  getImageById: jest.fn(),
  getImagesByProjectId: jest.fn(),
  getLooseImagesByUserId: jest.fn(),
}));

jest.mock("@/services/projects/projectService", () => ({
  getOwnedOrAccessibleProject: jest.fn(),
}));

const React = require("react");
const { createRoot } = require("react-dom/client");
const { act } = require("react");
const { useAuth } = require("@/hooks/useAuth");
const {
  getImageById,
  getImagesByProjectId,
} = require("@/services/images/imageService");
const {
  getOwnedOrAccessibleProject,
} = require("@/services/projects/projectService");
const { useViewerImage } = require("./useViewerImage");

function Probe({ imageId, onState }) {
  const state = useViewerImage(imageId);
  React.useEffect(() => {
    onState(state);
  });
  return null;
}

describe("useViewerImage — RC-SEC-PROJECT-PRIVATE-ROUTE-1", () => {
  /** @type {HTMLElement} */
  let container;
  /** @type {ReturnType<typeof createRoot>} */
  let root;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    jest.clearAllMocks();
    useAuth.mockReturnValue({ user: { uid: "user-b" } });
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    container.remove();
  });

  test("owner image in owned project loads", async () => {
    useAuth.mockReturnValue({ user: { uid: "owner" } });
    getImageById.mockResolvedValue({
      id: "img-1",
      userId: "owner",
      projectId: "p1",
      originalUrl: "https://example.com/a.jpg",
    });
    getOwnedOrAccessibleProject.mockResolvedValue({
      id: "p1",
      userId: "owner",
      title: "Meu",
    });
    getImagesByProjectId.mockResolvedValue([
      { id: "img-1", userId: "owner", projectId: "p1" },
    ]);

    /** @type {any} */
    let latest = null;

    await act(async () => {
      root.render(
        React.createElement(Probe, {
          imageId: "img-1",
          onState: (s) => {
            latest = s;
          },
        }),
      );
    });
    await act(async () => {
      await Promise.resolve();
    });

    expect(latest.loading).toBe(false);
    expect(latest.error).toBeNull();
    expect(latest.image?.id).toBe("img-1");
    expect(latest.project?.id).toBe("p1");
  });

  test("foreign public image is blocked without rendering data", async () => {
    getImageById.mockResolvedValue({
      id: "img-foreign",
      userId: "owner-a",
      projectId: "p-public",
      title: "Segredo",
      originalUrl: "https://example.com/secret.jpg",
    });

    /** @type {any} */
    let latest = null;

    await act(async () => {
      root.render(
        React.createElement(Probe, {
          imageId: "img-foreign",
          onState: (s) => {
            latest = s;
          },
        }),
      );
    });
    await act(async () => {
      await Promise.resolve();
    });

    expect(latest.loading).toBe(false);
    expect(latest.error).toBe("not_found");
    expect(latest.image).toBeNull();
    expect(latest.project).toBeNull();
    expect(getOwnedOrAccessibleProject).not.toHaveBeenCalled();
    expect(getImagesByProjectId).not.toHaveBeenCalled();
  });

  test("permission-denied maps to not_found (no enumeration)", async () => {
    getImageById.mockRejectedValue({ code: "permission-denied" });

    /** @type {any} */
    let latest = null;

    await act(async () => {
      root.render(
        React.createElement(Probe, {
          imageId: "img-private",
          onState: (s) => {
            latest = s;
          },
        }),
      );
    });
    await act(async () => {
      await Promise.resolve();
    });

    expect(latest.error).toBe("not_found");
    expect(latest.image).toBeNull();
  });
});
