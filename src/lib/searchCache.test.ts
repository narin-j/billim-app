import { describe, expect, it } from "vitest";
import type { FavoritesStorage } from "./favorites";
import { SEARCH_CACHE_KEY, SEARCH_CACHE_TTL_MS, loadSearch, saveSearch, type SearchSnapshot } from "./searchCache";

/** sessionStorage 대신 쓰는 메모리 저장소 */
function memoryStorage(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial));
  return {
    data,
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => void data.set(key, value),
  };
}

/** 읽기와 쓰기가 모두 오류를 내는 저장소 (프라이빗 모드, 용량 초과) */
const brokenStorage: FavoritesStorage = {
  getItem: () => {
    throw new Error("SecurityError");
  },
  setItem: () => {
    throw new Error("QuotaExceededError");
  },
};

const NOW = 1_800_000_000_000;

const snapshot: SearchSnapshot = {
  total: 929,
  page: 2,
  scrollY: 1840,
  books: [
    { isbn13: "9788972599999", title: "무지개 물고기와 흰수염고래", author: "마르쿠스 피스터", publisher: "시공주니어", year: "1999", coverUrl: null },
    { isbn13: "9791164135752", title: "고래빙수", author: "문채빈", publisher: null, year: null, coverUrl: "https://example.com/c.jpg" },
  ],
};

describe("searchCache", () => {
  it("저장한 검색을 같은 범위·검색어로 읽으면 책, 전체 권수, 쪽 수, 스크롤 위치를 그대로 돌려준다", () => {
    const storage = memoryStorage();
    saveSearch(storage, "title", "고래", snapshot, NOW);
    expect(loadSearch(storage, "title", "고래", NOW + 1000)).toEqual(snapshot);
  });

  it.each([
    ["범위가 다름", "author", "고래"],
    ["검색어가 다름", "title", "고래상어"],
  ] as const)("범위나 검색어가 다르면 null이다 (%s)", (_, scope, keyword) => {
    const storage = memoryStorage();
    saveSearch(storage, "title", "고래", snapshot, NOW);
    expect(loadSearch(storage, scope, keyword, NOW)).toBeNull();
  });

  it("저장한 지 30분이 지났으면 null이다", () => {
    const storage = memoryStorage();
    saveSearch(storage, "title", "고래", snapshot, NOW);
    expect(loadSearch(storage, "title", "고래", NOW + SEARCH_CACHE_TTL_MS - 1)).toEqual(snapshot);
    expect(loadSearch(storage, "title", "고래", NOW + SEARCH_CACHE_TTL_MS + 1)).toBeNull();
  });

  it.each([
    ["JSON이 아님", "{고래"],
    ["객체가 아님", JSON.stringify([1, 2])],
    ["책 목록이 배열이 아님", JSON.stringify({ scope: "title", keyword: "고래", savedAt: NOW, ...snapshot, books: "x" })],
    ["책 모양이 다름", JSON.stringify({ scope: "title", keyword: "고래", savedAt: NOW, ...snapshot, books: [{ isbn13: 1 }] })],
    ["쪽 수가 1보다 작음", JSON.stringify({ scope: "title", keyword: "고래", savedAt: NOW, ...snapshot, page: 0 })],
    ["저장 시각 없음", JSON.stringify({ scope: "title", keyword: "고래", ...snapshot })],
  ])("저장값이 깨졌거나 모양이 다르면 null이다 (%s)", (_, raw) => {
    const storage = memoryStorage({ [SEARCH_CACHE_KEY]: raw });
    expect(loadSearch(storage, "title", "고래", NOW)).toBeNull();
  });

  it("저장소가 없거나 읽기·쓰기에서 오류가 나도 예외를 던지지 않는다", () => {
    expect(() => saveSearch(null, "title", "고래", snapshot, NOW)).not.toThrow();
    expect(loadSearch(null, "title", "고래", NOW)).toBeNull();
    expect(() => saveSearch(brokenStorage, "title", "고래", snapshot, NOW)).not.toThrow();
    expect(loadSearch(brokenStorage, "title", "고래", NOW)).toBeNull();
  });

  it("새 검색을 저장하면 이전 검색을 덮어써서 하나만 남는다", () => {
    const storage = memoryStorage();
    saveSearch(storage, "title", "고래", snapshot, NOW);
    saveSearch(storage, "author", "한강", { ...snapshot, total: 107 }, NOW);

    expect(storage.data.size).toBe(1);
    expect(loadSearch(storage, "title", "고래", NOW)).toBeNull();
    expect(loadSearch(storage, "author", "한강", NOW)).toEqual({ ...snapshot, total: 107 });
  });
});
