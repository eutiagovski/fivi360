import {
  canUseProjectEmbed,
  PLAN_IDS,
  PLAN_LIMITS,
} from "@/config/planLimits";

describe("canUseProjectEmbed", () => {
  test("Starter / free não pode ativar", () => {
    expect(canUseProjectEmbed("starter")).toBe(false);
    expect(canUseProjectEmbed(null)).toBe(false);
    expect(canUseProjectEmbed(undefined)).toBe(false);
  });

  test("Professional pode ativar", () => {
    expect(canUseProjectEmbed("professional")).toBe(true);
    expect(
      canUseProjectEmbed({ id: "professional", status: "active" }),
    ).toBe(true);
  });

  test("planos superiores podem ativar", () => {
    expect(canUseProjectEmbed("studio")).toBe(true);
    expect(canUseProjectEmbed("enterprise")).toBe(true);
  });

  test("plano desconhecido não pode ativar", () => {
    expect(canUseProjectEmbed("unknown-plan")).toBe(false);
    expect(canUseProjectEmbed("free")).toBe(false);
    expect(canUseProjectEmbed("pro")).toBe(false);
  });

  test("plano inativo (past_due / canceled) não pode ativar", () => {
    expect(
      canUseProjectEmbed({ id: "professional", status: "past_due" }),
    ).toBe(false);
    expect(
      canUseProjectEmbed({ id: "professional", status: "canceled" }),
    ).toBe(false);
  });

  test("flag projectEmbedEnabled alinhada aos planos", () => {
    expect(PLAN_LIMITS[PLAN_IDS.STARTER].projectEmbedEnabled).toBe(false);
    expect(PLAN_LIMITS[PLAN_IDS.PROFESSIONAL].projectEmbedEnabled).toBe(true);
    expect(PLAN_LIMITS[PLAN_IDS.STUDIO].projectEmbedEnabled).toBe(true);
    expect(PLAN_LIMITS[PLAN_IDS.ENTERPRISE].projectEmbedEnabled).toBe(true);
  });

  test("benefício comercial no Professional", () => {
    expect(PLAN_LIMITS[PLAN_IDS.PROFESSIONAL].featureBullets).toEqual(
      expect.arrayContaining(["Incorporação em websites"]),
    );
  });
});
