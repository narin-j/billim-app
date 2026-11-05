"use client";

import { use, useCallback, useEffect, useState } from "react";
import { requestLocation, type LocationResult } from "@/lib/location";
import { LOCATION_FAILURE, LOCATION_NEEDED } from "@/lib/messages";
import type { Area } from "@/lib/types";
import { AreaPicker, areaLabel } from "./AreaPicker";
import { BackButton } from "./BackButton";
import { NearbyLibraries } from "./NearbyLibraries";
import { LibraryListSkeleton } from "./Skeleton";

type State = { status: "loading" } | LocationResult | { status: "area"; area: Area };

const ask = () =>
  requestLocation(typeof navigator === "undefined" ? undefined : navigator.geolocation);

/**
 * 위치를 요청하고, 성공하면 S4(거리순 목록)를, 실패하면 S3(위치 안내)를 보여 준다.
 * 위치 대신 동네를 고르면 그 동네의 대표 지점으로 S4를 보여 준다.
 * 좌표는 이 컴포넌트의 상태에만 두고 저장하거나 주소에 넣지 않는다.
 */
export function LocationGate({ params }: { params: Promise<{ isbn13: string }> }) {
  const { isbn13 } = use(params);
  const [state, setState] = useState<State>({ status: "loading" });
  const [picking, setPicking] = useState(false);

  useEffect(() => {
    ask().then(setState);
  }, []);

  const retry = useCallback(() => {
    setPicking(false);
    setState({ status: "loading" });
    ask().then(setState);
  }, []);

  const pick = (area: Area) => {
    setPicking(false);
    setState({ status: "area", area });
  };

  if (state.status === "loading") {
    return <LibraryListSkeleton label="내 위치를 확인하고 있어요…" />;
  }

  if (state.status === "ok" || state.status === "area") {
    const origin = state.status === "ok" ? state.location : state.area.center;
    return (
      <>
        <div className="flex items-center gap-2 px-5 pt-3">
          <p className="min-w-0 flex-1 text-sm text-muted">
            기준{" "}
            <strong className="font-semibold text-foreground">
              {state.status === "ok" ? "내 위치" : areaLabel(state.area)}
            </strong>
          </p>
          {state.status === "area" && (
            <button type="button" onClick={retry} className="chip shrink-0 text-sm">
              내 위치로
            </button>
          )}
          <button
            type="button"
            onClick={() => setPicking((p) => !p)}
            aria-expanded={picking}
            className="chip shrink-0 text-sm"
          >
            {picking ? "닫기" : "동네 바꾸기"}
          </button>
        </div>
        {picking && (
          <div className="px-4 pt-3">
            <AreaPicker onPick={pick} onCancel={() => setPicking(false)} />
          </div>
        )}
        {/* 기준이 바뀌면 이전 목록을 남기지 않고 처음부터 불러온다 */}
        <NearbyLibraries key={`${origin.lat},${origin.lng}`} isbn13={isbn13} me={origin} />
      </>
    );
  }

  // S3. 위치 안내
  if (picking) {
    return (
      <section className="px-4 py-6">
        <AreaPicker onPick={pick} onCancel={() => setPicking(false)} />
      </section>
    );
  }

  return (
    <section className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
      <span aria-hidden className="text-3xl">
        📍
      </span>
      <p className="font-display text-lg">{LOCATION_NEEDED}</p>
      <p className="text-muted">{LOCATION_FAILURE[state.status]}</p>
      {state.status === "unsupported" ? (
        <BackButton className="btn">뒤로 가기</BackButton>
      ) : (
        <button type="button" onClick={retry} className="btn btn-primary">
          다시 시도
        </button>
      )}
      <button type="button" onClick={() => setPicking(true)} className="btn">
        동네 골라서 찾기
      </button>
    </section>
  );
}
