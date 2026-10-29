import type { BookSearchPage } from "@/lib/types";
import type { CallResult, Endpoint, FailureReason } from "./data4library/call";
import { toBooks } from "./data4library/toBooks";

export const PAGE_SIZE = 20;

export type SearchDeps = {
  call: (endpoint: Endpoint, params: Record<string, string>) => Promise<CallResult>;
  log: (message: string) => void;
};

export type SearchResponse =
  | (BookSearchPage & { page: number })
  | { error: "emptyQuery" | FailureReason };

/** GET /api/books?q=&page= 의 본체. 검색어는 응답과 로그에 남기지 않는다 */
export async function searchBooks(
  params: URLSearchParams,
  deps: SearchDeps,
): Promise<{ status: number; body: SearchResponse }> {
  const keyword = params.get("q")?.trim() ?? "";
  if (!keyword) return { status: 400, body: { error: "emptyQuery" } };

  const pageParam = params.get("page") ?? "";
  const page = /^\d+$/.test(pageParam) && Number(pageParam) >= 1 ? Number(pageParam) : 1;

  const result = await deps.call("srchBooks", { keyword, pageNo: String(page), pageSize: String(PAGE_SIZE) });
  const converted = result.ok ? toBooks(result.body) : result;
  if (!converted.ok) {
    deps.log(`srchBooks 실패: ${converted.reason}`);
    return { status: 502, body: { error: converted.reason } };
  }

  return { status: 200, body: { page, ...converted.page } };
}
