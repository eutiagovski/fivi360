/**
 * AuthContext.signUp — RC-BUG-001 (estratégia B)
 */

const mockSignUpWithEmail = jest.fn();
const mockAuthLogout = jest.fn();
const mockCreateUserProfile = jest.fn();
const mockTrackEvent = jest.fn();
const mockSubscribeToAuthChanges = jest.fn(() => jest.fn());
const mockSetAnalyticsUser = jest.fn();

jest.mock("@/services/auth/authService", () => ({
  canReceiveWelcomeEmail: jest.fn(() => false),
  logout: (...args) => mockAuthLogout(...args),
  signInWithEmail: jest.fn(),
  signInWithGoogle: jest.fn(),
  signUpWithEmail: (...args) => mockSignUpWithEmail(...args),
  subscribeToAuthChanges: (...args) => mockSubscribeToAuthChanges(...args),
}));

jest.mock("@/services/auth/passwordResetService", () => ({
  requestPasswordResetEmail: jest.fn(),
}));

jest.mock("@/services/users/userService", () => ({
  createUserProfile: (...args) => mockCreateUserProfile(...args),
  getUserFirestoreData: jest.fn(),
  maybeEnqueueWelcomeEmailForAuthUser: jest.fn(),
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

describe("AuthContext.signUp — RC-BUG-001", () => {
  let mounted;

  beforeEach(() => {
    jest.clearAllMocks();
    global.IS_REACT_ACT_ENVIRONMENT = true;
    mockSignUpWithEmail.mockResolvedValue({
      uid: "uid-1",
      email: "usuario@email.com",
      emailVerified: false,
      usesPasswordAuth: true,
      usesGoogleAuth: false,
      displayName: null,
      photoURL: null,
    });
    mockCreateUserProfile.mockResolvedValue({
      profileCreated: true,
      verificationEmailQueued: true,
      verificationEmailId: "email-1",
    });
    mockAuthLogout.mockResolvedValue(undefined);
    mounted = mountProvider();
  });

  afterEach(() => {
    mounted.unmount();
  });

  it("A — uses canonical auth email, enqueues, then logs out", async () => {
    let result;
    await act(async () => {
      result = await mounted.getCtx().signUp("Usuario@Email.com", "secret1", "Ana");
    });

    expect(mockCreateUserProfile).toHaveBeenCalledWith("uid-1", {
      displayName: "Ana",
      email: "usuario@email.com",
      acceptedSource: "signup",
      enqueueVerifyEmail: true,
    });
    expect(mockAuthLogout).toHaveBeenCalled();
    expect(mockTrackEvent).toHaveBeenCalledWith("sign_up", { method: "email" });
    expect(result).toEqual({
      userCreated: true,
      profileCreated: true,
      verificationEmailQueued: true,
      email: "usuario@email.com",
      logoutCompleted: true,
    });
  });

  it("C — partial failure: profile ok, queue failed, still logs out with errorCode", async () => {
    mockCreateUserProfile.mockResolvedValue({
      profileCreated: true,
      verificationEmailQueued: false,
      errorCode: "verification-email-queue-failed",
      error: { code: "permission-denied" },
    });

    let result;
    await act(async () => {
      result = await mounted.getCtx().signUp("ana@example.com", "secret1", "Ana");
    });

    expect(mockAuthLogout).toHaveBeenCalled();
    expect(result.verificationEmailQueued).toBe(false);
    expect(result.errorCode).toBe("verification-email-queue-failed");
    expect(result.userCreated).toBe(true);
    expect(result.email).toBe("usuario@email.com");
  });

  it("E — logout failure does not erase signup result", async () => {
    mockAuthLogout.mockRejectedValue(
      Object.assign(new Error("network"), { code: "auth/network-request-failed" }),
    );

    let result;
    await act(async () => {
      result = await mounted.getCtx().signUp("ana@example.com", "secret1", "Ana");
    });

    expect(result.verificationEmailQueued).toBe(true);
    expect(result.logoutCompleted).toBe(false);
    expect(result.userCreated).toBe(true);
  });

  it("D — signUpInProgress is true while signup runs", async () => {
    let resolveProfile;
    mockCreateUserProfile.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveProfile = resolve;
        }),
    );

    let pending;
    act(() => {
      pending = mounted.getCtx().signUp("ana@example.com", "secret1", "Ana");
    });

    await act(async () => {
      await Promise.resolve();
    });

    expect(mounted.getCtx().signUpInProgress).toBe(true);

    await act(async () => {
      resolveProfile({
        profileCreated: true,
        verificationEmailQueued: true,
        verificationEmailId: "email-1",
      });
      await pending;
    });

    expect(mounted.getCtx().signUpInProgress).toBe(true);

    act(() => {
      mounted.getCtx().clearSignUpInProgress();
    });
    expect(mounted.getCtx().signUpInProgress).toBe(false);
  });

  it("G — signInGoogle does not set signUpInProgress", async () => {
    const { signInWithGoogle } = require("@/services/auth/authService");
    signInWithGoogle.mockResolvedValue({
      user: {
        uid: "g-1",
        email: "g@example.com",
        emailVerified: true,
        usesGoogleAuth: true,
        usesPasswordAuth: false,
      },
      isNewUser: true,
    });

    const { getUserFirestoreData } = require("@/services/users/userService");
    getUserFirestoreData.mockResolvedValue(null);

    await act(async () => {
      await mounted.getCtx().signInGoogle();
    });

    expect(mounted.getCtx().signUpInProgress).toBe(false);
    expect(mockCreateUserProfile).not.toHaveBeenCalled();
  });
});
