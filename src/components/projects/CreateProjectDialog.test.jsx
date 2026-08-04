/**
 * RC-PROJECT-FORM-MODAL-1 — CreateProjectDialog
 */

const mockUseAuth = jest.fn();
const mockUsePlanLimits = jest.fn();
const mockCreateProject = jest.fn();
const mockToast = jest.fn();
const mockTrackEvent = jest.fn();
const mockShowPlanLimitToast = jest.fn(() => false);
const mockNavigate = jest.fn();

jest.mock("@/hooks/useAuth", () => ({
  useAuth: (...args) => mockUseAuth(...args),
}));

jest.mock("@/hooks/usePlanLimits", () => ({
  usePlanLimits: (...args) => mockUsePlanLimits(...args),
}));

jest.mock("@/hooks/use-toast", () => ({
  toast: (...args) => mockToast(...args),
}));

jest.mock("@/services/projects/projectService", () => ({
  createProject: (...args) => mockCreateProject(...args),
}));

jest.mock("@/services/analytics/analyticsService", () => ({
  trackEvent: (...args) => mockTrackEvent(...args),
}));

jest.mock("@/utils/planToast", () => ({
  showPlanLimitToast: (...args) => mockShowPlanLimitToast(...args),
}));

jest.mock(
  "react-router-dom",
  () => ({
    useNavigate: () => mockNavigate,
  }),
  { virtual: true },
);

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
const { CreateProjectDialog } = require("./CreateProjectDialog");

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

describe("CreateProjectDialog — RC-PROJECT-FORM-MODAL-1", () => {
  /** @type {HTMLElement} */
  let container;
  /** @type {ReturnType<typeof createRoot>} */
  let root;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({ user: { uid: "user-1" } });
    mockUsePlanLimits.mockReturnValue({
      publicVisibilityEnabled: true,
      canCreateProject: true,
    });
    mockCreateProject.mockResolvedValue("new-project-id");
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    container.remove();
  });

  function renderDialog(props = {}) {
    const onOpenChange = props.onOpenChange || jest.fn();
    act(() => {
      root.render(
        React.createElement(CreateProjectDialog, {
          open: true,
          onOpenChange,
          ...props,
        }),
      );
    });
    return { onOpenChange };
  }

  async function fillTitle(value) {
    await act(async () => {
      setNativeValue(
        container.querySelector('[data-testid="input-project-name"]'),
        value,
      );
    });
  }

  async function submitForm() {
    await act(async () => {
      const form = container.querySelector("#create-project-form-submit");
      form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
      await Promise.resolve();
      await Promise.resolve();
    });
  }

  test("abre modal vazio e foca o nome", async () => {
    const focusSpy = jest.spyOn(HTMLInputElement.prototype, "focus");
    renderDialog();

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(container.querySelector('[data-testid="create-project-dialog"]')).toBeTruthy();
    const title = container.querySelector('[data-testid="input-project-name"]');
    expect(title.value).toBe("");
    expect(focusSpy).toHaveBeenCalled();
    focusSpy.mockRestore();
  });

  test("validação obrigatória do nome impede submit", async () => {
    renderDialog();

    await submitForm();

    expect(mockCreateProject).not.toHaveBeenCalled();
    expect(
      container.querySelector('[data-testid="project-title-error"]')?.textContent,
    ).toBe("Informe o nome do projeto.");
    expect(container.querySelector('[data-testid="create-project-dialog"]')).toBeTruthy();
  });

  test("submit chama createProject uma vez, fecha, toast e navega", async () => {
    const onCreated = jest.fn();
    const onOpenChange = jest.fn();
    renderDialog({ onCreated, onOpenChange });

    await fillTitle("Residência");
    await submitForm();

    expect(mockCreateProject).toHaveBeenCalledTimes(1);
    expect(mockCreateProject).toHaveBeenCalledWith(
      "user-1",
      expect.objectContaining({
        title: "Residência",
        clientName: "",
        description: "",
        visibility: "private",
      }),
    );
    expect(mockTrackEvent).toHaveBeenCalledWith(
      "create_project",
      expect.objectContaining({ has_description: false }),
    );
    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Projeto criado com sucesso." }),
    );
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(onCreated).toHaveBeenCalledWith("new-project-id");
    expect(mockNavigate).toHaveBeenCalledWith("/projects/new-project-id");
  });

  test("clique duplo não duplica projeto", async () => {
    let resolveCreate;
    mockCreateProject.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveCreate = resolve;
        }),
    );

    renderDialog();
    await fillTitle("Duplo");

    await act(async () => {
      const form = container.querySelector("#create-project-form-submit");
      form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
      form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    });

    expect(mockCreateProject).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolveCreate("id-1");
      await Promise.resolve();
    });
  });

  test("erro mantém modal aberto", async () => {
    mockCreateProject.mockRejectedValue(new Error("falha rede"));
    const onOpenChange = jest.fn();
    renderDialog({ onOpenChange });

    await fillTitle("Erro");
    await submitForm();

    expect(onOpenChange).not.toHaveBeenCalledWith(false);
    expect(container.querySelector('[data-testid="create-project-dialog"]')).toBeTruthy();
    expect(
      container.querySelector('[data-testid="project-form-error"]')?.textContent,
    ).toContain("falha rede");
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
