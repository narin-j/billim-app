import { describe, expect, it, vi } from "vitest";
import type { CallResult } from "./data4library/call";
import { PAGE_SIZE, searchBooks, type SearchDeps } from "./searchBooks";

const OK_BODY = {
  response: {
    numFound: 1,
    docs: [{ doc: { bookname: "채식주의자", authors: "한강", publisher: "창비", publication_year: "2007", isbn13: "9788936433598", bookImageURL: "" } }],
  },
};

function deps(result: CallResult = { ok: true, body: OK_BODY }) {
  return {
    call: vi.fn(async () => result),
    log: vi.fn(),
  } satisfies SearchDeps;
}

const params = (query: string) => new URLSearchParams(query);

describe("searchBooks", () => {
  it("성공하면 200과 쪽 번호, 변환된 결과를 돌려준다", async () => {
    const d = deps();
    const res = await searchBooks(params("q=채식주의자&page=2"), d);

    expect(d.call).toHaveBeenCalledWith("srchBooks", { keyword: "채식주의자", pageNo: "2", pageSize: String(PAGE_SIZE) });
    expect(res).toEqual({
      status: 200,
      body: { page: 2, total: 1, books: [expect.objectContaining({ isbn13: "9788936433598", coverUrl: null })] },
    });
  });

  it("키워드 앞뒤 공백은 지우고 보낸다", async () => {
    const d = deps();
    await searchBooks(params("q=%20한강%20"), d);
    expect(d.call).toHaveBeenCalledWith("srchBooks", expect.objectContaining({ keyword: "한강" }));
  });

  it.each([
    ["q 없음", ""],
    ["빈 문자열", "q="],
    ["공백뿐", "q=%20%20%20"],
  ])("키워드가 비었으면 정보나루를 부르지 않고 400이다 (%s)", async (_, query) => {
    const d = deps();
    await expect(searchBooks(params(query), d)).resolves.toEqual({ status: 400, body: { error: "emptyQuery" } });
    expect(d.call).not.toHaveBeenCalled();
  });

  it.each(["", "abc", "0", "-1", "1.5", "2abc"])("page가 1 이상의 정수가 아니면 1로 본다 (%s)", async (page) => {
    const d = deps();
    const res = await searchBooks(params(`q=책&page=${page}`), d);
    expect(d.call).toHaveBeenCalledWith("srchBooks", expect.objectContaining({ pageNo: "1" }));
    expect(res.body).toEqual(expect.objectContaining({ page: 1 }));
  });

  it("호출에 실패하면 502와 실패 이유만 돌려주고, 검색어는 응답과 로그에 담지 않는다", async () => {
    const d = deps({ ok: false, reason: "auth", code: "vitalizationErr" });
    const res = await searchBooks(params("q=비밀검색어"), d);

    expect(res).toEqual({ status: 502, body: { error: "auth" } });
    expect(d.log).toHaveBeenCalledTimes(1);
    expect(JSON.stringify(d.log.mock.calls)).not.toContain("비밀검색어");
    expect(JSON.stringify(res)).not.toContain("비밀검색어");
  });

  it("응답 구조가 다르면 502 format이다", async () => {
    const d = deps({ ok: true, body: { response: {} } });
    await expect(searchBooks(params("q=책"), d)).resolves.toEqual({ status: 502, body: { error: "format" } });
  });
});
