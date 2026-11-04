"use client";

import { useCallback, useEffect, useState } from "react";
import { availableFirst } from "@/lib/availableFirst";
import { isFavoriteLibrary } from "@/lib/favorites";
import { formatDistance, NEARBY_EMPTY, NEARBY_FAILED } from "@/lib/messages";
import type { FavoriteLibrary, LatLng, NearbyLibrary } from "@/lib/types";
import { useFavorites } from "@/lib/useFavorites";
import type { NearbyResponse } from "@/server/findNearbyLibraries";
import { AvailabilityStatus } from "./AvailabilityStatus";
import { LibrarySheet } from "./LibrarySheet";

type Loaded = Extract<NearbyResponse, { libraries: unknown }>;

type State =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ok"; total: number; libraries: NearbyLibrary[]; page: number; hasMore: boolean; checkedAt: string; more: "idle" | "loading" | "error" };

/** 우리 서버(/api/libraries)를 부른다. 좌표는 주소에 남지 않도록 본문에 담는다 */
async function fetchPage(isbn13: string, me: LatLng, page: number): Promise<Loaded> {
  const res = await fetch("/api/libraries", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ isbn13, lat: me.lat, lng: me.lng, page }),
  });
  const body = (await res.json()) as NearbyResponse;
  if (!res.ok || "error" in body) throw new Error("libraries failed");
  return body;
}

/** 즐겨찾기에는 도서관 정보만 저장한다. 거리와 대출 여부는 그때그때 바뀐다 */
const toFavorite = ({ libCode, name, address, tel, homepage }: NearbyLibrary): FavoriteLibrary => ({
  libCode,
  name,
  address,
  tel,
  homepage,
});

const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", hour12: false });

/** S4. 소장 도서관 거리순 목록. 5곳씩 보여 주고 더 보기로 다음 5곳을 확인한다 */
export function NearbyLibraries({ isbn13, me }: { isbn13: string; me: LatLng }) {
  const [state, setState] = useState<State>({ status: "loading" });
  const { favorites, addLibrary, removeLibrary } = useFavorites();
  const [openedCode, setOpenedCode] = useState<string | null>(null);
  const [saveFailed, setSaveFailed] = useState(false);

  const openSheet = (libCode: string) => {
    setSaveFailed(false);
    setOpenedCode(libCode);
  };
  const closeSheet = useCallback(() => setOpenedCode(null), []);

  const loadFirst = useCallback(() => {
    let cancelled = false;
    fetchPage(isbn13, me, 1).then(
      ({ total, libraries, page, hasMore, checkedAt }) => {
        if (!cancelled) setState({ status: "ok", total, libraries, page, hasMore, checkedAt, more: "idle" });
      },
      () => {
        if (!cancelled) setState({ status: "error" });
      },
    );
    return () => {
      cancelled = true;
    };
  }, [isbn13, me]);

  useEffect(loadFirst, [loadFirst]);

  const retry = () => {
    setState({ status: "loading" });
    loadFirst();
  };

  const loadMore = () => {
    if (state.status !== "ok") return;
    const next = state.page + 1;
    setState({ ...state, more: "loading" });
    fetchPage(isbn13, me, next).then(
      ({ libraries, hasMore, checkedAt, total }) =>
        setState((prev) =>
          prev.status === "ok"
            ? { ...prev, page: next, hasMore, checkedAt, total, more: "idle", libraries: [...prev.libraries, ...libraries] }
            : prev,
        ),
      () => setState((prev) => (prev.status === "ok" ? { ...prev, more: "error" } : prev)),
    );
  };

  if (state.status === "loading") {
    return <p className="p-6 text-center opacity-70">주변 도서관을 확인하고 있어요…</p>;
  }

  if (state.status === "error") {
    return (
      <section className="flex flex-col items-center gap-3 p-6 text-center">
        <p>{NEARBY_FAILED}</p>
        <button type="button" onClick={retry} className="rounded-xl border px-4 py-2 font-semibold">
          다시 시도
        </button>
      </section>
    );
  }

  if (state.libraries.length === 0) {
    return <p className="p-6 text-center opacity-70">{NEARBY_EMPTY}</p>;
  }

  const available = state.libraries.filter((l) => l.availability === "available").length;
  const opened = state.libraries.find((l) => l.libCode === openedCode);
  const openedIsFavorite = opened ? isFavoriteLibrary(favorites, opened.libCode) : false;

  return (
    <>
      <div className="border-b px-4 py-3">
        <p className="font-semibold">
          소장 {state.total.toLocaleString("ko-KR")}곳 · 확인한 {state.libraries.length}곳 중 대출 가능 {available}곳
        </p>
        <p className="text-sm opacity-70">확인 시각 {formatTime(state.checkedAt)}</p>
      </div>

      <ol className="px-4">
        {availableFirst(state.libraries).map((library) => (
          <li key={library.libCode} className="border-b">
            <button
              type="button"
              onClick={() => openSheet(library.libCode)}
              aria-haspopup="dialog"
              className="grid w-full gap-1 py-3 text-left"
            >
              <span className="flex items-baseline gap-2">
                <span className="min-w-0 flex-1 font-semibold">{library.name}</span>
                <span className="shrink-0 text-sm">{formatDistance(library.distanceKm)}</span>
              </span>
              <AvailabilityStatus availability={library.availability} />
            </button>
          </li>
        ))}
      </ol>

      {state.hasMore && (
        <div className="flex flex-col items-center gap-2 p-4">
          {state.more === "error" && <p className="text-sm">{NEARBY_FAILED}</p>}
          <button
            type="button"
            onClick={loadMore}
            disabled={state.more === "loading"}
            className="rounded-xl border px-6 py-2 font-semibold disabled:opacity-50"
          >
            {state.more === "loading" ? "확인하는 중…" : state.more === "error" ? "다시 시도" : "더 보기"}
          </button>
        </div>
      )}

      {opened && (
        <LibrarySheet
          library={toFavorite(opened)}
          status={{ distanceKm: opened.distanceKm, availability: opened.availability }}
          isFavorite={openedIsFavorite}
          saveFailed={saveFailed}
          onToggleFavorite={() =>
            setSaveFailed(!(openedIsFavorite ? removeLibrary(opened.libCode) : addLibrary(toFavorite(opened))))
          }
          onClose={closeSheet}
        />
      )}
    </>
  );
}
