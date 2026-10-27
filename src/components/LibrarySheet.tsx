"use client";

import { useEffect } from "react";
import type { FavoriteLibrary } from "@/lib/types";

type Props = {
  library: FavoriteLibrary;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onClose: () => void;
};

/** S4-1. 도서관 상세 (아래에서 올라오는 시트). 즐겨찾기에서 열 때는 대출 여부 없이 보여 준다 */
export function LibrarySheet({ library, isFavorite, onToggleFavorite, onClose }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 flex items-end justify-center bg-black/40" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="library-sheet-title"
        className="grid w-full max-w-md gap-3 rounded-t-2xl bg-background p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2">
          <h2 id="library-sheet-title" className="flex-1 text-lg font-semibold">
            {library.name}
          </h2>
          <button
            type="button"
            onClick={onToggleFavorite}
            aria-pressed={isFavorite}
            aria-label={isFavorite ? "즐겨찾기에서 빼기" : "즐겨찾기에 넣기"}
            className="px-2 text-xl"
          >
            {isFavorite ? "★" : "☆"}
          </button>
          <button type="button" onClick={onClose} aria-label="닫기" className="px-2 text-xl">
            ×
          </button>
        </div>
        <p className="text-sm opacity-70">대출 가능 여부는 책을 고른 뒤 주변 도서관 목록에서 확인해요.</p>
        <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
          <dt className="opacity-70">주소</dt>
          <dd>{library.address ?? "정보 없음"}</dd>
          <dt className="opacity-70">전화</dt>
          <dd>
            {library.tel ? (
              <a href={`tel:${library.tel}`} className="underline">
                {library.tel}
              </a>
            ) : (
              "정보 없음"
            )}
          </dd>
        </dl>
        {library.homepage && (
          <a
            href={library.homepage}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-xl border px-4 py-3 text-center font-semibold"
          >
            도서관 홈페이지 열기 ↗
          </a>
        )}
      </div>
    </div>
  );
}
