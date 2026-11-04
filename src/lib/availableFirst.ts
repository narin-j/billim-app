import { AVAILABILITY_ORDER } from "./sortLibraries";
import type { Availability } from "./types";

/**
 * 확인한 도서관을 대출 가능 → 대출 중 → 확인 실패로 묶는다.
 * 묶음 안에서는 넘겨받은 순서(서버가 정한 가까운 순)를 그대로 둔다. 넘겨받은 배열은 바꾸지 않는다.
 */
export function availableFirst<T extends { availability: Availability }>(libraries: readonly T[]): T[] {
  // Array.prototype.sort는 안정 정렬이라 같은 상태끼리는 원래 순서가 유지된다
  return [...libraries].sort((a, b) => AVAILABILITY_ORDER[a.availability] - AVAILABILITY_ORDER[b.availability]);
}
