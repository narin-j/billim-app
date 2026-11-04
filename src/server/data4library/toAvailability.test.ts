import { describe, expect, it } from "vitest";
import { toAvailability } from "./toAvailability";

/** 2026-10-29 bookExist 실제 응답 형태 */
const answer = (result: unknown) => ({
  response: { request: { isbn13: "9788936433598", libCode: "111456", format: "json" }, result },
});

describe("toAvailability", () => {
  it("소장하고 대출 가능하면 available이다 (실제 응답)", () => {
    expect(toAvailability(answer({ hasBook: "Y", loanAvailable: "Y" }))).toBe("available");
  });

  it("소장하지만 대출할 수 없으면 onLoan이다 (실제 응답)", () => {
    expect(toAvailability(answer({ hasBook: "Y", loanAvailable: "N" }))).toBe("onLoan");
  });

  it.each([
    ["소장하지 않음", answer({ hasBook: "N", loanAvailable: "N" })],
    ["result가 없음", { response: {} }],
    ["값이 Y/N이 아님", answer({ hasBook: "Y", loanAvailable: true })],
    ["본문이 null", null],
  ])("그 밖에는 unknown(확인 실패)이다 (%s)", (_, body) => {
    expect(toAvailability(body)).toBe("unknown");
  });
});
