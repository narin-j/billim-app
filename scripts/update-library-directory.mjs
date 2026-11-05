// 전국 도서관 좌표 파일(libraryDirectory.json)과 동네 파일(areaDirectory.json)을 다시 만든다.
// libSrch를 시도마다 1번, 모두 17번 부른다.
// 실행: npm run update:libraries (키는 .env.local의 DATA4LIBRARY_API_KEY)
// 시도 하나라도 실패하면 파일을 쓰지 않는다. 키가 든 주소와 오류 원문은 출력하지 않는다.
import { writeFile } from "node:fs/promises";
import { REGION_CODES } from "../src/server/data4library/regionCodes.ts";
import { readError } from "../src/server/data4library/readError.ts";
import { toAreas } from "../src/server/data4library/toAreas.ts";
import { toLibraries } from "../src/server/data4library/toLibraries.ts";

const BASE_URL = "http://data4library.kr/api/libSrch";
const PAGE_SIZE = 500;
const OUT = new URL("../src/server/data4library/libraryDirectory.json", import.meta.url);
const AREAS_OUT = new URL("../src/lib/areaDirectory.json", import.meta.url);

const apiKey = process.env.DATA4LIBRARY_API_KEY;
if (!apiKey) {
  console.error("DATA4LIBRARY_API_KEY가 없습니다 (.env.local)");
  process.exit(1);
}

/** 소수점 6자리(약 0.1m)면 거리 계산에 충분하다 */
const round = (n) => Math.round(n * 1e6) / 1e6;

async function fetchRegion(region) {
  const url = new URL(BASE_URL);
  url.searchParams.set("authKey", apiKey);
  url.searchParams.set("format", "json");
  url.searchParams.set("region", region);
  url.searchParams.set("pageNo", "1");
  url.searchParams.set("pageSize", String(PAGE_SIZE));

  let body;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(15_000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    body = await res.json();
  } catch (error) {
    throw new Error(`${region}: 요청 실패 (${error?.name ?? "unknown"})`);
  }

  const apiError = readError(body);
  if (apiError) throw new Error(`${region}: ${apiError.reason} ${apiError.code ?? ""}`.trim());
  const converted = toLibraries(body);
  if (!converted.ok) throw new Error(`${region}: 응답 형태가 다릅니다`);
  // 한 쪽(500곳)에 다 오지 않으면 잘린 파일이 되므로 멈춘다 (spec 8장: 가장 많은 경기가 400곳)
  if (converted.libraries.length < converted.total) {
    throw new Error(`${region}: ${converted.total}곳 중 ${converted.libraries.length}곳만 왔습니다`);
  }

  return converted.libraries.map(({ address, location }) => ({
    region,
    address,
    location: location && { lat: round(location.lat), lng: round(location.lng) },
  }));
}

const entries = [];
for (const region of REGION_CODES) {
  const rows = await fetchRegion(region);
  console.log(`${region}: ${rows.length}곳`);
  entries.push(...rows);
}

// 한 줄에 한 곳씩 써서 갱신 diff를 읽기 쉽게 한다
const lines = (rows) => `[\n${rows.map((e) => "  " + JSON.stringify(e)).join(",\n")}\n]\n`;

// 좌표 파일에는 주소를 담지 않는다 (서버가 거리 계산에만 쓴다)
await writeFile(OUT, lines(entries.map(({ region, location }) => ({ region, location }))));
console.log(`합계 ${entries.length}곳 → ${OUT.pathname}`);

const areas = toAreas(entries);
await writeFile(AREAS_OUT, lines(areas));
console.log(`동네 ${areas.length}개 → ${AREAS_OUT.pathname}`);
