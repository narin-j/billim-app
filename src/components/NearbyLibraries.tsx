"use client";

import { useCallback, useEffect, useState } from "react";
import { availableFirst } from "@/lib/availableFirst";
import { AVAILABILITY_LABEL, NEARBY_EMPTY, NEARBY_FAILED } from "@/lib/messages";
import type { Availability, LatLng, NearbyLibrary } from "@/lib/types";
import type { NearbyResponse } from "@/server/findNearbyLibraries";

type Loaded = Extract<NearbyResponse, { libraries: unknown }>;

type State =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ok"; total: number; libraries: NearbyLibrary[]; page: number; hasMore: boolean; checkedAt: string; more: "idle" | "loading" | "error" };

const DOT: Record<Availability, string> = {
  available: "bg-green-600",
  onLoan: "bg-gray-400",
  unknown: "bg-yellow-400",
};

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

const formatDistance = (km: number | null) => (km === null ? "거리 알 수 없음" : `${km.toFixed(1)}km`);

const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", hour12: false });

/** S4. 소장 도서관 거리순 목록. 5곳씩 보여 주고 더 보기로 다음 5곳을 확인한다 */
export function NearbyLibraries({ isbn13, me }: { isbn13: string; me: LatLng }) {
  const [state, setState] = useState<State>({ status: "loading" });

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
          <li key={library.libCode} className="grid gap-1 border-b py-3">
            <div className="flex items-baseline gap-2">
              <span className="min-w-0 flex-1 font-semibold">{library.name}</span>
              <span className="shrink-0 text-sm">{formatDistance(library.distanceKm)}</span>
            </div>
            <span className="flex items-center gap-2 text-sm">
              <span aria-hidden className={`inline-block h-2.5 w-2.5 rounded-full ${DOT[library.availability]}`} />
              {AVAILABILITY_LABEL[library.availability]}
            </span>
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
    </>
  );
}
