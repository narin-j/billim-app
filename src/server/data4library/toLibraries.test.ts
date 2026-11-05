import { describe, expect, it } from "vitest";
import { toLibraries } from "./toLibraries";

/** 2026-10-29 libSrchByBook isbn=9788936433598 region=11 pageSize=2 실제 응답 */
const REAL = {
  response: {
    request: { isbn: "9788936433598", region: "11", pageNo: "", pageSize: "2", format: "json" },
    pageNo: "",
    pageSize: "2",
    numFound: 293,
    resultNum: 2,
    libs: [
      {
        lib: {
          libCode: "711618",
          libName: "KB국민은행과 함께하는 나무 작은도서관",
          address: "서울특별시 노원구 동일로 1405",
          tel: "070-4158-9660",
          fax: "-",
          latitude: "37.6538195",
          longitude: "127.0602181",
          homepage: "https://www.nowonlib.kr/",
          closed: "매주 토요일, 일요일 / 법정공휴일",
          operatingTime: "평일 09:00 ~ 18:00",
        },
      },
      {
        lib: {
          libCode: "111456",
          libName: "가락몰도서관",
          address: "서울특별시 송파구 양재대로 932",
          tel: "02-3435-0950",
          fax: "02-3435-0959",
          latitude: "37.492994",
          longitude: "127.112326",
          homepage: "http://www.splib.or.kr/spalib/",
          closed: "매주 월요일 / 법정공휴일, 기타 도서관 사정에 의해 관장이 정한 날",
          operatingTime: "09:00 ~ 18:00",
        },
      },
    ],
  },
};

const lib = (overrides: Record<string, unknown> = {}) => ({
  lib: {
    libCode: "111456",
    libName: "가락몰도서관",
    address: "서울특별시 송파구 양재대로 932",
    tel: "02-3435-0950",
    latitude: "37.492994",
    longitude: "127.112326",
    homepage: "http://www.splib.or.kr/spalib/",
    ...overrides,
  },
});

const body = (libs: unknown[]) => ({ response: { numFound: libs.length, libs } });

const first = (overrides: Record<string, unknown>) => {
  const result = toLibraries(body([lib(overrides)]));
  if (!result.ok) throw new Error("변환 실패");
  return result.libraries[0];
};

describe("toLibraries", () => {
  it("실제 응답을 앱 내부 타입으로 바꾸고 전체 수를 남긴다", () => {
    expect(toLibraries(REAL)).toEqual({
      ok: true,
      total: 293,
      libraries: [
        {
          libCode: "711618",
          name: "KB국민은행과 함께하는 나무 작은도서관",
          address: "서울특별시 노원구 동일로 1405",
          tel: "070-4158-9660",
          homepage: "https://www.nowonlib.kr/",
          operatingTime: "평일 09:00 ~ 18:00",
          closed: "매주 토요일, 일요일 / 법정공휴일",
          location: { lat: 37.6538195, lng: 127.0602181 },
        },
        {
          libCode: "111456",
          name: "가락몰도서관",
          address: "서울특별시 송파구 양재대로 932",
          tel: "02-3435-0950",
          homepage: "http://www.splib.or.kr/spalib/",
          operatingTime: "09:00 ~ 18:00",
          closed: "매주 월요일 / 법정공휴일, 기타 도서관 사정에 의해 관장이 정한 날",
          location: { lat: 37.492994, lng: 127.112326 },
        },
      ],
    });
  });

  it.each([
    ["위도가 빈 문자열", { latitude: "" }],
    ["경도가 없음", { longitude: undefined }],
    ["숫자가 아님", { latitude: "abc" }],
  ])("좌표를 읽을 수 없으면 location이 null이다 (%s)", (_, overrides) => {
    expect(first(overrides).location).toBeNull();
  });

  it.each(["", "-", " - "])("전화나 홈페이지가 비었거나 '-'면 null이다 (%j)", (value) => {
    const library = first({ tel: value, homepage: value, address: value });
    expect(library.tel).toBeNull();
    expect(library.homepage).toBeNull();
    expect(library.address).toBeNull();
  });

  it("운영 시간과 휴관일은 앞뒤 공백만 지우고 원문 그대로 담는다", () => {
    const library = first({ operatingTime: "  평일 09:00~22:00 / 주말 09:00~18:00 ", closed: " 매주 월요일 / 법정공휴일 " });
    expect(library.operatingTime).toBe("평일 09:00~22:00 / 주말 09:00~18:00");
    expect(library.closed).toBe("매주 월요일 / 법정공휴일");
  });

  it.each([
    ["빈 문자열", ""],
    ["공백만", "   "],
    ["'-' (2026-11-05 서울 66곳)", "-"],
    ["없음", undefined],
    ["숫자", 9],
    ["객체", {}],
  ])("운영 시간과 휴관일을 읽을 수 없으면 null이다 (%s)", (_, value) => {
    const library = first({ operatingTime: value, closed: value });
    expect(library.operatingTime).toBeNull();
    expect(library.closed).toBeNull();
  });

  it("libCode가 없는 항목은 빼고, 같은 libCode는 처음 것만 남긴다", () => {
    const result = toLibraries(
      body([lib({ libCode: "" }), lib({ libCode: undefined }), lib({ libName: "첫째" }), lib({ libName: "둘째" })]),
    );
    expect(result.ok && result.libraries.map((l) => l.name)).toEqual(["첫째"]);
  });

  it("소장 도서관이 없으면 빈 목록이다 (2026-10-29 실제 응답)", () => {
    const empty = { response: { request: {}, pageNo: "", pageSize: "1", numFound: 0, resultNum: 0, libs: [] } };
    expect(toLibraries(empty)).toEqual({ ok: true, total: 0, libraries: [] });
  });

  it.each([
    ["본문이 null", null],
    ["response가 없음", {}],
    ["libs가 없음", { response: { numFound: 1 } }],
    ["libs가 배열이 아님", { response: { numFound: 1, libs: {} } }],
    ["numFound가 없음", { response: { libs: [] } }],
  ])("구조가 다르면 format 실패다 (%s)", (_, input) => {
    expect(toLibraries(input)).toEqual({ ok: false, reason: "format" });
  });
});
