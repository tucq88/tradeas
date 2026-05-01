import { describe, expect, it } from "vitest";
import { fmtNum, fmtPct, fmtSigned, fmtUSD } from "@/lib/format";

const MINUS = "−";

describe("fmtUSD", () => {
  it("formats positive", () => {
    expect(fmtUSD(1234.5)).toBe("$1,234.50");
  });
  it("formats negative with U+2212", () => {
    expect(fmtUSD(-1234.5)).toBe(`${MINUS}$1,234.50`);
  });
  it("formats zero", () => {
    expect(fmtUSD(0)).toBe("$0.00");
  });
  it("formats large", () => {
    expect(fmtUSD(1_000_000)).toBe("$1,000,000.00");
  });
  it("respects dp", () => {
    expect(fmtUSD(1.123456, 4)).toBe("$1.1235");
  });
});

describe("fmtNum", () => {
  it("formats positive", () => {
    expect(fmtNum(1234.5)).toBe("1,234.50");
  });
  it("formats negative with U+2212", () => {
    expect(fmtNum(-0.5)).toBe(`${MINUS}0.50`);
  });
  it("formats zero", () => {
    expect(fmtNum(0)).toBe("0.00");
  });
  it("formats fractional with dp", () => {
    expect(fmtNum(0.0001234, 6)).toBe("0.000123");
  });
});

describe("fmtPct", () => {
  it("formats positive with +", () => {
    expect(fmtPct(4.2)).toBe("+4.20%");
  });
  it("formats negative with U+2212", () => {
    expect(fmtPct(-4.2)).toBe(`${MINUS}4.20%`);
  });
  it("formats zero with +", () => {
    expect(fmtPct(0)).toBe("+0.00%");
  });
  it("respects dp", () => {
    expect(fmtPct(1.5, 1)).toBe("+1.5%");
  });
});

describe("fmtSigned", () => {
  it("formats positive with +$", () => {
    expect(fmtSigned(1234.5)).toBe("+$1,234.50");
  });
  it("formats negative with U+2212 and $", () => {
    expect(fmtSigned(-1234.5)).toBe(`${MINUS}$1,234.50`);
  });
  it("formats zero with +$", () => {
    expect(fmtSigned(0)).toBe("+$0.00");
  });
  it("formats fractional", () => {
    expect(fmtSigned(0.01)).toBe("+$0.01");
  });
});
