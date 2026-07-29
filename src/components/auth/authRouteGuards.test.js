const {
  resolvePublicRoute,
  resolveProtectedRoute,
  resolveVerifyEmailRoute,
} = require("./authRouteGuards");

describe("auth route guards — RC-BUG-001", () => {
  const unverified = {
    uid: "uid-1",
    email: "ana@example.com",
    emailVerified: false,
    usesPasswordAuth: true,
    usesGoogleAuth: false,
  };

  const verified = {
    ...unverified,
    emailVerified: true,
  };

  it("D — PublicRoute does not redirect while signUpInProgress", () => {
    expect(
      resolvePublicRoute({
        user: unverified,
        loading: false,
        signUpInProgress: true,
      }),
    ).toBe("children");
  });

  it("PublicRoute redirects authenticated users when not signing up", () => {
    expect(
      resolvePublicRoute({
        user: verified,
        loading: false,
        signUpInProgress: false,
      }),
    ).toBe("dashboard");
  });

  it("D — ProtectedRoute stays on loading during signUpInProgress", () => {
    expect(
      resolveProtectedRoute({
        user: unverified,
        loading: false,
        signUpInProgress: true,
      }),
    ).toBe("loading");
  });

  it("ProtectedRoute sends unverified users to verify-email", () => {
    expect(
      resolveProtectedRoute({
        user: unverified,
        loading: false,
        signUpInProgress: false,
      }),
    ).toBe("verify-email");
  });

  it("F — VerifyEmailRoute: unverified authenticated stays", () => {
    expect(
      resolveVerifyEmailRoute({
        user: unverified,
        loading: false,
        signUpInProgress: false,
      }),
    ).toBe("children");
  });

  it("F — VerifyEmailRoute: logged out → login", () => {
    expect(
      resolveVerifyEmailRoute({
        user: null,
        loading: false,
        signUpInProgress: false,
      }),
    ).toBe("login");
  });

  it("F — VerifyEmailRoute: verified → dashboard", () => {
    expect(
      resolveVerifyEmailRoute({
        user: verified,
        loading: false,
        signUpInProgress: false,
      }),
    ).toBe("dashboard");
  });

  it("G — Google verified user is not forced to verify-email", () => {
    const googleUser = {
      uid: "g-1",
      email: "g@example.com",
      emailVerified: false,
      usesPasswordAuth: false,
      usesGoogleAuth: true,
    };

    expect(
      resolveProtectedRoute({
        user: googleUser,
        loading: false,
        signUpInProgress: false,
      }),
    ).toBe("children");
  });

  it("RC-BUG-002 — loading true shows spinner decision", () => {
    expect(
      resolveProtectedRoute({
        user: null,
        loading: true,
        signUpInProgress: false,
      }),
    ).toBe("loading");
  });

  it("RC-BUG-002 — loading false + user shows protected children", () => {
    expect(
      resolveProtectedRoute({
        user: verified,
        loading: false,
        signUpInProgress: false,
      }),
    ).toBe("children");
  });

  it("RC-BUG-002 — loading false + no user redirects to login", () => {
    expect(
      resolveProtectedRoute({
        user: null,
        loading: false,
        signUpInProgress: false,
      }),
    ).toBe("login");
  });

  it("RC-BUG-002 — signUpInProgress does not block when false on normal login", () => {
    expect(
      resolveProtectedRoute({
        user: verified,
        loading: false,
        signUpInProgress: false,
      }),
    ).toBe("children");

    expect(
      resolvePublicRoute({
        user: verified,
        loading: false,
        signUpInProgress: false,
      }),
    ).toBe("dashboard");
  });
});
