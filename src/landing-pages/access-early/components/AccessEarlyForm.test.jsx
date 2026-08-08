/**
 * RC-LP-PRELAUNCH-FORM-1 / RC-LP-PRELAUNCH-SUCCESS-1 — AccessEarlyForm + navigate
 */

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const mockNavigate = jest.fn();

jest.mock("../services/prelaunchLeadService", () => ({
  submitPrelaunchLead: jest.fn(),
}));

jest.mock("../utils/getPrelaunchAttribution", () => ({
  getPrelaunchAttribution: jest.fn(() => ({
    source: "instagram",
    medium: "stories",
    utmCampaign: "prelaunch_2026",
    content: "editorial_01",
    term: null,
    referrer: "https://instagram.com/",
    landingPath: "/lp/acesso-antecipado",
  })),
}));

jest.mock("react-router-dom", () => ({
  Link: ({ children, to, ...rest }) =>
    require("react").createElement("a", { href: to, ...rest }, children),
  useNavigate: () => mockNavigate,
}), { virtual: true });

jest.mock("@/components/ui/checkbox", () => {
  const React = require("react");
  return {
    Checkbox: ({ checked, onCheckedChange, id, disabled, ...rest }) =>
      React.createElement("input", {
        type: "checkbox",
        id,
        checked: Boolean(checked),
        disabled,
        onChange: (e) => onCheckedChange?.(e.target.checked),
        ...rest,
      }),
  };
});

jest.mock("@/components/ui/select", () => {
  const React = require("react");
  const { ACCESS_EARLY_PROFESSIONS } = require("../config");

  return {
    Select: ({ value, onValueChange, disabled }) =>
      React.createElement(
        "select",
        {
          "data-testid": "access-early-profession-select",
          id: "access-early-profession",
          value: value || "",
          disabled,
          onChange: (e) => onValueChange?.(e.target.value),
        },
        React.createElement("option", { value: "" }, "Selecione"),
        ACCESS_EARLY_PROFESSIONS.map((item) =>
          React.createElement(
            "option",
            { key: item.id, value: item.id },
            item.label,
          ),
        ),
      ),
    SelectTrigger: () => null,
    SelectValue: () => null,
    SelectContent: () => null,
    SelectItem: () => null,
  };
});

const React = require("react");
const { createRoot } = require("react-dom/client");
const { act } = require("react");
const { AccessEarlyForm } = require("./AccessEarlyForm");
const { useAccessEarlyForm } = require("../hooks/useAccessEarlyForm");
const { ACCESS_EARLY_SUCCESS_PATH } = require("../config");
const {
  submitPrelaunchLead: mockSubmitPrelaunchLead,
} = require("../services/prelaunchLeadService");
const {
  getPrelaunchAttribution: mockGetPrelaunchAttribution,
} = require("../utils/getPrelaunchAttribution");

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

function FormHarness() {
  const form = useAccessEarlyForm();
  return React.createElement(AccessEarlyForm, { form });
}

