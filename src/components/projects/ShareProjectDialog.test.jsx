/**
 * RC-EMBED-UX-REFINE-1 — ShareProjectDialog + ProjectEmbedSettingsSection
 *
 * Cobre tabs, bloqueio por plano, ativação progressiva e snippet.
 */

const mockUseAuth = jest.fn();
const mockUsePlanLimits = jest.fn();
const mockUpdateProject = jest.fn();
const mockUpdateProjectEmbedSettings = jest.fn();
const mockToast = jest.fn();
const mockTrackEvent = jest.fn();
const mockShowPlanLimitToast = jest.fn(() => false);

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
  updateProject: (...args) => mockUpdateProject(...args),
  updateProjectEmbedSettings: (...args) =>
    mockUpdateProjectEmbedSettings(...args),
}));

jest.mock("@/services/analytics/analyticsService", () => ({
  trackEvent: (...args) => mockTrackEvent(...args),
  toShareVisibilityParam: (v) => v,
}));

jest.mock("@/utils/planToast", () => ({
  showPlanLimitToast: (...args) => mockShowPlanLimitToast(...args),
}));

jest.mock("@/utils/publicAccess", () => ({
  buildShareProjectUrl: (id) => `https://app.test/share/${id}`,
}));

jest.mock("@/utils/embed", () => ({
  buildEmbedProjectUrl: (id) => `https://app.test/embed/${id}`,
  buildEmbedSnippet: (id, options = {}) =>
    `<iframe src="https://app.test/embed/${id}" title="${options.projectName || "projeto"}"></iframe>`,
}));

