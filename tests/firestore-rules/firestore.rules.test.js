/**
 * RC-P0.5 — Firestore Rules Hardening tests
 *
 * Run: npm run test:rules
 * (starts Firestore emulator via firebase emulators:exec)
 */

const { readFileSync } = require("fs");
const { resolve } = require("path");
const {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} = require("@firebase/rules-unit-testing");
const {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  Timestamp,
} = require("firebase/firestore");

const PROJECT_ID = "demo-fivi360-rules";
const RULES_PATH = resolve(__dirname, "../../firestore.rules");

/** @type {import('@firebase/rules-unit-testing').RulesTestEnvironment} */
let testEnv;

const STARTER_BILLING = Object.freeze({
  provider: "stripe",
  subscriptionStatus: "free",
});

const EMPTY_SOCIAL = Object.freeze({
  website: "",
  instagram: "",
  youtube: "",
  linkedin: "",
  whatsapp: "",
});

function authContext(uid) {
  return testEnv.authenticatedContext(uid, { email: `${uid}@example.com` });
}

function unauthContext() {
  return testEnv.unauthenticatedContext();
}

function buildUserCreate(uid, overrides = {}) {
  return {
    displayName: "Test User",
    email: `${uid}@example.com`,
    plan: "starter",
    billing: { ...STARTER_BILLING },
    defaultWorkspaceId: uid,
    activeWorkspaceId: uid,
    welcomeEmailQueuedAt: null,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
    ...overrides,
  };
}

function buildPublicProfileCreate(uid, overrides = {}) {
  return {
    uid,
    slug: "",
    portfolioEnabled: false,
    portfolioAvailable: false,
    displayName: "Test User",
    companyName: "",
    companyLogo: "",
    bio: "",
    socialLinks: { ...EMPTY_SOCIAL },
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
    ...overrides,
  };
}

async function seedOwnerDocs(uid, { user, profile } = {}) {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    await setDoc(doc(db, "users", uid), user ?? buildUserCreate(uid));
    await setDoc(
      doc(db, "publicProfiles", uid),
      profile ?? buildPublicProfileCreate(uid),
    );
  });
}

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      rules: readFileSync(RULES_PATH, "utf8"),
      host: "127.0.0.1",
      port: 8085,
    },
  });
});

afterAll(async () => {
  if (testEnv) {
    await testEnv.cleanup();
  }
});

beforeEach(async () => {
  await testEnv.clearFirestore();
});

