const {
  canUseProjectEmbed,
  normalizeEmbedSettings,
  resolveInitialImageId,
  resolvePublicEmbeddedProject,
} = require("../../functions/src/embed/resolvePublicEmbeddedProject");

function makeDoc(id, data, hotspots = []) {
  return {
    id,
    exists: true,
    data: () => data,
    ref: {
      collection: () => ({
        get: async () => ({
          docs: hotspots.map((hs) => ({
            id: hs.id,
            data: () => hs,
          })),
        }),
      }),
    },
  };
}

function makeDb({ project, owner, images = [] }) {
  return {
    collection(name) {
      if (name === "projects") {
        return {
          doc(id) {
            return {
              get: async () => {
                if (!project || project.id !== id) {
                  return { exists: false, id, data: () => undefined };
                }
                return makeDoc(project.id, project.data);
              },
            };
          },
        };
      }

      if (name === "users") {
        return {
          doc(id) {
            return {
              get: async () => {
                if (!owner || owner.id !== id) {
                  return { exists: false };
                }
                return { exists: true, data: () => owner.data };
              },
            };
          },
        };
      }

      if (name === "images") {
        return {
          where() {
            return {
              get: async () => ({
                docs: images.map((image) =>
                  makeDoc(image.id, image.data, image.hotspots || []),
                ),
              }),
            };
          },
        };
      }

      throw new Error(`Unexpected collection ${name}`);
    },
  };
}

describe("canUseProjectEmbed (functions)", () => {
  test("professional ativo elegível", () => {
    expect(canUseProjectEmbed({ id: "professional", status: "active" })).toBe(
      true,
    );
  });

  test("starter não elegível", () => {
    expect(canUseProjectEmbed("starter")).toBe(false);
  });

  test("professional past_due não elegível", () => {
    expect(
      canUseProjectEmbed({ id: "professional", status: "past_due" }),
    ).toBe(false);
  });
});

describe("resolvePublicEmbeddedProject", () => {
  test("projeto habilitado retorna DTO mínimo", async () => {
    const db = makeDb({
      project: {
        id: "p1",
        data: {
          title: "Casa X",
          userId: "u1",
          embedSettings: {
            enabled: true,
            initialImageId: "i2",
            allowFullscreen: true,
            allowNavigation: true,
            showBranding: true,
          },
        },
      },
      owner: {
        id: "u1",
        data: { plan: { id: "professional", status: "active" } },
      },
      images: [
        {
          id: "i1",
          data: {
            title: "Sala",
            originalUrl: "https://cdn/1.jpg",
            createdAt: { toMillis: () => 1 },
          },
          hotspots: [
            {
              id: "h1",
              type: "info",
              title: "Info",
              description: "Desc",
              pitch: 1,
              yaw: 2,
            },
          ],
        },
        {
          id: "i2",
          data: {
            title: "Quarto",
            previewUrl: "https://cdn/2.jpg",
            createdAt: { toMillis: () => 2 },
          },
        },
      ],
    });

    const result = await resolvePublicEmbeddedProject(db, "p1");
    expect(result.ok).toBe(true);
    expect(result.project).toMatchObject({
      id: "p1",
      name: "Casa X",
      initialImageId: "i2",
    });
    expect(result.project).not.toHaveProperty("userId");
    expect(result.project).not.toHaveProperty("ownerId");
    expect(result.project.images[0].hotspots[0]).toMatchObject({
      id: "h1",
      type: "info",
      title: "Info",
    });
    expect(result.project.images[0]).not.toHaveProperty("userId");
  });

  test("projeto desabilitado não retorna", async () => {
    const db = makeDb({
      project: {
        id: "p1",
        data: {
          title: "X",
          userId: "u1",
          embedSettings: { enabled: false },
        },
      },
      owner: {
        id: "u1",
        data: { plan: "professional" },
      },
    });

    const result = await resolvePublicEmbeddedProject(db, "p1");
    expect(result).toEqual({ ok: false, code: "unavailable" });
  });

  test("proprietário sem plano elegível não retorna", async () => {
    const db = makeDb({
      project: {
        id: "p1",
        data: {
          title: "X",
          userId: "u1",
          embedSettings: { enabled: true },
        },
      },
      owner: {
        id: "u1",
        data: { plan: "starter" },
      },
    });

    const result = await resolvePublicEmbeddedProject(db, "p1");
    expect(result).toEqual({ ok: false, code: "unavailable" });
  });

  test("projeto inexistente não retorna", async () => {
    const db = makeDb({ project: null, owner: null });
    const result = await resolvePublicEmbeddedProject(db, "missing");
    expect(result).toEqual({ ok: false, code: "not_found" });
  });

  test("imagem inicial inválida utiliza fallback", async () => {
    const db = makeDb({
      project: {
        id: "p1",
        data: {
          title: "X",
          userId: "u1",
          embedSettings: {
            enabled: true,
            initialImageId: "gone",
          },
        },
      },
      owner: {
        id: "u1",
        data: { plan: { id: "studio", status: "active" } },
      },
      images: [
        {
          id: "i1",
          data: {
            title: "A",
            originalUrl: "https://cdn/a.jpg",
            createdAt: { toMillis: () => 10 },
          },
        },
      ],
    });

    const result = await resolvePublicEmbeddedProject(db, "p1");
    expect(result.ok).toBe(true);
    expect(result.project.initialImageId).toBe("i1");
  });

  test("projeto sem imagens retorna estado vazio válido", async () => {
    const db = makeDb({
      project: {
        id: "p1",
        data: {
          title: "Vazio",
          userId: "u1",
          embedSettings: { enabled: true },
        },
      },
      owner: {
        id: "u1",
        data: { plan: "professional" },
      },
      images: [],
    });

    const result = await resolvePublicEmbeddedProject(db, "p1");
    expect(result.ok).toBe(true);
    expect(result.project.empty).toBe(true);
    expect(result.project.images).toEqual([]);
  });

  test("normalizeEmbedSettings defaults", () => {
    expect(normalizeEmbedSettings(undefined).enabled).toBe(false);
    expect(normalizeEmbedSettings({ showBranding: false }).showBranding).toBe(
      true,
    );
    expect(resolveInitialImageId(null, [{ id: "x" }])).toBe("x");
  });
});
