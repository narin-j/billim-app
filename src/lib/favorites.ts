import type { FavoriteBook, FavoriteLibrary, Favorites } from "./types";

export const FAVORITES_KEY = "billim:favorites:v1";

/** 저장소. 접근 자체가 막힌 환경이면 null */
export type FavoritesStorage = Pick<Storage, "getItem" | "setItem"> | null;

export type SaveResult = { ok: true; favorites: Favorites } | { ok: false };

const empty = (): Favorites => ({ books: [], libraries: [] });

/** 저장된 즐겨찾기를 읽는다. 읽을 수 없거나 값이 깨졌으면 빈 목록 */
export function loadFavorites(storage: FavoritesStorage): Favorites {
  try {
    const raw = storage?.getItem(FAVORITES_KEY);
    if (!raw) return empty();
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed)) return empty();
    return {
      books: arrayOf(parsed.books, isFavoriteBookShape),
      libraries: arrayOf(parsed.libraries, isFavoriteLibraryShape),
    };
  } catch {
    return empty();
  }
}

export const addFavoriteBook = (storage: FavoritesStorage, book: FavoriteBook) =>
  update(storage, (f) =>
    isFavoriteBook(f, book.isbn13) ? f : { ...f, books: [book, ...f.books] },
  );

export const removeFavoriteBook = (storage: FavoritesStorage, isbn13: string) =>
  update(storage, (f) => ({ ...f, books: f.books.filter((b) => b.isbn13 !== isbn13) }));

export const addFavoriteLibrary = (storage: FavoritesStorage, library: FavoriteLibrary) =>
  update(storage, (f) =>
    isFavoriteLibrary(f, library.libCode) ? f : { ...f, libraries: [library, ...f.libraries] },
  );

export const removeFavoriteLibrary = (storage: FavoritesStorage, libCode: string) =>
  update(storage, (f) => ({ ...f, libraries: f.libraries.filter((l) => l.libCode !== libCode) }));

export const isFavoriteBook = (favorites: Favorites, isbn13: string) =>
  favorites.books.some((b) => b.isbn13 === isbn13);

export const isFavoriteLibrary = (favorites: Favorites, libCode: string) =>
  favorites.libraries.some((l) => l.libCode === libCode);

/** 읽고 → 바꾸고 → 쓴다. 쓰기에 실패하면 ok: false */
function update(storage: FavoritesStorage, change: (f: Favorites) => Favorites): SaveResult {
  if (!storage) return { ok: false };
  const favorites = change(loadFavorites(storage));
  try {
    storage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
    return { ok: true, favorites };
  } catch {
    return { ok: false };
  }
}

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

const isStringOrNull = (v: unknown) => typeof v === "string" || v === null;

/** 배열이 아니면 빈 배열, 모양이 맞지 않는 항목은 버린다 */
function arrayOf<T>(v: unknown, isT: (item: unknown) => item is T): T[] {
  return Array.isArray(v) ? v.filter(isT) : [];
}

function isFavoriteBookShape(v: unknown): v is FavoriteBook {
  return (
    isRecord(v) &&
    typeof v.isbn13 === "string" &&
    typeof v.title === "string" &&
    typeof v.author === "string" &&
    isStringOrNull(v.coverUrl)
  );
}

function isFavoriteLibraryShape(v: unknown): v is FavoriteLibrary {
  return (
    isRecord(v) &&
    typeof v.libCode === "string" &&
    typeof v.name === "string" &&
    isStringOrNull(v.address) &&
    isStringOrNull(v.tel) &&
    isStringOrNull(v.homepage)
  );
}
