import { bookByIsbn } from "@/server/data4library/cached";
import { findBook } from "@/server/findBook";

/** S4 머리의 책 정보. 정보나루 키는 서버에서만 쓴다 */
export async function GET(_request: Request, { params }: RouteContext<"/api/books/[isbn13]">) {
  const { isbn13 } = await params;
  const { status, body } = await findBook(isbn13, {
    lookup: bookByIsbn,
    log: (message) => console.warn(message),
  });
  return Response.json(body, { status });
}
