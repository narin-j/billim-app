import Link from "next/link";

/** 없는 주소. 아직 만들지 않은 화면(예: 검색 결과)도 여기로 온다 */
export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
      <h1 className="text-lg font-semibold">찾는 화면이 없어요.</h1>
      <p className="opacity-80">주소가 바뀌었거나 아직 준비 중인 화면이에요.</p>
      <Link href="/" className="rounded-xl border px-4 py-2 font-semibold">
        처음으로
      </Link>
    </main>
  );
}
