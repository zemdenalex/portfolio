import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeScript } from "@/components/layout/theme-script";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://archifex.space";

export const metadata: Metadata = {
  title: {
    default: "Archifex — Web Architecture Studio",
    template: "%s | Archifex",
  },
  description:
    "We design and build modern websites, applications, and Telegram bots. From blueprint to production.",
  metadataBase: new URL(SITE_URL),
  openGraph: {
    type: "website",
    siteName: "Archifex",
    title: "Archifex — Web Architecture Studio",
    description:
      "We design and build modern websites, applications, and Telegram bots. From blueprint to production.",
    url: SITE_URL,
    images: [{ url: "/og-default.png", width: 1200, height: 630, alt: "Archifex" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Archifex — Web Architecture Studio",
    description: "We design and build modern websites, applications, and Telegram bots.",
    images: ["/og-default.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-theme="dark"
      data-comfort="off"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-bg-primary text-text-primary">
        <ThemeScript />
        {children}
      </body>
    </html>
  );
}
