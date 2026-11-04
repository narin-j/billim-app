"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { FAVORITES_SAVE_FAILED, formatDistance } from "@/lib/messages";
import type { Availability, FavoriteLibrary } from "@/lib/types";
import { AvailabilityStatus } from "./AvailabilityStatus";
import { StarIcon } from "./StarIcon";

type Props = {
  library: FavoriteLibrary;
  /** S4에서 열 때만 있다. 즐겨찾기(S5)에서는 고른 책이 없어 대출 여부를 모른다 */
  status?: { distanceKm: number | null; availability: Availability };
  isFavorite: boolean;
  saveFailed?: boolean;
  onToggleFavorite: () => void;
  onClose: () => void;
};

/** 내려가는 애니메이션(globals.css sheet-out)보다 조금 길게. animationend가 오지 않을 때를 대비한다 */
const CLOSE_FALLBACK_MS = 400;

/**
 * S4-1. 도서관 상세 (아래에서 올라오는 시트).
 * <dialog>의 showModal로 열어서 포커스가 시트 안에 머물고 뒤 화면은 읽히지 않는다.
 * 닫을 때(×, 바깥 누르기, Esc)는 내려가는 애니메이션이 끝난 뒤 onClose를 부른다.
 */
export function LibrarySheet({ library, status, isFavorite, saveFailed = false, onToggleFavorite, onClose }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const done = useRef(false);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    const dialog = ref.current;
    if (dialog && !dialog.open) {
      // showModal이 없는 오래된 브라우저에서는 열어 두기만 한다 (위치는 CSS가 고정)
      if (typeof dialog.showModal === "function") dialog.showModal();
      else dialog.setAttribute("open", "");
    }
    return () => {
      if (dialog?.open) dialog.close();
    };
  }, []);

  const finish = useCallback(() => {
    if (done.current) return;
    done.current = true;
    ref.current?.close();
    onClose();
  }, [onClose]);

  const requestClose = () => {
    if (closing) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) finish();
    else setClosing(true);
  };

  useEffect(() => {
    if (!closing) return;
    const timer = setTimeout(finish, CLOSE_FALLBACK_MS);
    return () => clearTimeout(timer);
  }, [closing, finish]);

  return (
    <dialog
      ref={ref}
      aria-labelledby="library-sheet-title"
      className={`sheet ${closing ? "closing" : ""}`}
      // Esc. 기본 동작(바로 닫기)을 막고 애니메이션으로 닫는다
      onCancel={(e) => {
        e.preventDefault();
        requestClose();
      }}
      // 브라우저가 막을 수 없이 닫은 경우(Esc 연타 등)에도 부모 상태를 맞춘다
      onClose={() => {
        if (!done.current && !ref.current?.open) {
          done.current = true;
          onClose();
        }
      }}
      // 시트 바깥(::backdrop)을 누르면 대상이 dialog 자신이다
      onClick={(e) => {
        if (e.target === e.currentTarget) requestClose();
      }}
      onAnimationEnd={(e) => {
        if (closing && e.target === e.currentTarget) finish();
      }}
    >
      <div className="grid gap-3 px-5 pt-3 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
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
            <StarIcon filled={isFavorite} />
          </button>
          <button type="button" onClick={requestClose} aria-label="닫기" className="icon-btn">
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
          <a href={library.homepage} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
            도서관 홈페이지 열기 ↗
          </a>
        )}
      </div>
    </dialog>
  );
}
