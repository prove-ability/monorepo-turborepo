import type { Metadata } from "next";
import localFont from "next/font/local";
import AppLayout from "@/components/AppLayout";
import PWAInstaller from "@/components/PWAInstaller";
import { ToastProvider } from "@/contexts/ToastContext";
import "./globals.css";
import "driver.js/dist/driver.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  title: "크라우드 랭크 - 주식 투자 게임",
  description: "학생용 주식 투자 시뮬레이션 게임",
  manifest: "/manifest.json",
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    viewportFit: "cover"
  },
  themeColor: "#3B82F6",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "크라우드랭크"
  },
  icons: {
    icon: [
      { url: '/icon-72.png', sizes: '72x72', type: 'image/png' },
      { url: '/icon-96.png', sizes: '96x96', type: 'image/png' },
      { url: '/icon-128.png', sizes: '128x128', type: 'image/png' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ]
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} bg-gray-200`}
      >
        <ToastProvider>
          <AppLayout>{children}</AppLayout>
          <PWAInstaller />
        </ToastProvider>
      </body>
    </html>
  );
}
