"use client";

import { use, useEffect, useState, type ReactNode } from "react";
import { FAVORITES_SAVE_FAILED } from "@/lib/messages";
import type { FavoriteBook } from "@/lib/types";
import { useFavorites } from "@/lib/useFavorites";
import type { FindBookResponse } from "@/server/findBook";
import { BackButton } from "./BackButton";
import { TitleSkeleton } from "./Skeleton";
import { StarIcon } from "./StarIcon";

type HeaderBarProps = {
  title?: string;
  /** 책 정보를 불러오는 중이면 제목 자리에 회색 틀을 둔다 */
  loading?: boolean;
  children?: ReactNode;
};

/** S4 머리 틀. 책을 불러오는 중에는 회색 틀, 모르면 "주변 도서관"이 보인다 */
export function HeaderBar({ title = "주변 도서관", loading = false, children }: HeaderBarProps) {
  return (
    <header className="flex min-h-[60px] items-center gap-1 px-3 pt-3 pb-1">
      <BackButton />
      <h1 className="min-w-0 flex-1 truncate font-display text-xl">{loading ? <TitleSkeleton /> : title}</h1>
      {children}
    </header>
  );
}

/** 우리 서버(/api/books/{isbn13})를 부른다. 실패하면 null이고 머리는 "주변 도서관"으로 남는다 */
async function fetchBook(isbn13: string): Promise<FavoriteBook | null> {
  const res = await fetch(`/api/books/${isbn13}`);
  const body = (await res.json()) as FindBookResponse;
  if (!res.ok || !("book" in body)) return null;
  const { title, author, coverUrl } = body.book;
  return { isbn13, title, author, coverUrl };
}

/** S4 머리. 책 제목과 책 즐겨찾기 별. 즐겨찾기한 책이면 저장된 정보로 바로 보여 준다 */
export function BookHeader({ params }: { params: Promise<{ isbn13: string }> }) {
  const { isbn13 } = use(params);
  const { favorites, addBook, removeBook } = useFavorites();
  // undefined = 불러오는 중, null = 못 찾음
  const [fetched, setFetched] = useState<FavoriteBook | null | undefined>(undefined);
  const [saveFailed, setSaveFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchBook(isbn13).then(
      (book) => {
        if (!cancelled) setFetched(book);
      },
      () => {
        if (!cancelled) setFetched(null);
      },
    );
    return () => {
      cancelled = true;
    };
  }, [isbn13]);

  const saved = favorites.books.find((b) => b.isbn13 === isbn13);
  const book = saved ?? fetched ?? null;

  return (
    <>
      <HeaderBar title={book?.title} loading={!book && fetched === undefined}>
        {book && (
          <button
            type="button"
            onClick={() => setSaveFailed(!(saved ? removeBook(isbn13) : addBook(book)))}
            aria-pressed={Boolean(saved)}
            aria-label={saved ? `${book.title} 즐겨찾기에서 빼기` : `${book.title} 즐겨찾기에 넣기`}
            className="icon-btn star"
          >
            <StarIcon filled={Boolean(saved)} />
          </button>
        )}
      </HeaderBar>
      {saveFailed && (
        <p role="alert" className="notice mx-4 mt-3">
          {FAVORITES_SAVE_FAILED}
        </p>
      )}
    </>
  );
}
