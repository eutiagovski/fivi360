/**
 * RC-SETTINGS-UX-REFINE-1 — Settings layout, navegação e preservação de estado.
 */

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const mockUseAuth = jest.fn();
const mockUsePlanLimits = jest.fn();
const mockGetUser = jest.fn();
const mockSaveUserSettings = jest.fn();
const mockCheckSlugAvailability = jest.fn();
const mockToast = jest.fn();
const mockTrackEvent = jest.fn();
const mockShowPlanLimitToast = jest.fn(() => false);
const mockSetSearchParams = jest.fn();

let mockSearchParams = new URLSearchParams();

jest.mock('@/hooks/useAuth', () => ({
  useAuth: (...args) => mockUseAuth(...args),
}));

jest.mock('@/hooks/usePlanLimits', () => ({
  usePlanLimits: (...args) => mockUsePlanLimits(...args),
}));

jest.mock('@/hooks/use-toast', () => ({
  toast: (...args) => mockToast(...args),
}));

jest.mock('@/services/users/userService', () => ({
  getUser: (...args) => mockGetUser(...args),
  saveUserSettings: (...args) => mockSaveUserSettings(...args),
  SlugTakenError: class SlugTakenError extends Error {
    constructor(message = 'Slug taken') {
      super(message);
      this.name = 'SlugTakenError';
    }
  },
  SlugValidationError: class SlugValidationError extends Error {
    constructor(message = 'Invalid slug') {
      super(message);
      this.name = 'SlugValidationError';
    }
  },
}));

jest.mock('@/services/slugs/slugService', () => ({
  checkSlugAvailability: (...args) => mockCheckSlugAvailability(...args),
}));

jest.mock('@/services/analytics/analyticsService', () => ({
  trackEvent: (...args) => mockTrackEvent(...args),
}));

jest.mock('@/utils/planToast', () => ({
  showPlanLimitToast: (...args) => mockShowPlanLimitToast(...args),
}));

jest.mock('@/utils/slug', () => ({
  normalizeSlug: (value) =>
    String(value || '')
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '-'),
  buildPortfolioUrl: (slug) =>
    slug ? `https://fivi360.com.br/u/${slug}` : 'https://fivi360.com.br/u/',
}));

jest.mock(
  'react-router-dom',
  () => ({
    useSearchParams: () => [mockSearchParams, mockSetSearchParams],
  }),
  { virtual: true },
);

