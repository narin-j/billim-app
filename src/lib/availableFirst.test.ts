import { describe, expect, it } from "vitest";
import { availableFirst } from "./availableFirst";
import type { Availability } from "./types";

type Item = { libCode: string; availability: Availability; distanceKm: number | null; name: string };

const lib = (libCode: string, availability: Availability, distanceKm: number | null = 1): Item => ({
  libCode,
  availability,
  distanceKm,
  name: `도서관 ${libCode}`,
});

const codes = (items: readonly Item[]) => items.map((i) => i.libCode);

describe("availableFirst", () => {
  it("대출 가능 → 대출 중 → 확인 실패 순으로 묶는다", () => {
    const result = availableFirst([lib("a", "unknown"), lib("b", "onLoan"), lib("c", "available")]);
    expect(codes(result)).toEqual(["c", "b", "a"]);
  });

  it("같은 상태 안에서는 넘겨받은 순서(가까운 순)를 그대로 둔다", () => {
    const result = availableFirst([
      lib("a", "onLoan", 0.5),
      lib("b", "available", 1.2),
      lib("c", "onLoan", 2),
      lib("d", "available", 3.4),
    ]);
    expect(codes(result)).toEqual(["b", "d", "a", "c"]);
  });

  it("좌표 없는 도서관은 자기 상태 묶음 안에서 맨 뒤에 있다", () => {
    const result = availableFirst([
      lib("a", "available", 0.3),
      lib("b", "onLoan", 0.9),
      lib("c", "available", null),
      lib("d", "onLoan", null),
    ]);
    expect(codes(result)).toEqual(["a", "c", "b", "d"]);
  });

  it("빈 목록이면 빈 목록을 돌려주고, 넘겨받은 배열은 바꾸지 않는다", () => {
    expect(availableFirst([])).toEqual([]);

    const input = [lib("a", "onLoan"), lib("b", "available")];
    const before = structuredClone(input);
    availableFirst(input);
    expect(input).toEqual(before);
  });

  it("도서관의 다른 필드는 그대로 둔다", () => {
    const item = lib("a", "available", 1.5);
    expect(availableFirst([lib("b", "onLoan"), item])[0]).toEqual(item);
  });
});
