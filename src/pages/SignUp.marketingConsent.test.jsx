/**
 * RC-MARKETING-CONSENT-1 — SignUp marketing checkbox UI
 *
 * Evita importar react-router-dom (ESM .mjs) no Jest: mocka checkboxes e layout.
 */

const mockSignUp = jest.fn();
const mockSignInGoogle = jest.fn();
const mockClearSignUpInProgress = jest.fn();
const mockNavigate = jest.fn();

jest.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    signUp: (...args) => mockSignUp(...args),
    signInGoogle: (...args) => mockSignInGoogle(...args),
    clearSignUpInProgress: (...args) => mockClearSignUpInProgress(...args),
  }),
}));

jest.mock("react-router-dom", () => ({
  Link: ({ children, to, ...rest }) =>
    require("react").createElement("a", { href: to, ...rest }, children),
  useNavigate: () => mockNavigate,
  useSearchParams: () => [new URLSearchParams(), jest.fn()],
}), { virtual: true });

jest.mock("@/utils/verifyEmailSentState", () => ({
  persistVerifyEmailSentState: jest.fn(),
}));

jest.mock("@/utils/billingPlanFlow", () => ({
  appendPlanQueryToPath: (path) => path,
  getPostAuthRedirectPath: () => "/dashboard",
}));

jest.mock("@/components/auth/AuthLayout", () => ({
  AuthLayout: ({ children }) =>
    require("react").createElement("div", { "data-testid": "auth-layout" }, children),
}));

jest.mock("@/components/auth/AuthCard", () => ({
  AuthCard: ({ children, title }) =>
    require("react").createElement(
      "div",
      { "data-testid": "auth-card" },
      require("react").createElement("h1", null, title),
      children,
    ),
}));

jest.mock("@/components/auth/GoogleSignInButton", () => ({
  GoogleSignInButton: (props) =>
    require("react").createElement("button", {
      type: "button",
      "data-testid": props.testId || "google-btn",
      onClick: props.onClick,
      disabled: props.disabled,
    }),
}));

jest.mock("@/components/legal/LegalConsentCheckbox", () => ({
  LegalConsentCheckbox: ({ checked, onCheckedChange, testId, id }) =>
    require("react").createElement(
      "label",
      null,
      require("react").createElement("button", {
        type: "button",
        id,
        role: "checkbox",
        "aria-checked": checked,
        "data-testid": testId,
        "data-state": checked ? "checked" : "unchecked",
        onClick: () => onCheckedChange(!checked),
      }),
      " Li e aceito os Termos de Uso e a Política de Privacidade.",
    ),
}));

jest.mock("@/components/legal/MarketingConsentCheckbox", () => ({
  MarketingConsentCheckbox: ({ checked, onCheckedChange, testId, id }) =>
    require("react").createElement(
      "label",
      null,
      require("react").createElement("button", {
        type: "button",
        id,
        role: "checkbox",
        "aria-checked": checked,
        "data-testid": testId,
        "data-state": checked ? "checked" : "unchecked",
        onClick: () => onCheckedChange(!checked),
      }),
      " Quero receber novidades e atualizações do FIVI360.",
    ),
  MARKETING_CONSENT_LABEL: "Quero receber novidades e atualizações do FIVI360.",
}));

jest.mock("@/components/legal/LegalConsentModal", () => ({
  CONSENT_REQUIRED_MESSAGE: "Aceite os Termos e a Política para continuar.",
}));

const React = require("react");
const { createRoot } = require("react-dom/client");
const { act } = require("react");
const { SignUp } = require("./SignUp");