jest.mock(
  "react-router-dom",
  () => ({
    Link: ({ to, children, ...props }) =>
      require("react").createElement("a", { href: to, ...props }, children),
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

jest.mock("@/components/ui/tabs", () => {
  const React = require("react");
  const TabsCtx = React.createContext({
    value: "share-link",
    onValueChange: () => {},
  });

  function Tabs({ value, onValueChange, children, ...props }) {
    return React.createElement(
      TabsCtx.Provider,
      { value: { value, onValueChange } },
      React.createElement("div", props, children),
    );
  }

  function TabsList({ children, ...props }) {
    return React.createElement("div", { role: "tablist", ...props }, children);
  }

  function TabsTrigger({ value, children, ...props }) {
    const ctx = React.useContext(TabsCtx);
    const selected = ctx.value === value;
    return React.createElement(
      "button",
      {
        type: "button",
        role: "tab",
        "aria-selected": selected,
        "data-state": selected ? "active" : "inactive",
        onClick: () => ctx.onValueChange?.(value),
        ...props,
      },
      children,
    );
  }

  function TabsContent({ value, children, forceMount, className, ...props }) {
    const ctx = React.useContext(TabsCtx);
    const selected = ctx.value === value;
    if (!forceMount && !selected) {
      return null;
    }
    return React.createElement(
      "div",
      {
        role: "tabpanel",
        "data-state": selected ? "active" : "inactive",
        hidden: !selected,
        className,
        ...props,
      },
      children,
    );
  }

  return { Tabs, TabsList, TabsTrigger, TabsContent };
});

jest.mock("@/components/ui/switch", () => {
  const React = require("react");
  return {
    Switch: React.forwardRef(function SwitchMock(
      { checked, onCheckedChange, disabled, ...props },
      ref,
    ) {
      return React.createElement("button", {
        type: "button",
        role: "switch",
        "aria-checked": checked === true,
        disabled,
        ref,
        onClick: () => {
          if (!disabled) {
            onCheckedChange?.(!checked);
          }
        },
        ...props,
      });
    }),
  };
});

jest.mock("@/components/ui/checkbox", () => {
  const React = require("react");
  return {
    Checkbox: React.forwardRef(function CheckboxMock(
      { checked, onCheckedChange, disabled, ...props },
      ref,
    ) {
      return React.createElement("button", {
        type: "button",
        role: "checkbox",
        "aria-checked": checked === true,
        disabled,
        ref,
        onClick: () => {
          if (!disabled) {
            onCheckedChange?.(!checked);
          }
        },
        ...props,
      });
    }),
  };
});

const React = require("react");
const { createRoot } = require("react-dom/client");
const { act } = require("react");
const {
  ShareProjectDialog,
} = require("./ShareProjectDialog");
const {
  ProjectEmbedSettingsSection,
} = require("./ProjectEmbedSettingsSection");
const { buildEmbedSnippet } = require("@/utils/embed");

function baseProject(overrides = {}) {
  return {
    id: "proj-1",
    title: "Residência Aurora",
    visibility: "shared",
    embedSettings: {
      enabled: false,
      initialImageId: null,
      allowFullscreen: true,
      allowNavigation: true,
      showBranding: true,
      updatedAt: null,
    },
    ...overrides,
  };
}

const sampleImages = [
  {
    id: "img-1",
    title: "Sala",
    originalUrl: "https://cdn.test/sala.jpg",
  },
  {
    id: "img-2",
    title: "Quarto",
    previewUrl: "https://cdn.test/quarto.jpg",
  },
];

function planLimits({ projectEmbedEnabled = true, publicVisibilityEnabled = true } = {}) {
  return {
    loading: false,
    projectEmbedEnabled,
    publicVisibilityEnabled,
  };
}

describe("ShareProjectDialog — RC-EMBED-UX-REFINE-1", () => {
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
    mockUsePlanLimits.mockReturnValue(planLimits());
    mockUpdateProjectEmbedSettings.mockImplementation(async (_id, _uid, patch) => ({
      enabled: false,
      initialImageId: null,
      allowFullscreen: true,
      allowNavigation: true,
      showBranding: true,
      updatedAt: null,
      ...patch,
    }));
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    container.remove();
  });

  function renderDialog(project = baseProject(), images = sampleImages) {
    act(() => {
      root.render(
        React.createElement(ShareProjectDialog, {
          open: true,
          onOpenChange: jest.fn(),
          project,
          images,
        }),
      );
    });
  }

  test("inicia na tab Compartilhar por link", () => {
    renderDialog();
    const linkTab = container.querySelector('[data-testid="share-tab-link"]');
    const embedTab = container.querySelector('[data-testid="share-tab-embed"]');
    expect(linkTab.getAttribute("aria-selected")).toBe("true");
    expect(embedTab.getAttribute("aria-selected")).toBe("false");
    expect(
      container.querySelector('[data-testid="share-tab-link-panel"]').hidden,
    ).toBe(false);
    expect(
      container.querySelector('[data-testid="share-project-url"]'),
    ).toBeTruthy();
  });

  test("link e incorporação ficam em tabs separadas", () => {
    renderDialog();
    act(() => {
      container.querySelector('[data-testid="share-tab-embed"]').click();
    });
    expect(
      container.querySelector('[data-testid="share-tab-embed"]').getAttribute(
        "aria-selected",
      ),
    ).toBe("true");
    expect(
      container.querySelector('[data-testid="embed-settings-section"]'),
    ).toBeTruthy();
    expect(
      container.querySelector('[data-testid="share-tab-link-panel"]').hidden,
    ).toBe(true);
    expect(
      container.querySelector('[data-testid="embed-snippet"]'),
    ).toBeNull();
  });

  test("troca de tab preserva estado local de visibilidade", () => {
    renderDialog();
    act(() => {
      container
        .querySelector('[data-testid="share-visibility-private"]')
        .click();
    });
    expect(
      container.querySelector('[data-testid="share-save-visibility"]'),
    ).toBeTruthy();

    act(() => {
      container.querySelector('[data-testid="share-tab-embed"]').click();
    });
    act(() => {
      container.querySelector('[data-testid="share-tab-link"]').click();
    });

    expect(
      container.querySelector('[data-testid="share-visibility-private"]')
        .checked,
    ).toBe(true);
    expect(
      container.querySelector('[data-testid="share-save-visibility"]'),
    ).toBeTruthy();
  });

  test("atualização do projeto não reseta a tab Embed nem fecha o modal", () => {
    const project = baseProject();
    act(() => {
      root.render(
        React.createElement(ShareProjectDialog, {
          open: true,
          onOpenChange: jest.fn(),
          project,
          images: sampleImages,
        }),
      );
    });

    act(() => {
      container.querySelector('[data-testid="share-tab-embed"]').click();
    });
    expect(
      container.querySelector('[data-testid="share-tab-embed"]').getAttribute(
        "aria-selected",
      ),
    ).toBe("true");

    act(() => {
      root.render(
        React.createElement(ShareProjectDialog, {
          open: true,
          onOpenChange: jest.fn(),
          project: {
            ...project,
            embedSettings: {
              ...project.embedSettings,
              allowFullscreen: false,
            },
          },
          images: sampleImages,
        }),
      );
    });

    expect(
      container.querySelector('[data-testid="share-tab-embed"]').getAttribute(
        "aria-selected",
      ),
    ).toBe("true");
    expect(
      container.querySelector('[data-testid="share-project-dialog"]') ||
        container.querySelector('[data-testid="dialog-root"]'),
    ).toBeTruthy();
  });

  test("descrição do modal separa as duas jornadas", () => {
    renderDialog();
    expect(container.textContent).toContain(
      "Compartilhe “Residência Aurora” por link ou incorpore a visualização no website do seu escritório.",
    );
  });

  test("usuário não elegível vê bloqueio sem código/configurações", () => {
    mockUsePlanLimits.mockReturnValue(
      planLimits({ projectEmbedEnabled: false }),
    );
    renderDialog(
      baseProject({
        embedSettings: {
          enabled: false,
          initialImageId: null,
          allowFullscreen: true,
          allowNavigation: true,
          showBranding: true,
          updatedAt: null,
        },
      }),
    );
    act(() => {
      container.querySelector('[data-testid="share-tab-embed"]').click();
    });

    expect(
      container.querySelector('[data-testid="embed-plan-locked"]'),
    ).toBeTruthy();
    expect(
      container.querySelector('[data-testid="embed-upgrade-cta"]'),
    ).toBeTruthy();
    expect(
      container.querySelector('[data-testid="embed-enabled-switch"]'),
    ).toBeNull();
    expect(container.querySelector('[data-testid="embed-snippet"]')).toBeNull();
    expect(
      container.querySelector('[data-testid="embed-initial-image"]'),
    ).toBeNull();
    expect(container.textContent).toContain("Professional+");
  });
});

describe("ProjectEmbedSettingsSection — RC-EMBED-UX-REFINE-1", () => {
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
    mockUsePlanLimits.mockReturnValue(planLimits());
    mockUpdateProjectEmbedSettings.mockImplementation(async (_id, _uid, patch) => ({
      enabled: true,
      initialImageId: "img-1",
      allowFullscreen: true,
      allowNavigation: true,
      showBranding: true,
      updatedAt: null,
      ...patch,
    }));
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    container.remove();
  });

  function renderSection(project = baseProject(), images = sampleImages) {
    act(() => {
      root.render(
        React.createElement(ProjectEmbedSettingsSection, {
          project,
          images,
        }),
      );
    });
  }

  test("Professional vê ativação e oculta configs quando desativado", () => {
    renderSection();
    expect(
      container.querySelector('[data-testid="embed-enabled-switch"]'),
    ).toBeTruthy();
    expect(
      container.querySelector('[data-testid="embed-settings-card"]'),
    ).toBeNull();
    expect(container.querySelector('[data-testid="embed-snippet"]')).toBeNull();
    expect(container.textContent).toContain(
      "Ative a incorporação para configurar a visualização e gerar o código HTML.",
    );
  });

  test("ativado mostra Ambiente inicial, configs, aviso, prévia e código", async () => {
    renderSection(
      baseProject({
        embedSettings: {
          enabled: true,
          initialImageId: "img-1",
          allowFullscreen: true,
          allowNavigation: true,
          showBranding: true,
          updatedAt: null,
        },
      }),
    );

    expect(container.textContent).toContain("Ambiente inicial");
    expect(container.textContent).not.toContain("Imagem inicial");
    expect(
      container.querySelector('[data-testid="embed-settings-card"]'),
    ).toBeTruthy();
    expect(
      container.querySelector('[data-testid="embed-access-notice"]'),
    ).toBeTruthy();
    expect(
      container.querySelector('[data-testid="embed-preview-section"]'),
    ).toBeTruthy();
    expect(
      container.querySelector('[data-testid="embed-code-section"]'),
    ).toBeTruthy();
    expect(container.querySelector('[data-testid="embed-snippet"]')).toBeTruthy();
    expect(container.querySelector('[data-testid="embed-preview"]')).toBeNull();

    act(() => {
      container.querySelector('[data-testid="embed-toggle-preview"]').click();
    });
    const preview = container.querySelector('[data-testid="embed-preview"] iframe');
    expect(preview).toBeTruthy();
    expect(preview.getAttribute("src")).toBe("https://app.test/embed/proj-1");
    expect(preview.getAttribute("title")).toContain(
      "Prévia da visualização 360°",
    );
    expect(preview.hasAttribute("allowfullscreen")).toBe(true);

    const openLink = container.querySelector(
      '[data-testid="embed-open-preview"]',
    );
    expect(openLink.getAttribute("href")).toBe("https://app.test/embed/proj-1");
  });

  test("ativar dispara persistência com initialImageId quando necessário", async () => {
    renderSection();

    await act(async () => {
      container.querySelector('[data-testid="embed-enabled-switch"]').click();
    });

    expect(mockUpdateProjectEmbedSettings).toHaveBeenCalledWith(
      "proj-1",
      "user-1",
      expect.objectContaining({
        enabled: true,
        initialImageId: "img-1",
      }),
    );
  });

  test("loading bloqueia interação duplicada no switch", async () => {
    let resolvePersist;
    mockUpdateProjectEmbedSettings.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolvePersist = resolve;
        }),
    );

    renderSection();

    await act(async () => {
      container.querySelector('[data-testid="embed-enabled-switch"]').click();
    });

    expect(
      container.querySelector('[data-testid="embed-enabled-switch"]').disabled,
    ).toBe(true);
    expect(container.textContent).toContain("Salvando...");

    await act(async () => {
      resolvePersist({
        enabled: true,
        initialImageId: "img-1",
        allowFullscreen: true,
        allowNavigation: true,
        showBranding: true,
        updatedAt: null,
      });
    });
  });

  test("erro apresenta feedback", async () => {
    mockUpdateProjectEmbedSettings.mockRejectedValue(new Error("falha"));
    renderSection();

    await act(async () => {
      container.querySelector('[data-testid="embed-enabled-switch"]').click();
    });

    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Erro ao salvar",
        variant: "destructive",
      }),
    );
  });

  test("snippet permanece idêntico ao gerador atual", () => {
    renderSection(
      baseProject({
        embedSettings: {
          enabled: true,
          initialImageId: "img-1",
          allowFullscreen: true,
          allowNavigation: true,
          showBranding: true,
          updatedAt: null,
        },
      }),
    );
    const expected = buildEmbedSnippet("proj-1", {
      projectName: "Residência Aurora",
    });
    expect(
      container.querySelector('[data-testid="embed-snippet"]').value,
    ).toBe(expected);
  });

  test("copiar código usa clipboard e falha possui fallback", async () => {
    const writeText = jest.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });

    renderSection(
      baseProject({
        embedSettings: {
          enabled: true,
          initialImageId: "img-1",
          allowFullscreen: true,
          allowNavigation: true,
          showBranding: true,
          updatedAt: null,
        },
      }),
    );

    await act(async () => {
      container.querySelector('[data-testid="embed-copy-code"]').click();
    });

    expect(writeText).toHaveBeenCalled();
    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Código de incorporação copiado.",
      }),
    );

    writeText.mockRejectedValue(new Error("denied"));
    await act(async () => {
      container.querySelector('[data-testid="embed-copy-code"]').click();
    });
    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Copie o código manualmente",
      }),
    );
  });

  test("preview não aparece para usuário bloqueado", () => {
    mockUsePlanLimits.mockReturnValue(
      planLimits({ projectEmbedEnabled: false }),
    );
    renderSection(
      baseProject({
        embedSettings: {
          enabled: true,
          initialImageId: "img-1",
          allowFullscreen: true,
          allowNavigation: true,
          showBranding: true,
          updatedAt: null,
        },
      }),
    );
    expect(
      container.querySelector('[data-testid="embed-preview-section"]'),
    ).toBeNull();
    expect(container.querySelector('[data-testid="embed-snippet"]')).toBeNull();
  });

  test("fullscreen e navegação mantêm persistência atual", async () => {
    renderSection(
      baseProject({
        embedSettings: {
          enabled: true,
          initialImageId: "img-1",
          allowFullscreen: true,
          allowNavigation: true,
          showBranding: true,
          updatedAt: null,
        },
      }),
    );

    await act(async () => {
      container.querySelector('[data-testid="embed-allow-fullscreen"]').click();
    });
    expect(mockUpdateProjectEmbedSettings).toHaveBeenCalledWith(
      "proj-1",
      "user-1",
      { allowFullscreen: false },
    );

    await act(async () => {
      container.querySelector('[data-testid="embed-allow-navigation"]').click();
    });
    expect(mockUpdateProjectEmbedSettings).toHaveBeenCalledWith(
      "proj-1",
      "user-1",
      { allowNavigation: false },
    );
  });

  test("alterar fullscreen/navegação não muda src nem key do iframe", async () => {
    renderSection(
      baseProject({
        embedSettings: {
          enabled: true,
          initialImageId: "img-1",
          allowFullscreen: true,
          allowNavigation: true,
          showBranding: true,
          updatedAt: null,
        },
      }),
    );

    act(() => {
      container.querySelector('[data-testid="embed-toggle-preview"]').click();
    });

    const preview = container.querySelector('[data-testid="embed-preview"]');
    const iframe = container.querySelector(
      '[data-testid="embed-preview-iframe"]',
    );
    const srcBefore = iframe.getAttribute("src");
    const keyBefore = preview.getAttribute("data-preview-key");

    await act(async () => {
      container.querySelector('[data-testid="embed-allow-fullscreen"]').click();
    });
    await act(async () => {
      container.querySelector('[data-testid="embed-allow-navigation"]').click();
    });

    const iframeAfter = container.querySelector(
      '[data-testid="embed-preview-iframe"]',
    );
    const previewAfter = container.querySelector('[data-testid="embed-preview"]');
    expect(iframeAfter).toBeTruthy();
    expect(iframeAfter.getAttribute("src")).toBe(srcBefore);
    expect(previewAfter.getAttribute("data-preview-key")).toBe(keyBefore);
    expect(srcBefore).toBe("https://app.test/embed/proj-1");
  });

  test("desativar incorporação oculta a prévia", async () => {
    mockUpdateProjectEmbedSettings.mockResolvedValue({
      enabled: false,
      initialImageId: "img-1",
      allowFullscreen: true,
      allowNavigation: true,
      showBranding: true,
      updatedAt: null,
    });

    renderSection(
      baseProject({
        embedSettings: {
          enabled: true,
          initialImageId: "img-1",
          allowFullscreen: true,
          allowNavigation: true,
          showBranding: true,
          updatedAt: null,
        },
      }),
    );

    act(() => {
      container.querySelector('[data-testid="embed-toggle-preview"]').click();
    });
    expect(
      container.querySelector('[data-testid="embed-preview-iframe"]'),
    ).toBeTruthy();

    await act(async () => {
      container.querySelector('[data-testid="embed-enabled-switch"]').click();
    });

    expect(
      container.querySelector('[data-testid="embed-preview-iframe"]'),
    ).toBeNull();
  });
});
