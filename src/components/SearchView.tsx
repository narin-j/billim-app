"use client";

import Link from "next/link";
import { use } from "react";
import { parseSearchScope } from "@/lib/searchScope";
import { BackIcon } from "./BackIcon";
import { SearchResults } from "./SearchResults";

const first = (raw: string | string[] | undefined) => (Array.isArray(raw) ? raw[0] : raw);

/** S2 머리(뒤로, 검색창)와 결과. 범위는 S1에서만 고르고 여기서는 그대로 쓴다. 키워드나 범위가 바뀌면 결과 상태를 새로 시작한다 */
export function SearchView({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const query = use(searchParams);
  const keyword = first(query.q)?.trim() ?? "";
  const scope = parseSearchScope(first(query.by));

  return (
    <>
      <header className="px-3 pt-3 pb-1">
        <form action="/search" method="get">
          {/* 다시 검색해도 지금 범위를 그대로 쓴다 */}
          <input type="hidden" name="by" value={scope} />
          <div className="flex items-center gap-2">
            <Link href="/" aria-label="뒤로" className="icon-btn">
              <BackIcon />
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
              className="field min-w-0 flex-1"
            />
            <button type="submit" className="btn btn-primary">
              검색
            </button>
          </div>
        </form>
      </header>
      <main className="flex flex-1 flex-col">
        {keyword ? (
          <SearchResults key={`${scope}:${keyword}`} keyword={keyword} scope={scope} />
        ) : (
          <p className="p-6 text-center text-muted">검색어를 입력해 주세요.</p>
        )}
      </main>
    </>
  );
}
