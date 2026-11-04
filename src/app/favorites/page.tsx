import Link from "next/link";
import { FavoritesView } from "@/components/FavoritesView";

/** S5. 즐겨찾기 */
export default function FavoritesPage() {
  return (
    <>
      <header className="flex items-center gap-1 px-3 pt-3 pb-1">
        <Link href="/" aria-label="뒤로" className="icon-btn">
          ←
        </Link>
        <h1 className="font-display text-xl">즐겨찾기</h1>
      </header>
      <main className="flex flex-1 flex-col">
        <FavoritesView />
      </main>
    </>
  );
}