function mountSignUp() {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);

  act(() => {
    root.render(React.createElement(SignUp));
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

function setInputValue(element, value) {
  const proto = Object.getPrototypeOf(element);
  const descriptor = Object.getOwnPropertyDescriptor(proto, "value");
  if (descriptor?.set) {
    descriptor.set.call(element, value);
  } else {
    element.value = value;
  }
  act(() => {
    element.dispatchEvent(new Event("input", { bubbles: true }));
    element.dispatchEvent(new Event("change", { bubbles: true }));
  });
}

function fillRequiredFields(container) {
  setInputValue(container.querySelector('[data-testid="input-name"]'), "Ana");
  setInputValue(
    container.querySelector('[data-testid="input-email"]'),
    "ana@example.com",
  );
  setInputValue(
    container.querySelector('[data-testid="input-password"]'),
    "secret1",
  );
}

function clickCheckbox(el) {
  act(() => {
    el.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });
}

describe("SignUp — RC-MARKETING-CONSENT-1", () => {
  let mounted;

  beforeEach(() => {
    jest.clearAllMocks();
    global.IS_REACT_ACT_ENVIRONMENT = true;
    mockSignUp.mockResolvedValue({
      email: "ana@example.com",
      verificationEmailQueued: true,
    });
    mounted = mountSignUp();
  });

  afterEach(() => {
    mounted.unmount();
  });

  it("shows marketing checkbox with exact label, unchecked by default", () => {
    const marketing = mounted.container.querySelector(
      '[data-testid="signup-marketing-consent-checkbox"]',
    );
    const section = mounted.container.querySelector(
      '[data-testid="signup-marketing-consent-section"]',
    );
    const legal = mounted.container.querySelector(
      '[data-testid="signup-legal-consent-checkbox"]',
    );

    expect(marketing).toBeTruthy();
    expect(section).toBeTruthy();
    expect(legal).toBeTruthy();
    expect(marketing.getAttribute("data-state")).toBe("unchecked");
    expect(mounted.container.textContent).toContain(
      "Quero receber novidades e atualizações do FIVI360.",
    );
  });

  it("submit works with marketing unchecked and legal accepted", async () => {
    fillRequiredFields(mounted.container);
    clickCheckbox(
      mounted.container.querySelector('[data-testid="signup-legal-consent-checkbox"]'),
    );

    const form = mounted.container.querySelector("form");
    await act(async () => {
      form.requestSubmit();
    });

    expect(mockSignUp).toHaveBeenCalledWith(
      "ana@example.com",
      "secret1",
      "Ana",
      { marketingConsent: false },
    );
  });

  it("submit works with marketing checked", async () => {
    fillRequiredFields(mounted.container);
    clickCheckbox(
      mounted.container.querySelector('[data-testid="signup-legal-consent-checkbox"]'),
    );
    clickCheckbox(
      mounted.container.querySelector('[data-testid="signup-marketing-consent-checkbox"]'),
    );

    const form = mounted.container.querySelector("form");
    await act(async () => {
      form.requestSubmit();
    });

    expect(mockSignUp).toHaveBeenCalledWith(
      "ana@example.com",
      "secret1",
      "Ana",
      { marketingConsent: true },
    );
  });

  it("marketing unchecked does not satisfy legal terms requirement", async () => {
    fillRequiredFields(mounted.container);
    clickCheckbox(
      mounted.container.querySelector('[data-testid="signup-marketing-consent-checkbox"]'),
    );

    const form = mounted.container.querySelector("form");
    await act(async () => {
      form.requestSubmit();
    });

    expect(mockSignUp).not.toHaveBeenCalled();
    const error = mounted.container.querySelector('[data-testid="signup-error"]');
    expect(error).toBeTruthy();
    expect(error.textContent).not.toMatch(/novidades|atualizações|marketing/i);
  });

  it("submit button stays disabled until legal is accepted (marketing irrelevant)", () => {
    const btn = mounted.container.querySelector('[data-testid="signup-btn"]');
    expect(btn.disabled).toBe(true);

    clickCheckbox(
      mounted.container.querySelector('[data-testid="signup-marketing-consent-checkbox"]'),
    );
    expect(btn.disabled).toBe(true);

    clickCheckbox(
      mounted.container.querySelector('[data-testid="signup-legal-consent-checkbox"]'),
    );
    expect(btn.disabled).toBe(false);
  });
});
