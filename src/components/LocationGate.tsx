"use client";

import { use, useCallback, useEffect, useState } from "react";
import { requestLocation, type LocationResult } from "@/lib/location";
import { LOCATION_FAILURE, LOCATION_NEEDED } from "@/lib/messages";
import { BackButton } from "./BackButton";
import { NearbyLibraries } from "./NearbyLibraries";
import { LibraryListSkeleton } from "./Skeleton";

type State = { status: "loading" } | LocationResult;

const ask = () =>
  requestLocation(typeof navigator === "undefined" ? undefined : navigator.geolocation);

/**
 * 위치를 요청하고, 성공하면 S4(거리순 목록)를, 실패하면 S3(위치 안내)를 보여 준다.
 * 좌표는 이 컴포넌트의 상태에만 두고 저장하거나 주소에 넣지 않는다.
 */
export function LocationGate({ params }: { params: Promise<{ isbn13: string }> }) {
  const { isbn13 } = use(params);
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    ask().then(setState);
  }, []);

  const retry = useCallback(() => {
    setState({ status: "loading" });
    ask().then(setState);
  }, []);

  if (state.status === "loading") {
    return <LibraryListSkeleton label="내 위치를 확인하고 있어요…" />;
  }

  if (state.status === "ok") {
    return <NearbyLibraries isbn13={isbn13} me={state.location} />;
  }

  // S3. 위치 안내
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
    </section>
  );
}
