"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

// 이 탭에서 페이지를 새로 불러온 뒤 앱 안에서 화면을 옮긴 적이 있는지.
// 모듈 변수라 새로고침하거나 주소를 직접 열면 false로 돌아간다
let navigated = false;

/** 뒤로 가기를 눌렀을 때 브라우저 이전 기록이 우리 앱 화면인지 */
export const hasInAppHistory = () => navigated;

/** 첫 화면에서 다른 화면으로 옮기면 기록한다. 레이아웃에서 한 번만 쓴다 */
export function useTrackInAppHistory() {
  const pathname = usePathname();
  const first = useRef(pathname);
  useEffect(() => {
    if (pathname !== first.current) navigated = true;
  }, [pathname]);
}
