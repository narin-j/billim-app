import { describe, expect, it, vi } from "vitest";
import type { LibraryInfo } from "@/lib/types";
import type { CallResult } from "./data4library/call";
import { PAGE_SIZE, findNearbyLibraries, type NearbyDeps } from "./findNearbyLibraries";

const ISBN = "9788936433598";
/** 응답과 로그에 섞여 들어갔는지 찾기 쉬운 좌표 */
const ME = { lat: 37.123456, lng: 127.654321 };
const NOW = new Date("2026-10-29T06:42:00.000Z");

/** 내 위치에서 북쪽으로 dLat도 떨어진 소장 도서관 (0.01도 ≈ 1.11km). null이면 좌표 없음 */
const holder = (libCode: string, dLat: number | null): LibraryInfo => ({
  libCode,
  name: `${libCode} 도서관`,
  address: null,
  tel: null,
  homepage: null,
  location: dLat === null ? null : { lat: ME.lat + dLat, lng: ME.lng },
});

const SEOUL = [
  holder("h1", 0.01),
  holder("h2", 0.02),
  holder("h3", 0.03),
  holder("n1", null),
  holder("h4", 0.04),
  holder("h5", 0.05),
  holder("h6", 0.06),
  holder("h7", 0.07),
];
// 경기 결과에도 h2가 한 번 더 나온다
const GYEONGGI = [holder("g1", 0.035), holder("h2", 0.02)];

const DIRECTORY = [
  { region: "11", location: { lat: ME.lat + 0.01, lng: ME.lng } },
  { region: "31", location: { lat: ME.lat + 0.02, lng: ME.lng } },
  { region: "39", location: { lat: 33.5, lng: 126.5 } },
];

const exists = (loanAvailable: "Y" | "N"): CallResult => ({
  ok: true,
  body: { response: { result: { hasBook: "Y", loanAvailable } } },
});

function deps(overrides: Partial<NearbyDeps> = {}) {
  const holders: Record<string, LibraryInfo[]> = { "11": SEOUL, "31": GYEONGGI };
  return {
    directory: vi.fn(async () => ({ ok: true as const, value: DIRECTORY })),
    holders: vi.fn(async (_isbn13: string, region: string) => ({ ok: true as const, value: holders[region] ?? [] })),
    call: vi.fn(async (): Promise<CallResult> => exists("Y")),
    log: vi.fn(),
    now: () => NOW,
    ...overrides,
  } satisfies NearbyDeps;
}

const input = (page = 1) => ({ isbn13: ISBN, lat: ME.lat, lng: ME.lng, page });

const checkedCodes = (d: ReturnType<typeof deps>) =>
  vi.mocked(d.call).mock.calls.map(([, params]) => params.libCode);

