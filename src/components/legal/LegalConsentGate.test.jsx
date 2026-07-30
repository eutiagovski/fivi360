/**
 * LegalConsentGate — RC-BUG-002 (spinner infinito pós-login)
 *
 * Cobre:
 * - double-invoke estilo StrictMode (cleanup invalida + remount effect);
 * - falha de ensure encerra loading;
 * - perfil null não mantém spinner.
 */

const mockEnsureUserStructure = jest.fn();
const mockSignOut = jest.fn();
const mockUseAuth = jest.fn();

jest.mock("@/hooks/useAuth", () => ({
  useAuth: (...args) => mockUseAuth(...args),
}));

jest.mock("@/services/auth/authService", () => ({
  canReceiveWelcomeEmail: jest.fn(() => false),
}));

jest.mock("@/services/users/ensureUserStructure", () => ({
  ensureUserStructure: (...args) => mockEnsureUserStructure(...args),
}));

jest.mock("@/services/users/userService", () => ({
  createUserProfile: jest.fn(),
  getUserFirestoreData: jest.fn(),
  maybeEnqueueWelcomeEmailForAuthUser: jest.fn(),
  saveLegalConsent: jest.fn(),
}));

jest.mock("@/components/auth/ProtectedRoute", () => ({
  AuthLoadingScreen: () =>
    require("react").createElement("div", { "data-testid": "auth-loading" }, "loading"),
}));

jest.mock("@/components/auth/AuthErrorScreen", () => ({
  AuthErrorScreen: (props) =>
    require("react").createElement(
      "div",
      { "data-testid": "auth-error" },
      props.title,
      require("react").createElement("button", {
        type: "button",
        "data-testid": "auth-error-retry",
        onClick: props.onRetry,
      }),
    ),
}));

jest.mock("@/components/legal/LegalConsentModal", () => ({
  LegalConsentModal: (props) =>
    require("react").createElement(
      "div",
      { "data-testid": "legal-consent-modal" },
      require("react").createElement("button", {
        type: "button",
        "data-testid": "legal-consent-accept-btn",
        onClick: () => props.onAccept({ marketingConsent: false }),
      }),
      require("react").createElement("button", {
        type: "button",
        "data-testid": "legal-consent-accept-marketing-on-btn",
        onClick: () => props.onAccept({ marketingConsent: true }),
      }),
      props.showMarketingConsent
        ? require("react").createElement("div", {
            "data-testid": "legal-consent-modal-marketing-checkbox",
            "data-state": "unchecked",
          })
        : null,
    ),
}));

const React = require("react");
const { createRoot } = require("react-dom/client");
const { act } = require("react");
const { LegalConsentGate } = require("./LegalConsentGate");
const { LEGAL_VERSIONS } = require("@/config/legal");
const {
  createUserProfile,
  saveLegalConsent,
} = require("@/services/users/userService");

const verifiedProfile = {
  id: "uid-1",
  email: "ana@example.com",
  displayName: "Ana",
  legalConsent: {
    termsAccepted: true,
    privacyAccepted: true,
    termsVersion: LEGAL_VERSIONS.termsVersion,
    privacyVersion: LEGAL_VERSIONS.privacyVersion,
    acceptedAt: new Date(),
    acceptedSource: "signup",
  },
};

const authUser = {
  uid: "uid-1",
  email: "ana@example.com",
  displayName: "Ana",
  emailVerified: true,
  usesPasswordAuth: true,
  usesGoogleAuth: false,
};

const googleUser = {
  uid: "g-1",
  email: "g@example.com",
  displayName: "Google User",
  emailVerified: true,
  usesPasswordAuth: false,
  usesGoogleAuth: true,
};

const googleProfilePendingConsent = {
  id: "g-1",
  email: "g@example.com",
  displayName: "Google User",
  marketingPreferences: {
    enabled: false,
    productUpdates: false,
    offers: false,
    tips: false,
    newsletter: false,
    research: false,
    consentVersion: "beta-2026-01",
    consentSource: "google_signup_default",
    consentedAt: null,
    revokedAt: null,
    updatedAt: null,
  },
};

