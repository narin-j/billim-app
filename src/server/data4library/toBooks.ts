import type { BookSearchPage, BookSummary } from "@/lib/types";

export type ToBooksResult = { ok: true; page: BookSearchPage } | { ok: false; reason: "format" };

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

/** 문자열이면 앞뒤 공백을 지운다. 비었거나 문자열이 아니면 null */
const text = (v: unknown): string | null => {
  if (typeof v !== "string") return null;
  const trimmed = v.trim();
  return trimmed === "" ? null : trimmed;
};

const ISBN13 = /^\d{13}$/;

/**
 * srchBooks 응답을 앱 내부 타입으로 바꾼다 (응답 형태: docs/spec.md 8장).
 * 제목과 저자는 부제와 "지은이:" 같은 앞말까지 그대로 둔다 (사용자 결정).
 */
export function toBooks(body: unknown): ToBooksResult {
  if (!isRecord(body) || !isRecord(body.response)) return { ok: false, reason: "format" };
  const { numFound, docs } = body.response;
  if (typeof numFound !== "number" || !Array.isArray(docs)) return { ok: false, reason: "format" };

  const books: BookSummary[] = [];
  const seen = new Set<string>();
  for (const item of docs) {
    const doc = isRecord(item) && isRecord(item.doc) ? item.doc : null;
    const isbn13 = text(doc?.isbn13);
    // isbn13이 없으면 소장 도서관(S4)을 찾을 수 없어서 뺀다
    if (!doc || !isbn13 || !ISBN13.test(isbn13) || seen.has(isbn13)) continue;
    seen.add(isbn13);

    const cover = text(doc.bookImageURL);
    books.push({
      isbn13,
      title: text(doc.bookname) ?? "",
      author: text(doc.authors) ?? "",
      publisher: text(doc.publisher),
      year: text(doc.publication_year),
      // https 페이지에서 http 이미지는 막힐 수 있다
      coverUrl: cover?.replace(/^http:\/\//, "https://") ?? null,
    });
  }

  return { ok: true, page: { total: numFound, books } };
}
