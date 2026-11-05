import type { LatLng, LibraryInfo } from "@/lib/types";

export type ToLibrariesResult =
  | { ok: true; total: number; libraries: LibraryInfo[] }
  | { ok: false; reason: "format" };

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

/** 앞뒤 공백을 지운 문자열. 비었거나 "-"(정보 없음 표시)면 null */
const text = (v: unknown): string | null => {
  if (typeof v !== "string") return null;
  const trimmed = v.trim();
  return trimmed === "" || trimmed === "-" ? null : trimmed;
};

/** 좌표는 문자열로 온다 ("37.492994") */
const toLocation = (lat: unknown, lng: unknown): LatLng | null => {
  const [a, b] = [text(lat), text(lng)];
  if (a === null || b === null) return null;
  const [la, ln] = [Number(a), Number(b)];
  return Number.isFinite(la) && Number.isFinite(ln) ? { lat: la, lng: ln } : null;
};

/** libSrch, libSrchByBook 응답을 앱 내부 타입으로 바꾼다 (응답 형태: docs/spec.md 8장) */
export function toLibraries(body: unknown): ToLibrariesResult {
  if (!isRecord(body) || !isRecord(body.response)) return { ok: false, reason: "format" };
  const { numFound, libs } = body.response;
  if (typeof numFound !== "number" || !Array.isArray(libs)) return { ok: false, reason: "format" };

  const libraries: LibraryInfo[] = [];
  const seen = new Set<string>();
  for (const item of libs) {
    const lib = isRecord(item) && isRecord(item.lib) ? item.lib : null;
    const libCode = text(lib?.libCode);
    if (!lib || !libCode || seen.has(libCode)) continue;
    seen.add(libCode);

    libraries.push({
      libCode,
      name: text(lib.libName) ?? "",
      address: text(lib.address),
      tel: text(lib.tel),
      homepage: text(lib.homepage),
      operatingTime: text(lib.operatingTime),
      closed: text(lib.closed),
      location: toLocation(lib.latitude, lib.longitude),
    });
  }

  return { ok: true, total: numFound, libraries };
}
