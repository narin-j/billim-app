/** 책 검색 범위. 값이 정보나루 srchBooks 파라미터 이름과 같다 (docs/spec.md 8장, 9장 2026-11-04) */
export const SEARCH_SCOPES = ["title", "author", "publisher"] as const;

export type SearchScope = (typeof SEARCH_SCOPES)[number];

export const DEFAULT_SEARCH_SCOPE: SearchScope = "title";

export const SEARCH_SCOPE_LABEL: Record<SearchScope, string> = {
  title: "제목",
  author: "저자",
  publisher: "출판사",
};

/** 주소의 by 값을 범위로 바꾼다. 없거나 모르는 값이면 제목이다 */
export function parseSearchScope(raw: string | null | undefined): SearchScope {
  return SEARCH_SCOPES.find((scope) => scope === raw) ?? DEFAULT_SEARCH_SCOPE;
}
