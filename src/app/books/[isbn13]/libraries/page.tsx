import { Suspense } from "react";
import { BookHeader, HeaderBar } from "@/components/BookHeader";
import { LocationGate } from "@/components/LocationGate";
import { LibraryListSkeleton } from "@/components/Skeleton";

/** S4(거리순 목록) 자리. 위치를 얻지 못하면 S3(위치 안내)를 보여 준다 */
export default function LibrariesPage({ params }: PageProps<"/books/[isbn13]/libraries">) {
  return (
    <>
      {/* params는 주소마다 달라서 Suspense 안에서 읽는다 (Cache Components) */}
      <Suspense fallback={<HeaderBar loading />}>
        <BookHeader params={params} />
      </Suspense>
      <main className="flex flex-1 flex-col">
        <Suspense fallback={<LibraryListSkeleton label="불러오는 중…" />}>
          <LocationGate params={params} />
        </Suspense>
      </main>
    </>
  );
}
