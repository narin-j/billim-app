import { distanceKm } from "@/lib/distance";
import { sortLibraries } from "@/lib/sortLibraries";
import type { LatLng, LibraryInfo, NearbyLibrary } from "@/lib/types";
import type { CallResult, Endpoint, FailureReason } from "./data4library/call";
import { toAvailability } from "./data4library/toAvailability";
import { pickRegions, type DirectoryEntry } from "./pickRegions";

/** 한 쪽에 보여 줄 도서관 수. 한 쪽 = bookExist 호출 수 (하루 한도 499건) */
export const PAGE_SIZE = 5;

export type Fetched<T> = { ok: true; value: T } | { ok: false; reason: FailureReason };

export type NearbyDeps = {
  /** 전국 도서관 좌표와 시도 코드 (libSrch, 캐시) */
  directory: () => Promise<Fetched<DirectoryEntry[]>>;
  /** 한 시도에서 이 책을 가진 도서관 전부 (libSrchByBook, 캐시) */
  holders: (isbn13: string, region: string) => Promise<Fetched<LibraryInfo[]>>;
  /** bookExist 호출 (캐시하지 않음) */
  call: (endpoint: Endpoint, params: Record<string, string>) => Promise<CallResult>;
  log: (message: string) => void;
  now: () => Date;
};

export type NearbyResponse =
  | { page: number; total: number; hasMore: boolean; checkedAt: string; libraries: NearbyLibrary[] }
  | { error: "badRequest" | FailureReason };

type Input = { isbn13: string; me: LatLng; page: number };

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

const inRange = (v: unknown, limit: number): v is number =>
  typeof v === "number" && Number.isFinite(v) && Math.abs(v) <= limit;

function readInput(body: unknown): Input | null {
  if (!isRecord(body)) return null;
  const { isbn13, lat, lng, page } = body;
  if (typeof isbn13 !== "string" || !/^\d{13}$/.test(isbn13)) return null;
  if (!inRange(lat, 90) || !inRange(lng, 180)) return null;
  if (typeof page !== "number" || !Number.isInteger(page) || page < 1) return null;
  return { isbn13, me: { lat, lng }, page };
}

/**
 * POST /api/libraries 의 본체. 내 위치에서 가까운 소장 도서관을 5곳씩 대출 여부와 함께 돌려준다.
 * 내 좌표와 ISBN은 응답과 로그에 남기지 않는다.
 */
export async function findNearbyLibraries(
  body: unknown,
  deps: NearbyDeps,
): Promise<{ status: number; body: NearbyResponse }> {
  const input = readInput(body);
  if (!input) return { status: 400, body: { error: "badRequest" } };
  const { isbn13, me, page } = input;

  const fail = (what: string, reason: FailureReason) => {
    deps.log(`${what} 실패: ${reason}`);
    return { status: 502, body: { error: reason } };
  };

  const directory = await deps.directory();
  if (!directory.ok) return fail("libSrch", directory.reason);

  const fetched = await Promise.all(pickRegions(me, directory.value).map((region) => deps.holders(isbn13, region)));
  const failed = fetched.find((r) => !r.ok);
  if (failed && !failed.ok) return fail("libSrchByBook", failed.reason);

  // 여러 시도 결과를 합치고, 가까운 순(좌표 없는 곳은 맨 뒤)으로 세운다
  const unique = new Map<string, LibraryInfo>();
  for (const r of fetched) if (r.ok) for (const lib of r.value) if (!unique.has(lib.libCode)) unique.set(lib.libCode, lib);
  const byDistance = [...unique.values()]
    .map((lib) => ({ lib, km: lib.location ? distanceKm(me, lib.location) : Infinity }))
    .sort((a, b) => a.km - b.km || a.lib.libCode.localeCompare(b.lib.libCode))
    .map(({ lib }) => lib);

  const offset = (page - 1) * PAGE_SIZE;
  const slice = byDistance.slice(offset, offset + PAGE_SIZE);
  const checked = await Promise.all(
    slice.map(async (lib) => {
      const result = await deps.call("bookExist", { isbn13, libCode: lib.libCode });
      return { ...lib, availability: result.ok ? toAvailability(result.body) : "unknown" as const };
    }),
  );

  return {
    status: 200,
    body: {
      page,
      total: byDistance.length,
      hasMore: offset + PAGE_SIZE < byDistance.length,
      checkedAt: deps.now().toISOString(),
      // eslint-disable-next-line @typescript-eslint/no-unused-vars -- 좌표는 응답에서 뺀다
      libraries: sortLibraries(me, checked).map(({ location, ...lib }) => ({ ...lib, rank: offset + lib.rank })),
    },
  };
}
