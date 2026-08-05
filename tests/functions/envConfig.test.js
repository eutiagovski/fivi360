/**
 * RC-FUNCTIONS-ENV-CLEANUP-1 — config / secrets loading tests.
 * Does not call external services. Does not print secret values.
 */

const fs = require("fs");
const path = require("path");

const FUNCTIONS_ROOT = path.join(__dirname, "../../functions");
const ENV_EXAMPLE = path.join(FUNCTIONS_ROOT, ".env.example");
const GITIGNORE = path.join(FUNCTIONS_ROOT, ".gitignore");
const ROOT_GITIGNORE = path.join(__dirname, "../../.gitignore");

const REQUIRED_EXAMPLE_KEYS = [
  "APP_BASE_URL",
  "RESEND_FROM_EMAIL",
  "STRIPE_PRICE_PROFESSIONAL",
  "STRIPE_PRICE_STUDIO",
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "RESEND_API_KEY",
];

/** Patterns that look like real credentials (must not appear in .env.example). */
const REAL_VALUE_PATTERNS = [
  /sk_(live|test)_[A-Za-z0-9]+/,
  /whsec_[A-Za-z0-9]+/,
  /re_[A-Za-z0-9]+/,
  /price_[A-Za-z0-9]{10,}/,
];

describe("functions env files", () => {
  test(".env.example exists and lists all required keys", () => {
    const text = fs.readFileSync(ENV_EXAMPLE, "utf8");
    for (const key of REQUIRED_EXAMPLE_KEYS) {
      expect(text).toContain(key);
    }
  });

  test(".env.example does not contain real secret/price values", () => {
    const text = fs.readFileSync(ENV_EXAMPLE, "utf8");
    for (const pattern of REAL_VALUE_PATTERNS) {
      expect(text).not.toMatch(pattern);
    }
  });

  test(".env.local and .secret.local are ignored by functions/.gitignore", () => {
    const text = fs.readFileSync(GITIGNORE, "utf8");
    expect(text).toMatch(/\.env\.local/);
    expect(text).toMatch(/\.secret\.local/);
    expect(text).not.toMatch(/^\.env\*$/m);
  });

  test("root .gitignore scopes frontend env to repo root (allows functions/.env)", () => {
    const text = fs.readFileSync(ROOT_GITIGNORE, "utf8");
    expect(text).toMatch(/^\/\.env$/m);
    expect(text).toMatch(/^\/\.env\.local$/m);
  });

  test(".env.example is not ignored", () => {
    const { execSync } = require("child_process");
    let ignored = "";
    try {
      ignored = execSync("git check-ignore -v functions/.env.example", {
        cwd: path.join(__dirname, "../.."),
        encoding: "utf8",
      }).trim();
    } catch (err) {
      // exit 1 = not ignored
      ignored = (err.stdout || "").trim();
    }
    expect(ignored).toBe("");
  });
});

describe("requireConfiguredSecret", () => {
  const { requireConfiguredSecret } = require("../../functions/src/config/requireConfiguredSecret");

  test("returns trimmed value when present", () => {
    const param = { value: () => "  secret-value  " };
    expect(requireConfiguredSecret(param, "TEST_SECRET")).toBe("secret-value");
  });

  test("throws controlled error when empty (does not include value)", () => {
    const param = { value: () => "" };
    expect(() => requireConfiguredSecret(param, "TEST_SECRET")).toThrow(
      /TEST_SECRET is not configured/,
    );
    try {
      requireConfiguredSecret(param, "TEST_SECRET");
    } catch (err) {
      expect(err.code).toBe("secret-not-configured");
      expect(String(err.message)).not.toMatch(/sk_|whsec_|re_/);
    }
  });

  test("throws when value() fails", () => {
    const param = {
      value: () => {
        throw new Error("unavailable");
      },
    };
    expect(() => requireConfiguredSecret(param, "RESEND_API_KEY")).toThrow(
      /RESEND_API_KEY is not configured/,
    );
  });
});

describe("getStripeClient without secret", () => {
  test("returns null when STRIPE_SECRET_KEY is missing (no throw at call)", () => {
    jest.resetModules();
    jest.doMock("firebase-functions/params", () => ({
      defineSecret: (name) => ({
        name,
        value: () => "",
      }),
    }));
    jest.doMock("stripe", () => {
      return jest.fn().mockImplementation(() => ({ mocked: true }));
    });

    const { getStripeClient } = require("../../functions/src/stripe/client");
    expect(getStripeClient()).toBeNull();

    jest.dontMock("firebase-functions/params");
    jest.dontMock("stripe");
    jest.resetModules();
  });
});