function mountGate(user, { strict = false } = {}) {
  mockUseAuth.mockReturnValue({
    user,
    signOut: mockSignOut,
  });

  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);

  const tree = React.createElement(
    LegalConsentGate,
    null,
    React.createElement("div", { "data-testid": "dashboard-child" }, "ok"),
  );

  act(() => {
    root.render(strict ? React.createElement(React.StrictMode, null, tree) : tree);
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

async function flushMicrotasks() {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
  });
}

describe("LegalConsentGate — RC-BUG-002", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.IS_REACT_ACT_ENVIRONMENT = true;
  });

  it("StrictMode remount still completes bootstrap (no infinite spinner)", async () => {
    let resolveSecond;
    let call = 0;

    mockEnsureUserStructure.mockImplementation(() => {
      call += 1;
      if (call === 1) {
        // Primeira invocação (pré-cleanup): nunca resolve a tempo / fica órfã.
        return new Promise(() => {});
      }

      return new Promise((resolve) => {
        resolveSecond = () =>
          resolve({ profile: verifiedProfile, gaps: {}, repaired: [] });
      });
    });

    const mounted = mountGate(authUser, { strict: true });

    expect(mounted.container.querySelector('[data-testid="auth-loading"]')).toBeTruthy();

    await flushMicrotasks();

    // StrictMode dispara effect duas vezes → pelo menos a 2ª chamada deve existir.
    expect(mockEnsureUserStructure.mock.calls.length).toBeGreaterThanOrEqual(2);

    await act(async () => {
      resolveSecond();
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(mounted.container.querySelector('[data-testid="auth-loading"]')).toBeNull();
    expect(mounted.container.querySelector('[data-testid="dashboard-child"]')).toBeTruthy();
    mounted.unmount();
  });

  it("ensure failure ends loading and shows recoverable error", async () => {
    mockEnsureUserStructure.mockRejectedValue({
      code: "permission-denied",
      message: "Missing or insufficient permissions.",
    });

    const mounted = mountGate(authUser);
    await flushMicrotasks();

    expect(mounted.container.querySelector('[data-testid="auth-loading"]')).toBeNull();
    expect(mounted.container.querySelector('[data-testid="auth-error"]')).toBeTruthy();
    mounted.unmount();
  });

  it("absent profile (null) does not keep spinner — shows consent UI", async () => {
    mockEnsureUserStructure.mockResolvedValue({
      profile: null,
      gaps: {},
      repaired: [],
    });

    const mounted = mountGate(authUser);
    await flushMicrotasks();

    expect(mounted.container.querySelector('[data-testid="auth-loading"]')).toBeNull();
    expect(mounted.container.querySelector('[data-testid="legal-consent-modal"]')).toBeTruthy();
    mounted.unmount();
  });

  it("successful load with current consent renders children", async () => {
    mockEnsureUserStructure.mockResolvedValue({
      profile: verifiedProfile,
      gaps: {},
      repaired: [],
    });

    const mounted = mountGate(authUser);
    await flushMicrotasks();

    expect(mounted.container.querySelector('[data-testid="auth-loading"]')).toBeNull();
    expect(mounted.container.querySelector('[data-testid="dashboard-child"]')).toBeTruthy();
    mounted.unmount();
  });
});

