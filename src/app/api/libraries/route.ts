import { data4library } from "@/server/data4library";
import { directory, holders } from "@/server/data4library/cached";
import { findNearbyLibraries } from "@/server/findNearbyLibraries";

/** F3 주변 소장 도서관. 좌표가 주소(쿼리)에 남지 않도록 POST 본문으로 받는다 */
export async function POST(request: Request) {
  const input: unknown = await request.json().catch(() => null);
  const { status, body } = await findNearbyLibraries(input, {
    directory,
    holders,
    call: data4library,
    log: (message) => console.warn(message),
    now: () => new Date(),
  });
  return Response.json(body, { status });
}
