import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { auth } from "@/lib/auth";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { QueryProvider } from "@/components/providers/QueryProvider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DevNote AI",
  description: "GitHub repo를 분석해 AI 학습 노트와 블로그 초안을 생성합니다.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>
        <QueryProvider>
          <nav style={{ display: "flex", justifyContent: "flex-end", padding: "1rem" }}>
            {session?.user && <LogoutButton />}
          </nav>
          {children}
        </QueryProvider>
      </body>
    </html>
  );
}
