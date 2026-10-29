import { describe, expect, it } from "vitest";
import { pickRegions, type DirectoryEntry } from "./pickRegions";

const entry = (region: string, lat: number, lng: number): DirectoryEntry => ({ region, location: { lat, lng } });

const DIRECTORY: DirectoryEntry[] = [
  entry("11", 37.495, 126.887), // 서울 구로
  entry("11", 37.654, 127.06), // 서울 노원
  entry("31", 37.478, 126.864), // 경기 광명
  entry("32", 37.751, 128.876), // 강원 강릉
  entry("37", 36.019, 129.343), // 경북 포항
  { region: "39", location: null }, // 좌표 없는 도서관
];

describe("pickRegions", () => {
  it("20km 안에 도서관이 있는 시도를 모두 고른다 (광명 → 서울, 경기)", () => {
    const gwangmyeong = { lat: 37.4786, lng: 126.8646 };
    expect(pickRegions(gwangmyeong, DIRECTORY).sort()).toEqual(["11", "31"]);
  });

  it("같은 시도는 한 번만 넣는다", () => {
    const nowon = { lat: 37.654, lng: 127.06 };
    expect(pickRegions(nowon, DIRECTORY)).toEqual(["11"]);
  });

  it("20km 안에 도서관이 없으면 가장 가까운 도서관의 시도만 고른다 (울릉도 → 강원)", () => {
    const ulleung = { lat: 37.484, lng: 130.905 };
    expect(pickRegions(ulleung, DIRECTORY)).toEqual(["32"]);
  });

  it("좌표가 있는 도서관이 하나도 없으면 빈 목록이다", () => {
    expect(pickRegions({ lat: 37.5, lng: 127 }, [{ region: "39", location: null }])).toEqual([]);
  });
});
