import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Threads Poster | 휴대폰 홍보 자동 게시",
  description:
    "자연스러운 일상 대화 형식으로 휴대폰 홍보 게시글을 생성하고 Threads에 게시하는 도구",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="min-h-screen bg-threads-bg text-threads-text antialiased">
        {children}
      </body>
    </html>
  );
}