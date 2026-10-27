import type { LatLng } from "./types";

export type LocationResult =
  | { status: "ok"; location: LatLng }
  | { status: "denied" | "unavailable" | "timeout" | "unsupported" };

export const LOCATION_OPTIONS: PositionOptions = {
  enableHighAccuracy: false,
  timeout: 10_000,
  maximumAge: 60_000,
};

/** 현재 위치를 한 번 얻는다. 좌표는 저장하지 않고 돌려주기만 한다 */
export function requestLocation(
  geolocation: Pick<Geolocation, "getCurrentPosition"> | undefined,
): Promise<LocationResult> {
  if (!geolocation) return Promise.resolve({ status: "unsupported" });

  return new Promise((resolve) => {
    geolocation.getCurrentPosition(
      ({ coords }) => resolve({ status: "ok", location: { lat: coords.latitude, lng: coords.longitude } }),
      (error) => resolve({ status: ERROR_STATUS[error.code] ?? "unavailable" }),
      LOCATION_OPTIONS,
    );
  });
}

/** GeolocationPositionError.code → 결과 상태 */
const ERROR_STATUS: Record<number, "denied" | "unavailable" | "timeout"> = {
  1: "denied",
  2: "unavailable",
  3: "timeout",
};
