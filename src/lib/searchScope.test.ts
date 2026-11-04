import { describe, expect, it } from "vitest";
import { parseSearchScope } from "./searchScope";

describe("parseSearchScope", () => {
  it.each(["title", "author", "publisher"] as const)("알려진 범위는 그대로 받는다 (%s)", (scope) => {
    expect(parseSearchScope(scope)).toBe(scope);
  });

  it.each([
    ["없음", null],
    ["undefined", undefined],
    ["빈 문자열", ""],
    ["쓰지 않는 keyword", "keyword"],
    ["예전 전체", "all"],
    ["대문자", "AUTHOR"],
    ["모르는 값", "isbn"],
  ])("모르는 값은 제목으로 본다 (%s)", (_, raw) => {
    expect(parseSearchScope(raw)).toBe("title");
  });
});
