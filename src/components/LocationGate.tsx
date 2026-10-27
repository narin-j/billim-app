"use client";

import Link from "next/link";
import { use, useCallback, useEffect, useState } from "react";
import { requestLocation, type LocationResult } from "@/lib/location";
import { LOCATION_FAILURE, LOCATION_NEEDED } from "@/lib/messages";

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
    return <p className="p-6 text-center opacity-70">내 위치를 확인하고 있어요…</p>;
  }

  if (state.status === "ok") {
    // S4는 정보나루 응답을 확인한 뒤 만든다
    return (
      <p className="p-6 text-center opacity-70">
        위치를 확인했어요. ISBN {isbn13}을 가진 주변 도서관 목록은 정보나루 API를 연결한 뒤 보여 줘요.
      </p>
    );
  }

  // S3. 위치 안내
  return (
    <section className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
      <span aria-hidden className="text-3xl">
        📍
      </span>
      <p className="font-semibold">{LOCATION_NEEDED}</p>
      <p className="opacity-80">{LOCATION_FAILURE[state.status]}</p>
      {state.status === "unsupported" ? (
        <Link href="/" className="rounded-xl border px-4 py-2">
          뒤로 가기
        </Link>
      ) : (
        <button type="button" onClick={retry} className="rounded-xl border px-4 py-2 font-semibold">
          다시 시도
        </button>
      )}
    </section>
  );
}
