import { data4library } from "@/server/data4library";
import { searchBooks } from "@/server/searchBooks";

/** F1 책 검색. 정보나루 키는 서버에서만 쓴다 */
export async function GET(request: Request) {
  const { status, body } = await searchBooks(new URL(request.url).searchParams, {
    call: data4library,
    log: (message) => console.warn(message),
  });
  return Response.json(body, { status });
}
