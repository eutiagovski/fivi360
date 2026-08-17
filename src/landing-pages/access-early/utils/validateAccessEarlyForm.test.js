/**
 * RC-LP-PRELAUNCH-FORM-1 — validateAccessEarlyForm
 */

import { validateAccessEarlyForm } from "./validateAccessEarlyForm";

function base(overrides = {}) {
  return {
    name: "Ana",
    email: "ana@example.com",
    phone: "(21) 99999-9999",
    professionId: "arquiteto",
    professionOther: "",
    ...overrides,
  };
}

describe("validateAccessEarlyForm — RC-LP-PRELAUNCH-FORM-1", () => {
  it("accepts a valid payload and maps profession label", () => {
    const result = validateAccessEarlyForm(base());
    expect(result.valid).toBe(true);
    expect(result.profession).toBe("Arquiteto(a)");
  });

  it("requires name", () => {
    expect(validateAccessEarlyForm(base({ name: "  " })).errors.name).toBeTruthy();
  });

  it("requires email", () => {
    expect(validateAccessEarlyForm(base({ email: "" })).errors.email).toBeTruthy();
  });

  it("rejects invalid email", () => {
    expect(
      validateAccessEarlyForm(base({ email: "nao-email" })).errors.email,
    ).toBeTruthy();
  });

  it("requires phone", () => {
    expect(validateAccessEarlyForm(base({ phone: "" })).errors.phone).toBeTruthy();
  });

  it("rejects implausible phone", () => {
    expect(
      validateAccessEarlyForm(base({ phone: "123" })).errors.phone,
    ).toBeTruthy();
  });

  it("requires profession", () => {
    expect(
      validateAccessEarlyForm(base({ professionId: "" })).errors.professionId,
    ).toBeTruthy();
  });

  it("requires complementary text for Outro", () => {
    const result = validateAccessEarlyForm(
      base({ professionId: "outro", professionOther: "" }),
    );
    expect(result.errors.professionOther).toBeTruthy();
  });

  it("uses complementary text as profession for Outro", () => {
    const result = validateAccessEarlyForm(
      base({ professionId: "outro", professionOther: "Fotógrafo" }),
    );
    expect(result.valid).toBe(true);
    expect(result.profession).toBe("Fotógrafo");
  });

  it("maps estudante to the architecture/design student label", () => {
    const result = validateAccessEarlyForm(base({ professionId: "estudante" }));
    expect(result.valid).toBe(true);
    expect(result.profession).toBe(
      "Estudante de Arquitetura, Design ou curso superior relacionado",
    );
  });
});