describe("users/{uid} — allow", () => {
  test("1. owner reads own users/{uid}", async () => {
    const uid = "user-a";
    await seedOwnerDocs(uid);

    const db = authContext(uid).firestore();
    await assertSucceeds(getDoc(doc(db, "users", uid)));
  });

  test("2. owner updates safe field (displayName)", async () => {
    const uid = "user-a";
    await seedOwnerDocs(uid);

    const db = authContext(uid).firestore();
    await assertSucceeds(
      updateDoc(doc(db, "users", uid), {
        displayName: "Novo Nome",
        updatedAt: Timestamp.now(),
      }),
    );
  });

  test("5. legitimate profile bootstrap create succeeds", async () => {
    const uid = "user-new";
    const db = authContext(uid).firestore();

    await assertSucceeds(setDoc(doc(db, "users", uid), buildUserCreate(uid)));
    await assertSucceeds(
      setDoc(doc(db, "publicProfiles", uid), buildPublicProfileCreate(uid)),
    );
  });

  test("bootstrap Starter billing is stripe/free", async () => {
    const uid = "user-stripe-bootstrap";
    const db = authContext(uid).firestore();
    const payload = buildUserCreate(uid);

    expect(payload.billing.provider).toBe("stripe");
    expect(payload.billing.subscriptionStatus).toBe("free");
    expect(payload.billing).not.toHaveProperty("customerId");
    expect(JSON.stringify(payload)).not.toMatch(/mercado_pago/i);

    await assertSucceeds(setDoc(doc(db, "users", uid), payload));
  });

  test("owner updates legalConsent", async () => {
    const uid = "user-a";
    await seedOwnerDocs(uid);

    const db = authContext(uid).firestore();
    await assertSucceeds(
      updateDoc(doc(db, "users", uid), {
        legalConsent: {
          termsAccepted: true,
          privacyAccepted: true,
          termsVersion: "1.0",
          privacyVersion: "1.0",
          acceptedAt: Timestamp.now(),
          acceptedSource: "modal_existing_user",
        },
        updatedAt: Timestamp.now(),
      }),
    );
  });

  test("RC-MARKETING-CONSENT-1 — create with marketingPreferences opt-out succeeds", async () => {
    const uid = "user-mkt-out";
    const db = authContext(uid).firestore();

    await assertSucceeds(
      setDoc(
        doc(db, "users", uid),
        buildUserCreate(uid, {
          marketingPreferences: {
            enabled: false,
            productUpdates: false,
            offers: false,
            tips: false,
            newsletter: false,
            research: false,
            consentVersion: "beta-2026-01",
            consentSource: "signup",
            consentedAt: null,
            revokedAt: null,
            updatedAt: Timestamp.now(),
          },
        }),
      ),
    );
  });

  test("RC-MARKETING-CONSENT-1 — create with marketingPreferences opt-in succeeds", async () => {
    const uid = "user-mkt-in";
    const db = authContext(uid).firestore();

    await assertSucceeds(
      setDoc(
        doc(db, "users", uid),
        buildUserCreate(uid, {
          marketingPreferences: {
            enabled: true,
            productUpdates: true,
            offers: false,
            tips: true,
            newsletter: false,
            research: false,
            consentVersion: "beta-2026-01",
            consentSource: "signup",
            consentedAt: Timestamp.now(),
            revokedAt: null,
            updatedAt: Timestamp.now(),
          },
        }),
      ),
    );
  });

  test("RC-MARKETING-CONSENT-1 — owner may update own marketingPreferences", async () => {
    const uid = "user-a";
    await seedOwnerDocs(uid);

    const db = authContext(uid).firestore();
    await assertSucceeds(
      updateDoc(doc(db, "users", uid), {
        marketingPreferences: {
          enabled: true,
          productUpdates: true,
          offers: false,
          tips: true,
          newsletter: false,
          research: false,
          consentVersion: "beta-2026-01",
          consentSource: "signup",
          consentedAt: Timestamp.now(),
          revokedAt: null,
          updatedAt: Timestamp.now(),
        },
        updatedAt: Timestamp.now(),
      }),
    );
  });

  test("RC-MARKETING-CONSENT-1 — enabled true without consentedAt is denied", async () => {
    const uid = "user-mkt-invalid";
    const db = authContext(uid).firestore();

    await assertFails(
      setDoc(
        doc(db, "users", uid),
        buildUserCreate(uid, {
          marketingPreferences: {
            enabled: true,
            productUpdates: true,
            offers: false,
            tips: true,
            newsletter: false,
            research: false,
            consentVersion: "beta-2026-01",
            consentSource: "signup",
            consentedAt: null,
            revokedAt: null,
            updatedAt: Timestamp.now(),
          },
        }),
      ),
    );
  });
});

describe("publicProfiles/{uid} — allow", () => {
  test("3. owner updates legitimate public fields", async () => {
    const uid = "user-a";
    await seedOwnerDocs(uid);

    const db = authContext(uid).firestore();
    await assertSucceeds(
      setDoc(
        doc(db, "publicProfiles", uid),
        {
          uid,
          displayName: "Escritório",
          companyName: "Studio X",
          bio: "Bio",
          slug: "studio-x",
          portfolioEnabled: false,
          socialLinks: {
            website: "https://example.com",
            instagram: "",
            youtube: "",
            linkedin: "",
            whatsapp: "",
          },
          updatedAt: Timestamp.now(),
        },
        { merge: true },
      ),
    );
  });

  test("4. owner may change portfolioEnabled (preference)", async () => {
    const uid = "user-a";
    await seedOwnerDocs(uid);

    const db = authContext(uid).firestore();
    await assertSucceeds(
      updateDoc(doc(db, "publicProfiles", uid), {
        portfolioEnabled: true,
        updatedAt: Timestamp.now(),
      }),
    );
  });

  test("owner may demote portfolioAvailable to false", async () => {
    const uid = "user-a";
    await seedOwnerDocs(uid, {
      profile: buildPublicProfileCreate(uid, { portfolioAvailable: true }),
    });

    const db = authContext(uid).firestore();
    await assertSucceeds(
      updateDoc(doc(db, "publicProfiles", uid), {
        portfolioAvailable: false,
        portfolioEnabled: false,
        updatedAt: Timestamp.now(),
      }),
    );
  });
});

