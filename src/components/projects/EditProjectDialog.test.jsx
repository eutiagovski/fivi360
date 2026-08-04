/**
 * RC-PROJECT-FORM-MODAL-1 — EditProjectDialog
 */

const mockUsePlanLimits = jest.fn();
const mockUpdateProject = jest.fn();
const mockToast = jest.fn();
const mockShowPlanLimitToast = jest.fn(() => false);

jest.mock("@/hooks/usePlanLimits", () => ({
  usePlanLimits: (...args) => mockUsePlanLimits(...args),
}));

jest.mock("@/hooks/use-toast", () => ({
  toast: (...args) => mockToast(...args),
}));

jest.mock("@/services/projects/projectService", () => ({
  updateProject: (...args) => mockUpdateProject(...args),
}));

jest.mock("@/utils/planToast", () => ({
  showPlanLimitToast: (...args) => mockShowPlanLimitToast(...args),
}));

jest.mock("@/components/ui/dialog", () => {
  const React = require("react");
  return {
    Dialog: ({ open, children }) =>
      open ? React.createElement("div", { "data-testid": "dialog-root" }, children) : null,
    DialogContent: ({ children, ...props }) =>
      React.createElement("div", props, children),
    DialogHeader: ({ children, ...props }) =>
      React.createElement("div", props, children),
    DialogTitle: ({ children, ...props }) =>
      React.createElement("h2", props, children),
    DialogDescription: ({ children, ...props }) =>
      React.createElement("p", props, children),
    DialogFooter: ({ children, ...props }) =>
      React.createElement("div", props, children),
  };
});

const React = require("react");
const { createRoot } = require("react-dom/client");
const { act } = require("react");
const { EditProjectDialog } = require("./EditProjectDialog");

function setNativeValue(element, value) {
  const prototype = Object.getPrototypeOf(element);
  const descriptor = Object.getOwnPropertyDescriptor(prototype, "value");
  const lastValue = element.value;
  descriptor.set.call(element, value);
  const tracker = element._valueTracker;
  if (tracker) {
    tracker.setValue(lastValue);
  }
  element.dispatchEvent(new Event("input", { bubbles: true }));
  element.dispatchEvent(new Event("change", { bubbles: true }));
}

function baseProject(overrides = {}) {
  return {
    id: "proj-1",
    title: "Residência Aurora",
    clientName: "Cliente A",
    description: "Descrição atual",
    visibility: "shared",
    ...overrides,
  };
}

describe("EditProjectDialog — RC-PROJECT-FORM-MODAL-1", () => {
  /** @type {HTMLElement} */
  let container;
  /** @type {ReturnType<typeof createRoot>} */
  let root;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    jest.clearAllMocks();
    mockUsePlanLimits.mockReturnValue({ publicVisibilityEnabled: true });
    mockUpdateProject.mockResolvedValue(undefined);
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    container.remove();
  });

  function renderDialog(project = baseProject(), props = {}) {
    const onOpenChange = props.onOpenChange || jest.fn();
    act(() => {
      root.render(
        React.createElement(EditProjectDialog, {
          open: true,
          onOpenChange,
          project,
          ...props,
        }),
      );
    });
    return { onOpenChange };
  }

  async function submitForm() {
    await act(async () => {
      const form = container.querySelector("#edit-project-form-submit");
      form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
      await Promise.resolve();
      await Promise.resolve();
    });
  }

  test("carrega dados atuais do projeto", async () => {
    renderDialog();

    await act(async () => {
      await Promise.resolve();
    });

    expect(container.querySelector('[data-testid="edit-project-dialog"]')).toBeTruthy();
    expect(container.querySelector('[data-testid="input-project-name"]').value).toBe(
      "Residência Aurora",
    );
    expect(container.querySelector('[data-testid="input-project-client"]').value).toBe(
      "Cliente A",
    );
    expect(
      container.querySelector('[data-testid="input-project-description"]').value,
    ).toBe("Descrição atual");
  });

  test("salva campos corretos e não chama create", async () => {
    const onUpdated = jest.fn();
    const onOpenChange = jest.fn();
    renderDialog(baseProject(), { onUpdated, onOpenChange });

    await act(async () => {
      setNativeValue(
        container.querySelector('[data-testid="input-project-name"]'),
        "Residência Atualizada",
      );
    });

    await submitForm();

    expect(mockUpdateProject).toHaveBeenCalledTimes(1);
    expect(mockUpdateProject).toHaveBeenCalledWith("proj-1", {
      title: "Residência Atualizada",
      clientName: "Cliente A",
      description: "Descrição atual",
      visibility: "shared",
    });
    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Projeto atualizado com sucesso." }),
    );
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(onUpdated).toHaveBeenCalledWith({
      title: "Residência Atualizada",
      clientName: "Cliente A",
      description: "Descrição atual",
      visibility: "shared",
    });
  });

  test("erro mantém modal aberto", async () => {
    mockUpdateProject.mockRejectedValue(new Error("falha update"));
    const onOpenChange = jest.fn();
    renderDialog(baseProject(), { onOpenChange });

    await submitForm();

    expect(onOpenChange).not.toHaveBeenCalledWith(false);
    expect(container.querySelector('[data-testid="edit-project-dialog"]')).toBeTruthy();
    expect(
      container.querySelector('[data-testid="project-form-error"]')?.textContent,
    ).toContain("falha update");
  });

  test("trocar de projeto não reaproveita dados anteriores", async () => {
    const onOpenChange = jest.fn();

    await act(async () => {
      root.render(
        React.createElement(EditProjectDialog, {
          open: true,
          onOpenChange,
          project: baseProject({ title: "Projeto A", id: "a" }),
        }),
      );
    });

    expect(container.querySelector('[data-testid="input-project-name"]').value).toBe(
      "Projeto A",
    );

    await act(async () => {
      root.render(
        React.createElement(EditProjectDialog, {
          open: true,
          onOpenChange,
          project: baseProject({
            id: "b",
            title: "Projeto B",
            clientName: "Outro",
            description: "",
            visibility: "private",
          }),
        }),
      );
    });

    expect(container.querySelector('[data-testid="input-project-name"]').value).toBe(
      "Projeto B",
    );
    expect(container.querySelector('[data-testid="input-project-client"]').value).toBe(
      "Outro",
    );
  });

  test("clique duplo não duplica update", async () => {
    let resolveUpdate;
    mockUpdateProject.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveUpdate = resolve;
        }),
    );

    renderDialog();

    await act(async () => {
      const form = container.querySelector("#edit-project-form-submit");
      form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
      form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    });

    expect(mockUpdateProject).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolveUpdate();
      await Promise.resolve();
    });
  });
});
