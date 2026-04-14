import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Archifex Logo Rating",
  description:
    "Help us pick a logo. Rate 30 Archifex logo variants from 0 to 10, compare pairs head-to-head, see aggregated results.",
  robots: { index: false, follow: false },
};

export default function LogosLayout({ children }: { children: React.ReactNode }) {
  return children;
}