describe("slugs/{slug} — allow", () => {
  test("6. legitimate slug create and owner delete work", async () => {
    const uid = "user-a";
    const db = authContext(uid).firestore();

    await assertSucceeds(
      setDoc(doc(db, "slugs", "meu-escritorio"), {
        uid,
        type: "user",
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      }),
    );

    await assertSucceeds(deleteDoc(doc(db, "slugs", "meu-escritorio")));
  });
});

describe("users/{uid} — deny", () => {
  test("create with billing.provider mercado_pago is denied", async () => {
    const uid = "user-mp-create";
    const db = authContext(uid).firestore();

    await assertFails(
      setDoc(
        doc(db, "users", uid),
        buildUserCreate(uid, {
          billing: {
            provider: "mercado_pago",
            subscriptionStatus: "free",
          },
        }),
      ),
    );
  });

  test("create with non-bootstrap billing shape is denied", async () => {
    const uid = "user-invalid-billing-shape";
    const db = authContext(uid).firestore();

    await assertFails(
      setDoc(
        doc(db, "users", uid),
        buildUserCreate(uid, {
          billing: {
            provider: "stripe",
            customerId: "",
            subscriptionId: "",
            planId: "",
            subscriptionStatus: "free",
            currentPeriodStart: null,
            currentPeriodEnd: null,
            nextInvoiceDate: null,
            cancelAtPeriodEnd: false,
            lastInvoiceUrl: "",
            lastPaymentStatus: "",
            updatedAt: null,
          },
        }),
      ),
    );
  });

  test("7. owner cannot change users.plan", async () => {
    const uid = "user-a";
    await seedOwnerDocs(uid);

    const db = authContext(uid).firestore();
    await assertFails(
      updateDoc(doc(db, "users", uid), {
        plan: { id: "studio", status: "active", source: "stripe" },
        updatedAt: Timestamp.now(),
      }),
    );
  });

  test("8. owner cannot change users.billing", async () => {
    const uid = "user-a";
    await seedOwnerDocs(uid);

    const db = authContext(uid).firestore();
    await assertFails(
      updateDoc(doc(db, "users", uid), {
        billing: {
          ...STARTER_BILLING,
          provider: "stripe",
          subscriptionStatus: "active",
        },
        updatedAt: Timestamp.now(),
      }),
    );
  });

  test("9. owner cannot add billing.stripe.customerId", async () => {
    const uid = "user-a";
    await seedOwnerDocs(uid);

    const db = authContext(uid).firestore();
    await assertFails(
      updateDoc(doc(db, "users", uid), {
        billing: {
          provider: "stripe",
          stripe: { customerId: "cus_hack", subscriptionId: "sub_hack" },
        },
        updatedAt: Timestamp.now(),
      }),
    );
  });

  test("10. owner cannot change subscriptionStatus", async () => {
    const uid = "user-a";
    await seedOwnerDocs(uid);

    const db = authContext(uid).firestore();
    await assertFails(
      updateDoc(doc(db, "users", uid), {
        subscriptionStatus: "active",
        updatedAt: Timestamp.now(),
      }),
    );
  });

  test("11. owner cannot change priceId", async () => {
    const uid = "user-a";
    await seedOwnerDocs(uid);

    const db = authContext(uid).firestore();
    await assertFails(
      updateDoc(doc(db, "users", uid), {
        priceId: "price_paid",
        updatedAt: Timestamp.now(),
      }),
    );
  });

  test("12. owner cannot add admin field", async () => {
    const uid = "user-a";
    await seedOwnerDocs(uid);

    const db = authContext(uid).firestore();
    await assertFails(
      updateDoc(doc(db, "users", uid), {
        isAdmin: true,
        updatedAt: Timestamp.now(),
      }),
    );
  });

  test("15. user cannot alter another user's document", async () => {
    await seedOwnerDocs("user-a");

    const db = authContext("user-b").firestore();
    await assertFails(
      updateDoc(doc(db, "users", "user-a"), {
        displayName: "Hijacked",
        updatedAt: Timestamp.now(),
      }),
    );
  });

  test("17. owner cannot delete users/{uid}", async () => {
    const uid = "user-a";
    await seedOwnerDocs(uid);

    const db = authContext(uid).firestore();
    await assertFails(deleteDoc(doc(db, "users", uid)));
  });

  test("create with paid plan is denied", async () => {
    const uid = "user-new";
    const db = authContext(uid).firestore();

    await assertFails(
      setDoc(
        doc(db, "users", uid),
        buildUserCreate(uid, {
          plan: { id: "professional", status: "active", source: "stripe" },
        }),
      ),
    );
  });
});

