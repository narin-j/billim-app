import type { FavoritesStorage } from "./favorites";

/** localStorage. 서버이거나 접근이 막힌 환경(일부 프라이빗 모드 등)이면 null */
export function getBrowserStorage(): FavoritesStorage {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

/** sessionStorage (이 탭에서만, 탭을 닫으면 사라진다). 쓸 수 없으면 null */
export function getSessionStorage(): FavoritesStorage {
  try {
    return typeof window === "undefined" ? null : window.sessionStorage;
  } catch {
    return null;
  }
}
