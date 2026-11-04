import { describe, expect, it, vi } from "vitest";
import type { BookSummary } from "@/lib/types";
import { findBook, type FindBookDeps } from "./findBook";
import type { Fetched } from "./findNearbyLibraries";

const ISBN = "9788936433598";

const book = (isbn13: string, title = "채식주의자"): BookSummary => ({
  isbn13,
  title,
  author: "한강",
  publisher: "창비",
  year: "2007",
  coverUrl: "https://example.com/cover.jpg",
});

function deps(result: Fetched<BookSummary[]> = { ok: true, value: [book(ISBN)] }) {
  return {
    lookup: vi.fn(async () => result),
    log: vi.fn(),
  } satisfies FindBookDeps;
}

describe("findBook", () => {
  it("올바른 ISBN이면 그 ISBN으로 조회하고 200과 책 정보를 돌려준다", async () => {
    const d = deps();
    await expect(findBook(ISBN, d)).resolves.toEqual({ status: 200, body: { book: book(ISBN) } });
    expect(d.lookup).toHaveBeenCalledWith(ISBN);
  });

  it.each([
    ["빈 값", ""],
    ["12자리", "978893643359"],
    ["14자리", "97889364335980"],
    ["문자 포함", "978893643359X"],
    ["하이픈 포함", "978-89-364-3359-8"],
  ])("ISBN이 13자리 숫자가 아니면 조회하지 않고 400 badIsbn이다 (%s)", async (_, isbn) => {
    const d = deps();
    await expect(findBook(isbn, d)).resolves.toEqual({ status: 400, body: { error: "badIsbn" } });
    expect(d.lookup).not.toHaveBeenCalled();
  });

  it("결과가 0권이면 404 notFound다", async () => {
    await expect(findBook(ISBN, deps({ ok: true, value: [] }))).resolves.toEqual({
      status: 404,
      body: { error: "notFound" },
    });
  });

  it("결과에 다른 ISBN 책만 있으면 404 notFound다", async () => {
    await expect(findBook(ISBN, deps({ ok: true, value: [book("9788954610551")] }))).resolves.toEqual({
      status: 404,
      body: { error: "notFound" },
    });
  });

  it("여러 권이 오면 ISBN이 같은 책을 고른다", async () => {
    const d = deps({ ok: true, value: [book("9788954610551", "다른 책"), book(ISBN)] });
    await expect(findBook(ISBN, d)).resolves.toEqual({ status: 200, body: { book: book(ISBN) } });
  });

  it("조회에 실패하면 502와 실패 이유만 돌려주고, 로그에는 실패 이유만 남긴다", async () => {
    const d = deps({ ok: false, reason: "timeout" });
    const res = await findBook(ISBN, d);

    expect(res).toEqual({ status: 502, body: { error: "timeout" } });
    expect(d.log).toHaveBeenCalledTimes(1);
    expect(JSON.stringify(d.log.mock.calls)).toContain("timeout");
    expect(JSON.stringify(d.log.mock.calls)).not.toContain(ISBN);
  });
});
