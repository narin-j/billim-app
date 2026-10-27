import { describe, expect, it, vi } from "vitest";
import { LOCATION_OPTIONS, requestLocation } from "./location";

function succeeding(lat: number, lng: number) {
  return {
    getCurrentPosition: vi.fn((onSuccess: PositionCallback) => {
      onSuccess({
        coords: { latitude: lat, longitude: lng, accuracy: 30 },
        timestamp: 1_700_000_000_000,
      } as GeolocationPosition);
    }),
  };
}

function failing(code: 1 | 2 | 3) {
  return {
    getCurrentPosition: vi.fn((_: PositionCallback, onError?: PositionErrorCallback | null) => {
      onError?.({
        code,
        message: "",
        PERMISSION_DENIED: 1,
        POSITION_UNAVAILABLE: 2,
        TIMEOUT: 3,
      } as GeolocationPositionError);
    }),
  };
}

describe("requestLocation", () => {
  it("성공하면 위도와 경도만 돌려준다", async () => {
    await expect(requestLocation(succeeding(37.5, 127.0))).resolves.toEqual({
      status: "ok",
      location: { lat: 37.5, lng: 127.0 },
    });
  });

  it("권한을 거부하면 denied", async () => {
    await expect(requestLocation(failing(1))).resolves.toEqual({ status: "denied" });
  });

  it("위치를 찾지 못하면 unavailable", async () => {
    await expect(requestLocation(failing(2))).resolves.toEqual({ status: "unavailable" });
  });

  it("시간이 지나면 timeout", async () => {
    await expect(requestLocation(failing(3))).resolves.toEqual({ status: "timeout" });
  });

  it("위치 기능이 없으면 unsupported", async () => {
    await expect(requestLocation(undefined)).resolves.toEqual({ status: "unsupported" });
  });

  it("정해 둔 옵션을 그대로 넘긴다", async () => {
    const geo = succeeding(37.5, 127.0);
    await requestLocation(geo);
    expect(geo.getCurrentPosition).toHaveBeenCalledWith(
      expect.any(Function),
      expect.any(Function),
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 60_000 },
    );
    expect(LOCATION_OPTIONS).toEqual({ enableHighAccuracy: false, timeout: 10_000, maximumAge: 60_000 });
  });
});
