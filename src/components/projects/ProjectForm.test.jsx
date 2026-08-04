/**
 * RC-PROJECT-FORM-MODAL-1 — ProjectForm compartilhado
 */

jest.mock("@/utils/visibility", () => ({
  VISIBILITY_OPTIONS: [
    { value: "private", label: "Privado", description: "Só você acessa" },
    { value: "shared", label: "Compartilhado", description: "Acessível por link" },
    { value: "public", label: "Público", description: "Portfólio" },
  ],
  getVisibilityOptionsForPlan: (enabled) => {
    const all = [
      { value: "private", label: "Privado", description: "Só você acessa" },
      { value: "shared", label: "Compartilhado", description: "Acessível por link" },
      { value: "public", label: "Público", description: "Portfólio" },
    ];
    return enabled ? all : all.filter((o) => o.value !== "public");
  },
}));

const React = require("react");
const { createRoot } = require("react-dom/client");
const { act } = require("react");
const {
  ProjectForm,
  EMPTY_PROJECT_FORM_VALUES,
  projectToFormValues,
} = require("./ProjectForm");

describe("ProjectForm — RC-PROJECT-FORM-MODAL-1", () => {
  /** @type {HTMLElement} */
  let container;
  /** @type {ReturnType<typeof createRoot>} */
  let root;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    container.remove();
  });

  test("projectToFormValues mapeia projeto e defaults", () => {
    expect(projectToFormValues(null)).toEqual(EMPTY_PROJECT_FORM_VALUES);
    expect(
      projectToFormValues({
        title: "Casa",
        clientName: "Ana",
        description: "Desc",
        visibility: "shared",
      }),
    ).toEqual({
      title: "Casa",
      clientName: "Ana",
      description: "Desc",
      visibility: "shared",
    });
  });

  test("modo create inicia com campos vazios e foca o nome", async () => {
    const onChange = jest.fn();
    const focusSpy = jest.spyOn(HTMLInputElement.prototype, "focus");

    await act(async () => {
      root.render(
        React.createElement(ProjectForm, {
          mode: "create",
          values: EMPTY_PROJECT_FORM_VALUES,
          onChange,
          publicVisibilityEnabled: true,
          autoFocusTitle: true,
        }),
      );
    });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    const title = container.querySelector('[data-testid="input-project-name"]');
    expect(title).toBeTruthy();
    expect(title.value).toBe("");
    expect(focusSpy).toHaveBeenCalled();
    expect(container.querySelector('[data-testid="create-project-form"]')).toBeTruthy();

    focusSpy.mockRestore();
  });

  test("modo edit carrega valores iniciais", async () => {
    const values = projectToFormValues({
      title: "Loft",
      clientName: "Bruno",
      description: "Interior",
      visibility: "private",
    });

    await act(async () => {
      root.render(
        React.createElement(ProjectForm, {
          mode: "edit",
          values,
          onChange: jest.fn(),
          publicVisibilityEnabled: true,
          autoFocusTitle: false,
        }),
      );
    });

    expect(container.querySelector('[data-testid="input-project-name"]').value).toBe(
      "Loft",
    );
    expect(container.querySelector('[data-testid="input-project-client"]').value).toBe(
      "Bruno",
    );
    expect(
      container.querySelector('[data-testid="input-project-description"]').value,
    ).toBe("Interior");
    expect(container.querySelector('[data-testid="edit-project-form"]')).toBeTruthy();
  });

  test("exibe erro de título acessível", async () => {
    await act(async () => {
      root.render(
        React.createElement(ProjectForm, {
          mode: "create",
          values: EMPTY_PROJECT_FORM_VALUES,
          onChange: jest.fn(),
          errors: { title: "Informe o nome do projeto." },
          autoFocusTitle: false,
        }),
      );
    });

    const error = container.querySelector('[data-testid="project-title-error"]');
    expect(error).toBeTruthy();
    expect(error.textContent).toBe("Informe o nome do projeto.");
    expect(error.getAttribute("role")).toBe("alert");
  });

  test("oculta opção público quando plano não permite", async () => {
    await act(async () => {
      root.render(
        React.createElement(ProjectForm, {
          mode: "create",
          values: EMPTY_PROJECT_FORM_VALUES,
          onChange: jest.fn(),
          publicVisibilityEnabled: false,
          autoFocusTitle: false,
        }),
      );
    });

    expect(container.querySelector('[data-testid="status-option-private"]')).toBeTruthy();
    expect(container.querySelector('[data-testid="status-option-shared"]')).toBeTruthy();
    expect(container.querySelector('[data-testid="status-option-public"]')).toBeNull();
  });
});
