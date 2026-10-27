import { describe, expect, it } from "vitest";
import { readError } from "./readError";

describe("readError", () => {
  it("키 미활성 응답(2026-10-27 실제 응답)이면 auth 실패다", () => {
    const body = { response: { errCode: "vitalizationErr", error: "API 활성화 상태가아닙니다." } };
    expect(readError(body)).toEqual({ reason: "auth", code: "vitalizationErr" });
  });

  it("다른 errCode면 upstream 실패이고 코드를 남긴다", () => {
    const body = { response: { errCode: "someOtherErr", error: "알 수 없는 오류" } };
    expect(readError(body)).toEqual({ reason: "upstream", code: "someOtherErr" });
  });

  it("response.error가 없으면 오류가 없다", () => {
    expect(readError({ response: { docs: [] } })).toBeNull();
  });

  it.each([
    ["response가 없음", {}],
    ["response가 객체가 아님", { response: "x" }],
    ["본문이 null", null],
    ["본문이 배열", []],
  ])("%s이면 format 실패다", (_, body) => {
    expect(readError(body)).toEqual({ reason: "format" });
  });
});
