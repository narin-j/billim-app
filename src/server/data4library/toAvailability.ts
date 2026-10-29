import type { Availability } from "@/lib/types";

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

/**
 * bookExist 응답을 대출 여부로 바꾼다 (응답 형태: docs/spec.md 8장).
 * 소장 목록에 있었는데 hasBook이 N이거나 형식이 다르면 확인 실패로 본다.
 */
export function toAvailability(body: unknown): Availability {
  const result = isRecord(body) && isRecord(body.response) ? body.response.result : null;
  if (!isRecord(result) || result.hasBook !== "Y") return "unknown";
  if (result.loanAvailable === "Y") return "available";
  if (result.loanAvailable === "N") return "onLoan";
  return "unknown";
}