describe("LegalConsentGate — RC-MARKETING-CONSENT-GOOGLE-1", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.IS_REACT_ACT_ENVIRONMENT = true;
    saveLegalConsent.mockResolvedValue(undefined);
    createUserProfile.mockResolvedValue({
      profileCreated: true,
      verificationEmailQueued: false,
    });
  });

  it("Google pending consent shows marketing checkbox", async () => {
    mockEnsureUserStructure.mockResolvedValue({
      profile: googleProfilePendingConsent,
      gaps: {},
      repaired: [],
    });

    const mounted = mountGate(googleUser);
    await flushMicrotasks();

    expect(mounted.container.querySelector('[data-testid="legal-consent-modal"]')).toBeTruthy();
    expect(
      mounted.container.querySelector(
        '[data-testid="legal-consent-modal-marketing-checkbox"]',
      ),
    ).toBeTruthy();
    expect(mounted.container.querySelector('[data-testid="dashboard-child"]')).toBeNull();
    mounted.unmount();
  });

  it("password user modal does not show marketing checkbox", async () => {
    mockEnsureUserStructure.mockResolvedValue({
      profile: { id: "uid-1", email: "ana@example.com" },
      gaps: {},
      repaired: [],
    });

    const mounted = mountGate(authUser);
    await flushMicrotasks();

    expect(mounted.container.querySelector('[data-testid="legal-consent-modal"]')).toBeTruthy();
    expect(
      mounted.container.querySelector(
        '[data-testid="legal-consent-modal-marketing-checkbox"]',
      ),
    ).toBeNull();
    mounted.unmount();
  });

  it("Google accept with marketing false saves google_terms_modal opt-out", async () => {
    mockEnsureUserStructure.mockResolvedValue({
      profile: googleProfilePendingConsent,
      gaps: {},
      repaired: [],
    });

    const mounted = mountGate(googleUser);
    await flushMicrotasks();

    await act(async () => {
      mounted.container
        .querySelector('[data-testid="legal-consent-accept-btn"]')
        .dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(saveLegalConsent).toHaveBeenCalledWith(
      "g-1",
      "modal_existing_user",
      {
        marketingConsent: false,
        marketingConsentSource: "google_terms_modal",
      },
    );
    mounted.unmount();
  });

  it("Google accept with marketing true saves google_terms_modal opt-in", async () => {
    mockEnsureUserStructure.mockResolvedValue({
      profile: googleProfilePendingConsent,
      gaps: {},
      repaired: [],
    });

    const mounted = mountGate(googleUser);
    await flushMicrotasks();

    await act(async () => {
      mounted.container
        .querySelector('[data-testid="legal-consent-accept-marketing-on-btn"]')
        .dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(saveLegalConsent).toHaveBeenCalledWith(
      "g-1",
      "modal_existing_user",
      {
        marketingConsent: true,
        marketingConsentSource: "google_terms_modal",
      },
    );
    mounted.unmount();
  });

  it("Google createUserProfile fallback uses google_terms_modal", async () => {
    mockEnsureUserStructure.mockResolvedValue({
      profile: null,
      gaps: {},
      repaired: [],
    });

    const mounted = mountGate(googleUser);
    await flushMicrotasks();

    await act(async () => {
      mounted.container
        .querySelector('[data-testid="legal-consent-accept-btn"]')
        .dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(createUserProfile).toHaveBeenCalledWith(
      "g-1",
      expect.objectContaining({
        marketingConsent: false,
        marketingConsentSource: "google_terms_modal",
        acceptedSource: "signup",
      }),
    );
    mounted.unmount();
  });

  it("completed Google consent does not re-show modal", async () => {
    mockEnsureUserStructure.mockResolvedValue({
      profile: {
        ...googleProfilePendingConsent,
        legalConsent: {
          termsAccepted: true,
          privacyAccepted: true,
          termsVersion: LEGAL_VERSIONS.termsVersion,
          privacyVersion: LEGAL_VERSIONS.privacyVersion,
          acceptedAt: new Date(),
          acceptedSource: "modal_existing_user",
        },
        marketingPreferences: {
          ...googleProfilePendingConsent.marketingPreferences,
          consentSource: "google_terms_modal",
        },
      },
      gaps: {},
      repaired: [],
    });

    const mounted = mountGate(googleUser);
    await flushMicrotasks();

    expect(mounted.container.querySelector('[data-testid="legal-consent-modal"]')).toBeNull();
    expect(mounted.container.querySelector('[data-testid="dashboard-child"]')).toBeTruthy();
    mounted.unmount();
  });
});
