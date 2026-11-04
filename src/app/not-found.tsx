import Link from "next/link";

/** 없는 주소. 아직 만들지 않은 화면(예: 검색 결과)도 여기로 온다 */
export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
      <h1 className="font-display text-xl">찾는 화면이 없어요.</h1>
      <p className="text-muted">주소가 바뀌었거나 아직 준비 중인 화면이에요.</p>
      <Link href="/" className="btn btn-primary">
        처음으로
      </Link>
    </main>
  );
}
