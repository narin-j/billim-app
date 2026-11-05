"use client";

import { useId, useState } from "react";
import areaDirectory from "@/lib/areaDirectory.json";
import type { Area } from "@/lib/types";

const AREAS: Area[] = areaDirectory;
const SIDOS = [...new Set(AREAS.map((a) => a.sido))];

/** "서울특별시 노원구". 시군구가 없는 세종은 시도 이름만 */
export const areaLabel = ({ sido, name }: Area) => (sido === name ? name : `${sido} ${name}`);

type Props = {
  onPick: (area: Area) => void;
  onCancel?: () => void;
};

/**
 * 동네 고르기. 시도 → 시군구를 고르면 그 동네의 대표 지점을 넘긴다.
 * 고른 동네는 기억하지 않는다 (docs/spec.md 9장 2026-11-05)
 */
export function AreaPicker({ onPick, onCancel }: Props) {
  const id = useId();
  const [sido, setSido] = useState("");
  const [name, setName] = useState("");

  const inSido = AREAS.filter((a) => a.sido === sido);
  // 세종처럼 동네가 하나뿐이면 시군구를 고르지 않아도 된다
  const picked = inSido.length === 1 ? inSido[0] : inSido.find((a) => a.name === name);

  return (
    <form
      className="card grid gap-3 p-5 text-left"
      onSubmit={(e) => {
        e.preventDefault();
        if (picked) onPick(picked);
      }}
    >
      <p className="font-display text-lg">동네 골라서 찾기</p>
      <label htmlFor={`${id}-sido`} className="sr-only">
        시도
      </label>
      <select
        id={`${id}-sido`}
        value={sido}
        onChange={(e) => {
          setSido(e.target.value);
          setName("");
        }}
        className="field w-full"
      >
        <option value="">시도를 골라 주세요</option>
        {SIDOS.map((s) => (
          <option key={s}>{s}</option>
        ))}
      </select>
      {inSido.length > 1 && (
        <>
          <label htmlFor={`${id}-name`} className="sr-only">
            시군구
          </label>
          <select id={`${id}-name`} value={name} onChange={(e) => setName(e.target.value)} className="field w-full">
            <option value="">시군구를 골라 주세요</option>
            {inSido.map((a) => (
              <option key={a.name}>{a.name}</option>
            ))}
          </select>
        </>
      )}
      <p className="text-sm text-muted">그 동네 도서관들의 가운데쯤에서 가까운 순으로 보여 줘요.</p>
      <div className="flex gap-2">
        {onCancel && (
          <button type="button" onClick={onCancel} className="btn flex-1">
            취소
          </button>
        )}
        <button type="submit" disabled={!picked} className="btn btn-primary flex-[2]">
          이 동네에서 찾기
        </button>
      </div>
    </form>
  );
}
