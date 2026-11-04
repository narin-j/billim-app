"use client";

import Link from "next/link";
import { use, useEffect, useState, type ReactNode } from "react";
import { FAVORITES_SAVE_FAILED } from "@/lib/messages";
import type { FavoriteBook } from "@/lib/types";
import { useFavorites } from "@/lib/useFavorites";
import type { FindBookResponse } from "@/server/findBook";
import { StarIcon } from "./StarIcon";

/** S4 머리 틀. 책을 모를 때는 "주변 도서관"만 보인다 */
export function HeaderBar({ title = "주변 도서관", children }: { title?: string; children?: ReactNode }) {
  return (
    <header className="flex items-center gap-1 px-3 pt-3 pb-1">
      <Link href="/" aria-label="뒤로" className="icon-btn">
        ←
      </Link>
      <h1 className="min-w-0 flex-1 truncate font-display text-xl">{title}</h1>
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
  const [fetched, setFetched] = useState<FavoriteBook | null>(null);
  const [saveFailed, setSaveFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchBook(isbn13).then(
      (book) => {
        if (!cancelled) setFetched(book);
      },
      () => {},
    );
    return () => {
      cancelled = true;
    };
  }, [isbn13]);

  const saved = favorites.books.find((b) => b.isbn13 === isbn13);
  const book = saved ?? fetched;

  return (
    <>
      <HeaderBar title={book?.title}>
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
