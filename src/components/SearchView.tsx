"use client";

import Link from "next/link";
import { use } from "react";
import { parseSearchScope } from "@/lib/searchScope";
import { SearchResults } from "./SearchResults";
import { SearchScopeOptions } from "./SearchScopeOptions";

const first = (raw: string | string[] | undefined) => (Array.isArray(raw) ? raw[0] : raw);

/** S2 머리(뒤로, 검색창, 범위)와 결과. 키워드나 범위가 바뀌면 결과 상태를 새로 시작한다 */
export function SearchView({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const query = use(searchParams);
  const keyword = first(query.q)?.trim() ?? "";
  const scope = parseSearchScope(first(query.by));

  return (
    <>
      <header className="border-b px-4 py-3">
        <form action="/search" method="get" className="grid gap-2">
          <div className="flex items-center gap-2">
            <Link href="/" aria-label="뒤로" className="px-2 text-lg">
              ←
            </Link>
            <label htmlFor="q" className="sr-only">
              검색어
            </label>
            <input
              id="q"
              name="q"
              type="search"
              required
              pattern=".*\S.*"
              defaultValue={keyword}
              key={keyword}
              placeholder="검색어"
              className="min-w-0 flex-1 rounded-xl border px-3 py-2"
            />
            <button type="submit" className="rounded-xl border px-3 py-2 font-semibold">
              검색
            </button>
          </div>
          {/* S2에서는 범위를 누르면 바로 다시 검색한다. requestSubmit이라 빈 검색어 검사도 거친다 */}
          <div className="pl-9" onChange={(e) => (e.target as HTMLInputElement).form?.requestSubmit()}>
            <SearchScopeOptions key={scope} value={scope} />
          </div>
        </form>
      </header>
      <main className="flex flex-1 flex-col">
        {keyword ? (
          <SearchResults key={`${scope}:${keyword}`} keyword={keyword} scope={scope} />
        ) : (
          <p className="p-6 text-center opacity-70">검색어를 입력해 주세요.</p>
        )}
      </main>
    </>
  );
}
