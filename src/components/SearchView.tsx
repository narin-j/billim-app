"use client";

import Link from "next/link";
import { use } from "react";
import { SearchResults } from "./SearchResults";

/** S2 머리(뒤로, 검색창)와 결과. 키워드가 바뀌면 결과 상태를 새로 시작한다 */
export function SearchView({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const raw = use(searchParams).q;
  const keyword = (Array.isArray(raw) ? raw[0] : raw)?.trim() ?? "";

  return (
    <>
      <header className="flex items-center gap-2 border-b px-4 py-3">
        <Link href="/" aria-label="뒤로" className="px-2 text-lg">
          ←
        </Link>
        <form action="/search" method="get" className="flex min-w-0 flex-1 gap-2">
          <label htmlFor="q" className="sr-only">
            제목 또는 저자
          </label>
          <input
            id="q"
            name="q"
            type="search"
            required
            pattern=".*\S.*"
            defaultValue={keyword}
            key={keyword}
            placeholder="제목 또는 저자"
            className="min-w-0 flex-1 rounded-xl border px-3 py-2"
          />
          <button type="submit" className="rounded-xl border px-3 py-2 font-semibold">
            검색
          </button>
        </form>
      </header>
      <main className="flex flex-1 flex-col">
        {keyword ? (
          <SearchResults key={keyword} keyword={keyword} />
        ) : (
          <p className="p-6 text-center opacity-70">제목이나 저자를 입력해 주세요.</p>
        )}
      </main>
    </>
  );
}
