import type { Metadata } from "next";
import { Tajawal, Inter } from "next/font/google";
import "./globals.css";

const tajawal = Tajawal({
  variable: "--font-tajawal",
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "700", "900"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "المساعد الطبي الذكي",
  description: "منصة رقمنة العمل اليومي للطبيب - من التشخيص إلى المتابعة والفوترة",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ar"
      dir="rtl"
      className={`${tajawal.variable} ${inter.variable} h-full antialiased overflow-hidden`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
