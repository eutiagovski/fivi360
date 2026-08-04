import {
  DEFAULT_EMBED_SETTINGS,
  normalizeEmbedSettings,
  resolveInitialImageId,
  toPublicEmbedSettings,
} from "@/services/projects/embedSettings";

describe("embedSettings normalization", () => {
  test("ausência usa fallback seguro", () => {
    expect(normalizeEmbedSettings(undefined)).toEqual(DEFAULT_EMBED_SETTINGS);
    expect(normalizeEmbedSettings(null)).toEqual(DEFAULT_EMBED_SETTINGS);
  });

  test("valores padrão esperados", () => {
    expect(DEFAULT_EMBED_SETTINGS).toEqual({
      enabled: false,
      initialImageId: null,
      allowFullscreen: true,
      allowNavigation: true,
      showBranding: true,
      updatedAt: null,
    });
  });

  test("ativação / desativação", () => {
    expect(normalizeEmbedSettings({ enabled: true }).enabled).toBe(true);
    expect(normalizeEmbedSettings({ enabled: false }).enabled).toBe(false);
  });

  test("alteração da imagem inicial", () => {
    expect(
      normalizeEmbedSettings({ initialImageId: "img-1" }).initialImageId,
    ).toBe("img-1");
    expect(
      normalizeEmbedSettings({ initialImageId: "  " }).initialImageId,
    ).toBeNull();
  });

  test("fullscreen e navegação", () => {
    expect(
      normalizeEmbedSettings({ allowFullscreen: false }).allowFullscreen,
    ).toBe(false);
    expect(
      normalizeEmbedSettings({ allowNavigation: false }).allowNavigation,
    ).toBe(false);
  });

  test("showBranding permanece verdadeiro", () => {
    expect(normalizeEmbedSettings({ showBranding: false }).showBranding).toBe(
      true,
    );
  });

  test("DTO público usa Date | null e sem updatedAt", () => {
    const normalized = normalizeEmbedSettings({
      enabled: true,
      updatedAt: { seconds: 1_700_000_000, nanoseconds: 0 },
    });
    expect(normalized.updatedAt instanceof Date || normalized.updatedAt === null).toBe(
      true,
    );
    const publicDto = toPublicEmbedSettings(normalized);
    expect(publicDto).not.toHaveProperty("updatedAt");
    expect(publicDto.showBranding).toBe(true);
  });

  test("resolveInitialImageId com fallback", () => {
    const images = [{ id: "a" }, { id: "b" }];
    expect(resolveInitialImageId("b", images)).toBe("b");
    expect(resolveInitialImageId("missing", images)).toBe("a");
    expect(resolveInitialImageId(null, [])).toBeNull();
  });
});
