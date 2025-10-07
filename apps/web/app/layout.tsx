import type { Metadata } from "next";
import AppLayout from "@/components/AppLayout";
import PWAInstaller from "@/components/PWAInstaller";
import { ToastProvider } from "@/contexts/ToastContext";
import "./globals.css";
import "driver.js/dist/driver.css";

export const metadata: Metadata = {
  title: "크라우드 랭크 - 주식 투자 게임",
  description: "학생용 주식 투자 시뮬레이션 게임",
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    viewportFit: "cover",
  },
  themeColor: "#07726a",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "크라우드랭크",
  },
  icons: {
    icon: [
      {
        url: "/icons/android-launchericon-48-48.png",
        sizes: "48x48",
        type: "image/png",
      },
      {
        url: "/icons/android-launchericon-72-72.png",
        sizes: "72x72",
        type: "image/png",
      },
      {
        url: "/icons/android-launchericon-96-96.png",
        sizes: "96x96",
        type: "image/png",
      },
      {
        url: "/icons/android-launchericon-144-144.png",
        sizes: "144x144",
        type: "image/png",
      },
      {
        url: "/icons/android-launchericon-192-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        url: "/icons/android-launchericon-512-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body className="bg-gray-200">
        <ToastProvider>
          <AppLayout>{children}</AppLayout>
          <PWAInstaller />
        </ToastProvider>
      </body>
    </html>
  );
}