describe("publicProfiles/{uid} — deny", () => {
  test("13. owner cannot promote portfolioAvailable to true", async () => {
    const uid = "user-a";
    await seedOwnerDocs(uid);

    const db = authContext(uid).firestore();
    await assertFails(
      updateDoc(doc(db, "publicProfiles", uid), {
        portfolioAvailable: true,
        updatedAt: Timestamp.now(),
      }),
    );
  });

  test("14. owner cannot add planId to publicProfiles", async () => {
    const uid = "user-a";
    await seedOwnerDocs(uid);

    const db = authContext(uid).firestore();
    await assertFails(
      updateDoc(doc(db, "publicProfiles", uid), {
        planId: "studio",
        updatedAt: Timestamp.now(),
      }),
    );
  });

  test("16. owner cannot repoint uid to another person", async () => {
    const uid = "user-a";
    await seedOwnerDocs(uid);

    const db = authContext(uid).firestore();
    await assertFails(
      updateDoc(doc(db, "publicProfiles", uid), {
        uid: "user-b",
        updatedAt: Timestamp.now(),
      }),
    );
  });

  test("create with portfolioAvailable true is denied", async () => {
    const uid = "user-new";
    const db = authContext(uid).firestore();

    await assertFails(
      setDoc(
        doc(db, "publicProfiles", uid),
        buildPublicProfileCreate(uid, { portfolioAvailable: true }),
      ),
    );
  });

  test("anonymous cannot read profile when portfolioAvailable is false", async () => {
    const uid = "user-a";
    await seedOwnerDocs(uid);

    const db = unauthContext().firestore();
    await assertFails(getDoc(doc(db, "publicProfiles", uid)));
  });

  test("anonymous can read profile when portfolioAvailable is true", async () => {
    const uid = "user-a";
    await seedOwnerDocs(uid, {
      profile: buildPublicProfileCreate(uid, { portfolioAvailable: true }),
    });

    const db = unauthContext().firestore();
    await assertSucceeds(getDoc(doc(db, "publicProfiles", uid)));
  });
});

describe("slugs/{slug} — deny", () => {
  test("18. user cannot overwrite slug owned by another uid", async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      await setDoc(doc(db, "slugs", "taken-slug"), {
        uid: "user-a",
        type: "user",
        createdAt: Timestamp.now(),
      });
    });

    const db = authContext("user-b").firestore();

    // update is always denied
    await assertFails(
      updateDoc(doc(db, "slugs", "taken-slug"), {
        uid: "user-b",
      }),
    );

    // delete only by owner
    await assertFails(deleteDoc(doc(db, "slugs", "taken-slug")));

    // create on existing doc fails (already exists); pointing new slug to other uid denied
    await assertFails(
      setDoc(doc(db, "slugs", "other-slug"), {
        uid: "user-a",
        type: "user",
        createdAt: Timestamp.now(),
      }),
    );
  });
});

describe("Admin SDK note", () => {
  test("withSecurityRulesDisabled can write server-only fields", async () => {
    const uid = "user-a";
    await seedOwnerDocs(uid);

    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      await updateDoc(doc(db, "users", uid), {
        plan: { id: "professional", status: "active", source: "stripe" },
        billing: {
          provider: "stripe",
          stripe: { customerId: "cus_1", subscriptionId: "sub_1" },
        },
      });
      await updateDoc(doc(db, "publicProfiles", uid), {
        portfolioAvailable: true,
      });
    });

    const db = authContext(uid).firestore();
    const userSnap = await getDoc(doc(db, "users", uid));
    expect(userSnap.data().plan.id).toBe("professional");
  });
});

