import type { BookSummary } from "@/lib/types";
import type { FailureReason } from "./data4library/call";
import type { Fetched } from "./findNearbyLibraries";

const ISBN13 = /^\d{13}$/;

export type FindBookDeps = {
  /** srchBooks?isbn13= 결과. 변환된 책 목록 */
  lookup: (isbn13: string) => Promise<Fetched<BookSummary[]>>;
  log: (message: string) => void;
};

export type FindBookResponse = { book: BookSummary } | { error: "badIsbn" | "notFound" | FailureReason };

/** GET /api/books/{isbn13} 의 본체. S4 머리의 책 제목과 즐겨찾기용 정보 */
export async function findBook(isbn13: string, deps: FindBookDeps): Promise<{ status: number; body: FindBookResponse }> {
  if (!ISBN13.test(isbn13)) return { status: 400, body: { error: "badIsbn" } };

  const result = await deps.lookup(isbn13);
  if (!result.ok) {
    deps.log(`srchBooks(isbn13) 실패: ${result.reason}`);
    return { status: 502, body: { error: result.reason } };
  }

  const book = result.value.find((b) => b.isbn13 === isbn13);
  if (!book) return { status: 404, body: { error: "notFound" } };
  return { status: 200, body: { book } };
}
