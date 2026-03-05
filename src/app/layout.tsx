import type { Metadata, Viewport } from "next";
import { Nunito } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { Sidebar } from "@/components/sidebar";
import "./globals.css";

const nunito = Nunito({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-nunito",
});

export const metadata: Metadata = {
  title: "내 공간 | 일정 & 생산성",
  description: "나만의 일정 관리, 퀘스트, TEPS를 한곳에서",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={nunito.variable} suppressHydrationWarning>
      <body className="antialiased" suppressHydrationWarning>
        <ThemeProvider>
          <div className="flex min-h-screen">
            <Sidebar />
            <main className="md:ml-64 flex-1 p-4 md:p-8 pb-24 md:pb-8">{children}</main>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
