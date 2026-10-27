import Link from "next/link";
import { FavoritesView } from "@/components/FavoritesView";

/** S5. 즐겨찾기 */
export default function FavoritesPage() {
  return (
    <>
      <header className="flex items-center gap-2 border-b px-4 py-3">
        <Link href="/" aria-label="뒤로" className="px-2 text-lg">
          ←
        </Link>
        <h1 className="font-semibold">즐겨찾기</h1>
      </header>
      <main className="flex flex-1 flex-col">
        <FavoritesView />
      </main>
    </>
  );
}
