/**
 * RC-LP-PRELAUNCH-STRUCTURE-1 — demo project config compartilhada
 */

import { FIVI360_DEMO_PROJECT } from "./demoProject";
import { LANDING_DEMO } from "./landingDemo";

describe("FIVI360_DEMO_PROJECT — RC-LP-PRELAUNCH-STRUCTURE-1", () => {
  it("is the shared source for Home LANDING_DEMO alias", () => {
    expect(LANDING_DEMO).toBe(FIVI360_DEMO_PROJECT);
    expect(FIVI360_DEMO_PROJECT).toHaveProperty("projectId");
    expect(FIVI360_DEMO_PROJECT).toHaveProperty("projectPath");
    expect(FIVI360_DEMO_PROJECT).toHaveProperty("portfolioPath");
  });

  it("does not point demo to commercial embed route", () => {
    expect(FIVI360_DEMO_PROJECT.projectPath).not.toMatch(/^\/embed\//);
  });
});
