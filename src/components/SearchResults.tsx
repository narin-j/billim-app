"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { isFavoriteBook } from "@/lib/favorites";
import { FAVORITES_SAVE_FAILED, SEARCH_FAILED, searchEmpty } from "@/lib/messages";
import type { BookSummary } from "@/lib/types";
import { useFavorites } from "@/lib/useFavorites";
import { PAGE_SIZE, type SearchResponse } from "@/server/searchBooks";

type State =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ok"; total: number; books: BookSummary[]; page: number; more: "idle" | "loading" | "error" };

/** 우리 서버(/api/books)를 부른다. 이미 변환된 앱 내부 타입만 받는다 */
async function fetchPage(keyword: string, page: number) {
  const res = await fetch(`/api/books?${new URLSearchParams({ q: keyword, page: String(page) })}`);
  const body = (await res.json()) as SearchResponse;
  if (!res.ok || "error" in body) throw new Error("search failed");
  return body;
}

export function SearchResults({ keyword }: { keyword: string }) {
  const [state, setState] = useState<State>({ status: "loading" });
  const { favorites, addBook, removeBook } = useFavorites();
  const [saveFailed, setSaveFailed] = useState(false);

  const loadFirst = useCallback(() => {
    let cancelled = false;
    fetchPage(keyword, 1).then(
      ({ total, books, page }) => {
        if (!cancelled) setState({ status: "ok", total, books, page, more: "idle" });
      },
      () => {
        if (!cancelled) setState({ status: "error" });
      },
    );
    return () => {
      cancelled = true;
    };
  }, [keyword]);

  useEffect(loadFirst, [loadFirst]);

  const retry = () => {
    setState({ status: "loading" });
    loadFirst();
  };

  const loadMore = () => {
    if (state.status !== "ok") return;
    const next = state.page + 1;
    setState({ ...state, more: "loading" });
    fetchPage(keyword, next).then(
      ({ books }) =>
        setState((prev) => {
          if (prev.status !== "ok") return prev;
          // 쪽 사이에 같은 책이 다시 나올 수 있다
          const known = new Set(prev.books.map((b) => b.isbn13));
          return { ...prev, page: next, more: "idle", books: [...prev.books, ...books.filter((b) => !known.has(b.isbn13))] };
        }),
      () => setState((prev) => (prev.status === "ok" ? { ...prev, more: "error" } : prev)),
    );
  };

  const toggleFavorite = (book: BookSummary) => {
    const ok = isFavoriteBook(favorites, book.isbn13)
      ? removeBook(book.isbn13)
      : addBook({ isbn13: book.isbn13, title: book.title, author: book.author, coverUrl: book.coverUrl });
    setSaveFailed(!ok);
  };

  if (state.status === "loading") {
    return <p className="p-6 text-center opacity-70">책을 찾고 있어요…</p>;
  }

  if (state.status === "error") {
    return (
      <section className="flex flex-col items-center gap-3 p-6 text-center">
        <p>{SEARCH_FAILED}</p>
        <button type="button" onClick={retry} className="rounded-xl border px-4 py-2 font-semibold">
          다시 시도
        </button>
      </section>
    );
  }

  if (state.books.length === 0) {
    return <p className="p-6 text-center opacity-70">{searchEmpty(keyword)}</p>;
  }

  const hasMore = state.page * PAGE_SIZE < state.total;

  return (
    <>
      <p className="px-4 pt-3 text-sm opacity-70">검색 결과 {state.total.toLocaleString("ko-KR")}권</p>

      {saveFailed && (
        <p role="alert" className="mx-4 mt-3 rounded-lg border px-3 py-2 text-sm">
          {FAVORITES_SAVE_FAILED}
        </p>
      )}

      <ul className="px-4">
        {state.books.map((book) => {
          const favorite = isFavoriteBook(favorites, book.isbn13);
          return (
            <li key={book.isbn13} className="flex items-start gap-3 border-b py-3">
              <Link href={`/books/${book.isbn13}/libraries`} className="flex min-w-0 flex-1 items-start gap-3">
                {book.coverUrl ? (
                  // 표지 주소는 외부 도메인이라 next/image 설정 없이 그대로 쓴다
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={book.coverUrl} alt="" loading="lazy" className="h-[70px] w-[52px] shrink-0 rounded object-cover" />
                ) : (
                  <div aria-hidden className="h-[70px] w-[52px] shrink-0 rounded bg-foreground/10" />
                )}
                <span className="grid min-w-0 gap-1">
                  <span className="font-semibold">{book.title}</span>
                  <span className="text-sm opacity-70">
                    {[book.author, book.publisher, book.year].filter(Boolean).join(" · ")}
                  </span>
                </span>
              </Link>
              <button
                type="button"
                onClick={() => toggleFavorite(book)}
                aria-pressed={favorite}
                aria-label={favorite ? `${book.title} 즐겨찾기에서 빼기` : `${book.title} 즐겨찾기에 넣기`}
                className="px-2 text-xl"
              >
                {favorite ? "★" : "☆"}
              </button>
            </li>
          );
        })}
      </ul>

      {hasMore && (
        <div className="flex flex-col items-center gap-2 p-4">
          {state.more === "error" && <p className="text-sm">{SEARCH_FAILED}</p>}
          <button
            type="button"
            onClick={loadMore}
            disabled={state.more === "loading"}
            className="rounded-xl border px-6 py-2 font-semibold disabled:opacity-50"
          >
            {state.more === "loading" ? "불러오는 중…" : state.more === "error" ? "다시 시도" : "더 보기"}
          </button>
        </div>
      )}
    </>
  );
}
