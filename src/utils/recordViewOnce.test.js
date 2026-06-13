import {
  resetRecordedViews,
  shouldRecordViewOnce,
} from "@/utils/recordViewOnce";

describe("shouldRecordViewOnce", () => {
  beforeEach(() => {
    resetRecordedViews();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("permite o primeiro registro de uma chave", () => {
    expect(shouldRecordViewOnce("portfolio:abc")).toBe(true);
  });

  it("bloqueia registro duplicado na janela de deduplicação", () => {
    expect(shouldRecordViewOnce("portfolio:abc")).toBe(true);
    expect(shouldRecordViewOnce("portfolio:abc")).toBe(false);
  });

  it("permite novo registro após a janela de deduplicação", () => {
    expect(shouldRecordViewOnce("portfolio:abc")).toBe(true);
    jest.advanceTimersByTime(3001);
    expect(shouldRecordViewOnce("portfolio:abc")).toBe(true);
  });

  it("trata chaves diferentes de forma independente", () => {
    expect(shouldRecordViewOnce("portfolio:abc")).toBe(true);
    expect(shouldRecordViewOnce("portfolio:xyz")).toBe(true);
  });
});
