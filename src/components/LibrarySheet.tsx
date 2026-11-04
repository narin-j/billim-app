"use client";

import { useEffect } from "react";
import { FAVORITES_SAVE_FAILED, formatDistance } from "@/lib/messages";
import type { Availability, FavoriteLibrary } from "@/lib/types";
import { AvailabilityStatus } from "./AvailabilityStatus";

type Props = {
  library: FavoriteLibrary;
  /** S4에서 열 때만 있다. 즐겨찾기(S5)에서는 고른 책이 없어 대출 여부를 모른다 */
  status?: { distanceKm: number | null; availability: Availability };
  isFavorite: boolean;
  saveFailed?: boolean;
  onToggleFavorite: () => void;
  onClose: () => void;
};

/** S4-1. 도서관 상세 (아래에서 올라오는 시트) */
export function LibrarySheet({ library, status, isFavorite, saveFailed = false, onToggleFavorite, onClose }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 flex items-end justify-center bg-[rgb(40_28_18/0.45)]" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="library-sheet-title"
        className="grid w-full max-w-md gap-3 rounded-t-[28px] bg-surface px-5 pt-3 pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-[0_-10px_24px_-12px_rgb(60_40_20/0.45)]"
        onClick={(e) => e.stopPropagation()}
      >
        <span aria-hidden className="h-1.5 w-10 justify-self-center rounded-full bg-line" />
        <div className="flex items-center gap-1">
          <h2 id="library-sheet-title" className="min-w-0 flex-1 font-display text-xl">
            {library.name}
          </h2>
          {status && <span className="shrink-0 text-sm text-muted tabular-nums">{formatDistance(status.distanceKm)}</span>}
          <button
            type="button"
            onClick={onToggleFavorite}
            aria-pressed={isFavorite}
            aria-label={isFavorite ? "즐겨찾기에서 빼기" : "즐겨찾기에 넣기"}
            className="icon-btn star"
          >
            {isFavorite ? "★" : "☆"}
          </button>
          <button type="button" onClick={onClose} aria-label="닫기" className="icon-btn">
            ×
          </button>
        </div>
        {status ? (
          <AvailabilityStatus availability={status.availability} />
        ) : (
          <p className="text-sm text-muted">대출 가능 여부는 책을 고른 뒤 주변 도서관 목록에서 확인해요.</p>
        )}
        {saveFailed && (
          <p role="alert" className="notice">
            {FAVORITES_SAVE_FAILED}
          </p>
        )}
        <hr className="border-0 border-t-2 border-dashed border-line" />
        <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
          <dt className="text-muted">주소</dt>
          <dd>{library.address ?? "정보 없음"}</dd>
          <dt className="text-muted">전화</dt>
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
            className="btn btn-primary"
          >
            도서관 홈페이지 열기 ↗
          </a>
        )}
      </div>
    </div>
  );
}
