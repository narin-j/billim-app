// 화면 문구. docs/spec.md 6장과 같게 유지한다

import type { LocationResult } from "./location";

export const LOCATION_NEEDED = "내 위치를 알아야 가까운 도서관을 찾을 수 있어요.";

export const LOCATION_FAILURE: Record<Exclude<LocationResult["status"], "ok">, string> = {
  denied: "브라우저 설정에서 위치 권한을 허용한 뒤 다시 시도해 주세요.",
  unavailable: "위치를 찾지 못했어요. 잠시 후 다시 시도해 주세요.",
  timeout: "위치를 찾지 못했어요. 잠시 후 다시 시도해 주세요.",
  unsupported: "이 브라우저에서는 위치를 확인할 수 없어요.",
};

export const FAVORITES_SAVE_FAILED = "이 브라우저에서는 즐겨찾기를 저장할 수 없어요.";
export const FAVORITES_DEVICE_ONLY = "즐겨찾기는 이 기기의 이 브라우저에만 저장돼요.";
export const FAVORITES_EMPTY_BOOKS = "아직 즐겨찾기한 책이 없어요. 검색 결과에서 ☆를 눌러 저장해 보세요.";
export const FAVORITES_EMPTY_LIBRARIES = "아직 즐겨찾기한 도서관이 없어요. 도서관 상세에서 ☆를 눌러 저장해 보세요.";
