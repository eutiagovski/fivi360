/**
 * RC-EMBED-UX-POLISH-2 — refetch silencioso não liga loading
 * RC-SEC-PROJECT-PRIVATE-ROUTE-1 — usa getOwnedOrAccessibleProject
 */

jest.mock("@/services/projects/projectService", () => ({
  getOwnedOrAccessibleProject: jest.fn(),
}));

const React = require("react");
const { createRoot } = require("react-dom/client");
const { act } = require("react");
const {
  getOwnedOrAccessibleProject,
} = require("@/services/projects/projectService");
const { useProject } = require("./useProject");

function Probe({ projectId, userId, onState }) {
  const state = useProject(projectId, userId);
  React.useEffect(() => {
    onState(state);
  });
  return null;
}

describe("useProject refetch — RC-EMBED-UX-POLISH-2", () => {
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

  test("refetch não ativa loading (evita desmontar modal/prévia)", async () => {
    getOwnedOrAccessibleProject.mockResolvedValue({
      id: "p1",
      userId: "u1",
      title: "A",
      visibility: "shared",
    });

    /** @type {any} */
    let latest = null;

    await act(async () => {
      root.render(
        React.createElement(Probe, {
          projectId: "p1",
          userId: "u1",
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
    expect(latest.project?.id).toBe("p1");
    expect(getOwnedOrAccessibleProject).toHaveBeenCalledWith("p1", "u1");

    let resolveFetch;
    getOwnedOrAccessibleProject.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveFetch = resolve;
        }),
    );

    let refetchPromise;
    await act(async () => {
      refetchPromise = latest.refetch();
    });

    // Enquanto a Promise está pendente, loading deve permanecer false.
    expect(latest.loading).toBe(false);

    await act(async () => {
      resolveFetch({
        id: "p1",
        userId: "u1",
        title: "B",
        visibility: "shared",
      });
      await refetchPromise;
    });

    expect(latest.loading).toBe(false);
    expect(latest.project?.title).toBe("B");
  });

  test("projeto de terceiro retorna notFound sem dados", async () => {
    getOwnedOrAccessibleProject.mockResolvedValue(null);

    /** @type {any} */
    let latest = null;

    await act(async () => {
      root.render(
        React.createElement(Probe, {
          projectId: "foreign-public",
          userId: "u-b",
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
    expect(latest.notFound).toBe(true);
    expect(latest.project).toBeNull();
  });
});
