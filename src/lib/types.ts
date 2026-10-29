// 앱 내부 타입. 외부 API 응답은 변환 함수에서 이 타입으로 바꾼 뒤에만 쓴다.

export type LatLng = {
  lat: number;
  lng: number;
};

/** 대출 가능 / 대출 중 / 확인 실패 */
export type Availability = "available" | "onLoan" | "unknown";

export type Library = {
  libCode: string;
  name: string;
  /** 좌표를 모르면 null */
  location: LatLng | null;
  availability: Availability;
};

export type FavoriteBook = {
  isbn13: string;
  title: string;
  author: string;
  coverUrl: string | null;
};

export type FavoriteLibrary = {
  libCode: string;
  name: string;
  address: string | null;
  tel: string | null;
  homepage: string | null;
};

/** 최근에 넣은 것이 앞에 온다 */
export type Favorites = {
  books: FavoriteBook[];
  libraries: FavoriteLibrary[];
};

export type RankedLibrary = Library & {
  /** 1부터 시작하는 순번 */
  rank: number;
  /** 내 위치에서의 직선거리(km). 좌표를 모르면 null */
  distanceKm: number | null;
};

/** 검색 결과의 책 1권 */
export type BookSummary = {
  isbn13: string;
  title: string;
  author: string;
  publisher: string | null;
  /** 출판 연도. 모르면 null */
  year: string | null;
  coverUrl: string | null;
};

export type BookSearchPage = {
  /** 검색에 맞는 전체 책 수 */
  total: number;
  books: BookSummary[];
};
