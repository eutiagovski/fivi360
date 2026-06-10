import {
  buildPortfolioImageUrl,
  buildPortfolioProjectUrl,
  buildShareImageUrl,
  buildShareProjectUrl,
  buildShareStandaloneImageUrl,
  canAccessPortfolioImage,
  canAccessPortfolioProject,
  canAccessSharedProject,
  canAccessSharedProjectImage,
  canAccessStandaloneImage,
  resolveLegacyShareImageRedirectPath,
} from "./publicAccess";

const ownerUserId = "user-1";
const otherUserId = "user-2";

const publicProject = {
  id: "project-1",
  userId: ownerUserId,
  visibility: "public",
};

const sharedProject = {
  id: "project-2",
  userId: ownerUserId,
  visibility: "shared",
};

const privateProject = {
  id: "project-3",
  userId: ownerUserId,
  visibility: "private",
};

const foreignProject = {
  id: "project-4",
  userId: otherUserId,
  visibility: "public",
};

describe("canAccessPortfolioProject", () => {
  it("allows public project owned by portfolio user", () => {
    expect(canAccessPortfolioProject(publicProject, ownerUserId)).toBe(true);
  });

  it("blocks shared and private projects", () => {
    expect(canAccessPortfolioProject(sharedProject, ownerUserId)).toBe(false);
    expect(canAccessPortfolioProject(privateProject, ownerUserId)).toBe(false);
  });

  it("blocks project from another user", () => {
    expect(canAccessPortfolioProject(foreignProject, ownerUserId)).toBe(false);
  });
});

describe("canAccessPortfolioImage", () => {
  it("allows image from public portfolio project", () => {
    const image = {
      id: "image-1",
      projectId: publicProject.id,
      visibility: "private",
    };

    expect(canAccessPortfolioImage(image, publicProject, ownerUserId)).toBe(
      true,
    );
  });

  it("blocks image when projectId does not match", () => {
    const image = {
      id: "image-1",
      projectId: "other-project",
      visibility: "private",
    };

    expect(canAccessPortfolioImage(image, publicProject, ownerUserId)).toBe(
      false,
    );
  });
});

describe("canAccessSharedProject", () => {
  it("allows shared and public projects", () => {
    expect(canAccessSharedProject(sharedProject)).toBe(true);
    expect(canAccessSharedProject(publicProject)).toBe(true);
  });

  it("blocks private projects", () => {
    expect(canAccessSharedProject(privateProject)).toBe(false);
  });
});

describe("canAccessSharedProjectImage", () => {
  it("allows image when image is shared", () => {
    const image = {
      id: "image-1",
      projectId: sharedProject.id,
      visibility: "shared",
    };

    expect(canAccessSharedProjectImage(image, sharedProject)).toBe(true);
  });

  it("allows private image when project is shared or public", () => {
    const sharedImage = {
      id: "image-2",
      projectId: sharedProject.id,
      visibility: "private",
    };

    const publicImage = {
      id: "image-3",
      projectId: publicProject.id,
      visibility: "private",
    };

    expect(canAccessSharedProjectImage(sharedImage, sharedProject)).toBe(true);
    expect(canAccessSharedProjectImage(publicImage, publicProject)).toBe(true);
  });

  it("blocks image from another project", () => {
    const image = {
      id: "image-3",
      projectId: "other-project",
      visibility: "shared",
    };

    expect(canAccessSharedProjectImage(image, sharedProject)).toBe(false);
  });
});

describe("canAccessStandaloneImage", () => {
  it("allows loose shared image", () => {
    expect(
      canAccessStandaloneImage({
        id: "image-1",
        projectId: null,
        visibility: "shared",
      }),
    ).toBe(true);
  });

  it("blocks image with projectId", () => {
    expect(
      canAccessStandaloneImage({
        id: "image-2",
        projectId: "project-1",
        visibility: "shared",
      }),
    ).toBe(false);
  });

  it("blocks private loose image", () => {
    expect(
      canAccessStandaloneImage({
        id: "image-3",
        projectId: null,
        visibility: "private",
      }),
    ).toBe(false);
  });
});

describe("URL builders", () => {
  it("builds share project url", () => {
    expect(buildShareProjectUrl("project-1")).toMatch(
      /\/share\/project\/project-1$/,
    );
  });

  it("builds share image url for project and standalone images", () => {
    expect(
      buildShareImageUrl({ id: "image-1", projectId: "project-1" }),
    ).toMatch(/\/share\/project\/project-1\/image\/image-1$/);

    expect(buildShareImageUrl({ id: "image-2", projectId: null })).toMatch(
      /\/share\/standalone\/image-2$/,
    );
  });

  it("builds portfolio urls", () => {
    expect(buildPortfolioProjectUrl("escritorio", "project-1")).toMatch(
      /\/u\/escritorio\/project\/project-1$/,
    );

    expect(
      buildPortfolioImageUrl("escritorio", "project-1", "image-1"),
    ).toMatch(/\/u\/escritorio\/project\/project-1\/image\/image-1$/);
  });

  it("builds standalone share url", () => {
    expect(buildShareStandaloneImageUrl("image-1")).toMatch(
      /\/share\/standalone\/image-1$/,
    );
  });
});

describe("resolveLegacyShareImageRedirectPath", () => {
  it("redirects project image to shared project image route", () => {
    expect(
      resolveLegacyShareImageRedirectPath({
        id: "image-1",
        projectId: "project-1",
      }),
    ).toBe("/share/project/project-1/image/image-1");
  });

  it("redirects loose image to standalone route", () => {
    expect(
      resolveLegacyShareImageRedirectPath({
        id: "image-2",
        projectId: null,
      }),
    ).toBe("/share/standalone/image-2");
  });

  it("returns null when image is missing", () => {
    expect(resolveLegacyShareImageRedirectPath(null)).toBeNull();
  });
});
