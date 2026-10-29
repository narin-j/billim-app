import { describe, expect, it } from "vitest";
import { toBooks } from "./toBooks";

/** 2026-10-29 srchBooks keyword=채식주의자 pageSize=2 실제 응답 */
const REAL = {
  response: {
    request: { keyword: "채식주의자", sort: "loan_count", direction: "desc", exactMatch: false, pageNo: 1, pageSize: 2, format: "json" },
    numFound: 97,
    docs: [
      {
        doc: {
          bookname: "채식주의자:한강 연작소설",
          authors: "한강",
          publisher: "창비",
          publication_year: "2007",
          isbn13: "9788936433598",
          addition_symbol: "03810",
          vol: "",
          class_no: "813.6",
          class_nm: "문학 > 한국문학 > 소설",
          bookImageURL: "https://bookthumb-phinf.pstatic.net/cover/033/094/03309417.jpg?type=m1&udate=20180609",
          bookDtlUrl: "https://data4library.kr/bookV?seq=2155671",
          loan_count: "246067",
        },
      },
      {
        doc: {
          bookname: "작별하지 않는다 :한강 장편소설 ",
          authors: "지은이: 한강",
          publisher: "문학동네",
          publication_year: "2021",
          isbn13: "9788954682152",
          addition_symbol: "03810",
          vol: "",
          class_no: "813.62",
          class_nm: "문학 > 한국문학 > 소설",
          bookImageURL: "https://image.aladin.co.kr/product/27877/5/cover/8954682154_1.jpg",
          bookDtlUrl: "https://data4library.kr/bookV?seq=6086446",
          loan_count: "134935",
        },
      },
    ],
  },
};

const doc = (overrides: Record<string, unknown> = {}) => ({
  doc: {
    bookname: "책",
    authors: "저자",
    publisher: "출판사",
    publication_year: "2020",
    isbn13: "9788936433598",
    bookImageURL: "https://example.com/cover.jpg",
    ...overrides,
  },
});

const body = (docs: unknown[], numFound = docs.length) => ({ response: { numFound, docs } });

const firstBook = (overrides: Record<string, unknown>) => {
  const result = toBooks(body([doc(overrides)]));
  if (!result.ok) throw new Error("변환 실패");
  return result.page.books[0];
};

describe("toBooks", () => {
  it("실제 응답을 앱 내부 타입으로 바꾼다", () => {
    expect(toBooks(REAL)).toEqual({
      ok: true,
      page: {
        total: 97,
        books: [
          {
            isbn13: "9788936433598",
            title: "채식주의자:한강 연작소설",
            author: "한강",
            publisher: "창비",
            year: "2007",
            coverUrl: "https://bookthumb-phinf.pstatic.net/cover/033/094/03309417.jpg?type=m1&udate=20180609",
          },
          {
            isbn13: "9788954682152",
            title: "작별하지 않는다 :한강 장편소설",
            author: "지은이: 한강",
            publisher: "문학동네",
            year: "2021",
            coverUrl: "https://image.aladin.co.kr/product/27877/5/cover/8954682154_1.jpg",
          },
        ],
      },
    });
  });

  it("결과가 없으면 빈 목록이다 (2026-10-29 실제 응답)", () => {
    const empty = { response: { request: { keyword: "zzqqxxnotabook" }, numFound: 0, docs: [] } };
    expect(toBooks(empty)).toEqual({ ok: true, page: { total: 0, books: [] } });
  });

  it("http 표지는 https로 바꾼다", () => {
    expect(firstBook({ bookImageURL: "http://image.aladin.co.kr/product/4086/97/cover/8936434128_2.jpg" }).coverUrl).toBe(
      "https://image.aladin.co.kr/product/4086/97/cover/8936434128_2.jpg",
    );
  });

  it("표지가 빈 문자열이면 null이다", () => {
    expect(firstBook({ bookImageURL: "" }).coverUrl).toBeNull();
  });

  it("출판 연도가 빈 문자열이면 null이다", () => {
    expect(firstBook({ publication_year: "" }).year).toBeNull();
  });

  it("제목과 저자의 앞뒤 공백을 지운다", () => {
    const book = firstBook({ bookname: "  소년이 온다 :한강 장편소설 ", authors: " 지은이: 한강 " });
    expect(book.title).toBe("소년이 온다 :한강 장편소설");
    expect(book.author).toBe("지은이: 한강");
  });

  it.each([
    ["isbn13 없음", undefined],
    ["빈 문자열", ""],
    ["10자리", "8936433598"],
    ["숫자가 아님", "97889364335X8"],
  ])("isbn13이 13자리 숫자가 아니면 뺀다 (%s)", (_, isbn13) => {
    const result = toBooks(body([doc({ isbn13 }), doc({ isbn13: "9788954682152" })], 2));
    expect(result).toEqual({
      ok: true,
      page: { total: 2, books: [expect.objectContaining({ isbn13: "9788954682152" })] },
    });
  });

  it("같은 isbn13이 두 번 나오면 처음 것만 남긴다", () => {
    const result = toBooks(body([doc({ bookname: "첫째" }), doc({ bookname: "둘째" })]));
    expect(result.ok && result.page.books.map((b) => b.title)).toEqual(["첫째"]);
  });

  it.each([
    ["본문이 null", null],
    ["response가 없음", {}],
    ["docs가 없음", { response: { numFound: 1 } }],
    ["docs가 배열이 아님", { response: { numFound: 1, docs: {} } }],
    ["numFound가 없음", { response: { docs: [] } }],
  ])("구조가 다르면 format 실패다 (%s)", (_, input) => {
    expect(toBooks(input)).toEqual({ ok: false, reason: "format" });
  });
});
