import Link from "next/link";

/** 없는 주소. 잘못 입력했거나 없어진 주소로 오면 보인다 */
export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-5">
      <div className="card grid w-full justify-items-center gap-3 px-6 py-8 text-center">
        <h1 className="font-display text-xl">찾는 화면이 없어요.</h1>
        <p className="text-muted text-balance">주소를 다시 확인하거나, 처음 화면에서 책을 검색해 보세요.</p>
        <Link href="/" className="btn btn-primary mt-1">
          처음으로
        </Link>
      </div>
    </main>
  );
}
