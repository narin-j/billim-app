import type { Metadata, Viewport } from "next";
import { Gowun_Dodum, Jua } from "next/font/google";
import { Suspense } from "react";
import { NavigationTracker } from "@/components/NavigationTracker";
import "./globals.css";

// 한글 글꼴은 subsets에 한글이 없어 미리 받지 않고, 쓰는 글자 범위만 받는다
const gowun = Gowun_Dodum({ weight: "400", variable: "--font-gowun", preload: false, display: "swap" });
const jua = Jua({ weight: "400", variable: "--font-jua", preload: false, display: "swap" });

export const metadata: Metadata = {
  title: "billim",
  description: "읽고 싶은 책을 가까운 공공도서관에서 빌릴 수 있는지 확인해요",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#efe5d6" },
    { media: "(prefers-color-scheme: dark)", color: "#2a221b" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className={`${gowun.variable} ${jua.variable} h-full font-sans antialiased`}>
      <body className="mx-auto flex min-h-full w-full max-w-md flex-col">
        {/* usePathname은 주소마다 달라서 Suspense 안에서 읽는다 (Cache Components). 그리는 것은 없다 */}
        <Suspense fallback={null}>
          <NavigationTracker />
        </Suspense>
        {children}
      </body>
    </html>
  );
}
