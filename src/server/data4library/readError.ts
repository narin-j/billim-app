export type ApiError =
  | { reason: "auth"; code: string }
  | { reason: "upstream"; code: string }
  | { reason: "format" };

/** 실제 응답으로 확인한 오류 코드만 적는다 (docs/spec.md 8장) */
const AUTH_ERROR_CODES = new Set(["vitalizationErr"]);

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

/**
 * 정보나루 응답 본문에서 오류를 읽는다. 오류가 없으면 null.
 * 정보나루는 오류도 HTTP 200으로 보내므로 상태 코드가 아니라 본문을 본다.
 */
export function readError(body: unknown): ApiError | null {
  if (!isRecord(body) || !isRecord(body.response)) return { reason: "format" };

  const { error, errCode } = body.response;
  if (error === undefined) return null;

  const code = typeof errCode === "string" ? errCode : "unknown";
  return { reason: AUTH_ERROR_CODES.has(code) ? "auth" : "upstream", code };
}
