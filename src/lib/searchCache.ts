import type { FavoritesStorage } from "./favorites";
import type { SearchScope } from "./searchScope";
import type { BookSummary } from "./types";

export const SEARCH_CACHE_KEY = "billim:search:v1";
export const SEARCH_CACHE_TTL_MS = 30 * 60 * 1000;

/** 뒤로 돌아왔을 때 되살릴 S2 상태 */
export type SearchSnapshot = {
  total: number;
  books: BookSummary[];
  /** 지금까지 불러온 쪽 수 (더 보기 포함) */
  page: number;
  scrollY: number;
};

type Stored = SearchSnapshot & { scope: string; keyword: string; savedAt: number };

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);
const isNumber = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);
const isStringOrNull = (v: unknown) => v === null || typeof v === "string";

function isBook(v: unknown): v is BookSummary {
  return (
    isRecord(v) &&
    typeof v.isbn13 === "string" &&
    typeof v.title === "string" &&
    typeof v.author === "string" &&
    isStringOrNull(v.publisher) &&
    isStringOrNull(v.year) &&
    isStringOrNull(v.coverUrl)
  );
}

function isStored(v: unknown): v is Stored {
  return (
    isRecord(v) &&
    typeof v.scope === "string" &&
    typeof v.keyword === "string" &&
    isNumber(v.savedAt) &&
    isNumber(v.total) &&
    v.total >= 0 &&
    Number.isInteger(v.page) &&
    (v.page as number) >= 1 &&
    isNumber(v.scrollY) &&
    v.scrollY >= 0 &&
    Array.isArray(v.books) &&
    v.books.every(isBook)
  );
}

/** 마지막 검색 하나만 저장한다(이전 검색은 덮어쓴다). 저장에 실패해도 조용히 넘어간다 */
export function saveSearch(
  storage: FavoritesStorage,
  scope: SearchScope,
  keyword: string,
  snapshot: SearchSnapshot,
  now: number,
): void {
  const stored: Stored = { scope, keyword, savedAt: now, ...snapshot };
  try {
    storage?.setItem(SEARCH_CACHE_KEY, JSON.stringify(stored));
  } catch {
    // 저장소가 막혀 있거나 꽉 찼으면 되살리기만 못 할 뿐이다
  }
}

/** 같은 범위·검색어로 30분 안에 저장한 상태. 없거나 깨졌으면 null */
export function loadSearch(
  storage: FavoritesStorage,
  scope: SearchScope,
  keyword: string,
  now: number,
): SearchSnapshot | null {
  let parsed: unknown;
  try {
    const raw = storage?.getItem(SEARCH_CACHE_KEY);
    if (!raw) return null;
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!isStored(parsed)) return null;
  if (parsed.scope !== scope || parsed.keyword !== keyword) return null;
  if (now - parsed.savedAt > SEARCH_CACHE_TTL_MS) return null;
  const { total, books, page, scrollY } = parsed;
  return { total, books, page, scrollY };
}
