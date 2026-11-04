import { FavoritesCount } from "@/components/FavoritesCount";
import { SearchScopeOptions } from "@/components/SearchScopeOptions";
import { DEFAULT_SEARCH_SCOPE } from "@/lib/searchScope";

/** S1. 홈 (검색) */
export default function Home() {
  return (
    <>
      <header className="flex items-center justify-between px-4 py-3">
        <span className="font-display text-2xl">billim</span>
        <FavoritesCount />
      </header>
      <main className="flex flex-1 flex-col justify-center gap-5 px-5 pb-24">
        <h1 className="font-display text-3xl text-balance">어떤 책을 빌리고 싶나요?</h1>
        {/* 빈 키워드는 pattern으로 막는다 */}
        <form action="/search" method="get" className="grid gap-3">
          <SearchScopeOptions value={DEFAULT_SEARCH_SCOPE} />
          <div className="flex gap-2">
            <label htmlFor="q" className="sr-only">
              검색어
            </label>
            <input
              id="q"
              name="q"
              type="search"
              required
              pattern=".*\S.*"
              placeholder="검색어"
              className="field min-w-0 flex-1"
            />
            <button type="submit" className="btn btn-primary">
              검색
            </button>
          </div>
        </form>
        <p className="text-sm text-muted">도서관 정보나루 데이터 기준</p>
      </main>
    </>
  );
}
