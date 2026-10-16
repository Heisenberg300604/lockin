import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LockIn — Keep promises to yourself",
  description: "A private focus space for meaningful commitments.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>{children}<Analytics /></body>
    </html>
  );
}
