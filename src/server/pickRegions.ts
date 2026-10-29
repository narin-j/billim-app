import { distanceKm } from "@/lib/distance";
import type { LatLng } from "@/lib/types";

/** 전국 도서관 목록의 한 줄. region은 정보나루 시도 코드 */
export type DirectoryEntry = { region: string; location: LatLng | null };

export const REGION_RADIUS_KM = 20;

/**
 * 소장 도서관을 찾을 시도 코드를 고른다.
 * 내 위치 20km 안에 도서관이 있는 시도를 모두 쓰고, 없으면 가장 가까운 도서관의 시도만 쓴다.
 * 시도 경계 근처에서도 이웃 시도의 가까운 도서관을 놓치지 않으려는 것이다.
 */
export function pickRegions(me: LatLng, directory: readonly DirectoryEntry[]): string[] {
  const regions = new Set<string>();
  let nearest: { region: string; km: number } | null = null;

  for (const { region, location } of directory) {
    if (!location) continue;
    const km = distanceKm(me, location);
    if (km <= REGION_RADIUS_KM) regions.add(region);
    if (!nearest || km < nearest.km) nearest = { region, km };
  }

  if (regions.size === 0 && nearest) regions.add(nearest.region);
  return [...regions];
}
