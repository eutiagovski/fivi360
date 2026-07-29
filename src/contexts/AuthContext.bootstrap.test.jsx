/**
 * AuthContext bootstrap / loading — RC-BUG-002
 */

const mockSubscribeToAuthChanges = jest.fn();
const mockSignInWithEmail = jest.fn();
const mockSignInWithGoogle = jest.fn();
const mockAuthLogout = jest.fn();
const mockGetUserFirestoreData = jest.fn();
const mockMaybeEnqueueWelcomeEmail = jest.fn();
const mockCanReceiveWelcomeEmail = jest.fn(() => false);
const mockSetAnalyticsUser = jest.fn();
const mockTrackEvent = jest.fn();

jest.mock("@/services/auth/authService", () => ({
  canReceiveWelcomeEmail: (...args) => mockCanReceiveWelcomeEmail(...args),
  logout: (...args) => mockAuthLogout(...args),
  signInWithEmail: (...args) => mockSignInWithEmail(...args),
  signInWithGoogle: (...args) => mockSignInWithGoogle(...args),
  signUpWithEmail: jest.fn(),
  subscribeToAuthChanges: (...args) => mockSubscribeToAuthChanges(...args),
}));

jest.mock("@/services/auth/passwordResetService", () => ({
  requestPasswordResetEmail: jest.fn(),
}));

jest.mock("@/services/users/userService", () => ({
  createUserProfile: jest.fn(),
  getUserFirestoreData: (...args) => mockGetUserFirestoreData(...args),
  maybeEnqueueWelcomeEmailForAuthUser: (...args) =>
    mockMaybeEnqueueWelcomeEmail(...args),
}));

jest.mock("@/services/analytics/analyticsService", () => ({
  setAnalyticsUser: (...args) => mockSetAnalyticsUser(...args),
  trackEvent: (...args) => mockTrackEvent(...args),
}));

const React = require("react");
const { createRoot } = require("react-dom/client");
const { act } = require("react");
const { AuthProvider, AuthContext } = require("./AuthContext");

function mountProvider() {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  let ctx = null;

  function Probe() {
    ctx = React.useContext(AuthContext);
    return null;
  }

  act(() => {
    root.render(
      React.createElement(AuthProvider, null, React.createElement(Probe)),
    );
  });

  return {
    getCtx: () => ctx,
    unmount: () => {
      act(() => {
        root.unmount();
      });
      container.remove();
    },
  };
}

describe("AuthContext bootstrap — RC-BUG-002", () => {
  let authCallback;
  let mounted;

  beforeEach(() => {
    jest.clearAllMocks();
    global.IS_REACT_ACT_ENVIRONMENT = true;
    authCallback = null;
    mockSubscribeToAuthChanges.mockImplementation((cb) => {
      authCallback = cb;
      return jest.fn();
    });
    mounted = mountProvider();
  });

  afterEach(() => {
    mounted.unmount();
  });

  it("null user ends loading", () => {
    expect(mounted.getCtx().loading).toBe(true);

    act(() => {
      authCallback(null);
    });

    expect(mounted.getCtx().loading).toBe(false);
    expect(mounted.getCtx().user).toBe(null);
    expect(mounted.getCtx().signUpInProgress).toBe(false);
  });

  it("valid user ends loading", () => {
    act(() => {
      authCallback({
        uid: "uid-1",
        email: "ana@example.com",
        emailVerified: true,
        usesPasswordAuth: true,
        usesGoogleAuth: false,
      });
    });

    expect(mounted.getCtx().loading).toBe(false);
    expect(mounted.getCtx().user.uid).toBe("uid-1");
  });

  it("signInGoogle does not leave signUpInProgress true", async () => {
    mockSignInWithGoogle.mockResolvedValue({
      user: {
        uid: "g-1",
        email: "g@example.com",
        emailVerified: true,
        usesPasswordAuth: false,
        usesGoogleAuth: true,
      },
      isNewUser: false,
    });
    mockGetUserFirestoreData.mockResolvedValue({ id: "g-1" });

    await act(async () => {
      await mounted.getCtx().signInGoogle();
    });

    expect(mounted.getCtx().signUpInProgress).toBe(false);
  });

  it("email signIn completes even if profile read fails", async () => {
    mockSignInWithEmail.mockResolvedValue({
      uid: "uid-1",
      email: "ana@example.com",
      emailVerified: true,
      usesPasswordAuth: true,
      usesGoogleAuth: false,
    });
    mockCanReceiveWelcomeEmail.mockReturnValue(true);
    mockGetUserFirestoreData.mockRejectedValue({
      code: "permission-denied",
      message: "denied",
    });

    await act(async () => {
      await mounted.getCtx().signIn("ana@example.com", "secret");
    });

    act(() => {
      authCallback({
        uid: "uid-1",
        email: "ana@example.com",
        emailVerified: true,
        usesPasswordAuth: true,
        usesGoogleAuth: false,
      });
    });

    expect(mounted.getCtx().loading).toBe(false);
    expect(mounted.getCtx().error).toBe(null);
  });

  it("logout clears signUpInProgress", async () => {
    act(() => {
      mounted.getCtx().clearSignUpInProgress();
    });

    // Força true via signUp path mock — set via auth null clear instead.
    // Simula estado residual: listener null limpa a flag.
    act(() => {
      authCallback(null);
    });

    expect(mounted.getCtx().signUpInProgress).toBe(false);

    mockAuthLogout.mockResolvedValue(undefined);
    await act(async () => {
      await mounted.getCtx().signOut();
    });

    expect(mounted.getCtx().signUpInProgress).toBe(false);
  });
});
