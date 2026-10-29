import { Suspense } from "react";
import { SearchView } from "@/components/SearchView";

/** S2. 검색 결과 */
export default function SearchPage({ searchParams }: PageProps<"/search">) {
  return (
    // searchParams는 주소마다 달라서 Suspense 안에서 읽는다 (Cache Components)
    <Suspense fallback={<p className="p-6 text-center opacity-70">불러오는 중…</p>}>
      <SearchView searchParams={searchParams} />
    </Suspense>
  );
}
