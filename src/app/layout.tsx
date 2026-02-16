import type { Metadata } from "next";
import localFont from "next/font/local";
import SessionProvider from "@/components/providers/SessionProvider";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: {
    default: "여시광장 - 2만 여시의 커뮤니티 구인구직",
    template: "%s | 여시광장",
  },
  description:
    "밤여시 카페 2만 회원 커뮤니티 기반 구인구직 포털. 신뢰할 수 있는 구인구직 정보를 여시광장에서 만나보세요.",
  other: {
    rating: "adult",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        <meta name="rating" content="adult" />
      </head>
      <body className={`${geistSans.variable} font-sans antialiased`}>
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
