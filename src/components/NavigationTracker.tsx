"use client";

import { useTrackInAppHistory } from "@/lib/inAppHistory";

/** 앱 안에서 화면을 옮겼는지 기록한다 (BackButton이 쓴다). 화면에는 아무것도 그리지 않는다 */
export function NavigationTracker() {
  useTrackInAppHistory();
  return null;
}