describe("emailQueue/{emailId} — RC-BUG-001", () => {
  function buildEmailQueueCreate(uid, overrides = {}) {
    return {
      type: "verify_email",
      to: `${uid}@example.com`,
      userId: uid,
      payload: { name: "Ana" },
      status: "pending",
      createdAt: Timestamp.now(),
      ...overrides,
    };
  }

  test("canonical auth email allows verify_email create", async () => {
    const uid = "user-a";
    const db = authContext(uid).firestore();

    await assertSucceeds(
      setDoc(doc(db, "emailQueue", "email-ok"), buildEmailQueueCreate(uid)),
    );
  });

  test("different to email is rejected", async () => {
    const uid = "user-a";
    const db = authContext(uid).firestore();

    await assertFails(
      setDoc(
        doc(db, "emailQueue", "email-wrong-to"),
        buildEmailQueueCreate(uid, { to: "other@example.com" }),
      ),
    );
  });

  test("unauthenticated create is rejected", async () => {
    const db = unauthContext().firestore();

    await assertFails(
      setDoc(
        doc(db, "emailQueue", "email-anon"),
        buildEmailQueueCreate("user-a"),
      ),
    );
  });

  test("invalid type is rejected", async () => {
    const uid = "user-a";
    const db = authContext(uid).firestore();

    await assertFails(
      setDoc(
        doc(db, "emailQueue", "email-bad-type"),
        buildEmailQueueCreate(uid, { type: "password_reset" }),
      ),
    );
  });

  test("invalid payload is rejected", async () => {
    const uid = "user-a";
    const db = authContext(uid).firestore();

    await assertFails(
      setDoc(
        doc(db, "emailQueue", "email-bad-payload"),
        buildEmailQueueCreate(uid, { payload: "not-a-map" }),
      ),
    );
  });

  test("casing mismatch vs token.email is rejected", async () => {
    const uid = "user-a";
    // authContext uses `${uid}@example.com` — uppercase differs from token
    const db = authContext(uid).firestore();

    await assertFails(
      setDoc(
        doc(db, "emailQueue", "email-casing"),
        buildEmailQueueCreate(uid, { to: "User-A@Example.com" }),
      ),
    );
  });
});

describe("workspaces.planId — RC-P0.5A", () => {
  test("owner cannot change workspaces.planId (not an entitlement bypass)", async () => {
    const uid = "user-a";

    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      await setDoc(doc(db, "workspaces", uid), {
        ownerId: uid,
        name: "Meu workspace",
        type: "personal",
        planId: "starter",
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      await setDoc(doc(db, "workspaces", uid, "members", uid), {
        userId: uid,
        role: "owner",
        status: "active",
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
    });

    const db = authContext(uid).firestore();
    await assertFails(
      updateDoc(doc(db, "workspaces", uid), {
        planId: "studio",
        name: "Meu workspace",
        updatedAt: Timestamp.now(),
      }),
    );

    await assertSucceeds(
      updateDoc(doc(db, "workspaces", uid), {
        planId: "starter",
        name: "Workspace renomeado",
        updatedAt: Timestamp.now(),
      }),
    );
  });
});

describe("projects.embedSettings — RC-PROJECT-EMBED-1", () => {
  const projectBase = {
    userId: "owner-embed",
    title: "Projeto Embed",
    description: "",
    clientName: "",
    visibility: "private",
    coverImage: "",
    imageCount: 0,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };

  const validEmbedSettings = {
    enabled: true,
    initialImageId: "img-1",
    allowFullscreen: true,
    allowNavigation: true,
    showBranding: true,
    updatedAt: Timestamp.now(),
  };

  async function seedProject(overrides = {}) {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      await setDoc(doc(db, "projects", "proj-embed"), {
        ...projectBase,
        ...overrides,
      });
    });
  }

  test("owner pode atualizar embedSettings válidos", async () => {
    await seedOwnerDocs("owner-embed");
    await seedProject();

    const db = authContext("owner-embed").firestore();
    await assertSucceeds(
      updateDoc(doc(db, "projects", "proj-embed"), {
        embedSettings: validEmbedSettings,
        updatedAt: Timestamp.now(),
      }),
    );
  });

  test("outro usuário não pode atualizar embedSettings", async () => {
    await seedOwnerDocs("owner-embed");
    await seedOwnerDocs("other-user");
    await seedProject({
      embedSettings: { ...validEmbedSettings, enabled: false },
    });

    const db = authContext("other-user").firestore();
    await assertFails(
      updateDoc(doc(db, "projects", "proj-embed"), {
        embedSettings: validEmbedSettings,
        updatedAt: Timestamp.now(),
      }),
    );
  });

  test("usuário não autenticado não pode atualizar", async () => {
    await seedProject({
      embedSettings: { ...validEmbedSettings, enabled: false },
    });

    const db = unauthContext().firestore();
    await assertFails(
      updateDoc(doc(db, "projects", "proj-embed"), {
        embedSettings: validEmbedSettings,
        updatedAt: Timestamp.now(),
      }),
    );
  });

  test("showBranding false é rejeitado", async () => {
    await seedOwnerDocs("owner-embed");
    await seedProject();

    const db = authContext("owner-embed").firestore();
    await assertFails(
      updateDoc(doc(db, "projects", "proj-embed"), {
        embedSettings: { ...validEmbedSettings, showBranding: false },
        updatedAt: Timestamp.now(),
      }),
    );
  });

  test("projeto private sem embed não é legível publicamente", async () => {
    await seedProject({ visibility: "private" });
    const db = unauthContext().firestore();
    await assertFails(getDoc(doc(db, "projects", "proj-embed")));
  });

  test("projeto shared continua legível publicamente (fluxo share)", async () => {
    await seedProject({ visibility: "shared" });
    const db = unauthContext().firestore();
    await assertSucceeds(getDoc(doc(db, "projects", "proj-embed")));
  });
});

