import type { Area, LatLng } from "@/lib/types";
// 갱신 스크립트(Node)가 이 파일을 바로 실행하므로 런타임 import를 두지 않는다. 타입 검사로만 코드 목록과 맞춘다
import type { REGION_CODES } from "./regionCodes";

/** 동네를 만들 도서관 한 곳. region은 정보나루 시도 코드 */
export type AreaSource = { region: string; address: string | null; location: LatLng | null };

type Parsed = { sido: string; city: string | null; gu: string | null; location: LatLng };

/** 정보나루 시도 코드 → 정식 시도 이름 (2026-11-05 libSrch 주소 첫 단어, docs/spec.md 8장) */
const REGION_NAMES: Record<(typeof REGION_CODES)[number], string> = {
  "11": "서울특별시",
  "21": "부산광역시",
  "22": "대구광역시",
  "23": "인천광역시",
  "24": "광주광역시",
  "25": "대전광역시",
  "26": "울산광역시",
  "29": "세종특별자치시",
  "31": "경기도",
  "32": "강원특별자치도",
  "33": "충청북도",
  "34": "충청남도",
  "35": "전북특별자치도",
  "36": "전라남도",
  "37": "경상북도",
  "38": "경상남도",
  "39": "제주특별자치도",
};

/** 지역 코드 순 */
const SIDO_ORDER: readonly string[] = Object.entries(REGION_NAMES)
  .sort(([a], [b]) => Number(a) - Number(b))
  .map(([, name]) => name);
const isDistrict = (word: string | undefined) => word !== undefined && /(시|군|구)$/.test(word);
const round = (n: number) => Math.round(n * 1e6) / 1e6;

/** 짝수 개면 가운데 두 값의 평균. 좌표가 틀린 도서관 몇 곳에 끌려가지 않게 평균 대신 쓴다 */
function median(values: number[]) {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = sorted.length >> 1;
  return sorted.length % 2 === 1 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

/**
 * 도서관 주소로 동네(시도 → 시군구) 목록을 만든다 (규칙: docs/spec.md 9장 2026-11-05).
 * 시도는 주소 첫 단어가 정식 이름이면 그것, 아니면 지역 코드의 시도.
 * 대표 지점은 위도·경도 각각의 중앙값이다.
 * 시 안에서 절반 넘는 주소에 구가 있으면 구 단위로 나누고, 구가 없는 주소는 대표 지점 계산에서 뺀다.
 */
export function toAreas(libraries: AreaSource[]): Area[] {
  const parsed = libraries.flatMap(parse);

  // 시마다 구가 있는 주소가 절반을 넘는지 센다
  const guCount = new Map<string, { withGu: number; total: number }>();
  for (const p of parsed) {
    if (!p.city || !p.city.endsWith("시")) continue;
    const key = `${p.sido} ${p.city}`;
    const c = guCount.get(key) ?? { withGu: 0, total: 0 };
    guCount.set(key, { withGu: c.withGu + (p.gu ? 1 : 0), total: c.total + 1 });
  }
  const splitByGu = (sido: string, city: string) => {
    const c = guCount.get(`${sido} ${city}`);
    return c !== undefined && c.withGu * 2 > c.total;
  };

  const groups = new Map<string, { sido: string; name: string; points: LatLng[] }>();
  for (const p of parsed) {
    let name: string;
    if (!p.city) name = p.sido;
    else if (splitByGu(p.sido, p.city)) {
      if (!p.gu) continue;
      name = `${p.city} ${p.gu}`;
    } else name = p.city;

    const key = `${p.sido} ${name}`;
    const group = groups.get(key) ?? { sido: p.sido, name, points: [] };
    group.points.push(p.location);
    groups.set(key, group);
  }

  return [...groups.values()]
    .map(({ sido, name, points }) => ({
      sido,
      name,
      center: { lat: round(median(points.map((p) => p.lat))), lng: round(median(points.map((p) => p.lng))) },
    }))
    .sort((a, b) => sidoRank(a.sido) - sidoRank(b.sido) || a.name.localeCompare(b.name, "ko"));
}

function sidoRank(sido: string) {
  const i = SIDO_ORDER.indexOf(sido);
  return i === -1 ? SIDO_ORDER.length : i;
}

function parse({ region, address, location }: AreaSource): Parsed[] {
  const words = address?.trim().split(/\s+/) ?? [];
  if (!location || words.length === 0 || words[0] === "" || words[0] === "-") return [];

  const fromCode = REGION_NAMES[region as keyof typeof REGION_NAMES];
  const sido = SIDO_ORDER.includes(words[0]) ? words[0] : fromCode;
  if (!sido) return [];

  const city = isDistrict(words[1]) ? words[1] : null;
  const gu = city?.endsWith("시") && words[2]?.endsWith("구") ? words[2] : null;
  return [{ sido, city, gu, location }];
}
