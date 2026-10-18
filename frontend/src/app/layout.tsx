import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { ClerkProvider } from "@clerk/nextjs";
import { Hanken_Grotesk } from "next/font/google";
import "./globals.css";

const hankenGrotesk = Hanken_Grotesk({
  subsets: ["latin"],
  variable: "--font-hanken-grotesk",
  display: "swap",
});

export const metadata: Metadata = {
  title: "LockIn — Keep promises to yourself",
  description: "A private focus space for meaningful commitments.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body className={hankenGrotesk.variable} suppressHydrationWarning>
        <ClerkProvider dynamic>{children}</ClerkProvider>
        <Analytics />
      </body>
    </html>
  );
}
