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
      className={`flex-1 rounded-lg border py-2 ${tab === value ? "bg-foreground text-background" : ""}`}
    >
      {label} ({ready ? count : "…"})
    </button>
  );

  return (
    <>
      <div role="tablist" className="flex gap-2 px-4 pt-3">
        {tabButton("books", "책", favorites.books.length)}
        {tabButton("libraries", "도서관", favorites.libraries.length)}
      </div>

      {saveFailed && (
        <p role="alert" className="mx-4 mt-3 rounded-lg border px-3 py-2 text-sm">
          {FAVORITES_SAVE_FAILED}
        </p>
      )}

      <div className="flex-1 px-4 py-2">
        {!ready ? null : tab === "books" ? (
          favorites.books.length === 0 ? (
            <p className="py-12 text-center opacity-70">{FAVORITES_EMPTY_BOOKS}</p>
          ) : (
            <ul>
              {favorites.books.map((book) => (
                <li key={book.isbn13} className="flex items-start gap-3 border-b py-3">
                  {book.coverUrl ? (
                    // 표지 주소는 외부 도메인이라 next/image 설정 없이 그대로 쓴다
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={book.coverUrl} alt="" className="h-[70px] w-[52px] rounded object-cover" />
                  ) : (
                    <div aria-hidden className="h-[70px] w-[52px] rounded bg-foreground/10" />
                  )}
                  <div className="grid min-w-0 flex-1 justify-items-start gap-1">
                    <span className="font-semibold">{book.title}</span>
                    <span className="text-sm opacity-70">{book.author}</span>
                    <Link href={`/books/${book.isbn13}/libraries`} className="rounded-lg border px-3 py-1 text-sm">
                      주변에서 찾기
                    </Link>
                  </div>
                  <button
                    type="button"
                    onClick={() => save(removeBook(book.isbn13))}
                    aria-label={`${book.title} 즐겨찾기에서 빼기`}
                    className="px-2 text-xl"
                  >
                    ★
                  </button>
                </li>
              ))}
            </ul>
          )
        ) : favorites.libraries.length === 0 ? (
          <p className="py-12 text-center opacity-70">{FAVORITES_EMPTY_LIBRARIES}</p>
        ) : (
          <ul>
            {favorites.libraries.map((library) => (
              <li key={library.libCode} className="flex items-center gap-3 border-b py-3">
                <button type="button" onClick={() => setOpened(library)} className="grid min-w-0 flex-1 text-left">
                  <span className="font-semibold">{library.name}</span>
                  <span className="text-sm opacity-70">
                    {[library.address, library.tel].filter(Boolean).join(" · ") || "주소와 전화 정보 없음"}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => save(removeLibrary(library.libCode))}
                  aria-label={`${library.name} 즐겨찾기에서 빼기`}
                  className="px-2 text-xl"
                >
                  ★
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <p className="px-4 pb-6 text-xs opacity-70">{FAVORITES_DEVICE_ONLY}</p>

      {opened && (
        <LibrarySheet
          library={opened}
          isFavorite={isFavoriteLibrary(favorites, opened.libCode)}
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
