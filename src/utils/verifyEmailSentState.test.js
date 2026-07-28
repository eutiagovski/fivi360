/**
 * sessionStorage helpers for /verify-email-sent — unit tests (no DOM beyond storage mock).
 */

describe("verifyEmailSentState", () => {
  const store = {};

  beforeEach(() => {
    Object.keys(store).forEach((key) => {
      delete store[key];
    });

    Object.defineProperty(global, "sessionStorage", {
      configurable: true,
      value: {
        getItem: (key) => (key in store ? store[key] : null),
        setItem: (key, value) => {
          store[key] = String(value);
        },
        removeItem: (key) => {
          delete store[key];
        },
      },
    });
  });

  it("persists and reads queued state", () => {
    const {
      persistVerifyEmailSentState,
      readVerifyEmailSentState,
    } = require("./verifyEmailSentState");

    persistVerifyEmailSentState({
      email: "user@example.com",
      verificationEmailQueued: true,
    });

    expect(readVerifyEmailSentState()).toEqual({
      email: "user@example.com",
      verificationEmailQueued: true,
    });
  });

  it("persists failure state without claiming email was sent", () => {
    const {
      persistVerifyEmailSentState,
      readVerifyEmailSentState,
      clearVerifyEmailSentState,
    } = require("./verifyEmailSentState");

    persistVerifyEmailSentState({
      email: "Usuario@Email.com",
      verificationEmailQueued: false,
    });

    expect(readVerifyEmailSentState()).toEqual({
      email: "Usuario@Email.com",
      verificationEmailQueued: false,
    });

    clearVerifyEmailSentState();
    expect(readVerifyEmailSentState()).toBeNull();
  });

  it("returns null for invalid storage payload", () => {
    const { readVerifyEmailSentState } = require("./verifyEmailSentState");
    sessionStorage.setItem("fivi360.verifyEmailSent", "{not-json");
    expect(readVerifyEmailSentState()).toBeNull();
  });
});