describe("findNearbyLibraries", () => {
  it("한 쪽은 5곳이다", () => {
    expect(PAGE_SIZE).toBe(5);
  });

  it("1쪽: 가장 가까운 소장 도서관 5곳에만 bookExist를 부르고 순번 1~5를 붙인다", async () => {
    const d = deps();
    const res = await findNearbyLibraries(input(1), d);

    expect(d.call).toHaveBeenCalledTimes(5);
    expect(checkedCodes(d).sort()).toEqual(["g1", "h1", "h2", "h3", "h4"]);
    expect(d.call).toHaveBeenCalledWith("bookExist", { isbn13: ISBN, libCode: "h1" });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      page: 1,
      total: 9,
      hasMore: true,
      checkedAt: NOW.toISOString(),
      libraries: ["h1", "h2", "h3", "g1", "h4"].map((libCode, i) =>
        expect.objectContaining({ libCode, rank: i + 1, availability: "available", distanceKm: expect.any(Number) }),
      ),
    });
  });

  it("2쪽: 다음 곳들에만 bookExist를 부르고 순번은 6부터다. 마지막 쪽이면 hasMore가 false다", async () => {
    const d = deps();
    const res = await findNearbyLibraries(input(2), d);

    expect(d.call).toHaveBeenCalledTimes(4);
    expect(res.body).toEqual(
      expect.objectContaining({
        page: 2,
        total: 9,
        hasMore: false,
        libraries: [
          expect.objectContaining({ libCode: "h5", rank: 6 }),
          expect.objectContaining({ libCode: "h6", rank: 7 }),
          expect.objectContaining({ libCode: "h7", rank: 8 }),
          // 좌표 없는 도서관은 맨 뒤, 거리는 null
          expect.objectContaining({ libCode: "n1", rank: 9, distanceKm: null }),
        ],
      }),
    );
  });

  it("가운데 쪽은 bookExist를 정확히 5번 부른다", async () => {
    const many = Array.from({ length: 12 }, (_, i) => holder(`m${i}`, 0.01 * (i + 1)));
    const d = deps({ holders: vi.fn(async () => ({ ok: true as const, value: many })) });
    await findNearbyLibraries(input(2), d);
    expect(d.call).toHaveBeenCalledTimes(5);
    expect(checkedCodes(d).sort()).toEqual(["m5", "m6", "m7", "m8", "m9"]);
  });

  it("고른 시도마다 소장 목록을 받고, 고르지 않은 시도는 부르지 않는다", async () => {
    const d = deps();
    await findNearbyLibraries(input(1), d);
    expect(vi.mocked(d.holders).mock.calls.map(([, region]) => region).sort()).toEqual(["11", "31"]);
  });

  it("소장 도서관이 없으면 빈 목록이고 bookExist를 부르지 않는다", async () => {
    const d = deps({ holders: vi.fn(async () => ({ ok: true as const, value: [] })) });
    const res = await findNearbyLibraries(input(1), d);
    expect(res).toEqual({
      status: 200,
      body: { page: 1, total: 0, hasMore: false, checkedAt: NOW.toISOString(), libraries: [] },
    });
    expect(d.call).not.toHaveBeenCalled();
  });

  it("bookExist가 하나 실패하면 그 도서관만 확인 실패(unknown)다", async () => {
    const d = deps({
      call: vi.fn(async (_endpoint: string, params: Record<string, string>): Promise<CallResult> =>
        params.libCode === "h2" ? { ok: false, reason: "network" } : params.libCode === "h3" ? exists("N") : exists("Y"),
      ),
    });
    const res = await findNearbyLibraries(input(1), d);
    const libraries = res.status === 200 && "libraries" in res.body ? res.body.libraries : [];
    const byCode = Object.fromEntries(libraries.map((l) => [l.libCode, l.availability]));
    expect(byCode).toEqual({ h1: "available", h2: "unknown", h3: "onLoan", g1: "available", h4: "available" });
  });

  it("도서관 목록(libSrch)을 받지 못하면 502다", async () => {
    const d = deps({ directory: vi.fn(async () => ({ ok: false as const, reason: "network" as const })) });
    await expect(findNearbyLibraries(input(1), d)).resolves.toEqual({ status: 502, body: { error: "network" } });
    expect(d.call).not.toHaveBeenCalled();
  });

  it("소장 목록(libSrchByBook)을 하나라도 받지 못하면 502다", async () => {
    const d = deps({
      holders: vi.fn(async (_isbn13: string, region: string) =>
        region === "31" ? { ok: false as const, reason: "timeout" as const } : { ok: true as const, value: SEOUL },
      ),
    });
    await expect(findNearbyLibraries(input(1), d)).resolves.toEqual({ status: 502, body: { error: "timeout" } });
  });

  it.each([
    ["본문이 객체가 아님", "x"],
    ["isbn13 없음", { lat: ME.lat, lng: ME.lng, page: 1 }],
    ["isbn13이 10자리", { ...input(), isbn13: "8936433598" }],
    ["위도가 문자열", { ...input(), lat: "37.5" }],
    ["위도가 범위 밖", { ...input(), lat: 91 }],
    ["경도가 범위 밖", { ...input(), lng: -181 }],
    ["경도가 NaN", { ...input(), lng: Number.NaN }],
    ["page가 0", input(0)],
    ["page가 소수", input(1.5)],
    ["page 없음", { isbn13: ISBN, lat: ME.lat, lng: ME.lng }],
  ])("입력이 잘못되면 외부 호출 없이 400이다 (%s)", async (_, body) => {
    const d = deps();
    await expect(findNearbyLibraries(body, d)).resolves.toEqual({ status: 400, body: { error: "badRequest" } });
    expect(d.directory).not.toHaveBeenCalled();
    expect(d.holders).not.toHaveBeenCalled();
    expect(d.call).not.toHaveBeenCalled();
  });

  it("내 좌표와 ISBN은 응답과 로그에 남지 않는다", async () => {
    const ok = deps();
    const failing = deps({ directory: vi.fn(async () => ({ ok: false as const, reason: "upstream" as const })) });
    const responses = [await findNearbyLibraries(input(1), ok), await findNearbyLibraries(input(1), failing)];

    expect(failing.log).toHaveBeenCalledTimes(1);
    const text = JSON.stringify([responses, vi.mocked(ok.log).mock.calls, vi.mocked(failing.log).mock.calls]);
    for (const secret of [String(ME.lat), String(ME.lng), ISBN]) expect(text).not.toContain(secret);
  });
});
