"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { hasInAppHistory } from "@/lib/inAppHistory";

type Props = {
  /** 앱 안 이전 화면이 없을 때(주소를 직접 연 경우) 갈 곳 */
  fallback?: string;
  className?: string;
  children?: ReactNode;
  "aria-label"?: string;
};

/** 앱 안에서 왔으면 이전 화면으로 돌아가고, 아니면 fallback으로 간다 */
export function BackButton({ fallback = "/", className = "icon-btn", children = "←", ...rest }: Props) {
  const router = useRouter();
  return (
    <Link
      href={fallback}
      aria-label={rest["aria-label"] ?? (children === "←" ? "뒤로" : undefined)}
      className={className}
      onClick={(e) => {
        if (!hasInAppHistory()) return;
        e.preventDefault();
        router.back();
      }}
    >
      {children}
    </Link>
  );
}
