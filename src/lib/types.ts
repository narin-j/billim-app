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

export type RankedLibrary = Library & {
  /** 1부터 시작하는 순번 */
  rank: number;
  /** 내 위치에서의 직선거리(km). 좌표를 모르면 null */
  distanceKm: number | null;
};
