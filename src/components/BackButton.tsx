"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { hasInAppHistory } from "@/lib/inAppHistory";
import { BackIcon } from "./BackIcon";

type Props = {
  /** 앱 안 이전 화면이 없을 때(주소를 직접 연 경우) 갈 곳 */
  fallback?: string;
  className?: string;
  /** 없으면 뒤로 화살표 아이콘만 보여 준다 */
  children?: ReactNode;
};

/** 앱 안에서 왔으면 이전 화면으로 돌아가고, 아니면 fallback으로 간다 */
export function BackButton({ fallback = "/", className = "icon-btn", children }: Props) {
  const router = useRouter();
  return (
    <Link
      href={fallback}
      aria-label={children ? undefined : "뒤로"}
      className={className}
      onClick={(e) => {
        if (!hasInAppHistory()) return;
        e.preventDefault();
        router.back();
      }}
    >
      {children ?? <BackIcon />}
    </Link>
  );
}
