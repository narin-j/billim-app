import "server-only";

import { callData4Library, type CallResult, type Endpoint } from "./call";

export type { CallResult, Endpoint, FailureReason } from "./call";

/**
 * 서버(Route Handler)에서만 쓰는 정보나루 호출. 키는 여기서만 읽는다.
 * 로그를 남길 때는 엔드포인트와 실패 이유만 남기고 파라미터는 남기지 않는다.
 */
export function data4library(endpoint: Endpoint, params: Record<string, string>): Promise<CallResult> {
  return callData4Library(endpoint, params, {
    fetch,
    apiKey: process.env.DATA4LIBRARY_API_KEY,
  });
}
