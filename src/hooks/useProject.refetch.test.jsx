/**
 * RC-EMBED-UX-POLISH-2 — refetch silencioso não liga loading
 */

jest.mock("@/services/projects/projectService", () => ({
  getProjectById: jest.fn(),
}));

const React = require("react");
const { createRoot } = require("react-dom/client");
const { act } = require("react");
const { getProjectById } = require("@/services/projects/projectService");
const { useProject } = require("./useProject");

function Probe({ projectId, onState }) {
  const state = useProject(projectId);
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
    getProjectById.mockResolvedValue({
      id: "p1",
      title: "A",
      visibility: "shared",
    });

    /** @type {any} */
    let latest = null;

    await act(async () => {
      root.render(
        React.createElement(Probe, {
          projectId: "p1",
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

    let resolveFetch;
    getProjectById.mockImplementation(
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
        title: "B",
        visibility: "shared",
      });
      await refetchPromise;
    });

    expect(latest.loading).toBe(false);
    expect(latest.project?.title).toBe("B");
  });
});
