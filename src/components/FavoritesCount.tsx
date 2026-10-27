"use client";

import Link from "next/link";
import { useFavorites } from "@/lib/useFavorites";

/** S1 오른쪽 위 즐겨찾기 바로가기 */
export function FavoritesCount() {
  const { ready, favorites } = useFavorites();
  const count = favorites.books.length + favorites.libraries.length;
  return (
    <Link href="/favorites" className="rounded-full border px-3 py-1 text-sm" aria-label={`즐겨찾기 ${ready ? count : ""}개`}>
      ★ {ready ? count : ""}
    </Link>
  );
}
