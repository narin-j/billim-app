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
  /** 운영 시간 원문. 이 값이 생기기 전에 저장한 즐겨찾기는 null */
  operatingTime: string | null;
  /** 휴관일 원문. 이 값이 생기기 전에 저장한 즐겨찾기는 null */
  closed: string | null;
};

/** 최근에 넣은 것이 앞에 온다 */
export type Favorites = {
  books: FavoriteBook[];
  libraries: FavoriteLibrary[];
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

/** 정보나루가 주는 도서관 정보 (대출 여부 제외) */
export type LibraryInfo = {
  libCode: string;
  name: string;
  /** 좌표를 모르면 null */
  location: LatLng | null;
  address: string | null;
  tel: string | null;
  homepage: string | null;
  /** 운영 시간 원문 ("평일 09:00 ~ 18:00"). 형식이 도서관마다 달라 해석하지 않는다 */
  operatingTime: string | null;
  /** 휴관일 원문 ("매주 월요일 / 법정공휴일") */
  closed: string | null;
};

/** S4 목록의 한 줄. 화면은 거리만 쓰므로 도서관 좌표는 담지 않는다 */
export type NearbyLibrary = Omit<LibraryInfo, "location"> & {
  availability: Availability;
  /** 1부터 시작하는 순번. 쪽이 넘어가도 이어진다 */
  rank: number;
  /** 내 위치에서의 직선거리(km). 좌표를 모르면 null */
  distanceKm: number | null;
};
