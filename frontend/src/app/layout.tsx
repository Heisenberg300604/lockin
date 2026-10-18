import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import { ClerkProvider } from "@clerk/nextjs";
import { Hanken_Grotesk } from "next/font/google";
import "./globals.css";

const hankenGrotesk = Hanken_Grotesk({
  subsets: ["latin"],
  variable: "--font-hanken-grotesk",
  display: "swap",
});

// Clerk's modal is the first surface a new member sees, so it borrows LockIn's
// paper, ink, and hard-shadow language instead of arriving as a default card.
const clerkAppearance = {
  variables: {
    colorPrimary: "#28221e",
    colorPrimaryForeground: "#fffdfa",
    colorBackground: "#fcfaf6",
    colorForeground: "#28221e",
    colorMuted: "#efe9e1",
    colorMutedForeground: "#81776d",
    colorInput: "#ffffff",
    colorInputForeground: "#28221e",
    colorBorder: "#d7cec4",
    colorRing: "#63eabd",
    colorShadow: "#28221e",
    colorDanger: "#bb2020",
    colorSuccess: "#00795b",
    colorModalBackdrop: "rgba(33,27,22,0.65)",
    fontFamily: "var(--font-hanken-grotesk), 'Hanken Grotesk', Arial, sans-serif",
    fontWeight: { normal: 400, medium: 600, semibold: 700, bold: 800 },
    borderRadius: "0",
    spacing: "1rem",
  },
  elements: {
    // overflow:hidden keeps the footer inside the rounded card, and the footer
    // needs its own opaque surface or the page behind the modal shows through it.
    cardBox: { borderRadius: "28px", border: "1px solid #e1dad1", boxShadow: "7px 7px 0 #312a25", overflow: "hidden" },
    card: { backgroundColor: "#fcfaf6" },
    modalBackdrop: { backdropFilter: "blur(5px)" },
    modalContent: { margin: "auto" },
    modalCloseButton: { color: "#5d544c" },
    headerTitle: { fontSize: "1.6rem", fontWeight: 800, letterSpacing: "-0.05em" },
    headerSubtitle: { color: "#81776d" },
    formButtonPrimary: { minHeight: "50px", border: "1px solid #28221e", boxShadow: "4px 4px 0 #28221e", fontSize: "12px", fontWeight: 800, letterSpacing: "1px", textTransform: "uppercase" as const },
    socialButtonsBlockButton: { minHeight: "48px", border: "1px solid #302923", backgroundColor: "#fffdfa", boxShadow: "3px 3px 0 #28221e", fontWeight: 700 },
    formFieldLabel: { fontSize: "13px", fontWeight: 700 },
    formFieldInput: { minHeight: "48px", border: "1px solid #302923", backgroundColor: "#ffffff" },
    dividerLine: { backgroundColor: "#d7cec4" },
    dividerText: { color: "#81776d", fontSize: "11px", letterSpacing: "1px" },
    footer: { backgroundColor: "#f1ebe2", borderTop: "1px solid #e1dad1" },
    footerAction: { backgroundColor: "transparent" },
    footerActionText: { color: "#6b6259", fontSize: "13px" },
    footerActionLink: { color: "#28221e", fontWeight: 800, textDecoration: "underline", textUnderlineOffset: "3px" },
    footerItem: { color: "#81776d" },
    footerPagesLink: { color: "#81776d" },
    userButtonPopoverCard: { borderRadius: "22px", border: "1px solid #e1dad1", boxShadow: "6px 6px 0 #312a25" },
  },
};

export const metadata: Metadata = {
  title: "LockIn — Keep promises to yourself",
  description: "A private focus space for meaningful commitments.",
  appleWebApp: { capable: true, title: "LockIn", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#f5f0e8",
  colorScheme: "light",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      {/* Extensions (ColorZilla and friends) write attributes onto <body> before
          hydration; suppress the attribute diff on this element only. */}
      <body className={hankenGrotesk.variable} suppressHydrationWarning><ClerkProvider dynamic appearance={clerkAppearance}>{children}</ClerkProvider><Analytics /></body>
    </html>
  );
}
