/**
 * RC-LP-PRELAUNCH-SUCCESS-1 — AccessEarlySuccessPage + SocialFollowActions
 */

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

jest.mock("@/hooks/usePageSeo", () => ({
  usePageSeo: jest.fn(),
}));

jest.mock("@/components/common/BrandLogo", () => ({
  BrandLogo: (props) =>
    require("react").createElement("span", {
      "data-testid": "brand-logo",
      ...props,
    }),
}));

const mockNavigate = jest.fn();
const mockUseLocation = jest.fn(() => ({
  pathname: "/lp/acesso-antecipado/sucesso",
  search: "",
  state: null,
}));

jest.mock("react-router-dom", () => ({
  Link: ({ children, to, ...rest }) =>
    require("react").createElement("a", { href: to, ...rest }, children),
  useLocation: () => mockUseLocation(),
  useNavigate: () => mockNavigate,
}), { virtual: true });

const React = require("react");
const { createRoot } = require("react-dom/client");
const { act } = require("react");
const { AccessEarlySuccessPage } = require("./AccessEarlySuccessPage");
const {
  SocialFollowActions,
} = require("./components/SocialFollowActions");
const { ACCESS_EARLY_CONFIG } = require("./config");

function mount(element) {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => {
    root.render(element);
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

describe("AccessEarlySuccessPage — RC-LP-PRELAUNCH-SUCCESS-1", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockNavigate.mockReset();
    mockUseLocation.mockReturnValue({
      pathname: "/lp/acesso-antecipado/sucesso",
      search: "",
      state: null,
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("renders generic success copy without navigation state (refresh-safe)", () => {
    const mounted = mount(React.createElement(AccessEarlySuccessPage));
    expect(
      mounted.container
        .querySelector('[data-testid="access-early-success-page"]')
        ?.getAttribute("data-variant"),
    ).toBe("success");
    expect(
      mounted.container.querySelector('[data-testid="access-early-success-title"]')
        ?.textContent,
    ).toContain("Você está na lista");
    expect(
      mounted.container.querySelector('[data-testid="access-early-social-title"]')
        ?.textContent,
    ).toMatch(/Acompanhe nossas redes sociais/i);
    mounted.unmount();
  });

  it("renders duplicate copy from navigation state", () => {
    mockUseLocation.mockReturnValue({
      pathname: "/lp/acesso-antecipado/sucesso",
      search: "",
      state: { alreadyRegistered: true },
    });

    const mounted = mount(React.createElement(AccessEarlySuccessPage));
    expect(
      mounted.container
        .querySelector('[data-testid="access-early-success-page"]')
        ?.getAttribute("data-variant"),
    ).toBe("duplicate");
    expect(
      mounted.container.querySelector('[data-testid="access-early-success-title"]')
        ?.textContent,
    ).toContain("Você já está na lista");
    mounted.unmount();
  });

  it("redirects to home after 10 seconds", () => {
    const mounted = mount(React.createElement(AccessEarlySuccessPage));

    expect(mockNavigate).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(10_000);
    });

    expect(mockNavigate).toHaveBeenCalledWith("/", { replace: true });
    mounted.unmount();
  });

  it("renders footer privacy/terms and home link", () => {
    const mounted = mount(React.createElement(AccessEarlySuccessPage));
    expect(
      mounted.container.querySelector('[data-testid="access-early-footer-privacy"]'),
    ).toBeTruthy();
    expect(
      mounted.container.querySelector('[data-testid="access-early-footer-terms"]'),
    ).toBeTruthy();
    expect(
      mounted.container
        .querySelector('[data-testid="access-early-success-back"]')
        ?.getAttribute("href"),
    ).toBe("/");
    mounted.unmount();
  });
});

describe("SocialFollowActions — RC-LP-PRELAUNCH-SUCCESS-1", () => {
  it("shows Instagram and YouTube icons on one row; WhatsApp button below disabled when empty", () => {
    expect(ACCESS_EARLY_CONFIG.whatsappGroupUrl).toBe("");
    expect(ACCESS_EARLY_CONFIG.instagramUrl).toBe("");
    expect(ACCESS_EARLY_CONFIG.youtubeUrl).toBe("");

    const mounted = mount(React.createElement(SocialFollowActions));

    expect(
      mounted.container.querySelector('[data-testid="access-early-social-icons"]'),
    ).toBeTruthy();

    const ig = mounted.container.querySelector(
      '[data-testid="access-early-instagram-cta"]',
    );
    const yt = mounted.container.querySelector(
      '[data-testid="access-early-youtube-cta"]',
    );
    const wa = mounted.container.querySelector(
      '[data-testid="access-early-whatsapp-cta"]',
    );

    expect(ig?.getAttribute("data-enabled")).toBe("false");
    expect(ig?.disabled).toBe(true);
    expect(yt?.disabled).toBe(true);
    expect(wa?.disabled).toBe(true);
    expect(
      mounted.container.querySelector('[data-testid="access-early-whatsapp-soon"]'),
    ).toBeTruthy();
    mounted.unmount();
  });

  it("enables configured links with noopener noreferrer", () => {
    const mounted = mount(
      React.createElement(SocialFollowActions, {
        instagramUrl: "https://instagram.com/fivi360",
        youtubeUrl: "https://youtube.com/@fivi360",
        whatsappGroupUrl: "https://chat.whatsapp.com/example",
      }),
    );

    const ig = mounted.container.querySelector(
      '[data-testid="access-early-instagram-cta"]',
    );
    const yt = mounted.container.querySelector(
      '[data-testid="access-early-youtube-cta"]',
    );
    const wa = mounted.container.querySelector(
      '[data-testid="access-early-whatsapp-cta"]',
    );

    expect(ig.getAttribute("href")).toBe("https://instagram.com/fivi360");
    expect(ig.getAttribute("target")).toBe("_blank");
    expect(ig.getAttribute("rel")).toContain("noopener");
    expect(yt.getAttribute("href")).toBe("https://youtube.com/@fivi360");
    expect(yt.getAttribute("rel")).toContain("noreferrer");
    expect(wa.getAttribute("href")).toBe("https://chat.whatsapp.com/example");
    expect(
      mounted.container.querySelector('[data-testid="access-early-whatsapp-soon"]'),
    ).toBeNull();
    mounted.unmount();
  });
});
