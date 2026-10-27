import { FavoritesCount } from "@/components/FavoritesCount";

/** S1. 홈 (검색) */
export default function Home() {
  return (
    <>
      <header className="flex items-center justify-between px-4 py-3">
        <span className="text-lg font-bold">billim</span>
        <FavoritesCount />
      </header>
      <main className="flex flex-1 flex-col justify-center gap-4 px-5 pb-24">
        <h1 className="text-2xl font-semibold">어떤 책을 빌리고 싶나요?</h1>
        {/* 검색 결과(S2)는 F1에서 만든다. 빈 키워드는 pattern으로 막는다 */}
        <form action="/search" method="get" className="flex gap-2">
          <label htmlFor="q" className="sr-only">
            제목 또는 저자
          </label>
          <input
            id="q"
            name="q"
            type="search"
            required
            pattern=".*\S.*"
            placeholder="제목 또는 저자"
            className="min-w-0 flex-1 rounded-xl border px-4 py-3"
          />
          <button type="submit" className="rounded-xl border px-4 py-3 font-semibold">
            검색
          </button>
        </form>
        <p className="text-sm opacity-70">도서관 정보나루 데이터 기준</p>
      </main>
    </>
  );
}
