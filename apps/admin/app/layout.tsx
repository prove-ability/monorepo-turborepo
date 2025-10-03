import type { Metadata } from "next";
import localFont from "next/font/local";
import { StackProvider, StackTheme } from "@stackframe/stack";
import { stackServerApp } from "@/stack/server";

import "./globals.css";

// NanumSquareNeo 폰트 등록
const nanumSquareNeo = localFont({
  src: [
    {
      path: "./fonts/NanumSquareNeo-Variable.woff2",
      weight: "100 900",
      style: "normal",
    },
  ],
  variable: "--font-nanum-square-neo",
  display: "swap",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body className={`${nanumSquareNeo.variable}`}>
        <StackProvider app={stackServerApp}>
          <StackTheme>{children}</StackTheme>
        </StackProvider>
      </body>
    </html>
  );
}