describe("prelaunchLeads/{leadId} — RC-LP-PRELAUNCH-DATA-1", () => {
  const leadId = "a".repeat(64);
  const leadDoc = {
    name: "Ana",
    email: "ana@example.com",
    emailNormalized: "ana@example.com",
    phone: "21999999999",
    phoneNormalized: "5521999999999",
    profession: "Arquiteto(a)",
    marketingConsent: false,
    campaignId: "prelaunch_2026",
    attribution: {
      source: "instagram",
      medium: "stories",
      utmCampaign: "prelaunch_2026",
      content: "editorial_01",
      term: null,
      referrer: null,
      landingPath: "/lp/acesso-antecipado",
    },
    status: "waiting",
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };

  test("anonymous cannot read", async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), "prelaunchLeads", leadId), leadDoc);
    });

    const db = unauthContext().firestore();
    await assertFails(getDoc(doc(db, "prelaunchLeads", leadId)));
  });

  test("authenticated cannot read", async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), "prelaunchLeads", leadId), leadDoc);
    });

    const db = authContext("user-a").firestore();
    await assertFails(getDoc(doc(db, "prelaunchLeads", leadId)));
  });

  test("anonymous cannot create", async () => {
    const db = unauthContext().firestore();
    await assertFails(setDoc(doc(db, "prelaunchLeads", "client-create"), leadDoc));
  });

  test("authenticated cannot create", async () => {
    const db = authContext("user-a").firestore();
    await assertFails(setDoc(doc(db, "prelaunchLeads", "client-create-auth"), leadDoc));
  });

  test("client cannot update", async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), "prelaunchLeads", leadId), leadDoc);
    });

    const db = authContext("user-a").firestore();
    await assertFails(
      updateDoc(doc(db, "prelaunchLeads", leadId), { name: "Hack" }),
    );
  });

  test("client cannot delete", async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), "prelaunchLeads", leadId), leadDoc);
    });

    const db = authContext("user-a").firestore();
    await assertFails(deleteDoc(doc(db, "prelaunchLeads", leadId)));
  });

  test("Admin SDK bypass can write prelaunchLeads", async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      await setDoc(doc(db, "prelaunchLeads", "admin-lead"), leadDoc);
      const snap = await getDoc(doc(db, "prelaunchLeads", "admin-lead"));
      expect(snap.exists()).toBe(true);
      expect(snap.data().campaignId).toBe("prelaunch_2026");
    });
  });
});
