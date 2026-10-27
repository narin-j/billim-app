import { readError } from "./readError";

export const BASE_URL = "http://data4library.kr/api";
export const TIMEOUT_MS = 8_000;

/** 쓰기로 정한 엔드포인트만 부른다 */
export type Endpoint = "srchBooks" | "libSrchByBook" | "bookExist" | "libSrch";

export type FailureReason = "config" | "auth" | "upstream" | "timeout" | "network" | "format";

/** body는 변환 함수가 앱 내부 타입으로 바꾸기 전까지 unknown으로 둔다 */
export type CallResult =
  | { ok: true; body: unknown }
  | { ok: false; reason: FailureReason; code?: string };

export type CallDeps = {
  fetch: typeof fetch;
  apiKey: string | undefined;
  timeoutMs?: number;
};

/** 정보나루 API를 부른다. 예외를 던지지 않고, 결과에 키를 담지 않는다 */
export async function callData4Library(
  endpoint: Endpoint,
  params: Record<string, string>,
  deps: CallDeps,
): Promise<CallResult> {
  if (!deps.apiKey) return { ok: false, reason: "config" };

  const url = new URL(`${BASE_URL}/${endpoint}`);
  url.searchParams.set("authKey", deps.apiKey);
  url.searchParams.set("format", "json");
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), deps.timeoutMs ?? TIMEOUT_MS);

  try {
    const res = await deps.fetch(url.toString(), { signal: controller.signal });
    if (!res.ok) return { ok: false, reason: "upstream" };

    let body: unknown;
    try {
      body = JSON.parse(await res.text());
    } catch {
      return { ok: false, reason: controller.signal.aborted ? "timeout" : "format" };
    }

    const error = readError(body);
    return error ? { ok: false, ...error } : { ok: true, body };
  } catch {
    // 오류 메시지에는 키가 든 주소가 섞일 수 있어서 결과에 담지 않는다
    return { ok: false, reason: controller.signal.aborted ? "timeout" : "network" };
  } finally {
    clearTimeout(timer);
  }
}
