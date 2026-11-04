"use client";

import Link from "next/link";
import { useState } from "react";
import { isFavoriteLibrary } from "@/lib/favorites";
import {
  FAVORITES_DEVICE_ONLY,
  FAVORITES_EMPTY_BOOKS,
  FAVORITES_EMPTY_LIBRARIES,
  FAVORITES_SAVE_FAILED,
} from "@/lib/messages";
import type { FavoriteLibrary } from "@/lib/types";
import { useFavorites } from "@/lib/useFavorites";
import { LibrarySheet } from "./LibrarySheet";
import { StarIcon } from "./StarIcon";

type Tab = "books" | "libraries";

/** S5. 즐겨찾기 */
export function FavoritesView() {
  const { ready, favorites, removeBook, addLibrary, removeLibrary } = useFavorites();
  const [tab, setTab] = useState<Tab>("books");
  const [opened, setOpened] = useState<FavoriteLibrary | null>(null);
  const [saveFailed, setSaveFailed] = useState(false);

  const save = (ok: boolean) => setSaveFailed(!ok);

  const tabButton = (value: Tab, label: string, count: number) => (
    <button
      type="button"
      role="tab"
      aria-selected={tab === value}
      onClick={() => setTab(value)}
      className="chip flex-1"
    >
      {label} ({ready ? count : "…"})
    </button>
  );

  return (
    <>
      <div role="tablist" className="flex gap-3 px-4 pt-3">
        {tabButton("books", "책", favorites.books.length)}
        {tabButton("libraries", "도서관", favorites.libraries.length)}
      </div>

      {saveFailed && (
        <p role="alert" className="notice mx-4 mt-3">
          {FAVORITES_SAVE_FAILED}
        </p>
      )}

      <div className="flex-1 px-4 py-3">
        {!ready ? null : tab === "books" ? (
          favorites.books.length === 0 ? (
            <p className="py-12 text-center text-muted">{FAVORITES_EMPTY_BOOKS}</p>
          ) : (
            <ul className="grid gap-3">
              {favorites.books.map((book) => (
                <li key={book.isbn13} className="card flex items-center gap-1 p-1.5">
                  {/* 검색 결과처럼 카드를 누르면 S4로 간다 */}
                  <Link
                    href={`/books/${book.isbn13}/libraries`}
                    className="row-tap flex min-w-0 flex-1 items-start gap-3 rounded-2xl p-1.5"
                  >
                    {book.coverUrl ? (
                      // 표지 주소는 외부 도메인이라 next/image 설정 없이 그대로 쓴다
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={book.coverUrl} alt="" className="h-[70px] w-[52px] shrink-0 rounded-lg object-cover" />
                    ) : (
                      <div aria-hidden className="h-[70px] w-[52px] shrink-0 rounded-lg bg-line" />
                    )}
                    <span className="grid min-w-0 gap-1">
                      <span className="font-semibold">{book.title}</span>
                      <span className="text-sm text-muted">{book.author}</span>
                      <span className="text-sm text-accent">주변 도서관 찾기 ›</span>
                    </span>
                  </Link>
                  <button
                    type="button"
                    onClick={() => save(removeBook(book.isbn13))}
                    aria-label={`${book.title} 즐겨찾기에서 빼기`}
                    className="icon-btn star"
                  >
                    <StarIcon filled />
                  </button>
                </li>
              ))}
            </ul>
          )
        ) : favorites.libraries.length === 0 ? (
          <p className="py-12 text-center text-muted">{FAVORITES_EMPTY_LIBRARIES}</p>
        ) : (
          <ul className="grid gap-3">
            {favorites.libraries.map((library) => (
              <li key={library.libCode} className="card flex items-center gap-1 py-1 pr-2 pl-1">
                <button
                  type="button"
                  onClick={() => setOpened(library)}
                  className="card-tap grid min-w-0 flex-1 rounded-[18px] px-4 py-3 text-left"
                >
                  <span className="font-semibold">{library.name}</span>
                  <span className="text-sm text-muted">
                    {[library.address, library.tel].filter(Boolean).join(" · ") || "주소와 전화 정보 없음"}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => save(removeLibrary(library.libCode))}
                  aria-label={`${library.name} 즐겨찾기에서 빼기`}
                  className="icon-btn star"
                >
                  <StarIcon filled />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <p className="px-4 pb-6 text-xs text-muted">{FAVORITES_DEVICE_ONLY}</p>

      {opened && (
        <LibrarySheet
          library={opened}
          isFavorite={isFavoriteLibrary(favorites, opened.libCode)}
          saveFailed={saveFailed}
          onToggleFavorite={() =>
            save(
              isFavoriteLibrary(favorites, opened.libCode)
                ? removeLibrary(opened.libCode)
                : addLibrary(opened),
            )
          }
          onClose={() => setOpened(null)}
        />
      )}
    </>
  );
}
