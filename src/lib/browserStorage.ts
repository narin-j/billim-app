import type { FavoritesStorage } from "./favorites";

/** localStorage. 서버이거나 접근이 막힌 환경(일부 프라이빗 모드 등)이면 null */
export function getBrowserStorage(): FavoritesStorage {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}
