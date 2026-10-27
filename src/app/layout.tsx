import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "billim",
  description: "읽고 싶은 책을 가까운 공공도서관에서 빌릴 수 있는지 확인해요",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="mx-auto flex min-h-full w-full max-w-md flex-col">{children}</body>
    </html>
  );
}