describe("APP_BASE_URL / non-secret config", () => {
  test("APP_BASE_URL can come from process.env", () => {
    const previous = process.env.APP_BASE_URL;
    process.env.APP_BASE_URL = "http://env-test.example:3999";
    jest.resetModules();
    const { APP_BASE_URL } = require("../../functions/src/config/app");
    expect(APP_BASE_URL).toBe("http://env-test.example:3999");
    if (previous === undefined) {
      delete process.env.APP_BASE_URL;
    } else {
      process.env.APP_BASE_URL = previous;
    }
    jest.resetModules();
  });

  test("APP_BASE_URL falls back to localhost when unset", () => {
    const previous = process.env.APP_BASE_URL;
    delete process.env.APP_BASE_URL;
    jest.resetModules();
    const { APP_BASE_URL } = require("../../functions/src/config/app");
    expect(APP_BASE_URL).toBe("http://localhost:3000");
    if (previous !== undefined) {
      process.env.APP_BASE_URL = previous;
    }
    jest.resetModules();
  });
});

describe("functions bootstrap without secrets", () => {
  test("src/index.js exports load without external calls", () => {
    jest.resetModules();
    jest.doMock("firebase-admin/app", () => ({
      initializeApp: jest.fn(),
    }));
    jest.doMock("firebase-admin/firestore", () => ({
      getFirestore: jest.fn(),
      FieldValue: { serverTimestamp: jest.fn() },
    }));
    jest.doMock("firebase-admin/auth", () => ({
      getAuth: jest.fn(),
    }));
    jest.doMock("firebase-functions/params", () => ({
      defineSecret: (name) => ({
        name,
        value: () => {
          throw new Error(`secret ${name} not available at import`);
        },
      }),
      defineString: (name, opts = {}) => ({
        name,
        value: () => opts.default ?? "",
      }),
    }));

    const index = require("../../functions/src/index");
    expect(typeof index.createStripeCheckoutSession).toBe("function");
    expect(typeof index.processEmailQueue).toBe("function");
    expect(typeof index.getPublicEmbeddedProject).toBe("function");
    expect(typeof index.stripeWebhook).toBe("function");

    jest.resetModules();
  });

  test("missing Stripe secret does not prevent loading embed export", () => {
    jest.resetModules();
    jest.doMock("firebase-admin/app", () => ({ initializeApp: jest.fn() }));
    jest.doMock("firebase-admin/firestore", () => ({
      getFirestore: jest.fn(),
      FieldValue: { serverTimestamp: jest.fn() },
    }));
    jest.doMock("firebase-functions/params", () => ({
      defineSecret: (name) => ({
        name,
        value: () => (name === "STRIPE_SECRET_KEY" ? "" : "dummy"),
      }),
      defineString: (name, opts = {}) => ({
        name,
        value: () => opts.default ?? "",
      }),
    }));

    const { getPublicEmbeddedProject } = require("../../functions/src/index");
    expect(getPublicEmbeddedProject).toBeDefined();
    jest.resetModules();
  });

  test("missing Resend secret does not prevent loading Stripe export", () => {
    jest.resetModules();
    jest.doMock("firebase-admin/app", () => ({ initializeApp: jest.fn() }));
    jest.doMock("firebase-admin/firestore", () => ({
      getFirestore: jest.fn(),
      FieldValue: { serverTimestamp: jest.fn() },
    }));
    jest.doMock("firebase-functions/params", () => ({
      defineSecret: (name) => ({
        name,
        value: () => (name === "RESEND_API_KEY" ? "" : "dummy"),
      }),
      defineString: (name, opts = {}) => ({
        name,
        value: () => opts.default ?? "",
      }),
    }));

    const { createStripeCheckoutSession } = require("../../functions/src/index");
    expect(createStripeCheckoutSession).toBeDefined();
    jest.resetModules();
  });
});

describe("no leftover .secret references that imply removal without .secret.local", () => {
  test("codebase documents .secret.local (Firebase), not a bare .secret file requirement", () => {
    const example = fs.readFileSync(ENV_EXAMPLE, "utf8");
    expect(example).toContain(".secret.local");
  });
});
