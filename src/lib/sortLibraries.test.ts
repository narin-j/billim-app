import { describe, expect, it } from "vitest";
import { sortLibraries } from "./sortLibraries";
import type { Availability, Library } from "./types";

const me = { lat: 37.5, lng: 127.0 };

/** 내 위치에서 북쪽으로 dLat도 떨어진 도서관 (0.01도 ≈ 1.11km) */
function lib(libCode: string, dLat: number | null, availability: Availability = "available"): Library {
  return {
    libCode,
    name: `${libCode} 도서관`,
    location: dLat === null ? null : { lat: me.lat + dLat, lng: me.lng },
    availability,
  };
}

const codes = (libs: { libCode: string }[]) => libs.map((l) => l.libCode);

describe("sortLibraries", () => {
  it("가까운 도서관이 먼저 온다", () => {
    const result = sortLibraries(me, [lib("far", 0.05), lib("near", 0.01), lib("mid", 0.03)]);
    expect(codes(result)).toEqual(["near", "mid", "far"]);
  });

  it("0.1km 단위로 같은 거리면 대출 가능 → 대출 중 → 확인 실패 순이다", () => {
    const result = sortLibraries(me, [
      lib("unknown", 0.01, "unknown"),
      lib("onLoan", 0.01, "onLoan"),
      // 약 1.12km. 1.11km보다 조금 멀지만 0.1km 단위로는 같은 1.1km
      lib("available", 0.0101, "available"),
    ]);
    expect(codes(result)).toEqual(["available", "onLoan", "unknown"]);
  });

  it("정렬한 뒤 순번이 1부터 붙는다", () => {
    const result = sortLibraries(me, [lib("b", 0.02), lib("a", 0.01), lib("c", 0.03)]);
    expect(result.map((l) => l.rank)).toEqual([1, 2, 3]);
    expect(result[0].libCode).toBe("a");
  });

  it("빈 목록이면 빈 목록이 나온다", () => {
    expect(sortLibraries(me, [])).toEqual([]);
  });

  it("넣은 배열을 바꾸지 않는다", () => {
    const input = [lib("far", 0.05), lib("near", 0.01)];
    const snapshot = structuredClone(input);
    sortLibraries(me, input);
    expect(input).toEqual(snapshot);
  });

  it("좌표가 없는 도서관은 맨 뒤에 오고 거리가 null이다", () => {
    const result = sortLibraries(me, [lib("noLocation", null), lib("far", 0.05), lib("near", 0.01)]);
    expect(codes(result)).toEqual(["near", "far", "noLocation"]);
    expect(result[2].distanceKm).toBeNull();
    expect(result[2].rank).toBe(3);
  });

  it("거리를 km로 함께 돌려준다", () => {
    const [first] = sortLibraries(me, [lib("near", 0.01)]);
    expect(first.distanceKm).toBeCloseTo(1.11, 2);
  });
});
