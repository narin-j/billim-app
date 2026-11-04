import { describe, expect, it, vi } from "vitest";
import entries from "./libraryDirectory.json";
import { directory } from "./cached";
import { REGION_CODES } from "./regionCodes";

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ cacheLife: () => {} }));

// 갱신 스크립트(npm run update:libraries)가 쓴 파일이 깨지지 않았는지 본다
describe("libraryDirectory.json", () => {
  it("모든 항목의 시도 코드가 정보나루 시도 코드 17개 중 하나다", () => {
    const codes = new Set<string>(REGION_CODES);
    expect(entries.filter((e) => !codes.has(e.region))).toEqual([]);
  });

  it("17개 시도가 모두 한 곳 이상 들어 있다", () => {
    expect(new Set(entries.map((e) => e.region))).toEqual(new Set(REGION_CODES));
  });

  it("좌표가 있으면 한국 범위 안이다", () => {
    const outside = entries.filter(
      ({ location: l }) => l !== null && !(l.lat >= 33 && l.lat <= 39 && l.lng >= 124 && l.lng <= 132),
    );
    expect(outside).toEqual([]);
  });

  it("1,000곳 이상이다", () => {
    expect(entries.length).toBeGreaterThanOrEqual(1000);
  });
});

describe("directory", () => {
  it("파일 내용을 그대로 돌려준다", async () => {
    expect(await directory()).toEqual({ ok: true, value: entries });
  });
});
