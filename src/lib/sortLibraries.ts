import { distanceKm } from "./distance";
import type { Availability, LatLng, Library, RankedLibrary } from "./types";

const AVAILABILITY_ORDER: Record<Availability, number> = {
  available: 0,
  onLoan: 1,
  unknown: 2,
};

/** 화면에 보이는 단위(0.1km)로 맞춘 값. 이 값이 같으면 같은 거리로 본다 */
const toTenths = (km: number) => Math.round(km * 10);

/**
 * 내 위치에서 가까운 순으로 정렬하고 순번을 붙인다.
 * 0.1km 단위로 거리가 같으면 대출 가능 → 대출 중 → 확인 실패 순.
 * 좌표가 없는 도서관은 맨 뒤에 둔다.
 */
export function sortLibraries(me: LatLng, libraries: readonly Library[]): RankedLibrary[] {
  return libraries
    .map((library) => ({
      ...library,
      distanceKm: library.location ? distanceKm(me, library.location) : null,
    }))
    .sort((a, b) => {
      if (a.distanceKm === null || b.distanceKm === null) {
        if (a.distanceKm !== b.distanceKm) return a.distanceKm === null ? 1 : -1;
      } else {
        const byDistance = toTenths(a.distanceKm) - toTenths(b.distanceKm);
        if (byDistance !== 0) return byDistance;
      }
      return AVAILABILITY_ORDER[a.availability] - AVAILABILITY_ORDER[b.availability];
    })
    .map((library, i) => ({ ...library, rank: i + 1 }));
}
