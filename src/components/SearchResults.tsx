"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { getSessionStorage } from "@/lib/browserStorage";
import { isFavoriteBook } from "@/lib/favorites";
import { FAVORITES_SAVE_FAILED, SEARCH_FAILED, searchCount, searchEmpty } from "@/lib/messages";
import { loadSearch, saveSearch } from "@/lib/searchCache";
import type { SearchScope } from "@/lib/searchScope";
import type { BookSummary } from "@/lib/types";
import { useFavorites } from "@/lib/useFavorites";
import { PAGE_SIZE, type SearchResponse } from "@/server/searchBooks";
import { BookListSkeleton } from "./Skeleton";
import { StarIcon } from "./StarIcon";

type State =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ok"; total: number; books: BookSummary[]; page: number; more: "idle" | "loading" | "error" };

/** 우리 서버(/api/books)를 부른다. 이미 변환된 앱 내부 타입만 받는다 */
async function fetchPage(keyword: string, scope: SearchScope, page: number) {
  const res = await fetch(`/api/books?${new URLSearchParams({ q: keyword, by: scope, page: String(page) })}`);
  const body = (await res.json()) as SearchResponse;
  if (!res.ok || "error" in body) throw new Error("search failed");
  return body;
}

export function SearchResults({ keyword, scope }: { keyword: string; scope: SearchScope }) {
  const [state, setState] = useState<State>({ status: "loading" });
  const { favorites, addBook, removeBook } = useFavorites();
  const [saveFailed, setSaveFailed] = useState(false);

  // 되살린 목록을 그린 뒤 옮겨 갈 스크롤 위치
  const restoreScroll = useRef<number | null>(null);

  const loadFirst = useCallback(() => {
    let cancelled = false;
    // 책을 골랐다 돌아온 경우: 저장해 둔 목록이 있으면 정보나루를 다시 부르지 않는다
    const cached = loadSearch(getSessionStorage(), scope, keyword, Date.now());
    if (cached) {
      restoreScroll.current = cached.scrollY;
      // 효과 안에서 바로 상태를 바꾸지 않도록 한 박자 늦춘다. 실패할 일이 없어 결과는 기다리지 않는다
      void Promise.resolve().then(() => {
        if (!cancelled) setState({ status: "ok", total: cached.total, books: cached.books, page: cached.page, more: "idle" });
      });
      return () => {
        cancelled = true;
      };
    }
    fetchPage(keyword, scope, 1).then(
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
  }, [keyword, scope]);

  useEffect(loadFirst, [loadFirst]);

  // 목록이 바뀌면(첫 쪽, 더 보기) 지금 스크롤 위치와 함께 저장한다
  const okState = state.status === "ok" ? state : null;
  const save = useCallback(() => {
    if (!okState) return;
    const { total, books, page } = okState;
    saveSearch(getSessionStorage(), scope, keyword, { total, books, page, scrollY: window.scrollY }, Date.now());
  }, [okState, scope, keyword]);

  useEffect(() => {
    if (okState?.more === "idle") save();
  }, [okState, save]);

  useEffect(() => {
    if (!okState || restoreScroll.current === null) return;
    const y = restoreScroll.current;
    restoreScroll.current = null;
    requestAnimationFrame(() => window.scrollTo(0, y));
  }, [okState]);

  const retry = () => {
    setState({ status: "loading" });
    loadFirst();
  };

  const loadMore = () => {
    if (state.status !== "ok") return;
    const next = state.page + 1;
    setState({ ...state, more: "loading" });
    fetchPage(keyword, scope, next).then(
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
    return <BookListSkeleton label="책을 찾고 있어요…" />;
  }

  if (state.status === "error") {
    return (
      <section className="flex flex-col items-center gap-3 p-6 text-center">
        <p>{SEARCH_FAILED}</p>
        <button type="button" onClick={retry} className="btn btn-primary">
          다시 시도
        </button>
      </section>
    );
  }

  if (state.books.length === 0) {
    return <p className="p-6 text-center text-muted">{searchEmpty(keyword, scope)}</p>;
  }

  const hasMore = state.page * PAGE_SIZE < state.total;

  return (
    <>
      <p className="px-4 pt-3 text-sm text-muted">{searchCount(scope, state.total)}</p>

      {saveFailed && (
        <p role="alert" className="notice mx-4 mt-3">
          {FAVORITES_SAVE_FAILED}
        </p>
      )}

      <ul className="grid gap-3 px-4 py-3">
        {state.books.map((book) => {
          const favorite = isFavoriteBook(favorites, book.isbn13);
          return (
            <li key={book.isbn13} className="card flex items-start gap-1 p-3">
              <Link
                href={`/books/${book.isbn13}/libraries`}
                // 화면을 옮기기 전에 지금 스크롤 위치를 저장해 둔다 (뒤로 오면 되살린다)
                onClick={save}
                className="flex min-w-0 flex-1 items-start gap-3 rounded-2xl"
              >
                {book.coverUrl ? (
                  // 표지 주소는 외부 도메인이라 next/image 설정 없이 그대로 쓴다
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={book.coverUrl} alt="" loading="lazy" className="h-[70px] w-[52px] shrink-0 rounded-lg object-cover" />
                ) : (
                  <div aria-hidden className="h-[70px] w-[52px] shrink-0 rounded-lg bg-line" />
                )}
                <span className="grid min-w-0 gap-1">
                  <span className="font-semibold">{book.title}</span>
                  <span className="text-sm text-muted">
                    {[book.author, book.publisher, book.year].filter(Boolean).join(" · ")}
                  </span>
                </span>
              </Link>
              <button
                type="button"
                onClick={() => toggleFavorite(book)}
                aria-pressed={favorite}
                aria-label={favorite ? `${book.title} 즐겨찾기에서 빼기` : `${book.title} 즐겨찾기에 넣기`}
                className="icon-btn star"
              >
                <StarIcon filled={favorite} />
              </button>
            </li>
          );
        })}
      </ul>

      {hasMore && (
        <div className="flex flex-col items-center gap-2 px-4 pt-1 pb-6">
          {state.more === "error" && <p className="text-sm">{SEARCH_FAILED}</p>}
          <button
            type="button"
            onClick={loadMore}
            disabled={state.more === "loading"}
            className="btn px-8"
          >
            {state.more === "loading" ? "불러오는 중…" : state.more === "error" ? "다시 시도" : "더 보기"}
          </button>
        </div>
      )}
    </>
  );
}
