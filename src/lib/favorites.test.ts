import { describe, expect, it } from "vitest";
import {
  FAVORITES_KEY,
  addFavoriteBook,
  addFavoriteLibrary,
  isFavoriteBook,
  isFavoriteLibrary,
  loadFavorites,
  removeFavoriteBook,
  removeFavoriteLibrary,
  type FavoritesStorage,
} from "./favorites";
import type { FavoriteBook, FavoriteLibrary } from "./types";

/** localStorage 대신 쓰는 메모리 저장소 */
function memoryStorage(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial));
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => void data.set(key, value),
  };
}

/** 읽기와 쓰기가 모두 오류를 내는 저장소 (프라이빗 모드, 용량 초과) */
const brokenStorage: FavoritesStorage = {
  getItem: () => {
    throw new Error("SecurityError");
  },
  setItem: () => {
    throw new Error("QuotaExceededError");
  },
};

const book = (isbn13: string): FavoriteBook => ({
  isbn13,
  title: `책 ${isbn13}`,
  author: "저자",
  coverUrl: null,
});

const library = (libCode: string): FavoriteLibrary => ({
  libCode,
  name: `${libCode} 도서관`,
  address: "주소",
  tel: "02-000-0000",
  homepage: null,
});

describe("즐겨찾기 저장", () => {
  it("처음에는 책과 도서관 목록이 모두 비어 있다", () => {
    expect(loadFavorites(memoryStorage())).toEqual({ books: [], libraries: [] });
  });

  it("책을 넣으면 목록에 생기고 즐겨찾기 여부가 true다", () => {
    const result = addFavoriteBook(memoryStorage(), book("9780000000001"));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.favorites.books).toEqual([book("9780000000001")]);
    expect(isFavoriteBook(result.favorites, "9780000000001")).toBe(true);
  });

  it("같은 책(ISBN13)을 두 번 넣어도 하나만 남는다", () => {
    const storage = memoryStorage();
    addFavoriteBook(storage, book("9780000000001"));
    addFavoriteBook(storage, book("9780000000001"));
    expect(loadFavorites(storage).books).toHaveLength(1);
  });

  it("책을 빼면 사라지고, 없는 책을 빼면 아무 일도 없다", () => {
    const storage = memoryStorage();
    addFavoriteBook(storage, book("9780000000001"));
    addFavoriteBook(storage, book("9780000000002"));

    removeFavoriteBook(storage, "9780000000001");
    expect(isFavoriteBook(loadFavorites(storage), "9780000000001")).toBe(false);

    const result = removeFavoriteBook(storage, "9789999999999");
    expect(result.ok).toBe(true);
    expect(loadFavorites(storage).books).toEqual([book("9780000000002")]);
  });

  it("도서관도 libCode 기준으로 넣기, 중복 방지, 빼기가 된다", () => {
    const storage = memoryStorage();
    addFavoriteLibrary(storage, library("111001"));
    addFavoriteLibrary(storage, library("111001"));
    addFavoriteLibrary(storage, library("111002"));
    expect(loadFavorites(storage).libraries).toHaveLength(2);
    expect(isFavoriteLibrary(loadFavorites(storage), "111001")).toBe(true);

    removeFavoriteLibrary(storage, "111001");
    removeFavoriteLibrary(storage, "999999");
    expect(loadFavorites(storage).libraries).toEqual([library("111002")]);
  });

  it("같은 저장소로 다시 읽어도 그대로다 (새로고침 유지)", () => {
    const storage = memoryStorage();
    addFavoriteBook(storage, book("9780000000001"));
    addFavoriteLibrary(storage, library("111001"));
    expect(loadFavorites(storage)).toEqual({
      books: [book("9780000000001")],
      libraries: [library("111001")],
    });
  });

  it("최근에 넣은 것이 맨 앞에 온다", () => {
    const storage = memoryStorage();
    addFavoriteBook(storage, book("9780000000001"));
    addFavoriteBook(storage, book("9780000000002"));
    addFavoriteLibrary(storage, library("111001"));
    addFavoriteLibrary(storage, library("111002"));
    const favorites = loadFavorites(storage);
    expect(favorites.books.map((b) => b.isbn13)).toEqual(["9780000000002", "9780000000001"]);
    expect(favorites.libraries.map((l) => l.libCode)).toEqual(["111002", "111001"]);
  });

  it.each([
    ["깨진 JSON", "{not json"],
    ["모양이 다른 값", JSON.stringify({ books: "nope", libraries: 3 })],
    ["배열", JSON.stringify([1, 2, 3])],
  ])("저장값이 %s이면 빈 목록으로 시작한다", (_, raw) => {
    const storage = memoryStorage({ [FAVORITES_KEY]: raw });
    expect(loadFavorites(storage)).toEqual({ books: [], libraries: [] });
  });

  it("저장소가 막혀 있어도 멈추지 않고 실패를 알려 준다", () => {
    for (const storage of [brokenStorage, null]) {
      expect(loadFavorites(storage)).toEqual({ books: [], libraries: [] });
      expect(addFavoriteBook(storage, book("9780000000001"))).toEqual({ ok: false });
      expect(removeFavoriteBook(storage, "9780000000001")).toEqual({ ok: false });
      expect(addFavoriteLibrary(storage, library("111001"))).toEqual({ ok: false });
      expect(removeFavoriteLibrary(storage, "111001")).toEqual({ ok: false });
    }
  });

  it("책을 바꿔도 도서관은 그대로이고, 반대도 그렇다", () => {
    const storage = memoryStorage();
    addFavoriteBook(storage, book("9780000000001"));
    addFavoriteLibrary(storage, library("111001"));

    removeFavoriteBook(storage, "9780000000001");
    expect(loadFavorites(storage).libraries).toEqual([library("111001")]);

    addFavoriteBook(storage, book("9780000000002"));
    removeFavoriteLibrary(storage, "111001");
    expect(loadFavorites(storage).books).toEqual([book("9780000000002")]);
  });
});
