import { describe, expect, it } from "vitest";
import { distanceKm } from "./distance";

const seoulCityHall = { lat: 37.5663, lng: 126.9779 };
const busanCityHall = { lat: 35.1798, lng: 129.075 };

describe("distanceKm", () => {
  it("같은 지점이면 0이다", () => {
    expect(distanceKm(seoulCityHall, seoulCityHall)).toBe(0);
  });

  it("서울시청과 부산시청 사이는 약 325km다", () => {
    expect(Math.abs(distanceKm(seoulCityHall, busanCityHall) - 325)).toBeLessThanOrEqual(2);
  });

  it("위도만 0.01도 다르면 약 1.11km다", () => {
    const north = { lat: seoulCityHall.lat + 0.01, lng: seoulCityHall.lng };
    expect(distanceKm(seoulCityHall, north)).toBeCloseTo(1.11, 2);
  });

  it("a→b와 b→a의 거리가 같다", () => {
    expect(distanceKm(seoulCityHall, busanCityHall)).toBe(distanceKm(busanCityHall, seoulCityHall));
  });
});
