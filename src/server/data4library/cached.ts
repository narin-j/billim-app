import "server-only";

import { cacheLife } from "next/cache";
import type { LibraryInfo } from "@/lib/types";
import type { Fetched } from "../findNearbyLibraries";
import type { DirectoryEntry } from "../pickRegions";
import { data4library, type Endpoint, type FailureReason } from "./index";
import { toLibraries } from "./toLibraries";

/** 정보나루 시도 코드 (docs/spec.md 8장) */
export const REGION_CODES = [
  "11", "21", "22", "23", "24", "25", "26", "29",
  "31", "32", "33", "34", "35", "36", "37", "38", "39",
] as const;

const PAGE_SIZE = 500;
/** 쪽 넘김이 끝나지 않을 때 호출 한도를 지키는 상한 */
const MAX_PAGES = 5;

// 캐시 함수는 실패를 돌려주지 않고 던진다. 던진 결과는 캐시되지 않는다
const FAILURE_PREFIX = "data4library:";

async function fetchAllLibraries(endpoint: Endpoint, params: Record<string, string>): Promise<LibraryInfo[]> {
  const libraries: LibraryInfo[] = [];
  for (let pageNo = 1; pageNo <= MAX_PAGES; pageNo++) {
    const result = await data4library(endpoint, { ...params, pageNo: String(pageNo), pageSize: String(PAGE_SIZE) });
    if (!result.ok) throw new Error(FAILURE_PREFIX + result.reason);
    const converted = toLibraries(result.body);
    if (!converted.ok) throw new Error(FAILURE_PREFIX + converted.reason);
    libraries.push(...converted.libraries);
    if (converted.libraries.length === 0 || pageNo * PAGE_SIZE >= converted.total) break;
  }
  return libraries;
}

/** 한 시도의 도서관 좌표 (libSrch). 하루 캐시, 모든 인스턴스가 공유 */
async function regionDirectory(region: string): Promise<DirectoryEntry[]> {
  "use cache: remote";
  cacheLife("days");
  const libraries = await fetchAllLibraries("libSrch", { region });
  return libraries.map(({ location }) => ({ region, location }));
}

/** 한 시도에서 이 책을 가진 도서관 (libSrchByBook). 하루 캐시, 모든 인스턴스가 공유 */
async function regionHolders(isbn13: string, region: string): Promise<LibraryInfo[]> {
  "use cache: remote";
  cacheLife("days");
  return fetchAllLibraries("libSrchByBook", { isbn: isbn13, region });
}

async function settle<T>(run: () => Promise<T>): Promise<Fetched<T>> {
  try {
    return { ok: true, value: await run() };
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    const reason = message.startsWith(FAILURE_PREFIX) ? (message.slice(FAILURE_PREFIX.length) as FailureReason) : "upstream";
    return { ok: false, reason };
  }
}

export const directory = () =>
  settle(async () => (await Promise.all(REGION_CODES.map(regionDirectory))).flat());

export const holders = (isbn13: string, region: string) => settle(() => regionHolders(isbn13, region));
