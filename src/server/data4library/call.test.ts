import { describe, expect, it, vi } from "vitest";
import { TIMEOUT_MS, callData4Library, type CallDeps } from "./call";

const KEY = "test-key-0123456789abcdef";

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

function deps(fetchImpl: (url: string, init?: RequestInit) => Promise<Response>, overrides: Partial<CallDeps> = {}): CallDeps {
  return { fetch: vi.fn(fetchImpl) as unknown as typeof fetch, apiKey: KEY, ...overrides };
}

describe("callData4Library", () => {
  it("키가 비어 있으면 fetch를 부르지 않고 config 실패", async () => {
    for (const apiKey of [undefined, ""]) {
      const d = deps(async () => jsonResponse({}), { apiKey });
      await expect(callData4Library("srchBooks", {}, d)).resolves.toEqual({ ok: false, reason: "config" });
      expect(d.fetch).not.toHaveBeenCalled();
    }
  });

  it("요청 주소에 엔드포인트, authKey, format=json, 파라미터가 들어간다", async () => {
    const d = deps(async () => jsonResponse({ response: {} }));
    await callData4Library("srchBooks", { title: "채식주의자", pageSize: "10" }, d);

    const url = new URL(vi.mocked(d.fetch).mock.calls[0][0] as string);
    expect(`${url.origin}${url.pathname}`).toBe("http://data4library.kr/api/srchBooks");
    expect(url.searchParams.get("authKey")).toBe(KEY);
    expect(url.searchParams.get("format")).toBe("json");
    expect(url.searchParams.get("title")).toBe("채식주의자");
    expect(url.searchParams.get("pageSize")).toBe("10");
  });

  it("정한 엔드포인트만 받는다 (타입 검사)", () => {
    const d = deps(async () => jsonResponse({ response: {} }));
    // @ts-expect-error 목록에 없는 엔드포인트
    void callData4Library("loanItemSrch", {}, d);
  });

  it("성공하면 본문을 그대로 돌려준다", async () => {
    const body = { response: { docs: [] } };
    const d = deps(async () => jsonResponse(body));
    await expect(callData4Library("srchBooks", {}, d)).resolves.toEqual({ ok: true, body });
  });

  it("HTTP 200이어도 본문에 오류가 있으면 실패", async () => {
    const d = deps(async () =>
      jsonResponse({ response: { errCode: "vitalizationErr", error: "API 활성화 상태가아닙니다." } }),
    );
    await expect(callData4Library("srchBooks", {}, d)).resolves.toEqual({
      ok: false,
      reason: "auth",
      code: "vitalizationErr",
    });
  });

  it("HTTP 오류 상태면 upstream 실패", async () => {
    const d = deps(async () => jsonResponse({}, 500));
    await expect(callData4Library("srchBooks", {}, d)).resolves.toEqual({ ok: false, reason: "upstream" });
  });

  it("본문이 JSON이 아니면 format 실패", async () => {
    const d = deps(async () => new Response("<html>점검 중</html>", { status: 200 }));
    await expect(callData4Library("srchBooks", {}, d)).resolves.toEqual({ ok: false, reason: "format" });
  });

  it("제한 시간 안에 응답이 없으면 요청을 끊고 timeout 실패", async () => {
    let aborted = false;
    const d = deps(
      (_url, init) =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () => {
            aborted = true;
            reject(new DOMException("aborted", "AbortError"));
          });
        }),
      { timeoutMs: 20 },
    );
    await expect(callData4Library("srchBooks", {}, d)).resolves.toEqual({ ok: false, reason: "timeout" });
    expect(aborted).toBe(true);
    expect(TIMEOUT_MS).toBe(8_000);
  });

  it("네트워크 오류가 나도 던지지 않고 network 실패", async () => {
    const d = deps(async () => {
      throw new TypeError("fetch failed");
    });
    await expect(callData4Library("srchBooks", {}, d)).resolves.toEqual({ ok: false, reason: "network" });
  });

  it("실패 결과 어디에도 키가 들어가지 않는다", async () => {
    const d = deps(async (url) => {
      throw new Error(`connect ECONNREFUSED ${url}`);
    });
    const result = await callData4Library("srchBooks", { title: "x" }, d);
    expect(JSON.stringify(result)).not.toContain(KEY);
  });
});
