"use client"; // 오류 화면은 클라이언트 컴포넌트여야 한다

import Link from "next/link";

/** 예상하지 못한 오류. 오류 내용은 화면에 보여 주지 않는다 */
export default function Error({ retry }: { error: unknown; retry: () => void }) {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
      <h1 className="text-lg font-semibold">문제가 생겨 화면을 보여 주지 못했어요.</h1>
      <p className="opacity-80">잠시 후 다시 시도해 주세요.</p>
      <div className="flex gap-2">
        <button type="button" onClick={() => retry()} className="rounded-xl border px-4 py-2 font-semibold">
          다시 시도
        </button>
        <Link href="/" className="rounded-xl border px-4 py-2">
          처음으로
        </Link>
      </div>
    </main>
  );
}
