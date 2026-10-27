import Link from "next/link";
import { Suspense } from "react";
import { LocationGate } from "@/components/LocationGate";

/** S4(거리순 목록) 자리. 위치를 얻지 못하면 S3(위치 안내)를 보여 준다 */
export default function LibrariesPage({ params }: PageProps<"/books/[isbn13]/libraries">) {
  return (
    <>
      <header className="flex items-center gap-2 border-b px-4 py-3">
        <Link href="/" aria-label="뒤로" className="px-2 text-lg">
          ←
        </Link>
        <h1 className="font-semibold">주변 도서관</h1>
      </header>
      <main className="flex flex-1 flex-col">
        {/* params는 주소마다 달라서 Suspense 안에서 읽는다 (Cache Components) */}
        <Suspense fallback={<p className="p-6 text-center opacity-70">불러오는 중…</p>}>
          <LocationGate params={params} />
        </Suspense>
      </main>
    </>
  );
}