function mount() {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => {
    root.render(React.createElement(FormHarness));
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

async function flush() {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
}

function fillValid(container, overrides = {}) {
  const name = container.querySelector('[data-testid="access-early-name-input"]');
  const email = container.querySelector('[data-testid="access-early-email-input"]');
  const phone = container.querySelector('[data-testid="access-early-phone-input"]');
  const profession = container.querySelector(
    '[data-testid="access-early-profession-select"]',
  );

  act(() => {
    setNativeValue(name, overrides.name ?? "Ana Silva");
    setNativeValue(email, overrides.email ?? "ana@example.com");
    setNativeValue(phone, overrides.phone ?? "21999999999");
    setNativeValue(profession, overrides.professionId ?? "arquiteto");
  });
}

describe("AccessEarlyForm — RC-LP-PRELAUNCH-SUCCESS-1", () => {
  beforeEach(() => {
    mockNavigate.mockReset();
    mockSubmitPrelaunchLead.mockReset();
    mockGetPrelaunchAttribution.mockReset();
    mockGetPrelaunchAttribution.mockReturnValue({
      source: "instagram",
      medium: "stories",
      utmCampaign: "prelaunch_2026",
      content: "editorial_01",
      term: null,
      referrer: "https://instagram.com/",
      landingPath: "/lp/acesso-antecipado",
    });
    mockSubmitPrelaunchLead.mockResolvedValue({
      success: true,
      alreadyRegistered: false,
    });
  });

  it("renders fields; marketing starts unchecked", () => {
    const mounted = mount();
    expect(
      mounted.container.querySelector('[data-testid="access-early-name-input"]'),
    ).toBeTruthy();
    expect(
      mounted.container.querySelector('[data-testid="access-early-marketing-checkbox"]')
        .checked,
    ).toBe(false);
    mounted.unmount();
  });

  it("navigates to success route on new registration without PII in path", async () => {
    const mounted = mount();
    fillValid(mounted.container);

    await act(async () => {
      mounted.container
        .querySelector('[data-testid="access-early-form"]')
        .dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    });
    await flush();

    expect(mockSubmitPrelaunchLead).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith(ACCESS_EARLY_SUCCESS_PATH, {
      replace: true,
      state: { alreadyRegistered: false },
    });
    const pathArg = mockNavigate.mock.calls[0][0];
    expect(pathArg).not.toMatch(/@/);
    expect(pathArg).not.toMatch(/Ana/);
    expect(JSON.stringify(mockNavigate.mock.calls[0][1])).not.toMatch(/@/);
    mounted.unmount();
  });

  it("navigates to same success route on duplicate", async () => {
    mockSubmitPrelaunchLead.mockResolvedValue({
      success: true,
      alreadyRegistered: true,
    });

    const mounted = mount();
    fillValid(mounted.container);

    await act(async () => {
      mounted.container
        .querySelector('[data-testid="access-early-form"]')
        .dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    });
    await flush();

    expect(mockNavigate).toHaveBeenCalledWith(ACCESS_EARLY_SUCCESS_PATH, {
      replace: true,
      state: { alreadyRegistered: true },
    });
    expect(mounted.container.querySelector('[data-testid="access-early-form"]')).toBeTruthy();
    mounted.unmount();
  });

  it("shows loading and prevents double submit", async () => {
    let resolveSubmit;
    mockSubmitPrelaunchLead.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveSubmit = resolve;
        }),
    );

    const mounted = mount();
    fillValid(mounted.container);

    await act(async () => {
      mounted.container
        .querySelector('[data-testid="access-early-form"]')
        .dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    });

    expect(
      mounted.container.querySelector('[data-testid="access-early-submit-btn"]')
        ?.textContent,
    ).toBe("Enviando...");

    await act(async () => {
      mounted.container
        .querySelector('[data-testid="access-early-form"]')
        .dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    });

    expect(mockSubmitPrelaunchLead).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolveSubmit({ success: true, alreadyRegistered: false });
      await Promise.resolve();
    });
    await flush();

    mounted.unmount();
  });

  it("keeps fields on error and allows retry", async () => {
    mockSubmitPrelaunchLead
      .mockRejectedValueOnce(new Error("HttpsError internal"))
      .mockResolvedValueOnce({ success: true, alreadyRegistered: false });

    const mounted = mount();
    fillValid(mounted.container);

    await act(async () => {
      mounted.container
        .querySelector('[data-testid="access-early-form"]')
        .dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    });
    await flush();

    expect(
      mounted.container.querySelector('[data-testid="access-early-name-input"]')
        ?.value,
    ).toBe("Ana Silva");
    expect(mockNavigate).not.toHaveBeenCalled();

    await act(async () => {
      mounted.container
        .querySelector('[data-testid="access-early-form"]')
        .dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    });
    await flush();

    expect(mockNavigate).toHaveBeenCalledTimes(1);
    mounted.unmount();
  });

  it("does not import Auth create APIs", () => {
    const fs = require("fs");
    const path = require("path");
    const sources = [
      fs.readFileSync(path.join(__dirname, "AccessEarlyForm.jsx"), "utf8"),
      fs.readFileSync(
        path.join(__dirname, "../hooks/useAccessEarlyForm.js"),
        "utf8",
      ),
    ].join("\n");

    expect(sources).not.toMatch(/from\s+["'][^"']*useAuth/);
    expect(sources).not.toMatch(/createUserWithEmailAndPassword/);
    expect(sources).not.toMatch(/createUserProfile/);
  });
});
