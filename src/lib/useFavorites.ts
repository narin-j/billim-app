"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import { getBrowserStorage } from "./browserStorage";
import {
  FAVORITES_KEY,
  addFavoriteBook,
  addFavoriteLibrary,
  loadFavorites,
  removeFavoriteBook,
  removeFavoriteLibrary,
  type FavoritesStorage,
  type SaveResult,
} from "./favorites";
import type { FavoriteBook, FavoriteLibrary } from "./types";

// 같은 탭 안의 변경은 listeners로, 다른 탭의 변경은 storage 이벤트로 알린다
const listeners = new Set<() => void>();

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  const onStorage = (e: StorageEvent) => {
    if (e.key === FAVORITES_KEY) onChange();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onStorage);
  };
}

/** 원본 문자열을 스냅샷으로 쓴다. 문자열이라 바뀌지 않으면 같은 값으로 비교된다 */
function getSnapshot(): string | null {
  try {
    return getBrowserStorage()?.getItem(FAVORITES_KEY) ?? null;
  } catch {
    return null;
  }
}

const getServerSnapshot = () => null;
const subscribeNothing = () => () => {};

export function useFavorites() {
  const raw = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  // 서버 렌더와 첫 하이드레이션에서는 false. 저장값을 읽기 전에 빈 상태를 보여 주지 않으려고 쓴다
  const ready = useSyncExternalStore(subscribeNothing, () => true, () => false);

  const favorites = useMemo(
    () => loadFavorites({ getItem: () => raw, setItem: () => {} }),
    [raw],
  );

  /** 저장에 성공하면 true */
  const run = useCallback((save: (storage: FavoritesStorage) => SaveResult) => {
    const result = save(getBrowserStorage());
    if (result.ok) listeners.forEach((notify) => notify());
    return result.ok;
  }, []);

  return {
    ready,
    favorites,
    addBook: (book: FavoriteBook) => run((s) => addFavoriteBook(s, book)),
    removeBook: (isbn13: string) => run((s) => removeFavoriteBook(s, isbn13)),
    addLibrary: (library: FavoriteLibrary) => run((s) => addFavoriteLibrary(s, library)),
    removeLibrary: (libCode: string) => run((s) => removeFavoriteLibrary(s, libCode)),
  };
}
