import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AppProvider } from "@/lib/store";
import AppShell from "@/components/AppShell";

export const metadata: Metadata = {
  title: "CafeFocus — 지금 일하기 좋은 카페 지도",
  description:
    "소음·혼잡도·콘센트·Wi-Fi 데이터로 지금 이 시간에 노트북 작업하기 가장 좋은 카페를 찾아드려요. 미래에이아이랩 제작.",
  applicationName: "CafeFocus",
  authors: [{ name: "미래에이아이랩" }],
  creator: "미래에이아이랩",
  publisher: "미래에이아이랩",
  openGraph: {
    title: "CafeFocus — 지금 일하기 좋은 카페 지도",
    description:
      "소음·혼잡도·콘센트·Wi-Fi 데이터로 지금 이 시간에 노트북 작업하기 가장 좋은 카페를 찾아드려요.",
    siteName: "CafeFocus",
    locale: "ko_KR",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#38291C",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <head>
        <link
          rel="stylesheet"
          as="style"
          crossOrigin="anonymous"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Nanum+Myeongjo:wght@700;800&display=swap"
        />
      </head>
      <body>
        <AppProvider>
          <AppShell>{children}</AppShell>
        </AppProvider>
      </body>
    </html>
  );
}
