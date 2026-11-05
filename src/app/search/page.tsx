import { Suspense } from "react";
import { SearchView } from "@/components/SearchView";
import { BookListSkeleton } from "@/components/Skeleton";

/** S2. 검색 결과 */
export default function SearchPage({ searchParams }: PageProps<"/search">) {
  return (
    // searchParams는 주소마다 달라서 Suspense 안에서 읽는다 (Cache Components)
    <Suspense fallback={<BookListSkeleton label="불러오는 중…" />}>
      <SearchView searchParams={searchParams} />
    </Suspense>
  );
}
