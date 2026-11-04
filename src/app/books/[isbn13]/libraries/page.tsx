import { Suspense } from "react";
import { BookHeader, HeaderBar } from "@/components/BookHeader";
import { LocationGate } from "@/components/LocationGate";

/** S4(거리순 목록) 자리. 위치를 얻지 못하면 S3(위치 안내)를 보여 준다 */
export default function LibrariesPage({ params }: PageProps<"/books/[isbn13]/libraries">) {
  return (
    <>
      {/* params는 주소마다 달라서 Suspense 안에서 읽는다 (Cache Components) */}
      <Suspense fallback={<HeaderBar />}>
        <BookHeader params={params} />
      </Suspense>
      <main className="flex flex-1 flex-col">
        <Suspense fallback={<p className="p-6 text-center opacity-70">불러오는 중…</p>}>
          <LocationGate params={params} />
        </Suspense>
      </main>
    </>
  );
}