jest.mock('@/components/ui/switch', () => {
  const React = require('react');
  return {
    Switch: React.forwardRef(function SwitchMock(
      { checked, onCheckedChange, disabled, ...props },
      ref,
    ) {
      return React.createElement('button', {
        type: 'button',
        role: 'switch',
        'aria-checked': checked === true,
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

jest.mock('@/components/plans/PremiumFeatureModal', () => ({
  PremiumFeatureModal: () => null,
}));

jest.mock('@/components/plans/UpgradePrompt', () => ({
  UpgradePrompt: ({ message }) =>
    require('react').createElement(
      'div',
      { 'data-testid': 'upgrade-prompt' },
      message,
    ),
}));

jest.mock('@/components/common/PageHeader', () => ({
  PageHeader: ({ title, subtitle, dataTestId }) =>
    require('react').createElement(
      'div',
      null,
      require('react').createElement('h1', { 'data-testid': dataTestId }, title),
      subtitle
        ? require('react').createElement('p', null, subtitle)
        : null,
    ),
}));

const React = require('react');
const { act } = require('react');
const { createRoot } = require('react-dom/client');
const { Settings } = require('./Settings');
const {
  resolveSettingsSection,
  DEFAULT_SETTINGS_SECTION,
  SETTINGS_SECTIONS,
} = require('@/components/settings/settingsSections');

function profileFixture(overrides = {}) {
  return {
    displayName: 'Ana Silva',
    email: 'ana@example.com',
    companyName: 'Estúdio Ana',
    companyLogo: '',
    bio: 'Arquitetura contemporânea',
    publicSlug: 'estudio-ana',
    portfolioEnabled: true,
    socialLinks: {
      website: 'https://estudioana.com.br',
      instagram: 'https://instagram.com/estudioana',
      youtube: '',
      linkedin: '',
      whatsapp: 'https://wa.me/5511987654321',
    },
    marketingPreferences: {
      enabled: false,
      productUpdates: false,
      offers: false,
      tips: false,
      newsletter: false,
      research: false,
      consentVersion: null,
      consentSource: null,
      consentedAt: null,
      revokedAt: null,
      updatedAt: null,
    },
    ...overrides,
  };
}

function setInputValue(element, value) {
  const proto = Object.getPrototypeOf(element);
  const descriptor = Object.getOwnPropertyDescriptor(proto, 'value');
  if (descriptor?.set) {
    descriptor.set.call(element, value);
  } else {
    element.value = value;
  }
  act(() => {
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
  });
}

async function flushAsync() {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
}

async function renderSettings() {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);

  await act(async () => {
    root.render(React.createElement(Settings));
  });

  await flushAsync();

  return {
    container,
    root,
    rerender: async () => {
      await act(async () => {
        root.render(React.createElement(Settings));
      });
      await flushAsync();
    },
    unmount: () => {
      act(() => {
        root.unmount();
      });
      container.remove();
    },
  };
}

describe('settingsSections — RC-SETTINGS-UX-REFINE-1', () => {
  it('resolveSettingsSection returns default for invalid values', () => {
    expect(resolveSettingsSection(null)).toBe(DEFAULT_SETTINGS_SECTION);
    expect(resolveSettingsSection('unknown')).toBe(DEFAULT_SETTINGS_SECTION);
  });

  it('resolveSettingsSection accepts known section ids', () => {
    expect(resolveSettingsSection('office')).toBe('office');
    expect(resolveSettingsSection('portfolio')).toBe('portfolio');
    expect(SETTINGS_SECTIONS.map((s) => s.id)).toEqual([
      'profile',
      'office',
      'portfolio',
    ]);
  });
});

describe('Settings — RC-SETTINGS-UX-REFINE-1', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSearchParams = new URLSearchParams();
    mockUseAuth.mockReturnValue({
      user: { uid: 'user-1', displayName: 'Ana Silva', email: 'ana@example.com' },
    });
    mockUsePlanLimits.mockReturnValue({ publicPortfolioEnabled: true });
    mockGetUser.mockResolvedValue(profileFixture());
    mockCheckSlugAvailability.mockResolvedValue({ available: true });
    mockSaveUserSettings.mockResolvedValue({ publicSlug: 'estudio-ana' });
    mockSetSearchParams.mockImplementation((updater) => {
      const next =
        typeof updater === 'function'
          ? updater(mockSearchParams)
          : updater;
      mockSearchParams = new URLSearchParams(next);
    });

    Object.assign(navigator, {
      clipboard: {
        writeText: jest.fn().mockResolvedValue(undefined),
      },
    });
  });

  it('renderiza navegação interna (mobile e desktop)', async () => {
    const { container, unmount } = await renderSettings();

    expect(container.querySelector('[data-testid="settings-nav"]')).toBeTruthy();
    expect(
      container.querySelector('[data-testid="settings-nav-mobile"]'),
    ).toBeTruthy();
    expect(
      container.querySelector('[data-testid="settings-nav-desktop"]'),
    ).toBeTruthy();
    expect(
      container.querySelector('[data-testid="settings-nav-profile"]'),
    ).toBeTruthy();
    expect(
      container.querySelector('[data-testid="settings-nav-office"]'),
    ).toBeTruthy();
    expect(
      container.querySelector('[data-testid="settings-nav-portfolio"]'),
    ).toBeTruthy();

    unmount();
  });

  it('abre seção Perfil por padrão', async () => {
    const { container, unmount } = await renderSettings();

    const profile = container.querySelector('[data-testid="settings-section-profile"]');
    const office = container.querySelector('[data-testid="settings-section-office"]');

    expect(profile).toBeTruthy();
    expect(profile.hidden).toBe(false);
    expect(office.hidden).toBe(true);
    expect(container.querySelector('[data-testid="input-name"]')).toBeTruthy();
    expect(container.querySelector('[data-testid="input-email"]')).toBeTruthy();

    unmount();
  });

  it('abre seção Escritório via navegação', async () => {
    const { container, unmount } = await renderSettings();

    const officeNav = container.querySelector('[data-testid="settings-nav-office"]');
    await act(async () => {
      officeNav.click();
    });

    expect(mockSetSearchParams).toHaveBeenCalled();
    expect(
      container.querySelector('[data-testid="settings-section-office"]').hidden,
    ).toBe(false);
    expect(
      container.querySelector('[data-testid="settings-section-profile"]').hidden,
    ).toBe(true);
    expect(
      container.querySelector('[data-testid="input-office-name"]'),
    ).toBeTruthy();
    expect(
      container.querySelector('[data-testid="settings-logo-preview"]'),
    ).toBeTruthy();
    expect(
      container.querySelector('[data-testid="upload-logo-btn"]'),
    ).toBeTruthy();

    unmount();
  });

  it('troca de seção preserva estado local (painéis permanecem montados)', async () => {
    const { container, unmount } = await renderSettings();

    setInputValue(
      container.querySelector('[data-testid="input-name"]'),
      'Rascunho local',
    );
    expect(
      container.querySelector('[data-testid="input-name"]').value,
    ).toBe('Rascunho local');

    await act(async () => {
      container.querySelector('[data-testid="settings-nav-office"]').click();
    });
    await act(async () => {
      container.querySelector('[data-testid="settings-nav-portfolio"]').click();
    });
    await act(async () => {
      container.querySelector('[data-testid="settings-nav-profile"]').click();
    });

    expect(
      container.querySelector('[data-testid="settings-section-profile"]').hidden,
    ).toBe(false);
    expect(
      container.querySelector('[data-testid="input-name"]').value,
    ).toBe('Rascunho local');
    expect(
      container.querySelector('[data-testid="settings-section-office"]'),
    ).toBeTruthy();
    expect(
      container.querySelector('[data-testid="settings-section-portfolio"]'),
    ).toBeTruthy();

    unmount();
  });

  it('abre seção Portfólio com status, slug e redes', async () => {
    mockSearchParams = new URLSearchParams('section=portfolio');
    const { container, unmount } = await renderSettings();

    const portfolio = container.querySelector(
      '[data-testid="settings-section-portfolio"]',
    );
    expect(portfolio.hidden).toBe(false);
    expect(
      container.querySelector('[data-testid="portfolio-status-badge"]')?.textContent,
    ).toContain('Ativo');
    expect(
      container.querySelector('[data-testid="input-public-slug"]'),
    ).toBeTruthy();
    expect(
      container.querySelector('[data-testid="input-portfolio-enabled"]'),
    ).toBeTruthy();
    expect(
      container.querySelector('[data-testid="input-instagram-url"]'),
    ).toBeTruthy();
    expect(
      container.querySelector('[data-testid="slug-copy-url"]'),
    ).toBeTruthy();

    unmount();
  });

  it('página acompanha largura disponível; inputs mantêm max-width', async () => {
    const { container, unmount } = await renderSettings();

    const content = container.querySelector('[data-testid="settings-content"]');
    expect(content.className).not.toContain('max-w-[880px]');
    expect(content.className).toContain('overflow-y-auto');
    expect(content.className).toContain('min-h-0');

    const layout = container.querySelector('[data-testid="settings-layout"]');
    expect(layout.className).not.toContain('max-w-6xl');
    expect(layout.className).toContain('min-h-0');
    expect(layout.className).toContain('flex-1');

    const nameWrap = container
      .querySelector('[data-testid="input-name"]')
      ?.closest('.max-w-xl');
    expect(nameWrap).toBeTruthy();

    unmount();
  });

  it('header permanece fora da área rolável; conteúdo possui overflow-y-auto', async () => {
    const { container, unmount } = await renderSettings();

    const page = container.querySelector('[data-testid="settings-page"]');
    expect(page.className).toContain('overflow-hidden');
    expect(page.className).toContain('min-h-0');
    expect(page.className).toContain('flex-1');

    const header = container.querySelector('[data-testid="settings-page-header"]');
    expect(header.className).toContain('shrink-0');
    expect(header.contains(container.querySelector('[data-testid="settings-title"]'))).toBe(
      true,
    );

    const content = container.querySelector('[data-testid="settings-content"]');
    expect(header.contains(content)).toBe(false);
    expect(content.className).toContain('overflow-y-auto');

    const form = container.querySelector('[data-testid="settings-form"]');
    expect(content.contains(form)).toBe(true);

    unmount();
  });

  it('sidebar desktop fica fora do painel rolável', async () => {
    const { container, unmount } = await renderSettings();

    const content = container.querySelector('[data-testid="settings-content"]');
    const aside = container.querySelector('[data-testid="settings-nav-aside"]');
    expect(aside.className).toContain('hidden');
    expect(aside.className).toContain('lg:block');
    expect(content.contains(aside)).toBe(false);
    expect(
      aside.querySelector('[data-testid="settings-nav-desktop"]'),
    ).toBeTruthy();

    unmount();
  });

  it('troca de seção volta o painel de conteúdo ao topo', async () => {
    const { container, unmount } = await renderSettings();
    const content = container.querySelector('[data-testid="settings-content"]');
    const scrollTo = jest.fn();
    content.scrollTo = scrollTo;
    content.scrollTop = 120;

    await act(async () => {
      container.querySelector('[data-testid="settings-nav-office"]').click();
    });

    expect(scrollTo).toHaveBeenCalledWith({ top: 0 });

    unmount();
  });

  it('salvamento chama saveUserSettings com payload correto', async () => {
    const { container, unmount } = await renderSettings();

    const form = container.querySelector('[data-testid="settings-form"]');
    await act(async () => {
      form.requestSubmit();
    });

    expect(mockSaveUserSettings).toHaveBeenCalledWith(
      'user-1',
      expect.objectContaining({
        displayName: 'Ana Silva',
        companyName: 'Estúdio Ana',
        bio: 'Arquitetura contemporânea',
        publicSlug: 'estudio-ana',
        portfolioEnabled: true,
        socialLinks: expect.objectContaining({
          website: expect.any(String),
          instagram: expect.any(String),
        }),
      }),
      'estudio-ana',
    );

    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Configurações salvas' }),
    );

    // Loading does not unmount page
    expect(container.querySelector('[data-testid="settings-form"]')).toBeTruthy();
    expect(container.querySelector('[data-testid="settings-title"]')).toBeTruthy();

    unmount();
  });

  it('erro de salvamento permanece localizado (toast) e preserva formulário', async () => {
    mockSaveUserSettings.mockRejectedValue(new Error('network'));
    const { container, unmount } = await renderSettings();

    const form = container.querySelector('[data-testid="settings-form"]');
    await act(async () => {
      form.requestSubmit();
    });

    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({
        variant: 'destructive',
        title: 'Erro ao salvar',
      }),
    );
    expect(container.querySelector('[data-testid="input-name"]').value).toBe(
      'Ana Silva',
    );
    expect(container.querySelector('[data-testid="settings-loading"]')).toBeNull();

    unmount();
  });

  it('logo mantém fluxo atual (preview + botão de upload)', async () => {
    mockSearchParams = new URLSearchParams('section=office');
    mockGetUser.mockResolvedValue(
      profileFixture({ companyLogo: 'https://cdn.example/logo.png' }),
    );
    const { container, unmount } = await renderSettings();

    const preview = container.querySelector('[data-testid="settings-logo-preview"]');
    expect(preview.querySelector('img')?.getAttribute('src')).toBe(
      'https://cdn.example/logo.png',
    );
    expect(
      container.querySelector('[data-testid="upload-logo-btn"]')?.textContent,
    ).toContain('Alterar logo');

    unmount();
  });

  it('slug mantém validação de disponibilidade', async () => {
    mockCheckSlugAvailability.mockResolvedValue({ available: false });
    mockSearchParams = new URLSearchParams('section=portfolio');
    const { container, unmount } = await renderSettings();

    await act(async () => {
      await new Promise((r) => setTimeout(r, 450));
    });

    expect(
      container.querySelector('[data-testid="slug-availability-unavailable"]'),
    ).toBeTruthy();

    const saveBtn = container.querySelector('[data-testid="save-settings-btn"]');
    expect(saveBtn.disabled).toBe(true);

    unmount();
  });

  it('portfolioEnabled continua funcionando via switch', async () => {
    mockSearchParams = new URLSearchParams('section=portfolio');
    const { container, unmount } = await renderSettings();

    const toggle = container.querySelector(
      '[data-testid="input-portfolio-enabled"]',
    );
    expect(toggle.getAttribute('aria-checked')).toBe('true');

    await act(async () => {
      toggle.click();
    });

    expect(toggle.getAttribute('aria-checked')).toBe('false');
    expect(
      container.querySelector('[data-testid="portfolio-status-badge"]')?.textContent,
    ).toContain('Inativo');

    unmount();
  });

  it('bloqueia ativação de portfólio sem entitlement (modal premium)', async () => {
    mockUsePlanLimits.mockReturnValue({ publicPortfolioEnabled: false });
    mockGetUser.mockResolvedValue(profileFixture({ portfolioEnabled: false }));
    mockSearchParams = new URLSearchParams('section=portfolio');
    const { container, unmount } = await renderSettings();

    expect(
      container.querySelector('[data-testid="upgrade-prompt"]'),
    ).toBeTruthy();

    const toggle = container.querySelector(
      '[data-testid="input-portfolio-enabled"]',
    );
    await act(async () => {
      toggle.click();
    });

    // entitlement bloqueia — permanece false
    expect(toggle.getAttribute('aria-checked')).toBe('false');

    unmount();
  });

  it('copiar link funciona', async () => {
    mockSearchParams = new URLSearchParams('section=portfolio');
    const { container, unmount } = await renderSettings();

    const copyBtn = container.querySelector('[data-testid="slug-copy-url"]');
    await act(async () => {
      copyBtn.click();
    });

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      'https://fivi360.com.br/u/estudio-ana',
    );
    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Link copiado' }),
    );

    unmount();
  });

  it('estado ativo é acessível (aria-selected / aria-current)', async () => {
    const { container, unmount } = await renderSettings();

    const mobileProfile = container.querySelector(
      '[data-testid="settings-nav-profile"]',
    );
    expect(mobileProfile.getAttribute('aria-selected')).toBe('true');
    expect(mobileProfile.getAttribute('role')).toBe('tab');

    const desktopProfile = container.querySelector(
      '[data-testid="settings-nav-desktop-profile"]',
    );
    expect(desktopProfile.getAttribute('aria-current')).toBe('page');

    unmount();
  });

  it('mobile usa navegação horizontal (tablist) no header', async () => {
    const { container, unmount } = await renderSettings();

    const header = container.querySelector('[data-testid="settings-page-header"]');
    const mobile = container.querySelector('[data-testid="settings-nav-mobile"]');
    expect(header.contains(mobile)).toBe(true);
    expect(mobile.querySelector('[role="tablist"]')).toBeTruthy();
    expect(mobile.parentElement?.parentElement?.className).toContain('lg:hidden');

    const desktop = container.querySelector('[data-testid="settings-nav-desktop"]');
    expect(
      container.querySelector('[data-testid="settings-nav-aside"]').contains(desktop),
    ).toBe(true);

    unmount();
  });

  it('não cria seções Preferências/Conta sem conteúdo existente', async () => {
    const { container, unmount } = await renderSettings();

    expect(
      container.querySelector('[data-testid="settings-nav-preferences"]'),
    ).toBeNull();
    expect(
      container.querySelector('[data-testid="settings-nav-account"]'),
    ).toBeNull();
    expect(
      container.querySelector('[data-testid="settings-danger-zone"]'),
    ).toBeNull();

    unmount();
  });

  it('loading inicial não deixa formulário montado; após load página permanece', async () => {
    let resolveUser;
    mockGetUser.mockReturnValue(
      new Promise((resolve) => {
        resolveUser = resolve;
      }),
    );

    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(React.createElement(Settings));
    });

    expect(container.querySelector('[data-testid="settings-loading"]')).toBeTruthy();
    expect(container.querySelector('[data-testid="settings-form"]')).toBeNull();

    await act(async () => {
      resolveUser(profileFixture());
      await Promise.resolve();
    });

    expect(container.querySelector('[data-testid="settings-loading"]')).toBeNull();
    expect(container.querySelector('[data-testid="settings-form"]')).toBeTruthy();
    expect(container.querySelector('[data-testid="settings-layout"]')).toBeTruthy();

    act(() => {
      root.unmount();
    });
    container.remove();
  });
});
